import React, { useState } from "react";
import { 
  User, Briefcase, GraduationCap, Code, Globe, Award, Sparkles, 
  ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown, Check, Loader2, Layout, FileText
} from "lucide-react";
import { ResumeData, LayoutSettings, WorkExperience, Education, Project, SkillCategory } from "../types";

interface ResumeFormProps {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  layoutSettings: LayoutSettings;
  setLayoutSettings: React.Dispatch<React.SetStateAction<LayoutSettings>>;
}

export default function ResumeForm({ 
  resumeData, 
  setResumeData, 
  layoutSettings, 
  setLayoutSettings 
}: ResumeFormProps) {
  // Navigation tabs or accordions
  const [activeSection, setActiveSection] = useState<string>("personal");

  // AI Loading states
  const [aiLoading, setAiLoading] = useState<{ [key: string]: boolean }>({});
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: string]: string[] }>({});
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? "" : section);
  };

  // State update utilities
  const updatePersonalInfo = (field: keyof typeof resumeData.personalInfo, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const updateSummary = (value: string) => {
    setResumeData(prev => ({
      ...prev,
      summary: value
    }));
  };

  // AI Summary Generator
  const generateAISummary = async () => {
    const jobTitle = resumeData.personalInfo.jobTitle || "Professional";
    const allSkills = resumeData.skills.flatMap(s => s.skills);
    
    setAiLoading(prev => ({ ...prev, summary: true }));
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, skills: allSkills.slice(0, 5) })
      });
      const data = await res.json();
      if (data.summary) {
        updateSummary(data.summary);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the AI assistant. Ensure you have defined GEMINI_API_KEY.");
    } finally {
      setAiLoading(prev => ({ ...prev, summary: false }));
    }
  };

  // AI Summary Refiner
  const refineAISummary = async () => {
    const currentSummary = resumeData.summary;
    if (!currentSummary || !currentSummary.trim()) {
      alert("Please enter some summary text first so the AI can refine it!");
      return;
    }
    const jobTitle = resumeData.personalInfo.jobTitle || "Professional";

    setAiLoading(prev => ({ ...prev, refineSummary: true }));
    try {
      const res = await fetch("/api/ai/refine-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: currentSummary, jobTitle })
      });
      const data = await res.json();
      if (data.refinedSummary) {
        updateSummary(data.refinedSummary);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to refine the summary. Ensure you have defined GEMINI_API_KEY.");
    } finally {
      setAiLoading(prev => ({ ...prev, refineSummary: false }));
    }
  };

  // AI Skill Suggestions
  const fetchAISkills = async () => {
    const jobTitle = resumeData.personalInfo.jobTitle;
    if (!jobTitle) {
      alert("Please enter a Job Title in Personal Info first so the AI knows what skills to suggest!");
      return;
    }

    setAiLoading(prev => ({ ...prev, skills: true }));
    try {
      const res = await fetch("/api/ai/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle })
      });
      const data = await res.json();
      if (data.skills) {
        setSuggestedSkills(data.skills);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to get skill recommendations.");
    } finally {
      setAiLoading(prev => ({ ...prev, skills: false }));
    }
  };

  const addSuggestedSkill = (skill: string) => {
    // Add to first category, or create "Core Skills" if none exist
    setResumeData(prev => {
      const updatedCategories = [...prev.skills];
      if (updatedCategories.length === 0) {
        updatedCategories.push({
          id: "skill-gen-1",
          name: "Core Skills",
          skills: [skill]
        });
      } else {
        if (!updatedCategories[0].skills.includes(skill)) {
          updatedCategories[0] = {
            ...updatedCategories[0],
            skills: [...updatedCategories[0].skills, skill]
          };
        }
      }
      return { ...prev, skills: updatedCategories };
    });
    setSuggestedSkills(prev => prev.filter(s => s !== skill));
  };

  // AI Bullet Point Improver
  const improveBulletPoint = async (experienceId: string, index: number, originalText: string, role: string, company: string) => {
    const key = `${experienceId}-${index}`;
    if (!originalText.trim()) {
      alert("Please enter some text in the bullet point first!");
      return;
    }

    setAiLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/ai/enhance-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet: originalText, role, company })
      });
      const data = await res.json();
      if (data.enhancedBullets) {
        setAiSuggestions(prev => ({ ...prev, [key]: data.enhancedBullets }));
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to refine bullet point. Verify GEMINI_API_KEY settings.");
    } finally {
      setAiLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const applyBulletSuggestion = (expId: string, bulletIndex: number, suggestion: string) => {
    setResumeData(prev => {
      const updatedExp = prev.workExperience.map(exp => {
        if (exp.id === expId) {
          const updatedBullets = [...exp.description];
          updatedBullets[bulletIndex] = suggestion;
          return { ...exp, description: updatedBullets };
        }
        return exp;
      });
      return { ...prev, workExperience: updatedExp };
    });
    // Clear suggestions
    const key = `${expId}-${bulletIndex}`;
    setAiSuggestions(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Work Experience Utilities
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: [""]
    };
    setResumeData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, newExp]
    }));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => {
        if (exp.id === id) {
          return { ...exp, [field]: value };
        }
        return exp;
      })
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(exp => exp.id !== id)
    }));
  };

  const updateBulletPoint = (expId: string, index: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => {
        if (exp.id === expId) {
          const newDesc = [...exp.description];
          newDesc[index] = value;
          return { ...exp, description: newDesc };
        }
        return exp;
      })
    }));
  };

  const addBulletPoint = (expId: string) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => {
        if (exp.id === expId) {
          return { ...exp, description: [...exp.description, ""] };
        }
        return exp;
      })
    }));
  };

  const removeBulletPoint = (expId: string, index: number) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => {
        if (exp.id === expId) {
          return { ...exp, description: exp.description.filter((_, i) => i !== index) };
        }
        return exp;
      })
    }));
  };

  // Education Utilities
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      fieldOfStudy: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      gpa: ""
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => {
        if (edu.id === id) {
          return { ...edu, [field]: value };
        }
        return edu;
      })
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  // Projects Utilities
  const addProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: "",
      role: "",
      technologies: [],
      link: "",
      description: [""]
    };
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id === id) {
          return { ...proj, [field]: value };
        }
        return proj;
      })
    }));
  };

  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  const updateProjBulletPoint = (projId: string, index: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id === projId) {
          const newDesc = [...proj.description];
          newDesc[index] = value;
          return { ...proj, description: newDesc };
        }
        return proj;
      })
    }));
  };

  const addProjBulletPoint = (projId: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id === projId) {
          return { ...proj, description: [...proj.description, ""] };
        }
        return proj;
      })
    }));
  };

  const removeProjBulletPoint = (projId: string, index: number) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id === projId) {
          return { ...proj, description: proj.description.filter((_, i) => i !== index) };
        }
        return proj;
      })
    }));
  };

  // Skills Utilities
  const addSkillCategory = () => {
    const newCat: SkillCategory = {
      id: `skill-cat-${Date.now()}`,
      name: "",
      skills: []
    };
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, newCat]
    }));
  };

  const updateSkillCategoryName = (id: string, name: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map(cat => {
        if (cat.id === id) {
          return { ...cat, name };
        }
        return cat;
      })
    }));
  };

  const removeSkillCategory = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(cat => cat.id !== id)
    }));
  };

  const addSkillTag = (catId: string, skill: string) => {
    if (!skill.trim()) return;
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map(cat => {
        if (cat.id === catId) {
          const newSkills = [...cat.skills];
          if (!newSkills.includes(skill.trim())) {
            newSkills.push(skill.trim());
          }
          return { ...cat, skills: newSkills };
        }
        return cat;
      })
    }));
  };

  const removeSkillTag = (catId: string, skillToRemove: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map(cat => {
        if (cat.id === catId) {
          return { ...cat, skills: cat.skills.filter(s => s !== skillToRemove) };
        }
        return cat;
      })
    }));
  };

  // Section Order moving
  const moveSection = (index: number, direction: "up" | "down") => {
    const updatedOrder = [...layoutSettings.sectionOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updatedOrder.length) return;

    const temp = updatedOrder[index];
    updatedOrder[index] = updatedOrder[targetIndex];
    updatedOrder[targetIndex] = temp;

    setLayoutSettings(prev => ({
      ...prev,
      sectionOrder: updatedOrder
    }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 select-none">
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 font-sans tracking-tight">Editor Dashboard</h2>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Real-time</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        
        {/* PERSONAL DETAILS */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("personal")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Personal Details</span>
            </div>
            {activeSection === "personal" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          
          {activeSection === "personal" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={resumeData.personalInfo.fullName}
                    onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
                  <input 
                    type="text" 
                    value={resumeData.personalInfo.jobTitle}
                    onChange={(e) => updatePersonalInfo("jobTitle", e.target.value)}
                    placeholder="Senior Engineer"
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                  <input 
                    type="email" 
                    value={resumeData.personalInfo.email}
                    onChange={(e) => updatePersonalInfo("email", e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={resumeData.personalInfo.phone}
                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                <input 
                  type="text" 
                  value={resumeData.personalInfo.location}
                  onChange={(e) => updatePersonalInfo("location", e.target.value)}
                  placeholder="City, State"
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Website</label>
                  <input 
                    type="text" 
                    value={resumeData.personalInfo.website}
                    onChange={(e) => updatePersonalInfo("website", e.target.value)}
                    placeholder="johndoe.com"
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">LinkedIn</label>
                  <input 
                    type="text" 
                    value={resumeData.personalInfo.linkedin}
                    onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                    placeholder="linkedin.com/in/john"
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">GitHub</label>
                  <input 
                    type="text" 
                    value={resumeData.personalInfo.github}
                    onChange={(e) => updatePersonalInfo("github", e.target.value)}
                    placeholder="github.com/john"
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SUMMARY / OBJECTIVE */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("summary")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Professional Summary</span>
            </div>
            {activeSection === "summary" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {activeSection === "summary" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3.5">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Professional Bio</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={generateAISummary}
                    disabled={aiLoading.summary || aiLoading.refineSummary}
                    className="flex items-center space-x-1.5 text-xs bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-semibold py-1 px-2.5 rounded-lg transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {aiLoading.summary ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{aiLoading.summary ? "Generating..." : "Generate with AI"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={refineAISummary}
                    disabled={aiLoading.summary || aiLoading.refineSummary || !resumeData.summary?.trim()}
                    className="flex items-center space-x-1.5 text-xs bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 font-semibold py-1 px-2.5 rounded-lg transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                    title={!resumeData.summary?.trim() ? "Write or generate a bio first to refine it" : "Refining will improve tone, verbs, and professional language"}
                  >
                    {aiLoading.refineSummary ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{aiLoading.refineSummary ? "Refining..." : "Smart Refine"}</span>
                  </button>
                </div>
              </div>
              <textarea 
                value={resumeData.summary}
                onChange={(e) => updateSummary(e.target.value)}
                placeholder="A senior software architect with..."
                rows={5}
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
              />
              <p className="text-[10px] text-slate-400 leading-tight italic">
                *The AI summary uses your filled-out job title and technical skills to write a high-impact executive introduction.
              </p>
            </div>
          )}
        </div>

        {/* WORK EXPERIENCE */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("experience")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>Work Experience ({resumeData.workExperience.length})</span>
            </div>
            {activeSection === "experience" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {activeSection === "experience" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {resumeData.workExperience.map((exp, expIdx) => (
                <div key={exp.id} className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-3.5 relative shadow-sm">
                  <div className="absolute top-3.5 right-3.5 flex items-center space-x-1">
                    <button 
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-all"
                      title="Remove experience block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Job #{expIdx + 1}</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Company</label>
                      <input 
                        type="text" 
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                        placeholder="Company Inc."
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Role / Position</label>
                      <input 
                        type="text" 
                        value={exp.position}
                        onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                        placeholder="Senior Associate"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Location</label>
                      <input 
                        type="text" 
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                        placeholder="Chicago, IL"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <input 
                        type="checkbox" 
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => {
                          updateExperience(exp.id, "current", e.target.checked);
                          if (e.target.checked) updateExperience(exp.id, "endDate", "");
                        }}
                        className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-1 mr-2 cursor-pointer w-4 h-4 shadow-sm"
                      />
                      <label htmlFor={`current-${exp.id}`} className="text-xs text-slate-600 font-semibold cursor-pointer select-none">Currently work here</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Start Date</label>
                      <input 
                        type="month" 
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    {!exp.current && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">End Date</label>
                        <input 
                          type="month" 
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Achievements / Bullet Points</label>
                      <button 
                        type="button"
                        onClick={() => addBulletPoint(exp.id)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center space-x-0.5 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Bullet</span>
                      </button>
                    </div>

                    {exp.description.map((bullet, bulletIdx) => {
                      const bulletKey = `${exp.id}-${bulletIdx}`;
                      const suggestions = aiSuggestions[bulletKey] || [];
                      const isLoading = aiLoading[bulletKey] || false;

                      return (
                        <div key={bulletIdx} className="space-y-1">
                          <div className="flex items-start space-x-2">
                            <span className="text-slate-400 select-none text-xs pt-1.5">•</span>
                            <textarea
                              value={bullet}
                              onChange={(e) => updateBulletPoint(exp.id, bulletIdx, e.target.value)}
                              placeholder="e.g., Designed responsive UI that boosted visitor onboarding by 15%."
                              rows={2}
                              className="flex-1 bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 shadow-sm"
                            />
                            <div className="flex flex-col space-y-1">
                              <button
                                type="button"
                                onClick={() => improveBulletPoint(exp.id, bulletIdx, bullet, exp.position, exp.company)}
                                disabled={isLoading}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1.5 rounded border border-indigo-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                                title="Enhance with AI"
                              >
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              </button>
                              {exp.description.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeBulletPoint(exp.id, bulletIdx)}
                                  className="bg-white hover:bg-slate-50 text-red-500 p-1.5 rounded border border-slate-200 transition-all cursor-pointer shadow-sm"
                                  title="Remove bullet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* AI Bullet Suggestions */}
                          {suggestions.length > 0 && (
                            <div className="bg-white border border-indigo-100 rounded-lg p-2.5 ml-4 mt-1 space-y-2 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase flex items-center space-x-1">
                                  <Sparkles className="w-3 h-3 text-indigo-500" />
                                  <span>AI Enhanced Alternatives</span>
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => setAiSuggestions(prev => {
                                    const next = { ...prev };
                                    delete next[bulletKey];
                                    return next;
                                  })}
                                  className="text-[9px] text-slate-400 hover:text-slate-600 uppercase font-bold tracking-widest"
                                >
                                  Dismiss
                                </button>
                              </div>
                              <div className="space-y-1.5">
                                {suggestions.map((sug, sugIdx) => (
                                  <div 
                                    key={sugIdx}
                                    onClick={() => applyBulletSuggestion(exp.id, bulletIdx, sug)}
                                    className="text-xs p-2 bg-slate-50 border border-slate-100 hover:border-indigo-500/50 hover:bg-indigo-50/20 rounded-md text-slate-700 hover:text-slate-900 cursor-pointer transition-all flex items-start space-x-1.5 group"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-all" />
                                    <span>{sug}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={addExperience}
                className="w-full py-2.5 bg-white border border-dashed border-slate-300 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 rounded-xl flex items-center justify-center space-x-1.5 text-xs transition-all font-bold shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Work Experience</span>
              </button>
            </div>
          )}
        </div>

        {/* PROJECTS */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("projects")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <Code className="w-4 h-4 text-teal-600" />
              <span>Projects ({resumeData.projects.length})</span>
            </div>
            {activeSection === "projects" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {activeSection === "projects" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {resumeData.projects.map((proj, projIdx) => (
                <div key={proj.id} className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-3.5 relative shadow-sm">
                  <div className="absolute top-3.5 right-3.5 flex items-center space-x-1">
                    <button 
                      type="button"
                      onClick={() => removeProject(proj.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-all"
                      title="Remove project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Project #{projIdx + 1}</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Project Title</label>
                      <input 
                        type="text" 
                        value={proj.title}
                        onChange={(e) => updateProject(proj.id, "title", e.target.value)}
                        placeholder="DevPortal"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Role (Optional)</label>
                      <input 
                        type="text" 
                        value={proj.role}
                        onChange={(e) => updateProject(proj.id, "role", e.target.value)}
                        placeholder="Full-stack Architect"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Project Link (Optional)</label>
                      <input 
                        type="text" 
                        value={proj.link}
                        onChange={(e) => updateProject(proj.id, "link", e.target.value)}
                        placeholder="github.com/project"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Technologies (comma separated)</label>
                      <input 
                        type="text" 
                        value={proj.technologies.join(", ")}
                        onChange={(e) => updateProject(proj.id, "technologies", e.target.value.split(",").map(t => t.trim()))}
                        placeholder="React, AWS, Node"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Project description list */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Accomplishments</label>
                      <button 
                        type="button"
                        onClick={() => addProjBulletPoint(proj.id)}
                        className="text-[10px] text-teal-600 hover:text-teal-700 flex items-center space-x-0.5 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Accomplishment</span>
                      </button>
                    </div>

                    {proj.description.map((bullet, bulletIdx) => {
                      const bulletKey = `${proj.id}-${bulletIdx}`;
                      const suggestions = aiSuggestions[bulletKey] || [];
                      const isLoading = aiLoading[bulletKey] || false;

                      return (
                        <div key={bulletIdx} className="space-y-1">
                          <div className="flex items-start space-x-2">
                            <span className="text-slate-400 select-none text-xs pt-1.5">•</span>
                            <textarea
                              value={bullet}
                              onChange={(e) => updateProjBulletPoint(proj.id, bulletIdx, e.target.value)}
                              placeholder="Designed and implemented webhooks processing."
                              rows={2}
                              className="flex-1 bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 shadow-sm"
                            />
                            <div className="flex flex-col space-y-1">
                              <button
                                type="button"
                                onClick={() => improveBulletPoint(proj.id, bulletIdx, bullet, proj.role || "Developer", proj.title)}
                                disabled={isLoading}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1.5 rounded border border-indigo-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                                title="Enhance with AI"
                              >
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              </button>
                              {proj.description.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeProjBulletPoint(proj.id, bulletIdx)}
                                  className="bg-white hover:bg-slate-50 text-red-500 p-1.5 rounded border border-slate-200 transition-all cursor-pointer shadow-sm"
                                  title="Remove bullet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* AI Project Bullet Suggestions */}
                          {suggestions.length > 0 && (
                            <div className="bg-white border border-indigo-100 rounded-lg p-2.5 ml-4 mt-1 space-y-2 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase flex items-center space-x-1">
                                  <Sparkles className="w-3 h-3 text-indigo-500" />
                                  <span>AI Enhanced Alternatives</span>
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => setAiSuggestions(prev => {
                                    const next = { ...prev };
                                    delete next[bulletKey];
                                    return next;
                                  })}
                                  className="text-[9px] text-slate-400 hover:text-slate-600 uppercase font-bold tracking-widest"
                                >
                                  Dismiss
                                </button>
                              </div>
                              <div className="space-y-1.5">
                                {suggestions.map((sug, sugIdx) => (
                                  <div 
                                    key={sugIdx}
                                    onClick={() => {
                                      setResumeData(prev => {
                                        const updatedProj = prev.projects.map(p => {
                                          if (p.id === proj.id) {
                                            const updatedBullets = [...p.description];
                                            updatedBullets[bulletIdx] = sug;
                                            return { ...p, description: updatedBullets };
                                          }
                                          return p;
                                        });
                                        return { ...prev, projects: updatedProj };
                                      });
                                      setAiSuggestions(prev => {
                                        const next = { ...prev };
                                        delete next[bulletKey];
                                        return next;
                                      });
                                    }}
                                    className="text-xs p-2 bg-slate-50 border border-slate-100 hover:border-indigo-500/50 hover:bg-indigo-50/20 rounded-md text-slate-700 hover:text-slate-900 cursor-pointer transition-all flex items-start space-x-1.5 group"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-all" />
                                    <span>{sug}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={addProject}
                className="w-full py-2.5 bg-white border border-dashed border-slate-300 hover:border-teal-500 text-slate-500 hover:text-teal-600 rounded-xl flex items-center justify-center space-x-1.5 text-xs transition-all font-bold shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>
          )}
        </div>

        {/* EDUCATION */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("education")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Education ({resumeData.education.length})</span>
            </div>
            {activeSection === "education" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {activeSection === "education" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {resumeData.education.map((edu, eduIdx) => (
                <div key={edu.id} className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-3.5 relative shadow-sm">
                  <div className="absolute top-3.5 right-3.5">
                    <button 
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-all"
                      title="Remove education block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">School #{eduIdx + 1}</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Institution</label>
                      <input 
                        type="text" 
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                        placeholder="State University"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Degree</label>
                      <input 
                        type="text" 
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                        placeholder="Bachelor of Science"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Field of Study</label>
                      <input 
                        type="text" 
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                        placeholder="Information Systems"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">GPA / Honors (Optional)</label>
                      <input 
                        type="text" 
                        value={edu.gpa}
                        onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                        placeholder="3.8 / 4.0"
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Start Date</label>
                      <input 
                        type="month" 
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">End Date</label>
                      <input 
                        type="month" 
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={addEducation}
                className="w-full py-2.5 bg-white border border-dashed border-slate-300 hover:border-purple-500 text-slate-500 hover:text-purple-600 rounded-xl flex items-center justify-center space-x-1.5 text-xs transition-all font-bold shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Education</span>
              </button>
            </div>
          )}
        </div>

        {/* SKILLS */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("skills")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <Code className="w-4 h-4 text-rose-600" />
              <span>Skills & Expertise ({resumeData.skills.reduce((acc, cat) => acc + cat.skills.length, 0)} items)</span>
            </div>
            {activeSection === "skills" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {activeSection === "skills" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
              
              {/* AI SKILLS RECOMMENDER BAR */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/80 flex flex-col space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span>AI Skills Smart-Recommender</span>
                  </span>
                  <button
                    type="button"
                    onClick={fetchAISkills}
                    disabled={aiLoading.skills}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 bg-white px-2 py-1 rounded border border-indigo-100 shadow-sm cursor-pointer"
                  >
                    {aiLoading.skills ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Suggest Industry Skills</span>}
                  </button>
                </div>
                {suggestedSkills.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] text-slate-600 leading-tight">Recommended for "{resumeData.personalInfo.jobTitle || "Professional"}". Click to add:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedSkills.map((sk) => (
                        <button
                          type="button"
                          key={sk}
                          onClick={() => addSuggestedSkill(sk)}
                          className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-md py-0.5 px-2 transition-all flex items-center space-x-0.5 font-semibold cursor-pointer shadow-sm"
                        >
                          <span>+</span>
                          <span>{sk}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Let Gemini analyze your Job Title and recommend 10 premium technical and professional soft skills tailored for your specific career track.
                  </p>
                )}
              </div>

              {resumeData.skills.map((cat) => (
                <div key={cat.id} className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-3 relative shadow-sm">
                  <button 
                    type="button"
                    onClick={() => removeSkillCategory(cat.id)}
                    className="absolute top-3.5 right-3.5 text-slate-400 hover:text-red-500 p-1"
                    title="Remove Skill Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category Title</label>
                    <input 
                      type="text" 
                      value={cat.name}
                      onChange={(e) => updateSkillCategoryName(cat.id, e.target.value)}
                      placeholder="e.g., Languages / Databases"
                      className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Skills Tags</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[40px] mb-2 shadow-inner">
                      {cat.skills.map((skill) => (
                        <span 
                          key={skill}
                          className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold py-0.5 px-2.5 rounded-full flex items-center space-x-1 border border-indigo-100"
                        >
                          <span>{skill}</span>
                          <button 
                            type="button"
                            onClick={() => removeSkillTag(cat.id, skill)}
                            className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {cat.skills.length === 0 && <span className="text-[10px] text-slate-400 italic">No skill tags yet...</span>}
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as any).elements.skillInput;
                        addSkillTag(cat.id, input.value);
                        input.value = "";
                      }}
                      className="flex space-x-1"
                    >
                      <input 
                        name="skillInput"
                        type="text" 
                        placeholder="Add skill (press Enter)"
                        className="flex-1 bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button 
                        type="submit"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs px-3 rounded py-1 font-semibold shadow-sm cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={addSkillCategory}
                className="w-full py-2.5 bg-white border border-dashed border-slate-300 hover:border-rose-500 text-slate-500 hover:text-rose-600 rounded-xl flex items-center justify-center space-x-1.5 text-xs transition-all font-bold shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill Category</span>
              </button>
            </div>
          )}
        </div>

        {/* LANGUAGES & CERTIFICATIONS */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("extras")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <Award className="w-4 h-4 text-violet-600" />
              <span>Languages & Certifications</span>
            </div>
            {activeSection === "extras" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {activeSection === "extras" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {/* LANGUAGES */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Languages (comma separated)</label>
                <input 
                  type="text" 
                  value={resumeData.languages.join(", ")}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    languages: e.target.value.split(",").map(lang => lang.trim()).filter(Boolean)
                  }))}
                  placeholder="English (Native), Spanish (Basic)"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              {/* CERTIFICATIONS */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Certifications (comma separated)</label>
                <textarea 
                  value={resumeData.certifications.join(", \n")}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    certifications: e.target.value.split("\n").map(cert => cert.replace(/,$/, "").trim()).filter(Boolean)
                  }))}
                  placeholder="AWS Cloud Practitioner&#10;Google Project Manager Certificate"
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* CUSTOM SECTION */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("custom")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <Globe className="w-4 h-4 text-pink-600" />
              <span>Custom Section / Interests</span>
            </div>
            {activeSection === "custom" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {activeSection === "custom" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-600 font-semibold select-none">Show custom section</span>
                <input 
                  type="checkbox"
                  checked={resumeData.customSection.show}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    customSection: { ...prev.customSection, show: e.target.checked }
                  }))}
                  className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-1 mr-1 cursor-pointer w-4 h-4 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section Title</label>
                <input 
                  type="text" 
                  value={resumeData.customSection.title}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    customSection: { ...prev.customSection, title: e.target.value }
                  }))}
                  placeholder="e.g., Interests & Hobbies"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section Content</label>
                <textarea 
                  value={resumeData.customSection.content}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    customSection: { ...prev.customSection, content: e.target.value }
                  }))}
                  placeholder="Describe your interests, community efforts, or key details..."
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION RE-ORDERING */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-slate-300">
          <button 
            type="button"
            onClick={() => toggleSection("ordering")}
            className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-bold text-slate-800 focus:outline-none hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2.5">
              <Layout className="w-4 h-4 text-indigo-600" />
              <span>Section Hierarchy / Ordering</span>
            </div>
            {activeSection === "ordering" ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {activeSection === "ordering" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <p className="text-[11px] text-slate-500 leading-tight mb-2">
                Customize where sections appear on the page. Use the arrow buttons to arrange vertical placement of the resume sections:
              </p>
              <div className="space-y-1.5">
                {layoutSettings.sectionOrder.map((sec, idx) => {
                  const label = sec.charAt(0).toUpperCase() + sec.slice(1).replace(/([A-Z])/g, " $1");
                  return (
                    <div 
                      key={sec}
                      className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-sans font-semibold text-slate-700 shadow-sm"
                    >
                      <span>{label}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === layoutSettings.sectionOrder.length - 1}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
