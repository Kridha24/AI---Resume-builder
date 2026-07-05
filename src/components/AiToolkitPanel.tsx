import React, { useState, useEffect } from "react";
import { 
  Sparkles, Globe, Target, ShieldAlert, Cpu, CheckCircle2, 
  Loader2, ArrowRight, Check, AlertCircle, RefreshCw, Plus, 
  Trash2, Award, Zap, HeartHandshake, Info
} from "lucide-react";
import { ResumeData } from "../types";

interface AiToolkitPanelProps {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  colorTheme: string;
}

type ToolkitTab = "translate" | "tailor" | "cliche" | "gap" | "ats-audit";

export default function AiToolkitPanel({ 
  resumeData, 
  setResumeData, 
  colorTheme 
}: AiToolkitPanelProps) {
  const [activeTab, setActiveTab] = useState<ToolkitTab>("translate");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for Feature 1: Translation
  const [targetLang, setTargetLang] = useState("Spanish");
  const LANGUAGES = [
    { name: "Spanish (Español)", value: "Spanish" },
    { name: "French (Français)", value: "French" },
    { name: "German (Deutsch)", value: "German" },
    { name: "Japanese (日本語)", value: "Japanese" },
    { name: "Chinese (中文)", value: "Chinese" },
    { name: "Portuguese (Português)", value: "Portuguese" },
  ];

  // States for Feature 2: Job Tailoring
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredSummary, setTailoredSummary] = useState("");
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);

  // States for Feature 3: Cliché Word Auditor
  const [clicheFindings, setClicheFindings] = useState<Array<{
    id: string;
    phrase: string;
    text: string;
    replacement: string;
    explanation: string;
    section: "summary" | "experience" | "projects";
    applied?: boolean;
  }>>([]);

  // States for Feature 4: Skill Gap Analyzer
  const [gapJobTitle, setGapJobTitle] = useState(resumeData.personalInfo.jobTitle || "");
  const [gapJobDesc, setGapJobDesc] = useState("");
  const [matchingSkills, setMatchingSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  // States for Feature 5: ATS Formatting Checklist (Reactive State)
  const [formattingScore, setFormattingScore] = useState(100);
  const [checklistItems, setChecklistItems] = useState<Array<{
    id: string;
    label: string;
    description: string;
    status: "pass" | "warning" | "fail";
    tip: string;
  }>>([]);

  // Sync default job title
  useEffect(() => {
    if (resumeData.personalInfo.jobTitle && !gapJobTitle) {
      setGapJobTitle(resumeData.personalInfo.jobTitle);
    }
  }, [resumeData.personalInfo.jobTitle]);

  // Run ATS Formatting Audit Reactively
  useEffect(() => {
    runATSChecklist();
  }, [resumeData]);

  const runATSChecklist = () => {
    const items: typeof checklistItems = [];
    let score = 100;

    // Rule 1: Contact Completeness
    const hasEmail = !!resumeData.personalInfo.email?.trim();
    const hasPhone = !!resumeData.personalInfo.phone?.trim();
    const hasLocation = !!resumeData.personalInfo.location?.trim();
    if (hasEmail && hasPhone && hasLocation) {
      items.push({
        id: "contact",
        label: "Contact Information Completeness",
        description: "Email, phone number, and physical city location are present.",
        status: "pass",
        tip: "Perfect. ATS parsers need contact details to automatically route candidate files."
      });
    } else {
      score -= 20;
      items.push({
        id: "contact",
        label: "Incomplete Contact Info",
        description: `Missing: ${[!hasEmail && "Email", !hasPhone && "Phone", !hasLocation && "Location"].filter(Boolean).join(", ")}.`,
        status: "fail",
        tip: "Add missing contact details in Personal Info to ensure recruiters can contact you."
      });
    }

    // Rule 2: Quantified Bullet Density (STAR Method metric count)
    const bullets = (resumeData.workExperience || []).flatMap(exp => exp.description || []);
    const metricRegex = /\b\d+([.,]\d+)?%?\b|(?:\$|usd)\s*\d+|\b\d+\s*(?:\+|-|plus|years|hours|million|thousand|k|m|b)\b/i;
    const quantifiedBullets = bullets.filter(b => metricRegex.test(b));
    const density = bullets.length > 0 ? (quantifiedBullets.length / bullets.length) * 100 : 0;

    if (bullets.length === 0) {
      score -= 20;
      items.push({
        id: "metrics",
        label: "Work Bullet Metrics & Impact",
        description: "No work experience bullet points defined yet.",
        status: "fail",
        tip: "Add professional bullet points highlighting metrics and specific results."
      });
    } else if (density >= 35) {
      items.push({
        id: "metrics",
        label: "High Impact Metric Density",
        description: `${Math.round(density)}% of your bullet points contain tangible metrics or dollar figures.`,
        status: "pass",
        tip: "Excellent. ATS parsers look for numbers indicating quantifiable high-impact outcomes."
      });
    } else {
      score -= 15;
      items.push({
        id: "metrics",
        label: "Low Metric Density",
        description: `Only ${Math.round(density)}% of your bullets contain metrics. Recruiters expect at least 35%.`,
        status: "warning",
        tip: "Try revising sentences using our Bullet Point Enhancer to append numbers like [15%] or [$50K]."
      });
    }

    // Rule 3: Bullet Phrasing Length
    const longBullets = bullets.filter(b => b.trim().length > 200);
    const shortBullets = bullets.filter(b => b.trim().length > 0 && b.trim().length < 35);
    if (longBullets.length > 0) {
      score -= 10;
      items.push({
        id: "bullet-length",
        label: "Overly Wordy Bullets",
        description: `${longBullets.length} bullet points are too wordy (exceeding 200 characters).`,
        status: "warning",
        tip: "Keep bullets crisp and punchy. Shorten sentences to keep scanner focus."
      });
    } else if (shortBullets.length > 0) {
      score -= 10;
      items.push({
        id: "bullet-length",
        label: "Overly Short Bullet Points",
        description: `${shortBullets.length} bullet points are under 35 characters.`,
        status: "warning",
        tip: "Add details explaining how and why you performed the task to give context."
      });
    } else {
      items.push({
        id: "bullet-length",
        label: "Ideal Sentence Lengths",
        description: "All experience statements are perfectly proportioned (35 to 200 characters).",
        status: "pass",
        tip: "Great formatting. Keeps the human reader engaged and scanner scores optimal."
      });
    }

    // Rule 4: Structural Section Coverage
    const hasSummary = !!resumeData.summary?.trim();
    const hasExperience = (resumeData.workExperience || []).length > 0;
    const hasEducation = (resumeData.education || []).length > 0;
    const hasSkills = (resumeData.skills || []).flatMap(c => c.skills || []).length > 0;

    if (hasSummary && hasExperience && hasEducation && hasSkills) {
      items.push({
        id: "sections",
        label: "Structural Section Integrity",
        description: "Summary, Work History, Education, and Skills sections are all covered.",
        status: "pass",
        tip: "Perfect layout scaffolding. Ensures a comprehensive review profile."
      });
    } else {
      score -= 15;
      items.push({
        id: "sections",
        label: "Missing Critical Sections",
        description: `Your profile lacks: ${[!hasSummary && "Summary", !hasExperience && "Experience", !hasEducation && "Education", !hasSkills && "Skills"].filter(Boolean).join(", ")}.`,
        status: "fail",
        tip: "Ensure all core elements are populated. Standard ATS parsers reject incomplete profiles."
      });
    }

    // Rule 5: Professional Summary Length
    if (hasSummary) {
      const wordCount = resumeData.summary.split(/\s+/).filter(Boolean).length;
      if (wordCount < 40) {
        score -= 10;
        items.push({
          id: "summary-length",
          label: "Inadequate Summary Statement",
          description: `Summary is too short (${wordCount} words). Recommended is 50-95 words.`,
          status: "warning",
          tip: "Click 'Refine Summary' or use our Generator to construct an elegant summary statement."
        });
      } else if (wordCount > 110) {
        score -= 10;
        items.push({
          id: "summary-length",
          label: "Overly Wordy Summary",
          description: `Summary exceeds professional limit (${wordCount} words). Keep below 100 words.`,
          status: "warning",
          tip: "Condense your bio paragraph to focus strictly on major achievements and key technologies."
        });
      } else {
        items.push({
          id: "summary-length",
          label: "Perfect Summary Word Count",
          description: `Your summary has ${wordCount} words. Perfect sizing for quick review.`,
          status: "pass",
          tip: "Compelling and dense summary. Captures attention without reader fatigue."
        });
      }
    }

    setFormattingScore(Math.max(score, 10));
    setChecklistItems(items);
  };

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  // Feature 1: Translate resume action
  const handleTranslate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/translate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, targetLanguage: targetLang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to translate.");
      
      if (data.translatedResume) {
        setResumeData(data.translatedResume);
        showFeedback(`Successfully translated resume into ${targetLang}!`);
      }
    } catch (err: any) {
      showFeedback(err.message || "An error occurred during translation.", true);
    } finally {
      setIsLoading(false);
    }
  };

  // Feature 2: Tailor resume action
  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      showFeedback("Please paste the target job description first!", true);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jobDescription })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to tailor resume.");

      setTailoredSummary(data.tailoredSummary || "");
      setSuggestedSkills(data.suggestedSkills || []);
      showFeedback("AI completed tailoring and analysis! Check options below.");
    } catch (err: any) {
      showFeedback(err.message || "An error occurred during tailoring.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTailoredSummary = () => {
    if (!tailoredSummary) return;
    setResumeData(prev => ({
      ...prev,
      summary: tailoredSummary
    }));
    setTailoredSummary("");
    showFeedback("Tailored professional summary applied!");
  };

  const applyTailoredSkill = (skill: string) => {
    setResumeData(prev => {
      const updated = [...prev.skills];
      if (updated.length === 0) {
        updated.push({ id: "skill-tailor", name: "Core Skills", skills: [skill] });
      } else {
        if (!updated[0].skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
          updated[0] = { ...updated[0], skills: [...updated[0].skills, skill] };
        }
      }
      return { ...prev, skills: updated };
    });
    setSuggestedSkills(prev => prev.filter(s => s !== skill));
    showFeedback(`Added "${skill}" to your skills category!`);
  };

  // Feature 3: Scan Clichés action
  const handleScanCliches = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/audit-cliche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan cliché words.");

      if (data.findings && Array.isArray(data.findings)) {
        setClicheFindings(data.findings);
        if (data.findings.length === 0) {
          showFeedback("Incredible! No overused or weak clichés found in your profile!");
        } else {
          showFeedback(`Detected ${data.findings.length} clichés. Check revisions below.`);
        }
      }
    } catch (err: any) {
      showFeedback(err.message || "An error occurred during auditing.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const applyClicheFix = (finding: typeof clicheFindings[0]) => {
    setResumeData(prev => {
      let updatedSummary = prev.summary;
      let updatedExp = [...prev.workExperience];

      // Use a global case-insensitive replace for safe surgical text mutation
      const regex = new RegExp(finding.phrase, "gi");

      if (prev.summary.includes(finding.phrase)) {
        updatedSummary = prev.summary.replace(regex, finding.replacement);
      }

      updatedExp = updatedExp.map(exp => {
        const desc = exp.description.map(bullet => {
          if (bullet.toLowerCase().includes(finding.phrase.toLowerCase())) {
            return bullet.replace(regex, finding.replacement);
          }
          return bullet;
        });
        return { ...exp, description: desc };
      });

      return {
        ...prev,
        summary: updatedSummary,
        workExperience: updatedExp
      };
    });

    setClicheFindings(prev => prev.map(f => f.id === finding.id ? { ...f, applied: true } : f));
    showFeedback(`Successfully replaced "${finding.phrase}" with "${finding.replacement}"!`);
  };

  // Feature 4: Skill Gap Analyzer action
  const handleAnalyzeGap = async () => {
    if (!gapJobTitle.trim() || !gapJobDesc.trim()) {
      showFeedback("Target job title and description are required!", true);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jobTitle: gapJobTitle, jobDescription: gapJobDesc })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze skills.");

      setMatchingSkills(data.matchingSkills || []);
      setMissingSkills(data.missingSkills || []);
      setCertifications(data.recommendedCertifications || []);
      showFeedback("Skills gap analysis computed successfully.");
    } catch (err: any) {
      showFeedback(err.message || "An error occurred during analysis.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const addMissingSkill = (skill: string) => {
    setResumeData(prev => {
      const updated = [...prev.skills];
      if (updated.length === 0) {
        updated.push({ id: `gap-s-${Date.now()}`, name: "Core Skills", skills: [skill] });
      } else {
        if (!updated[0].skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
          updated[0] = { ...updated[0], skills: [...updated[0].skills, skill] };
        }
      }
      return { ...prev, skills: updated };
    });
    setMissingSkills(prev => prev.filter(s => s !== skill));
    setMatchingSkills(prev => [...prev, skill]);
    showFeedback(`Added "${skill}" to your resume skills list!`);
  };

  const addGapCertification = (cert: string) => {
    setResumeData(prev => {
      const updated = prev.certifications ? [...prev.certifications] : [];
      if (!updated.includes(cert)) {
        updated.push(cert);
      }
      return { ...prev, certifications: updated };
    });
    setCertifications(prev => prev.filter(c => c !== cert));
    showFeedback(`Added "${cert}" to your certifications block!`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* Title & Desc */}
      <div className="p-4 bg-white border-b border-slate-100 shrink-0 space-y-1">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
          <span>🔮 Core AI Career Toolkit</span>
        </h3>
        <p className="text-[11px] text-slate-500 font-medium">
          Deploy 5 game-changing AI optimization tools to perfect your resume, translate globally, and align targeting.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 border-b border-slate-200 shrink-0 bg-white">
        <button
          onClick={() => setActiveTab("translate")}
          className={`py-2 text-[10px] font-bold text-center border-b-2 cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 ${
            activeTab === "translate"
              ? "border-violet-600 text-violet-600 font-black bg-violet-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Resume Translation"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center scale-90">Translate</span>
        </button>

        <button
          onClick={() => setActiveTab("tailor")}
          className={`py-2 text-[10px] font-bold text-center border-b-2 cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 ${
            activeTab === "tailor"
              ? "border-violet-600 text-violet-600 font-black bg-violet-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Job Description Tailoring"
        >
          <Target className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center scale-90">Tailoring</span>
        </button>

        <button
          onClick={() => setActiveTab("cliche")}
          className={`py-2 text-[10px] font-bold text-center border-b-2 cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 ${
            activeTab === "cliche"
              ? "border-violet-600 text-violet-600 font-black bg-violet-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Weak & Cliché Word Scan"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center scale-90">Polisher</span>
        </button>

        <button
          onClick={() => setActiveTab("gap")}
          className={`py-2 text-[10px] font-bold text-center border-b-2 cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 ${
            activeTab === "gap"
              ? "border-violet-600 text-violet-600 font-black bg-violet-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Skills Gap Finder"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center scale-90">Gap Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab("ats-audit")}
          className={`py-2 text-[10px] font-bold text-center border-b-2 cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 ${
            activeTab === "ats-audit"
              ? "border-violet-600 text-violet-600 font-black bg-violet-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="ATS Checklist Audit"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center scale-90">ATS Audit</span>
        </button>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Status Alerts */}
        {successMsg && (
          <div className="flex items-center space-x-2 p-2.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-100 shadow-sm">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        
        {errorMsg && (
          <div className="flex items-start space-x-2 p-2.5 bg-rose-50 text-rose-800 text-[11px] font-bold rounded-lg border border-rose-100 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Translate */}
        {activeTab === "translate" && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-800">
                <Globe className="w-4 h-4 text-violet-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">1. Global Multi-Language CV Translator</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Applying for jobs abroad? Automatically translate your entire resume including job titles, summary statements, skill categories, and custom sections into a standard corporate format.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Select Target Language:
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleTranslate}
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Translating structure...</span>
                  </>
                ) : (
                  <>
                    <span>Translate Active Resume</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-lg flex items-start space-x-2">
              <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-violet-700 font-semibold leading-relaxed">
                Tip: Tech stacks (like React, Docker, JavaScript, Node.js) remain intact to protect ATS keyword matching consistency across language borders.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Tailor Resume to Job Description */}
        {activeTab === "tailor" && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-3.5 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-800">
                <Target className="w-4 h-4 text-violet-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">2. 1-Click Job Description Tailor</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Instantly tailor your executive profile summary and key skills to mirror target job criteria perfectly, pushing matching score up significantly!
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Paste Target Job Description:
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste details of the role here to align summary and discover priority skills..."
                  className="w-full h-24 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-violet-500 bg-slate-5/20 leading-relaxed resize-none"
                />
              </div>

              <button
                onClick={handleTailor}
                disabled={isLoading || !jobDescription.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing & tailoring summary...</span>
                  </>
                ) : (
                  <>
                    <span>Tailor Summary & Skills</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Tailored Results block */}
            {(tailoredSummary || suggestedSkills.length > 0) && (
              <div className="space-y-3.5">
                {tailoredSummary && (
                  <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-2.5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      ✨ Tailored Executive Summary Statement
                    </span>
                    <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed italic">
                      "{tailoredSummary}"
                    </p>
                    <button
                      onClick={applyTailoredSummary}
                      className="w-full border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 font-extrabold py-1.5 rounded text-[11px] cursor-pointer transition-colors"
                    >
                      Apply Customized Summary
                    </button>
                  </div>
                )}

                {suggestedSkills.length > 0 && (
                  <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-2.5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      📌 Priority Missing Skills in JD
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                      Click standard badge items below to append them directly into your core resume skill list:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedSkills.map((sk, index) => (
                        <button
                          key={index}
                          onClick={() => applyTailoredSkill(sk)}
                          className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3 text-indigo-500" />
                          <span>{sk}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Cliché Word Scanner & Fixer */}
        {activeTab === "cliche" && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-800">
                <ShieldAlert className="w-4 h-4 text-violet-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">3. Cliché & Weak Word Auditor</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Parsers and top hiring managers skip resumes containing dry, passive words. Scan your resume to identify weak wording (e.g. "responsible for") and auto-replace them with dynamic metrics-driven verbs!
              </p>

              <button
                onClick={handleScanCliches}
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing resume text...</span>
                  </>
                ) : (
                  <>
                    <span>Scan Active Resume for Clichés</span>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Cliché Findings */}
            {clicheFindings.length > 0 ? (
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Cliche Words Discovered ({clicheFindings.filter(f => !f.applied).length})
                </h5>
                {clicheFindings.map((finding) => (
                  <div 
                    key={finding.id} 
                    className={`bg-white border p-3 rounded-xl space-y-2.5 transition-all shadow-sm ${
                      finding.applied 
                        ? "border-emerald-200 bg-emerald-50/20 opacity-80" 
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-extrabold px-1.5 py-0.5 rounded border border-rose-100">
                        Weak Phrasing: "{finding.phrase}"
                      </span>
                      {finding.applied ? (
                        <span className="text-[10px] font-black text-emerald-600 flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Fixed!</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => applyClicheFix(finding)}
                          className="text-[10px] font-bold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer flex items-center space-x-0.5"
                        >
                          <Zap className="w-3 h-3 fill-violet-600" />
                          <span>Apply Auto-Fix</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded">
                      "<em>{finding.text}</em>"
                    </p>

                    {!finding.applied && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <p className="text-[10px] text-slate-700 leading-normal">
                          💡 <strong>Replacement Verb:</strong> <span className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{finding.replacement}</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                          {finding.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 4: Skill Gap Analyzer */}
        {activeTab === "gap" && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-800">
                <Cpu className="w-4 h-4 text-violet-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">4. ATS Skill Gap Analyzer</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Directly compare your resume skills matrix against your target job category requirements, identifying missing keywords and career credentials.
              </p>

              <div className="space-y-3.5 pt-2.5 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Target Job Title:
                  </label>
                  <input
                    type="text"
                    value={gapJobTitle}
                    onChange={(e) => setGapJobTitle(e.target.value)}
                    placeholder="e.g., Senior Frontend Engineer"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-violet-500 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Target Job Description:
                  </label>
                  <textarea
                    value={gapJobDesc}
                    onChange={(e) => setGapJobDesc(e.target.value)}
                    placeholder="Paste job details to compute missing critical skills and credential categories..."
                    className="w-full h-20 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-violet-500 bg-slate-50/50 leading-relaxed resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyzeGap}
                disabled={isLoading || !gapJobTitle.trim() || !gapJobDesc.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Comparing skill profiles...</span>
                  </>
                ) : (
                  <>
                    <span>Compute Skills Gap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Gap Analysis results */}
            {(matchingSkills.length > 0 || missingSkills.length > 0) && (
              <div className="space-y-3.5">
                {/* Matching Skills */}
                <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-2 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Matching Keywords ({matchingSkills.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {matchingSkills.map((sk, index) => (
                      <span key={index} className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-2 shadow-sm">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>Critical Missing Skills ({missingSkills.length})</span>
                  </span>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                    Click items to insert them instantly into your resume category block:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((sk, index) => (
                      <button
                        key={index}
                        onClick={() => addMissingSkill(sk)}
                        className="bg-rose-50/50 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{sk}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Certifications recommended */}
                {certifications.length > 0 && (
                  <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-2 shadow-sm">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>Recommended Certifications</span>
                    </span>
                    <div className="space-y-1.5">
                      {certifications.map((cert, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100 text-[11px] font-bold text-slate-800">
                          <span>{cert}</span>
                          <button
                            onClick={() => addGapCertification(cert)}
                            className="text-[9px] bg-violet-50 hover:bg-violet-100 text-violet-700 px-2 py-1 rounded cursor-pointer border border-violet-100 font-bold"
                          >
                            Add to Resume
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: ATS Formatting & Readability Checklist */}
        {activeTab === "ats-audit" && (
          <div className="space-y-4">
            <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-3.5 shadow-sm text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Live ATS Formatting Score
              </span>

              {/* Progress visual ring */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={
                      formattingScore >= 80 
                        ? "#10b981" 
                        : formattingScore >= 50 
                        ? "#f59e0b" 
                        : "#f43f5e"
                    }
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * formattingScore) / 100}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-slate-800">
                    {formattingScore}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Points</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Your layout, structural sections, character lengths, and metrics density are audited in real time as you edit. Aim for <strong>85+ points</strong> to guarantee perfect parsing.
              </p>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Audit Checklist details
              </h5>
              {checklistItems.map((item) => (
                <div key={item.id} className="bg-white border border-slate-150 p-3.5 rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {item.label}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      item.status === "pass"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : item.status === "warning"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed italic bg-slate-50 p-2 rounded border border-slate-100">
                    💡 <strong>Rule Tip:</strong> {item.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
