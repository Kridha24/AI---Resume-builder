import React, { useState, useRef } from "react";
import {
  X,
  Sparkles,
  Upload,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
  Download,
  Eye,
  FileCheck,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import {
  ResumeData,
  TargetJob,
  RequirementMatch,
  ChangeProposal,
  CandidateFact,
} from "../types";
import {
  extractCandidateFacts,
  mapRequirementsToEvidence,
  applyAcceptedChanges,
} from "../services/tailoringEngine";
import { ChangeReviewPanel } from "./ChangeReviewPanel";
import { getAuthToken } from "../firebase";

interface GuidedWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResume: ResumeData;
  onApplyTailoredResume: (tailoredResume: ResumeData) => void;
  onTriggerExport: () => void;
}

type WorkflowType = "tailor_existing" | "create_new";
type Step =
  | "select_workflow"
  | "candidate_profile"
  | "target_job"
  | "match_and_clarify"
  | "review_changes"
  | "export_ready";

export const GuidedWorkflowModal: React.FC<GuidedWorkflowModalProps> = ({
  isOpen,
  onClose,
  currentResume,
  onApplyTailoredResume,
  onTriggerExport,
}) => {
  const [workflowType, setWorkflowType] = useState<WorkflowType>("tailor_existing");
  const [step, setStep] = useState<Step>("select_workflow");

  // Candidate Profile State
  const [candidateProfile, setCandidateProfile] = useState<ResumeData>(currentResume);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParseError, setResumeParseError] = useState<string | null>(null);

  // Target Job State
  const [rawJdText, setRawJdText] = useState("");
  const [targetJob, setTargetJob] = useState<TargetJob | null>(null);
  const [isParsingJd, setIsParsingJd] = useState(false);
  const [jdParseError, setJdParseError] = useState<string | null>(null);

  // Requirement Match & Clarifications
  const [matches, setMatches] = useState<RequirementMatch[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});

  // Staged Proposals & Tailored Draft
  const [proposals, setProposals] = useState<ChangeProposal[]>([]);
  const [isGeneratingProposals, setIsGeneratingProposals] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [tailoredResume, setTailoredResume] = useState<ResumeData | null>(null);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- Step 1: Upload / Load Resume ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingResume(true);
    setResumeParseError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(",")[1];
          const token = await getAuthToken();

          const res = await fetch("/api/ai/parse-resume", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              fileBase64: base64Data,
              mimeType: file.type || "application/pdf",
            }),
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || "Failed to parse resume document.");
          }

          const data = await res.json();
          if (data.parsedResume) {
            setCandidateProfile(data.parsedResume);
            setStep("candidate_profile");
          }
        } catch (err: any) {
          setResumeParseError(err.message || "Failed to process resume file.");
        } finally {
          setIsParsingResume(false);
        }
      };

      reader.onerror = () => {
        setResumeParseError("Failed to read the uploaded file.");
        setIsParsingResume(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setResumeParseError(err.message || "Error reading file.");
      setIsParsingResume(false);
    }
  };

  const handleUseCurrentResume = () => {
    setCandidateProfile(currentResume);
    setStep("candidate_profile");
  };

  // --- Step 2: Parse Job Description ---
  const handleParseJobDescription = async () => {
    if (!rawJdText.trim()) {
      setJdParseError("Please paste the job description text.");
      return;
    }

    setIsParsingJd(true);
    setJdParseError(null);

    try {
      const token = await getAuthToken();
      const res = await fetch("/api/ai/parse-jd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rawText: rawJdText }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to parse job description.");
      }

      const data = await res.json();
      if (data.targetJob) {
        setTargetJob(data.targetJob);
        // Map requirements to evidence
        const computedMatches = mapRequirementsToEvidence(data.targetJob, candidateProfile);
        setMatches(computedMatches);
        setStep("match_and_clarify");
      }
    } catch (err: any) {
      setJdParseError(err.message || "Failed to parse job description.");
    } finally {
      setIsParsingJd(false);
    }
  };

  // --- Step 3: Clarification Answers ---
  const handleClarificationChange = (reqId: string, answer: string) => {
    setClarificationAnswers((prev) => ({
      ...prev,
      [reqId]: answer,
    }));
  };

  // --- Step 4: Generate Tailored Proposals ---
  const handleGenerateTailoredDraft = async () => {
    if (!targetJob) return;

    setIsGeneratingProposals(true);
    setTailorError(null);

    try {
      const candidateFacts = extractCandidateFacts(candidateProfile);
      
      // Augment candidate facts with any explicit positive user clarification answers
      Object.entries(clarificationAnswers).forEach(([reqId, ans]) => {
        const textAns = String(ans || "");
        if (textAns.trim()) {
          candidateFacts.push({
            id: `fact-clarification-${reqId}`,
            category: "skill",
            text: `Candidate clarified: ${textAns.trim()}`,
            verified: true,
          });
        }
      });

      const token = await getAuthToken();
      const res = await fetch("/api/ai/tailor-staged", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resumeData: candidateProfile,
          targetJob: targetJob,
          verifiedCandidateFacts: candidateFacts,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate tailored draft.");
      }

      const data = await res.json();
      if (Array.isArray(data.proposals)) {
        // By default, proposals start as pending
        setProposals(data.proposals);
        setStep("review_changes");
      }
    } catch (err: any) {
      setTailorError(err.message || "Failed to generate tailoring proposals.");
    } finally {
      setIsGeneratingProposals(false);
    }
  };

  // --- Proposal Status Updates ---
  const handleUpdateProposalStatus = (id: string, status: "pending" | "accepted" | "rejected") => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  // --- Apply Accepted Changes ---
  const handleApplyChanges = () => {
    const updated = applyAcceptedChanges(candidateProfile, proposals);
    setTailoredResume(updated);
    onApplyTailoredResume(updated);
    setStep("export_ready");
  };

  // --- Check for Unresolved Placeholders before Export ---
  const findUnresolvedPlaceholders = (data: ResumeData): string[] => {
    const textBlocks: string[] = [
      data.summary,
      ...data.workExperience.flatMap((w) => w.description),
      ...data.projects.flatMap((p) => p.description),
      data.customSection?.content || "",
    ];

    const placeholders: string[] = [];
    const regex = /\[(.*?)\]/g;

    textBlocks.forEach((block) => {
      let match;
      while ((match = regex.exec(block)) !== null) {
        placeholders.push(match[0]);
      }
    });

    return Array.from(new Set(placeholders));
  };

  const unresolvedPlaceholders = tailoredResume
    ? findUnresolvedPlaceholders(tailoredResume)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Job-Targeted Resume Studio</h2>
              <p className="text-xs text-slate-400">
                Grounded, verified tailoring without fabrication
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-4 min-w-max">
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === "select_workflow" || step === "candidate_profile"
                  ? "text-indigo-600"
                  : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              Profile Facts
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === "target_job" ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              Target Job
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === "match_and_clarify" ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              Matching & Clarify
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === "review_changes" ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                4
              </span>
              Review Changes
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === "export_ready" ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                5
              </span>
              Export PDF
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* STEP 0: Select Workflow */}
          {step === "select_workflow" && (
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  How would you like to start?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Choose whether you want to tailor an existing resume or build a targeted resume from scratch.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => {
                    setWorkflowType("tailor_existing");
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                    workflowType === "tailor_existing"
                      ? "border-indigo-600 bg-indigo-50/40 shadow-md"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900">Tailor an Existing Resume</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Upload your current resume (PDF, Word, or text) or use your active builder draft. Extract verified facts, paste a job description, and review proposed improvements.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setWorkflowType("create_new");
                    setStep("candidate_profile");
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                    workflowType === "create_new"
                      ? "border-indigo-600 bg-indigo-50/40 shadow-md"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900">Create a New Resume</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Input your verified background through our guided profile form. Provide a target job description to generate an aligned, professional resume.
                  </p>
                </div>
              </div>

              {workflowType === "tailor_existing" && (
                <div className="mt-6 p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Choose resume source:</h5>
                    <p className="text-xs text-slate-500">
                      Upload a file or proceed with the resume currently open in your editor.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isParsingResume}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isParsingResume ? "Parsing File..." : "Upload File"}
                    </button>
                    <button
                      type="button"
                      onClick={handleUseCurrentResume}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Use Current Draft
                    </button>
                  </div>
                </div>
              )}

              {resumeParseError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{resumeParseError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Candidate Profile Verification */}
          {step === "candidate_profile" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Verify Your Candidate Profile Facts
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    These are the verified facts that will be used for tailoring. We will NEVER invent qualifications outside of these facts.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Factual Grounding
                </div>
              </div>

              {/* Profile Summary Cards */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Personal Info:
                  </span>
                  <p className="text-slate-600">
                    <strong>{candidateProfile.personalInfo.fullName || "Name not specified"}</strong> &bull;{" "}
                    {candidateProfile.personalInfo.jobTitle || "Title not specified"} &bull;{" "}
                    {candidateProfile.personalInfo.email || "No email"} &bull;{" "}
                    {candidateProfile.personalInfo.location || "No location"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Professional Summary:
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {candidateProfile.summary || "No summary specified."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700 block mb-2">
                    Work Experience ({candidateProfile.workExperience.length} roles):
                  </span>
                  <div className="space-y-2">
                    {candidateProfile.workExperience.map((exp) => (
                      <div key={exp.id} className="pl-3 border-l-2 border-indigo-200">
                        <span className="font-medium text-slate-800">
                          {exp.position} at {exp.company} ({exp.startDate} - {exp.current ? "Present" : exp.endDate})
                        </span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {exp.description.length} bullet points documented
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700 block mb-2">
                    Skills & Projects:
                  </span>
                  <p className="text-slate-600">
                    <strong>Skills:</strong>{" "}
                    {candidateProfile.skills
                      .flatMap((s) => s.skills)
                      .slice(0, 15)
                      .join(", ") || "None listed"}
                  </p>
                  <p className="text-slate-600 mt-1">
                    <strong>Projects:</strong>{" "}
                    {candidateProfile.projects.map((p) => p.title).join(", ") || "None listed"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep("select_workflow")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("target_job")}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span>Confirm Profile & Next: Target Job</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Target Job Description */}
          {step === "target_job" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Provide Target Job Description
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Paste the full job posting below. We will extract requirements, responsibilities, and required skills without inventing any candidate credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Description Text:
                </label>
                <textarea
                  rows={10}
                  value={rawJdText}
                  onChange={(e) => setRawJdText(e.target.value)}
                  placeholder="Paste the job description here (title, requirements, responsibilities, qualifications)..."
                  className="w-full p-4 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed font-mono"
                />
              </div>

              {jdParseError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{jdParseError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep("candidate_profile")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={isParsingJd || !rawJdText.trim()}
                  onClick={handleParseJobDescription}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isParsingJd ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing Job Requirements...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Requirements & Match</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Matching & Clarification */}
          {step === "match_and_clarify" && targetJob && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Requirement Matching & Clarifications
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Role: {targetJob.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Review which requirements are evidenced in your profile. Answer clarifications to provide genuine background without fabricating.
                </p>
              </div>

              {/* Requirement Match Breakdown */}
              <div className="space-y-3">
                {matches.map((match) => {
                  const isSupported = match.status === "supported";
                  const isPartially = match.status === "partially_supported";

                  return (
                    <div
                      key={match.id}
                      className={`p-4 rounded-xl border text-xs transition-all ${
                        isSupported
                          ? "bg-emerald-50/40 border-emerald-200"
                          : isPartially
                          ? "bg-indigo-50/40 border-indigo-200"
                          : "bg-amber-50/40 border-amber-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isSupported
                                  ? "bg-emerald-500"
                                  : isPartially
                                  ? "bg-indigo-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            <span className="font-semibold text-slate-800">
                              {match.requirementText}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 ml-4 text-[11px]">
                            {match.gapExplanation}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSupported
                              ? "bg-emerald-100 text-emerald-800"
                              : isPartially
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {match.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Clarification prompt for missing requirements */}
                      {match.clarificationQuestion && (
                        <div className="mt-3 ml-4 p-3 rounded-lg bg-white border border-amber-200">
                          <label className="block font-medium text-amber-900 text-[11px] mb-1 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                            {match.clarificationQuestion}
                          </label>
                          <input
                            type="text"
                            placeholder="Optional: e.g. Used in 2 university projects; or leave blank if no experience"
                            value={clarificationAnswers[match.id] || ""}
                            onChange={(e) => handleClarificationChange(match.id, e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {tailorError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{tailorError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep("target_job")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={isGeneratingProposals}
                  onClick={handleGenerateTailoredDraft}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isGeneratingProposals ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Staged Proposals...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Tailored Draft & Changes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review Proposals */}
          {step === "review_changes" && (
            <ChangeReviewPanel
              proposals={proposals}
              onUpdateProposalStatus={handleUpdateProposalStatus}
              onApplyChanges={handleApplyChanges}
              onCancel={() => setStep("match_and_clarify")}
            />
          )}

          {/* STEP 5: Export Ready */}
          {step === "export_ready" && tailoredResume && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Your Tailored Resume Draft is Ready!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Accepted changes have been safely applied. Review any placeholders before exporting your clean, ATS-compliant PDF.
                </p>
              </div>

              {/* Placeholder check banner */}
              {unresolvedPlaceholders.length > 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left max-w-lg mx-auto">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Unresolved Bracketed Placeholders Found ({unresolvedPlaceholders.length})</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mb-3">
                    Your tailored resume contains placeholders that require your real metrics or inputs before final distribution:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {unresolvedPlaceholders.map((ph, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-mono text-[11px]"
                      >
                        {ph}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-600 mt-2">
                    You can edit these placeholders directly in the resume editor before exporting.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium max-w-md mx-auto flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>No unresolved placeholders found. All facts verified!</span>
                </div>
              )}

              {/* Export Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Close & Edit in Builder
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerExport();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Tailored PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
