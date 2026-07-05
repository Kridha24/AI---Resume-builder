import React, { useState } from "react";
import { Sparkles, Loader2, ClipboardCopy, Printer, RotateCcw, ArrowLeft, Mail, Phone, MapPin, Check, FileText, Cloud, MessageSquare } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { ResumeData, LayoutSettings } from "../types";
import AICoachSidebar from "./AICoachSidebar";

interface CoverLetterGeneratorProps {
  resumeData: ResumeData;
  layoutSettings: LayoutSettings;
  initialCoverLetter?: {
    targetRole: string;
    targetCompany: string;
    jobDescription: string;
    content: string;
  } | null;
  onBack: () => void;
}

export default function CoverLetterGenerator({
  resumeData,
  layoutSettings,
  initialCoverLetter,
  onBack
}: CoverLetterGeneratorProps) {
  const [targetRole, setTargetRole] = useState(initialCoverLetter?.targetRole || resumeData.personalInfo.jobTitle || "Software Engineer");
  const [targetCompany, setTargetCompany] = useState(initialCoverLetter?.targetCompany || "");
  const [jobDescription, setJobDescription] = useState(initialCoverLetter?.jobDescription || "");
  const [coverLetterText, setCoverLetterText] = useState(initialCoverLetter?.content || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Firestore Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Career Assistant Coach sidebar state
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  // Save to Cloud helper
  const handleSaveCloud = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please sign in first on the home portal page to save files to the cloud.");
      return;
    }

    if (!coverLetterText.trim()) {
      alert("Please write or generate a cover letter first before saving to cloud.");
      return;
    }

    setIsSaving(true);
    try {
      const lettersRef = collection(db, "coverLetters");
      await addDoc(lettersRef, {
        userId: currentUser.uid,
        title: `Cover Letter - ${targetCompany || "Tailored"} (${targetRole})`,
        targetRole,
        targetCompany,
        jobDescription,
        content: coverLetterText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save cover letter to database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Letter with AI
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const skillsList = resumeData.skills.map(s => `${s.name}: ${s.skills.join(", ")}`).join(" | ");
      
      const response = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: resumeData.personalInfo.fullName,
          targetRole,
          summary: resumeData.summary,
          skillsList,
          jobDescription: `${jobDescription} ${targetCompany ? `at ${targetCompany}` : ""}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate cover letter.");
      }

      if (data.coverLetter) {
        setCoverLetterText(data.coverLetter);
      } else {
        throw new Error("Invalid response received from cover letter writer.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not generate cover letter. Check your connection or Secrets for GEMINI_API_KEY.");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy letter to clipboard
  const handleCopy = () => {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print Cover Letter specifically
  const handlePrint = () => {
    // We can open a specific print view or print the window
    // To print the cover letter beautifully, we can temporarily hide everything else using inline style print rules or trigger window.print() after hiding others.
    // Let's implement a clean print rule where the cover letter preview is printed perfectly.
    window.print();
  };

  // Apply typography styles matching layoutSettings
  const getFontFamilyClass = () => {
    if (layoutSettings.fontFamily === "serif") return "font-serif";
    if (layoutSettings.fontFamily === "mono") return "font-mono";
    return "font-sans";
  };

  const getFontSizeClass = () => {
    if (layoutSettings.fontSize === "sm") return "text-[11px] leading-relaxed";
    if (layoutSettings.fontSize === "lg") return "text-[13px] leading-relaxed";
    return "text-xs leading-relaxed";
  };

  // Quick helper to fill out target description sample
  const handleLoadSampleJD = () => {
    setTargetRole("Senior Frontend Engineer");
    setTargetCompany("Acme Innovations Inc");
    setJobDescription(`We are looking for a Senior Frontend Engineer to design and deploy modern UI dashboards. Key requirements:
- 4+ years React, TypeScript, and state management (Redux/Context).
- Solid familiarity with styled layouts and Tailwind CSS.
- High emphasis on performance tuning, code modularity, and clean testing principles.`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT: INPUT COLUMN (no-print) */}
      <div className="no-print w-full md:w-[460px] bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-y-auto p-5 space-y-5">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            AI Writer
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">AI Cover Letter Generator</h2>
          <p className="text-xs text-slate-500 leading-normal">
            Generate an exceptionally professional cover letter tailored specifically to your target job role and desired company, synced automatically with your background.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Target Job Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Target Company
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Stripe Inc."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Job Description Requirements
              </label>
              <button
                type="button"
                onClick={handleLoadSampleJD}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Load Sample Job
              </button>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or core skill requirements here to align your pitch..."
              rows={8}
              className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all leading-normal"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold leading-relaxed border border-red-100 flex items-start space-x-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !targetRole.trim()}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Match & Writing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Generate Cover Letter with AI</span>
            </>
          )}
        </button>

        {/* Sync Info Banner */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Candidate Synchronization</span>
          <p className="text-[11px] text-slate-500 leading-normal">
            Your cover letter aligns with your resume profile <strong>{resumeData.personalInfo.fullName || 'Candidate'}</strong>. It pulls highlights from your professional background and core expertise.
          </p>
        </div>
      </div>

      {/* RIGHT: PREVIEW SHEET (print-only on print) */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-start min-h-0 bg-slate-100 relative">
        
        {/* Letter controls (no-print) */}
        <div className="no-print w-full max-w-[720px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-5 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Stationery Letter Preview</span>
          </span>

          <div className="flex items-center space-x-2 flex-wrap">
            {/* AI Coach Helper Button */}
            <button
              onClick={() => setIsCoachOpen(!isCoachOpen)}
              className="flex items-center space-x-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-1.5 px-3 rounded-lg transition-all shadow-sm font-semibold cursor-pointer"
              title="Open AI Career Coach Sidebar"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Coach Help</span>
            </button>

            {/* Cloud Save Button */}
            <button
              onClick={handleSaveCloud}
              disabled={isSaving || !coverLetterText}
              className={`flex items-center space-x-1.5 text-xs border py-1.5 px-3 rounded-lg transition-all shadow-sm font-semibold disabled:opacity-40 cursor-pointer ${
                saveSuccess 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved in Cloud!</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save to Cloud</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              disabled={!coverLetterText}
              className="flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-1.5 px-3 rounded-lg transition-all shadow-sm font-semibold disabled:opacity-40 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={!coverLetterText}
              className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3.5 rounded-lg transition-all shadow-md font-bold disabled:opacity-40 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Letter</span>
            </button>
          </div>
        </div>

        {/* Cover Letter Paper Canvas (Both browser-visible and printed) */}
        <div 
          id="print-cover-letter-area"
          className={`w-full max-w-[720px] bg-white border border-slate-200 p-12 shadow-md rounded-lg min-h-[900px] flex flex-col justify-between transition-all duration-300 relative ${getFontFamilyClass()} ${getFontSizeClass()}`}
        >
          {/* Stationery Top colored bar matching resume colors */}
          <div 
            className="absolute top-0 left-0 right-0 h-2"
            style={{ backgroundColor: layoutSettings.colorTheme }}
          />

          <div className="space-y-6 flex-1 text-slate-800">
            {/* Header / Brand block */}
            <div className="border-b pb-4 flex justify-between items-baseline" style={{ borderColor: layoutSettings.colorTheme + "22" }}>
              <div>
                <h1 
                  className="text-xl font-bold tracking-tight uppercase"
                  style={{ color: layoutSettings.colorTheme }}
                >
                  {resumeData.personalInfo.fullName || "Your Full Name"}
                </h1>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                  {resumeData.personalInfo.jobTitle || "Professional Trajectory"}
                </p>
              </div>

              {/* Quick Contact Block */}
              <div className="text-[10px] text-slate-500 space-y-1 text-right">
                {resumeData.personalInfo.email && (
                  <div className="flex items-center justify-end space-x-1">
                    <span>{resumeData.personalInfo.email}</span>
                    <Mail className="w-3 h-3 text-slate-400" />
                  </div>
                )}
                {resumeData.personalInfo.phone && (
                  <div className="flex items-center justify-end space-x-1">
                    <span>{resumeData.personalInfo.phone}</span>
                    <Phone className="w-3 h-3 text-slate-400" />
                  </div>
                )}
                {resumeData.personalInfo.location && (
                  <div className="flex items-center justify-end space-x-1">
                    <span>{resumeData.personalInfo.location}</span>
                    <MapPin className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Editable or generated body */}
            <div className="space-y-5 leading-relaxed text-slate-700 whitespace-pre-wrap">
              {coverLetterText ? (
                <textarea
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 resize-none h-[700px] text-xs leading-relaxed font-sans text-slate-700"
                  style={{
                    fontFamily: layoutSettings.fontFamily === 'serif' ? 'Georgia, serif' : layoutSettings.fontFamily === 'mono' ? 'monospace' : 'inherit'
                  }}
                />
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-3 py-16 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cover Letter Empty</h4>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
                      Fill out the target role and company requirements on the left, then click Generate to write your professional cover letter.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer branding */}
          <div className="border-t pt-4 text-center text-[10px] text-slate-400 font-sans tracking-wide">
            Generated via Resumify Stationery Builder • Clean layout match
          </div>
        </div>
      </div>

      {/* AI Career Assistant Coach Sidebar overlay */}
      <AICoachSidebar 
        resumeData={resumeData}
        coverLetterText={coverLetterText}
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        accentColor={layoutSettings.colorTheme || "#4f46e5"}
      />
    </div>
  );
}
