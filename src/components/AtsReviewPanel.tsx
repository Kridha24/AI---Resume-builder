import React, { useState } from "react";
import { 
  Sparkles, ShieldCheck, Loader2, AlertCircle, ArrowUpRight, 
  CheckCircle2, PlusCircle, Bookmark, Star, HelpCircle, LogIn, Lock, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { ResumeData } from "../types";
import { signInWithGoogle } from "../firebase";

const COMMON_KEYWORDS = [
  "React", "TypeScript", "Node.js", "Python", "Docker", "AWS", "SQL", "Agile", "Scrum", "CI/CD", "Git",
  "Kubernetes", "GraphQL", "REST API", "MongoDB", "Redux", "Testing", "Tailwind", "CSS", "HTML", "Javascript",
  "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "Machine Learning", "Data Analysis", "Project Management",
  "Product Management", "System Design", "Microservices", "Linux", "UI/UX", "Figma", "Firebase", "PostgreSQL",
  "Next.js", "SaaS", "NoSQL", "DevOps", "Cybersecurity", "Automated Testing", "API Design", "Jest", "Webpack",
  "Cloud", "Analytics", "Communication", "Teamwork", "Problem Solving", "Leadership"
];

interface AtsFeedback {
  category: string;
  description: string;
  howToFix: string;
}

interface AtsResult {
  score: number;
  scoreExplanation: string;
  feedback: AtsFeedback[];
  suggestedKeywords: string[];
  atsTips: string[];
  matchScore?: number;
  matchingKeywords?: string[];
  missingKeywords?: string[];
}

interface AtsReviewPanelProps {
  resumeData: ResumeData;
  isAuthenticated: boolean;
  accentColor: string;
}

export default function AtsReviewPanel({
  resumeData,
  isAuthenticated,
  accentColor
}: AtsReviewPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Job description matching states
  const [jobDescription, setJobDescription] = useState("");
  const [scannedJobDescription, setScannedJobDescription] = useState("");

  // Extract all tech stack/skills list from user's active resume
  const getUserResumeSkills = () => {
    const skillList: string[] = [];
    if (resumeData.skills) {
      resumeData.skills.forEach(cat => {
        if (cat.skills) {
          cat.skills.forEach(s => skillList.push(s.trim()));
        }
      });
    }
    if (resumeData.projects) {
      resumeData.projects.forEach(p => {
        if (p.technologies) {
          p.technologies.forEach(t => skillList.push(t.trim()));
        }
      });
    }
    return Array.from(new Set(skillList.filter(Boolean)));
  };

  // Perform quick reactive client-side matching
  const getClientAnalysis = () => {
    if (!jobDescription || jobDescription.trim().length === 0) {
      return { matched: [], missing: [], score: 0 };
    }

    const resumeSkills = getUserResumeSkills();
    const jdLower = jobDescription.toLowerCase();

    // 1. Identify direct matching skills
    const matched = resumeSkills.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(jdLower);
    });

    // 2. Identify missing keywords from our general list
    const missing = COMMON_KEYWORDS.filter(kw => {
      const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const inJD = new RegExp(`\\b${escapedKw}\\b`, 'i').test(jdLower);
      if (!inJD) return false;
      const inResume = resumeSkills.some(rs => rs.toLowerCase() === kw.toLowerCase());
      return !inResume;
    });

    const totalRelevant = matched.length + missing.length;
    const score = totalRelevant > 0 ? Math.round((matched.length / totalRelevant) * 100) : 0;

    return { matched, missing, score };
  };

  const clientAnalysis = getClientAnalysis();

  const handleScan = async () => {
    if (!isAuthenticated) {
      return; // Handled by UI lock
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/ats-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jobDescription })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse resume with ATM System.");
      }

      setResult(data);
      setScannedJobDescription(jobDescription);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while evaluating ATS score.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 5) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getScoreBadgeBg = (score: number) => {
    if (score >= 8) return "bg-emerald-600";
    if (score >= 5) return "bg-amber-500";
    return "bg-rose-500";
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
            Unlock AI ATS Matcher (ATM System)
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Get a professional rating from 1 to 10, exact details on where to modify your resume, and keyword optimization guidelines by signing in first.
          </p>
        </div>

        <button
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch (err: any) {
              if (err?.code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user")) {
                console.log("Sign-in cancelled: user closed the authentication popup window.");
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
          <span>Free Cloud Storage Included</span>
        </div>
      </div>
    );
  }

  // Check if current jobDescription is the one that was analyzed by AI
  const isJDMatchedWithAI = !!result && 
    result.matchScore !== undefined && 
    !!scannedJobDescription && 
    jobDescription.trim().toLowerCase() === scannedJobDescription.trim().toLowerCase();

  // If matched with AI, use Gemini's precise results. Otherwise, fall back to our fast client analysis.
  const displayMatchScore = isJDMatchedWithAI && result?.matchScore !== undefined
    ? result.matchScore 
    : clientAnalysis.score;

  const displayMatchedKeywords = isJDMatchedWithAI && result?.matchingKeywords
    ? result.matchingKeywords 
    : clientAnalysis.matched;

  const displayMissingKeywords = isJDMatchedWithAI && result?.missingKeywords
    ? result.missingKeywords 
    : clientAnalysis.missing;

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
              ATM Match Scanner
            </h4>
            <span className="text-[10px] text-slate-400 font-bold block leading-none">
              Applicant Tracking Match Engine
            </span>
          </div>
        </div>

        {!result && !loading && (
          <button
            onClick={handleScan}
            className="text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Scan Resume
          </button>
        )}
      </div>

      {/* Target Job Description & Matching Interface */}
      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            🎯 Target Job Description (Optional)
          </label>
          {jobDescription && (
            <button
              onClick={() => {
                setJobDescription("");
                setScannedJobDescription("");
                if (result) {
                  const { matchScore, matchingKeywords, missingKeywords, ...rest } = result;
                  setResult(rest as any);
                }
              }}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste a target job description here to extract keywords, check for missing skills, and calculate a live match score..."
          className="w-full h-24 text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white resize-none"
        />

        {jobDescription.trim().length > 0 && (
          <div className="space-y-3.5 pt-3.5 border-t border-slate-200/60">
            {/* Match Score Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  {isJDMatchedWithAI ? "✨ AI Certified Match Score:" : "⏳ Estimated Match Score:"}
                </span>
                {jobDescription.trim() !== scannedJobDescription.trim() && scannedJobDescription && (
                  <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded border border-amber-100 animate-pulse">
                    Modified
                  </span>
                )}
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                displayMatchScore >= 75
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : displayMatchScore >= 40
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-rose-100 text-rose-800 border border-rose-200"
              }`}>
                {displayMatchScore}% Match
              </span>
            </div>

            {/* Score progress bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  displayMatchScore >= 75
                    ? "bg-emerald-500"
                    : displayMatchScore >= 40
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${displayMatchScore}%` }}
              />
            </div>

            {/* Keyword Chips */}
            <div className="grid grid-cols-1 gap-3.5">
              {/* Matched Keywords */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
                  Matched Keywords ({displayMatchedKeywords.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {displayMatchedKeywords.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic font-medium">
                      No matching keywords detected yet. Integrate target job terms into your resume.
                    </span>
                  ) : (
                    displayMatchedKeywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="bg-emerald-50/80 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-sm"
                      >
                        <span className="text-emerald-500">✓</span>
                        <span>{kw}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 shrink-0" />
                  Missing Keywords ({displayMissingKeywords.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {displayMissingKeywords.length === 0 ? (
                    <span className="text-[10px] text-emerald-600 italic font-bold">
                      All core terms match! Incredible job!
                    </span>
                  ) : (
                    displayMissingKeywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="bg-rose-50/80 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-sm"
                      >
                        <span className="text-rose-400 font-extrabold">+</span>
                        <span>{kw}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Help Prompt */}
            {!isJDMatchedWithAI ? (
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                💡 Showing instant parser approximation. Click <strong>Scan Resume</strong> to run our advanced ATM system with Gemini to get your official ATS score and customized content recommendations!
              </p>
            ) : jobDescription.trim() !== scannedJobDescription.trim() ? (
              <p className="text-[9px] text-amber-600 font-semibold leading-relaxed">
                ⚠️ You modified the job description. Click <strong>Scan Resume</strong> to recalculate your certified AI Match Score.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">Reviewing Resume Sections...</p>
            <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
              Evaluating verb phrasing, industry target matches, metrics, and structural alignment.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Evaluation failed</span>
            <p className="text-[11px] leading-relaxed mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* When no scan has run yet */}
      {!result && !loading && !error && (
        <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Analyze your active resume layout and content structure against recruiter criteria.
          </p>
          <button
            onClick={handleScan}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate ATS/ATM Report</span>
          </button>
          <div className="flex justify-center items-center space-x-4 text-[9px] text-slate-400 font-semibold pt-1">
            <span>✓ Structural Scan</span>
            <span>✓ Keyword Analysis</span>
            <span>✓ Score (1 to 10)</span>
          </div>
        </div>
      )}

      {/* Results output view */}
      {result && !loading && (
        <div className="space-y-5">
          
          {/* Rating circle & score row */}
          <div className="flex items-center space-x-4 p-3.5 rounded-xl bg-slate-50 border border-slate-150">
            <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shrink-0 ${getScoreColor(result.score)}`}>
              <span className="text-lg font-black leading-none">{result.score}</span>
              <span className="text-[8px] font-extrabold uppercase tracking-wide opacity-80 mt-0.5">/ 10</span>
            </div>
            
            <div className="min-w-0">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Overall ATM Match Score
              </span>
              <p className="text-[11px] font-medium text-slate-700 leading-relaxed">
                {result.scoreExplanation}
              </p>
            </div>
          </div>

          {/* Section: "Where to Change to hit ATM Level" */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Required Changes for Top Tier ATM Match:
            </span>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {result.feedback.map((item, idx) => {
                const isOpen = expandedIndex === idx;
                return (
                  <div key={idx} className="transition-all">
                    <button
                      onClick={() => setExpandedIndex(isOpen ? null : idx)}
                      className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${getScoreBadgeBg(result.score)}`} />
                        <span className="text-xs font-bold text-slate-800">{item.category}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 space-y-2.5 bg-slate-50/40 text-[11px] leading-relaxed border-t border-slate-100">
                        <div>
                          <span className="font-extrabold text-[9px] uppercase tracking-wider text-amber-600 block">Current Issue:</span>
                          <p className="text-slate-600 font-medium">{item.description}</p>
                        </div>
                        <div className="p-2 bg-emerald-50/60 border border-emerald-100/50 rounded-lg">
                          <span className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                            <span>Action to Hit Top Level:</span>
                          </span>
                          <p className="text-slate-700 font-semibold mt-0.5">{item.howToFix}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keywords suggestions */}
          <div className="space-y-1.5 p-3.5 bg-indigo-50/30 border border-indigo-100/30 rounded-xl">
            <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">
              Recommended ATS Keywords to Add:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.suggestedKeywords.map((kw, i) => (
                <span 
                  key={i} 
                  className="bg-white border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Quick parser tips */}
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Formatting Compliance Tips:
            </span>
            <ul className="space-y-1">
              {result.atsTips.map((tip, i) => (
                <li key={i} className="text-[10px] text-slate-500 flex items-start space-x-1.5">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleScan}
            className="w-full text-center py-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-all cursor-pointer"
          >
            Re-scan with your changes
          </button>
          
        </div>
      )}
    </div>
  );
}
