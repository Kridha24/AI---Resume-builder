import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Download, Upload, Printer, ZoomIn, ZoomOut, RotateCcw, 
  FileJson, Check, Sliders, Type, HelpCircle, X, Palette, LayoutGrid, Home, ArrowLeft, MessageSquare, Loader2, Cloud
} from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { SAMPLE_RESUMES } from "./data";
import { ResumeData, LayoutSettings, TemplateId } from "./types";
import ResumeForm from "./components/ResumeForm";
import ResumePreview from "./components/ResumePreview";
import LandingPage from "./components/LandingPage";
import CoverLetterGenerator from "./components/CoverLetterGenerator";
import AICoachSidebar from "./components/AICoachSidebar";
import AuthHeaderWidget from "./components/AuthHeaderWidget";
import AtsReviewPanel from "./components/AtsReviewPanel";
import ResumeVersionHistory from "./components/ResumeVersionHistory";
import AiToolkitPanel from "./components/AiToolkitPanel";

const COLOR_PRESETS = [
  { name: "Ocean Blue", value: "#0284c7" },
  { name: "Emerald Forest", value: "#0f766e" },
  { name: "Crimson Red", value: "#b91c1c" },
  { name: "Royal Indigo", value: "#4f46e5" },
  { name: "Luxury Gold", value: "#b45309" },
  { name: "Midnight Slate", value: "#334155" },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<"landing" | "builder" | "cover-letter">("landing");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [loadedCoverLetter, setLoadedCoverLetter] = useState<{ targetRole: string; targetCompany: string; jobDescription: string; content: string } | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"edit" | "version" | "ats" | "ai-toolkit">("edit");

  // Cloud document tracking
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [activeResumeName, setActiveResumeName] = useState<string | null>(null);

  // Initialize state with Software Engineer sample by default
  const [resumeData, setResumeData] = useState<ResumeData>(SAMPLE_RESUMES.software_engineer.data);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(SAMPLE_RESUMES.software_engineer.layout);
  
  const [zoom, setZoom] = useState<number>(0.9);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [currentPreset, setCurrentPreset] = useState<string>("software_engineer");
  
  // Success notification feedback
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  // Cloud Saving states
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [cloudSaveSuccess, setCloudSaveSuccess] = useState(false);

  const handleSaveResumeCloud = async () => {
    if (!user) {
      alert("Please sign in first on the home portal page to save your resume to the cloud.");
      return;
    }

    const name = prompt("Enter a name for this saved resume draft:", resumeData.personalInfo.fullName ? `${resumeData.personalInfo.fullName} Resume` : "My Resume Draft");
    if (name === null) return; // user cancelled

    setIsCloudSaving(true);
    try {
      const resumesRef = collection(db, "resumes");
      const docRef = await addDoc(resumesRef, {
        userId: user.uid,
        name: name || "Untitled Resume",
        data: resumeData,
        layout: layoutSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setActiveResumeId(docRef.id);
      setActiveResumeName(name || "Untitled Resume");
      setCloudSaveSuccess(true);
      setTimeout(() => setCloudSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save resume to cloud: " + err.message);
    } finally {
      setIsCloudSaving(false);
    }
  };

  // Portal Actions
  const handleStartScratch = (template: TemplateId, colorTheme: string) => {
    setActiveResumeId(null);
    setActiveResumeName(null);
    setResumeData({
      personalInfo: {
        fullName: "",
        jobTitle: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        github: ""
      },
      summary: "",
      workExperience: [],
      education: [],
      projects: [],
      skills: [],
      languages: [],
      certifications: [],
      customSection: {
        title: "Custom Achievements",
        content: "",
        show: false
      }
    });
    setLayoutSettings({
      template,
      colorTheme,
      fontSize: "base",
      fontFamily: "sans",
      spacing: "comfortable",
      sectionOrder: ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "customSection"]
    });
    setCurrentPage("builder");
  };

  const handleStartPreset = (presetKey: string) => {
    if (SAMPLE_RESUMES[presetKey]) {
      setActiveResumeId(null);
      setActiveResumeName(null);
      setResumeData(SAMPLE_RESUMES[presetKey].data);
      setLayoutSettings(SAMPLE_RESUMES[presetKey].layout);
      setCurrentPreset(presetKey);
      setCurrentPage("builder");
    }
  };

  const handleStartParsed = (parsedData: ResumeData) => {
    setActiveResumeId(null);
    setActiveResumeName(null);
    setResumeData(parsedData);
    // Use an elegant default template for parsed resume
    setLayoutSettings({
      template: "modern",
      colorTheme: "#4f46e5",
      fontSize: "base",
      fontFamily: "sans",
      spacing: "comfortable",
      sectionOrder: ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "customSection"]
    });
    setCurrentPage("builder");
  };

  // Autosave / Load from localStorage on startup
  useEffect(() => {
    const savedData = localStorage.getItem("resume_builder_data");
    const savedLayout = localStorage.getItem("resume_builder_layout");
    
    if (savedData && savedLayout) {
      try {
        setResumeData(JSON.parse(savedData));
        setLayoutSettings(JSON.parse(savedLayout));
        console.log("Autosave draft restored successfully.");
      } catch (e) {
        console.error("Failed to parse saved local draft", e);
      }
    }
  }, []);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem("resume_builder_data", JSON.stringify(resumeData));
    localStorage.setItem("resume_builder_layout", JSON.stringify(layoutSettings));
  }, [resumeData, layoutSettings]);

  // Load a preset template
  const handleLoadPreset = (key: string) => {
    if (window.confirm(`Would you like to load the ${SAMPLE_RESUMES[key].name} template? This will replace your current edits.`)) {
      setResumeData(SAMPLE_RESUMES[key].data);
      setLayoutSettings(SAMPLE_RESUMES[key].layout);
      setCurrentPreset(key);
    }
  };

  // Reset entire resume to empty
  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear your resume? This cannot be undone.")) {
      setResumeData({
        personalInfo: {
          fullName: "",
          jobTitle: "",
          email: "",
          phone: "",
          location: "",
          website: "",
          linkedin: "",
          github: ""
        },
        summary: "",
        workExperience: [],
        education: [],
        projects: [],
        skills: [],
        languages: [],
        certifications: [],
        customSection: {
          title: "Custom Achievements",
          content: "",
          show: false
        }
      });
      setLayoutSettings({
        template: "minimal",
        colorTheme: "#0284c7",
        fontSize: "base",
        fontFamily: "sans",
        spacing: "comfortable",
        sectionOrder: ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "customSection"]
      });
    }
  };

  // Export/Download JSON Draft
  const handleExportJSON = () => {
    const backup = {
      version: "1.0",
      resumeData,
      layoutSettings
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_") || "My_Resume"}_draft.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  // Import/Upload JSON Draft
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.resumeData && json.layoutSettings) {
          setResumeData(json.resumeData);
          setLayoutSettings(json.layoutSettings);
          alert("Resume draft imported successfully!");
        } else {
          alert("Invalid file format. Ensure the JSON was exported from this Resume Builder.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Clear input
    event.target.value = "";
  };

  // Handle PDF Export / Browser Print
  const triggerPrint = () => {
    setShowPrintModal(true);
  };

  const confirmPrint = () => {
    setShowPrintModal(false);
    // Tiny delay to allow state changes to settle
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleLoadResume = (data: ResumeData, layout: LayoutSettings, id?: string, name?: string) => {
    setResumeData(data);
    setLayoutSettings(layout);
    setActiveResumeId(id || null);
    setActiveResumeName(name || null);
    setCurrentPage("builder");
  };

  const handleLoadCoverLetter = (targetRole: string, targetCompany: string, jobDescription: string, content: string) => {
    setLoadedCoverLetter({ targetRole, targetCompany, jobDescription, content });
    setCurrentPage("cover-letter");
  };

  if (currentPage === "landing") {
    return (
      <LandingPage
        user={user}
        onStartScratch={handleStartScratch}
        onStartPreset={handleStartPreset}
        onStartParsed={handleStartParsed}
        onOpenCoverLetter={() => {
          setLoadedCoverLetter(null);
          setCurrentPage("cover-letter");
        }}
        onLoadResume={handleLoadResume}
        onLoadCoverLetter={handleLoadCoverLetter}
      />
    );
  }

  if (currentPage === "cover-letter") {
    return (
      <CoverLetterGenerator
        resumeData={resumeData}
        layoutSettings={layoutSettings}
        initialCoverLetter={loadedCoverLetter}
        onBack={() => {
          setLoadedCoverLetter(null);
          setCurrentPage("landing");
        }}
      />
    );
  }

  return (
    <div id="main-applet-root" className="min-h-screen bg-slate-50 flex flex-col overflow-hidden text-slate-800">
      
      {/* GLOBAL HEADER BAR */}
      <header className="no-print h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Back Home Button */}
          <button
            onClick={() => setCurrentPage("landing")}
            className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 hover:bg-white py-1.5 px-3 rounded-lg cursor-pointer transition-all"
            title="Return to Main Portal Dashboard"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home Portal</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg font-black tracking-tighter text-sm flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-md font-semibold text-slate-900 tracking-tight leading-none flex items-baseline gap-1.5">
                <span className="font-bold">Resumify</span>
                {resumeData.personalInfo.jobTitle && (
                  <span className="text-slate-400 font-normal text-xs">/ {resumeData.personalInfo.jobTitle}</span>
                )}
              </h1>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Build, style, and download crisp, select-ready PDF resume drafts</p>
            </div>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center space-x-2">
          <AuthHeaderWidget />

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Preset templates selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mr-1.5 font-sans">Presets:</span>
            <select
              value={currentPreset}
              onChange={(e) => handleLoadPreset(e.target.value)}
              className="bg-transparent text-xs text-indigo-600 font-bold focus:outline-none cursor-pointer hover:text-indigo-700 pr-1"
            >
              <option value="software_engineer" className="bg-white text-slate-800">Software Engineer</option>
              <option value="product_manager" className="bg-white text-slate-800">Product Manager</option>
              <option value="creative_designer" className="bg-white text-slate-800">Brand & UI Designer</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Cloud Saving Action */}
          {user && (
            <button
              onClick={handleSaveResumeCloud}
              disabled={isCloudSaving}
              className={`flex items-center space-x-1.5 text-xs border py-1.5 px-3 rounded-lg transition-all shadow-sm font-semibold cursor-pointer ${
                cloudSaveSuccess 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              title="Save this resume draft securely in your cloud Firestore database"
            >
              {isCloudSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Saving...</span>
                </>
              ) : cloudSaveSuccess ? (
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
          )}

          {/* Backup Action */}
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-1.5 px-3 rounded-lg transition-all shadow-sm font-semibold"
            title="Download JSON draft to your local disk"
          >
            {saveFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Backup JSON</span>
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-1.5 px-2.5 rounded-lg transition-all shadow-sm font-semibold"
            title="Load an existing JSON resume backup file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Load Draft</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleReset}
            className="p-1.5 bg-white hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-500 transition-all border border-slate-200 shadow-sm"
            title="Clear all fields"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* AI Coach Helper Button */}
          <button
            onClick={() => setIsCoachOpen(!isCoachOpen)}
            className="flex items-center space-x-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-1.5 px-3 rounded-lg transition-all shadow-sm font-semibold cursor-pointer"
            title="Open AI Career Coach Sidebar"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Coach Help</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Core print PDF trigger */}
          <button
            onClick={triggerPrint}
            className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-lg transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      {/* CORE SPLIT SCREEN */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: FORMS */}
        <div className="no-print w-full md:w-[440px] shrink-0 h-full overflow-hidden flex flex-col bg-white border-r border-slate-200">
          {/* Quick Layout Styling top board inside sidebar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Design Layout Settings</span>
            </span>

            {/* Template, Fonts, Sizes sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Template Style</label>
                <select
                  value={layoutSettings.template}
                  onChange={(e) => setLayoutSettings(prev => ({ ...prev, template: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="modern">Modern Accent</option>
                  <option value="split">Split Columns</option>
                  <option value="minimal">Minimal Single</option>
                  <option value="executive">Executive Serif</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Primary Font</label>
                <select
                  value={layoutSettings.fontFamily}
                  onChange={(e) => setLayoutSettings(prev => ({ ...prev, fontFamily: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="sans">Inter (Modern Sans)</option>
                  <option value="serif">Georgia (Classic Serif)</option>
                  <option value="mono">JetBrains Mono (Technical)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Text Size</label>
                <select
                  value={layoutSettings.fontSize}
                  onChange={(e) => setLayoutSettings(prev => ({ ...prev, fontSize: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded py-1 px-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="sm">Small</option>
                  <option value="base">Normal</option>
                  <option value="lg">Large</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Line Spacing</label>
                <select
                  value={layoutSettings.spacing}
                  onChange={(e) => setLayoutSettings(prev => ({ ...prev, spacing: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded py-1 px-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="loose">Spacious</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Accent Palette</label>
                <div className="flex items-center space-x-1.5 h-7">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => setLayoutSettings(prev => ({ ...prev, colorTheme: col.value }))}
                      className={`w-4 h-4 rounded-full border border-white transition-all cursor-pointer hover:scale-110 shadow-sm`}
                      style={{ 
                        backgroundColor: col.value,
                        boxShadow: layoutSettings.colorTheme === col.value ? "0 0 0 2px #4f46e5" : "none"
                      }}
                      title={col.name}
                    />
                  ))}
                  {/* Hex Picker fallback */}
                  <input 
                    type="color" 
                    value={layoutSettings.colorTheme}
                    onChange={(e) => setLayoutSettings(prev => ({ ...prev, colorTheme: e.target.value }))}
                    className="w-5 h-5 bg-transparent border-0 cursor-pointer outline-none rounded shrink-0 p-0"
                    title="Choose custom hex color"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 shrink-0">
            <button
              onClick={() => setSidebarTab("edit")}
              className={`flex-1 py-2.5 text-[11px] font-bold text-center border-b-2 transition-all cursor-pointer ${
                sidebarTab === "edit"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              📝 Edit
            </button>
            <button
              onClick={() => setSidebarTab("version")}
              className={`flex-1 py-2.5 text-[11px] font-bold text-center border-b-2 transition-all cursor-pointer ${
                sidebarTab === "version"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              ⏳ History
            </button>
            <button
              onClick={() => setSidebarTab("ai-toolkit")}
              className={`flex-1 py-2.5 text-[11px] font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                sidebarTab === "ai-toolkit"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>🔮 AI Toolkit</span>
            </button>
            <button
              onClick={() => setSidebarTab("ats")}
              className={`flex-1 py-2.5 text-[11px] font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center space-x-0.5 ${
                sidebarTab === "ats"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>⚡ ATS Match</span>
            </button>
          </div>

          {/* Form Editor, Version History, AI Toolkit, or ATS Scanner block */}
          <div className="flex-1 overflow-y-auto bg-white">
            {sidebarTab === "edit" ? (
              <ResumeForm 
                resumeData={resumeData}
                setResumeData={setResumeData}
                layoutSettings={layoutSettings}
                setLayoutSettings={setLayoutSettings}
              />
            ) : sidebarTab === "version" ? (
              <div className="p-4">
                <ResumeVersionHistory 
                  userId={user?.uid || ""}
                  activeResumeId={activeResumeId}
                  activeResumeName={activeResumeName}
                  resumeData={resumeData}
                  layoutSettings={layoutSettings}
                  onLoadResume={handleLoadResume}
                  onSetCloudResume={(id, name) => {
                     setActiveResumeId(id);
                     setActiveResumeName(name);
                  }}
                  accentColor={layoutSettings.colorTheme || "#4f46e5"}
                />
              </div>
            ) : sidebarTab === "ai-toolkit" ? (
              <div className="h-full">
                <AiToolkitPanel 
                  resumeData={resumeData}
                  setResumeData={setResumeData}
                  colorTheme={layoutSettings.colorTheme || "#4f46e5"}
                />
              </div>
            ) : (
              <div className="p-4">
                <AtsReviewPanel 
                  resumeData={resumeData}
                  isAuthenticated={!!user}
                  accentColor={layoutSettings.colorTheme || "#4f46e5"}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PREVIEW CANVAS VIEW */}
        <main className="no-print flex-1 bg-slate-100 p-6 overflow-y-auto flex flex-col items-center justify-start scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          
          {/* Preview Navigation toolbar */}
          <div className="w-full max-w-[800px] flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-5 shadow-sm shrink-0">
            <span className="text-xs font-sans text-slate-600 font-semibold flex items-center space-x-1.5">
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              <span>Real-Time PDF Blueprint Preview</span>
            </span>

            <div className="flex items-center space-x-4">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setZoom(prev => Math.max(0.65, prev - 0.05))}
                  disabled={zoom <= 0.65}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-600 w-11 text-center font-semibold">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(prev => Math.min(1.2, prev + 0.05))}
                  disabled={zoom >= 1.2}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(0.9)}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 ml-1"
                  title="Fit preview layout"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* Instructions Guide trigger */}
              <button
                onClick={() => setShowPrintModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 font-semibold bg-indigo-50 border border-indigo-100 py-1 px-2.5 rounded-lg cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Print Guide</span>
              </button>
            </div>
          </div>

          {/* Interactive Scaled Resume Sheet Canvas container */}
          <div className="w-full flex-1 flex justify-center p-2 relative overflow-visible">
            <ResumePreview 
              resumeData={resumeData}
              layoutSettings={layoutSettings}
              zoom={zoom}
            />
          </div>

          <p className="text-[11px] text-slate-500 font-sans mt-4 text-center leading-normal select-none">
            Pro Tip: Highlight achievements with bracket tokens like <strong style={{ color: layoutSettings.colorTheme }}>[15%]</strong> or <strong style={{ color: layoutSettings.colorTheme }}>[$20K]</strong>. They will auto-colorize with your selected primary theme accent!
          </p>
        </main>
      </div>

      {/* RENDER-ONLY PRINT ZONE - Hidden in browser, centered in print */}
      <div className="print-only">
        <ResumePreview 
          resumeData={resumeData}
          layoutSettings={layoutSettings}
          zoom={1} // Keep print sizing at crisp absolute 100% vector scale
        />
      </div>

      {/* PRINT SETTINGS AND PDF EXPORT GUIDE DIALOG MODAL */}
      {showPrintModal && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4.5 right-4.5 text-slate-400 hover:text-slate-600 transition-all p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">Export Clean, High-Fidelity PDF</h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 leading-normal">
                To export your custom resume to a vector-sharp, text-selectable PDF, we use the browser's native print engine. For the absolute best results, please review these optimal printer preferences:
              </p>

              <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start space-x-2">
                  <div className="bg-indigo-50 text-indigo-700 rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Set Destination to <strong>Save as PDF</strong> or <strong>Microsoft Print to PDF</strong>.
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-indigo-50 text-indigo-700 rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Open "More Settings" and <strong>Check the box for "Background graphics"</strong> (required to show theme accent blocks and tags!).
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-indigo-50 text-indigo-700 rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Set Margins to <strong>None</strong> or <strong>Default</strong>. Uncheck "Headers and footers" to hide website urls.
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-indigo-50 text-indigo-700 rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Select <strong>Portrait</strong> layout. Your PDF will be generated at vector fidelity, preserving font structures and high contrast!
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-mono text-emerald-600 font-bold">✓</span>
                <p>No watermark, no registration, and fully searchable text-structures. Completely free.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-2.5">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmPrint}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md shadow-indigo-600/10 flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Print Window</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI Career Assistant Coach Sidebar overlay */}
      <AICoachSidebar 
        resumeData={resumeData}
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        accentColor={layoutSettings.colorTheme || "#4f46e5"}
      />
    </div>
  );
}
