import React, { useState, useEffect } from "react";
import { 
  Sparkles, ShieldCheck, Loader2, AlertCircle, ArrowUpRight, 
  CheckCircle2, PlusCircle, Bookmark, Star, HelpCircle, LogIn, Lock, Info, 
  ChevronDown, ChevronUp, RotateCcw, Award, Check
} from "lucide-react";
import { ResumeData, TargetJob, AtsReviewResult } from "../types";
import { signInWithGoogle, getAuthToken } from "../firebase";
import { computeSessionHash } from "../utils/hashing";
import { calculateAlignmentScore } from "../utils/alignmentScore";
import { matchSkill } from "../utils/keywordMatcher";

interface AtsReviewPanelProps {
  resumeData: ResumeData;
  isAuthenticated: boolean;
  accentColor: string;
  targetJob?: TargetJob | null;
  onUpdateJobDescription?: (jd: string) => void;
}

export default function AtsReviewPanel({
  resumeData,
  isAuthenticated,
  accentColor,
  targetJob,
  onUpdateJobDescription,
}: AtsReviewPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Job description matching states
  const [jobDescription, setJobDescription] = useState(targetJob?.rawText || "");
  const [analyzedSessionHash, setAnalyzedSessionHash] = useState<string | null>(null);

  // Synchronize when targetJob changes externally
  useEffect(() => {
    if (targetJob?.rawText && !jobDescription) {
      setJobDescription(targetJob.rawText);
    }
  }, [targetJob]);

  // Current session hash for staleness detection
  const currentSessionHash = computeSessionHash(resumeData, jobDescription);
  const isStale = !!analyzedSessionHash && analyzedSessionHash !== currentSessionHash;

  // Deterministic Alignment Score calculation
  const deterministicScore = calculateAlignmentScore(resumeData, targetJob, jobDescription);

  const handleScan = async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/ai/ats-review", {
        method: "POST",
        headers,
        body: JSON.stringify({ resumeData, jobDescription }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume alignment.");
      }

      setResult(data);
      setAnalyzedSessionHash(currentSessionHash);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while evaluating alignment.");
      setResult(null); // Never show fabricated scores on failure
    } finally {
      setLoading(false);
    }
  };

  // Render Lock/Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-5 shadow-sm">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-100 rounded-full scale-125 blur-lg opacity-40 animate-pulse" />
          <div className="relative w-14 h-14 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
            Unlock AI JD Alignment Engine
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Get an explainable JD alignment estimate, concrete section-by-section improvements, and punctuation-aware keyword matching by signing in first.
          </p>
        </div>

        <button
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch (err: any) {
              if (err?.code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user")) {
                console.log("Sign-in popup closed by user.");
              } else {
                alert("Sign-in popup was blocked or failed.");
              }
            }
          }}
          type="button"
          className="w-full inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl shadow transition-all cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In securely with Google</span>
        </button>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-4 text-[10px] text-slate-400 font-semibold">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Auth</span>
          </span>
          <span>•</span>
          <span>No Fabricated Data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              JD Alignment Engine
            </h4>
            <span className="text-[10px] text-slate-400 font-bold block leading-none">
              Explainable Candidate Match & Analysis
            </span>
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={loading}
          className="text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>{result ? "Re-Scan" : "Scan Resume"}</span>
          )}
        </button>
      </div>

      {/* Staleness Warning Banner */}
      {isStale && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Resume or JD has changed since this review was run.</span>
          </div>
          <button
            onClick={handleScan}
            disabled={loading}
            className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 px-2 py-1 rounded font-bold transition-all cursor-pointer shrink-0"
          >
            Update Analysis
          </button>
        </div>
      )}

      {/* Target Job Description Input */}
      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            🎯 Target Job Description
          </label>
          {jobDescription && (
            <button
              onClick={() => {
                setJobDescription("");
                if (onUpdateJobDescription) onUpdateJobDescription("");
              }}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
            if (onUpdateJobDescription) onUpdateJobDescription(e.target.value);
          }}
          placeholder="Paste target job description here to calculate explainable alignment metrics..."
          className="w-full h-24 text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white resize-none"
        />

        {/* Deterministic Alignment Breakdown */}
        <div className="space-y-2 pt-2 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Deterministic Alignment Estimate:
            </span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              deterministicScore.score >= 75
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : deterministicScore.score >= 50
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-rose-100 text-rose-800 border border-rose-200"
            }`}>
              {deterministicScore.score}%
            </span>
          </div>

          {/* Component weights */}
          <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-bold text-slate-600">
            <div className="bg-white p-1.5 rounded border border-slate-100">
              <div className="text-slate-400">Required</div>
              <div className="text-slate-800 font-extrabold">{deterministicScore.requiredSkillsScore}%</div>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-100">
              <div className="text-slate-400">Preferred</div>
              <div className="text-slate-800 font-extrabold">{deterministicScore.preferredSkillsScore}%</div>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-100">
              <div className="text-slate-400">{deterministicScore.isFresherProfile ? "Projects" : "Experience"}</div>
              <div className="text-slate-800 font-extrabold">{deterministicScore.experienceScore}%</div>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-100">
              <div className="text-slate-400">Education</div>
              <div className="text-slate-800 font-extrabold">{deterministicScore.educationScore}%</div>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-100">
              <div className="text-slate-400">Quality</div>
              <div className="text-slate-800 font-extrabold">{deterministicScore.qualityScore}%</div>
            </div>
          </div>

          {deterministicScore.isFresherProfile && (
            <p className="text-[10px] text-indigo-600 font-semibold italic">
              🎓 Evaluated as early-career / fresher profile: project portfolio and education weighted without penalizing lack of formal employment history.
            </p>
          )}
        </div>
      </div>

      {/* Error State with Honest Error and Retry */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-left">
          <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Analysis could not be completed: {error}</span>
          </div>
          <p className="text-[11px] text-rose-700">
            We do not fabricate fake scores when the service is unreachable or returns malformed data. You can retry the analysis below.
          </p>
          <button
            onClick={handleScan}
            className="mt-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Analysis</span>
          </button>
        </div>
      )}

      {/* AI Qualitative Feedback Result */}
      {result && !error && (
        <div className="space-y-4 pt-2">
          {/* Qualitative Score Explanation */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                Recruiter Screening Insights
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {result.scoreExplanation}
            </p>
          </div>

          {/* Actionable Feedback Accordion */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Actionable Recommendations
            </span>
            {result.feedback.map((item, idx) => (
              <div 
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  className="w-full p-3 text-left font-bold text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>{item.category}</span>
                  </span>
                  {expandedIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {expandedIndex === idx && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2 text-slate-600 leading-relaxed">
                    <p>{item.description}</p>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">
                      <strong className="text-indigo-600 block text-[10px] uppercase tracking-wider mb-0.5">
                        How to improve:
                      </strong>
                      <p className="text-[11px]">{item.howToFix}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Keywords Breakdown */}
          {result.suggestedKeywords && result.suggestedKeywords.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Target Keywords & Concepts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ATS Parser Tips */}
          {result.atsTips && result.atsTips.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <strong className="text-[10px] uppercase tracking-wider text-slate-500 block">
                Parser Optimization Tips:
              </strong>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {result.atsTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
