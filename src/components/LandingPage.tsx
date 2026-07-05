import React, { useState } from "react";
import { 
  Sparkles, FileText, ArrowRight, Upload, ClipboardCopy, Mail, Sliders, Check, BookOpen, User, PenTool, LayoutGrid, HelpCircle, Cloud
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { TemplateId, ResumeData, LayoutSettings } from "../types";
import TemplateSelector from "./TemplateSelector";
import ResumeRecreator from "./ResumeRecreator";
import AuthHeaderWidget from "./AuthHeaderWidget";
import CloudFilesList from "./CloudFilesList";

interface LandingPageProps {
  user: FirebaseUser | null;
  onStartScratch: (template: TemplateId, colorTheme: string) => void;
  onStartPreset: (presetKey: string) => void;
  onStartParsed: (data: ResumeData) => void;
  onOpenCoverLetter: () => void;
  onLoadResume: (data: ResumeData, layout: LayoutSettings, id?: string, name?: string) => void;
  onLoadCoverLetter: (targetRole: string, targetCompany: string, jobDescription: string, content: string) => void;
}

export default function LandingPage({
  user,
  onStartScratch,
  onStartPreset,
  onStartParsed,
  onOpenCoverLetter,
  onLoadResume,
  onLoadCoverLetter
}: LandingPageProps) {
  // Config state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("modern");
  const [selectedColor, setSelectedColor] = useState<string>("#4f46e5");
  const [activeTab, setActiveTab] = useState<"scratch" | "recreate" | "cover-letter">("scratch");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-start">
      
      {/* Top Header Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg font-black tracking-tighter text-xs flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <span className="text-sm font-black text-slate-900 tracking-tight">Resumify Career Suite</span>
        </div>
        <div className="flex items-center space-x-4">
          <AuthHeaderWidget />
        </div>
      </header>

      {/* Brand Hero Banner */}
      <div className="bg-slate-900 text-white py-14 px-8 relative overflow-hidden shrink-0">
        {/* Subtle background abstract shapes */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 opacity-90" />
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Gen Career Suite</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight font-sans">
            Craft PDF-Perfect Resumes & Cover Letters
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Choose a manually refined design template. Build a new resume from scratch, recreate/parse an existing resume using Gemini AI, or draft matching executive cover letters in minutes.
          </p>
        </div>
      </div>

      {/* Main Core Selector Grid */}
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER PORTALS: CHOOSE ACTION MODE (COL-SPAN-2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Tabs Selection Board */}
          <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex space-x-1 shadow-sm shrink-0">
            <button
              onClick={() => setActiveTab("scratch")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === "scratch"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Create New Resume</span>
            </button>

            <button
              onClick={() => setActiveTab("recreate")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === "recreate"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Recreate Old Resume</span>
            </button>

            <button
              onClick={() => setActiveTab("cover-letter")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === "cover-letter"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Cover Letter Writer</span>
            </button>
          </div>

          {/* TAB 1: CREATE NEW RESUME & SELECT TEMPLATE */}
          {activeTab === "scratch" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <TemplateSelector 
                selectedTemplate={selectedTemplate}
                onSelect={setSelectedTemplate}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-[11px] text-slate-400 font-medium">
                  Choose preset to auto-populate layout, or start fresh!
                </div>
                
                <div className="flex items-center space-x-2.5 self-end">
                  <button
                    onClick={() => onStartScratch(selectedTemplate, selectedColor)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Start Blank Resume</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECREATE WITH AI IMPORTER */}
          {activeTab === "recreate" && (
            <ResumeRecreator 
              colorTheme={selectedColor} 
              onParsed={onStartParsed} 
            />
          )}

          {/* TAB 3: COVER LETTER */}
          {activeTab === "cover-letter" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <PenTool className="w-4.5 h-4.5 text-indigo-600" />
                  <span>Interactive Cover Letter Studio</span>
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Our cover letter writer automatically scans your currently loaded background profile, highlights relevant project outcomes, and synthesizes a tailored pitch letter for target companies!
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex items-start space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">Aligned Stationery Designs</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    The generated cover letter uses the same professional font pairings, margins, and accent brand color palette chosen for your resume, ensuring cohesive candidate storytelling.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={onOpenCoverLetter}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Open Cover Letter Writer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRESETS / HIGHLIGHTS (COL-SPAN-1) */}
        <div className="space-y-6">
          {/* Cloud Files List if signed in */}
          {user && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <CloudFilesList 
                userId={user.uid}
                onLoadResume={onLoadResume}
                onLoadCoverLetter={onLoadCoverLetter}
                onOpenCoverLetterView={onOpenCoverLetter}
                accentColor={selectedColor}
              />
            </div>
          )}

          {/* Quick-Start Presets */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                Browse Core Presets
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Don't want to type everything? Load one of our curated high-performance presets tailored for specific sectors:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => onStartPreset("software_engineer")}
                className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all text-xs font-semibold text-slate-700 flex justify-between items-center group cursor-pointer"
              >
                <span>Software Engineer</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">Load &rarr;</span>
              </button>

              <button
                onClick={() => onStartPreset("product_manager")}
                className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all text-xs font-semibold text-slate-700 flex justify-between items-center group cursor-pointer"
              >
                <span>Product Manager</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">Load &rarr;</span>
              </button>

              <button
                onClick={() => onStartPreset("creative_designer")}
                className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all text-xs font-semibold text-slate-700 flex justify-between items-center group cursor-pointer"
              >
                <span>Brand & UI Designer</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">Load &rarr;</span>
              </button>
            </div>
          </div>

          {/* Core App Guidelines (Trust & Quality Indicator) */}
          <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl space-y-3 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-300">Why Resumify?</span>
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-[11px] text-slate-200">
                <span className="text-emerald-400 font-bold">✓</span>
                <p><strong>Vector PDF Quality</strong>: Crisp text, no blurry rasterization.</p>
              </div>
              <div className="flex items-start space-x-2 text-[11px] text-slate-200">
                <span className="text-emerald-400 font-bold">✓</span>
                <p><strong>Strict Privacy</strong>: Data lives locally or parses directly.</p>
              </div>
              <div className="flex items-start space-x-2 text-[11px] text-slate-200">
                <span className="text-emerald-400 font-bold">✓</span>
                <p><strong>AI-Optimized Words</strong>: Built-in professional verb selectors.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <footer className="py-6 border-t border-slate-200 bg-white text-center text-[10px] text-slate-400 tracking-wider">
        © 2026 Resumify Professional Career Suite • Built on Clean Design Rules
      </footer>

    </div>
  );
}
