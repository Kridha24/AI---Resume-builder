import { Fragment } from "react";
import { ResumeData, LayoutSettings, WorkExperience, Education, Project } from "../types";
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from "lucide-react";

interface ResumePreviewProps {
  resumeData: ResumeData;
  layoutSettings: LayoutSettings;
  zoom: number; // e.g. 0.85, 1, 1.15
}

export default function ResumePreview({ resumeData, layoutSettings, zoom }: ResumePreviewProps) {
  const { personalInfo, summary, workExperience, education, projects, skills, languages, certifications, customSection } = resumeData;
  const { template, colorTheme, fontSize, fontFamily, spacing, sectionOrder } = layoutSettings;

  // Custom styling mappings
  const fontClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[fontFamily];

  const fontSizeClass = {
    sm: "text-xs",
    base: "text-sm",
    lg: "text-base",
  }[fontSize];

  const titleSizeClass = {
    sm: "text-base",
    base: "text-lg",
    lg: "text-xl",
  }[fontSize];

  const headerSizeClass = {
    sm: "text-xl",
    base: "text-2xl",
    lg: "text-3xl",
  }[fontSize];

  const spacingClass = {
    compact: "space-y-2",
    comfortable: "space-y-4",
    loose: "space-y-6",
  }[spacing];

  const itemSpacingClass = {
    compact: "space-y-1",
    comfortable: "space-y-2",
    loose: "space-y-3",
  }[spacing];

  const paddingClass = {
    compact: "p-6",
    comfortable: "p-8",
    loose: "p-10",
  }[spacing];

  // Helper to format dates beautifully (e.g. "2023-03" -> "Mar 2023")
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Present";
    try {
      const date = new Date(dateStr + "-02"); // Add day to prevent timezone issues
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Helper to highlight bracketed metrics
  const highlightMetrics = (text: string) => {
    if (!text) return "";
    // Matches content in brackets like [X%] or [$100K]
    const regex = /\[(.*?)\]/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      parts.push(
        <strong 
          key={match.index} 
          style={{ color: colorTheme }} 
          className="font-semibold"
        >
          {match[1]}
        </strong>
      );
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  // RENDER SKILLS CLOUD BASED ON LAYOUT TEMPLATE
  const renderSkillsCloud = (currentTemplate: string) => {
    if (skills.length === 0) return null;

    if (currentTemplate === "split") {
      return (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest block text-slate-400">Core Expertise</span>
          <div className="space-y-3.5">
            {skills.map((cat) => cat.name && (
              <div key={cat.id} className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">{cat.name}</span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.skills.map((sk, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        backgroundColor: colorTheme + "10", 
                        color: colorTheme, 
                        borderColor: colorTheme + "33" 
                      }}
                      className="text-[10px] py-0.5 px-2 rounded-md font-semibold border transition-all duration-150 hover:scale-105"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentTemplate === "modern") {
      return (
        <div className="page-break-avoid space-y-3">
          <div className="flex items-center space-x-2 border-b pb-1" style={{ borderColor: colorTheme + "33" }}>
            <h3 className={`font-semibold uppercase tracking-wider ${titleSizeClass}`} style={{ color: colorTheme }}>
              Skills & Expertise
            </h3>
            <span 
              style={{ backgroundColor: colorTheme + "1a", color: colorTheme }} 
              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest"
            >
              Cloud Matrix
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {skills.map((cat) => cat.name && (
              <div 
                key={cat.id} 
                className="p-3.5 rounded-xl border bg-slate-50/40 hover:bg-white transition-all duration-200 hover:shadow-sm"
                style={{ borderColor: colorTheme + "15", borderLeftWidth: "4px", borderLeftColor: colorTheme }}
              >
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colorTheme }} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.skills.map((skill, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          backgroundColor: colorTheme + "0c", 
                          color: colorTheme, 
                          borderColor: colorTheme + "22" 
                        }}
                        className="text-xs py-1 px-2.5 rounded-lg font-semibold border shadow-sm hover:shadow transition-all duration-150 hover:-translate-y-0.5 cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentTemplate === "minimal") {
      return (
        <div className="page-break-avoid space-y-3">
          <h3 className={`font-bold uppercase tracking-widest text-slate-950 border-b pb-1 ${titleSizeClass}`}>
            Skills & Expertise
          </h3>
          <div className="space-y-2.5">
            {skills.map((cat) => cat.name && (
              <div key={cat.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <span className="md:col-span-1 text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block self-center">
                  {cat.name}
                </span>
                <div className="md:col-span-3 flex flex-wrap gap-1.5 items-center">
                  {cat.skills.map((skill, i) => (
                    <Fragment key={i}>
                      <span className="text-xs text-slate-700 font-medium hover:text-slate-950 transition-colors">
                        {skill}
                      </span>
                      {i < cat.skills.length - 1 && (
                        <span className="text-slate-300 select-none text-[11px] font-light">/</span>
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default / "executive": Classic serif style with elegant bullet dot separators
    return (
      <div className="page-break-avoid space-y-3">
        <h3 className={`font-semibold uppercase tracking-wider border-b pb-1 ${titleSizeClass}`} style={{ borderColor: "#cbd5e1" }}>
          Skills & Expertise
        </h3>
        <div className="space-y-2">
          {skills.map((cat) => cat.name && (
            <div key={cat.id} className="text-xs text-slate-800 leading-relaxed py-0.5">
              <span className="font-bold uppercase tracking-wider text-slate-950 mr-2">{cat.name}:</span>
              {cat.skills.map((skill, i) => (
                <span key={i} className="inline-block whitespace-nowrap">
                  <span className="font-medium text-slate-700">{skill}</span>
                  {i < cat.skills.length - 1 && (
                    <span className="text-slate-400 mx-2 font-light">•</span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // RENDER SECTIONS DYNAMICALLY
  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case "summary":
        if (!summary) return null;
        return (
          <div key="summary" className="page-break-avoid space-y-1.5">
            <h3 
              style={{ 
                color: template !== 'minimal' && template !== 'executive' ? colorTheme : undefined,
                borderColor: colorTheme + "33"
              }}
              className={`font-semibold uppercase tracking-wider ${titleSizeClass} border-b pb-1 flex items-center justify-between`}
            >
              <span>Professional Summary</span>
              {template === 'executive' && <span className="h-0.5 w-12 bg-slate-200" />}
            </h3>
            <p className="text-slate-700 leading-relaxed text-justify">{summary}</p>
          </div>
        );

      case "experience":
        if (workExperience.length === 0) return null;
        return (
          <div key="experience" className="space-y-3">
            <h3 
              className={`font-semibold uppercase tracking-wider ${titleSizeClass} border-b pb-1`}
              style={{ 
                color: template !== 'minimal' && template !== 'executive' ? colorTheme : undefined,
                borderColor: colorTheme + "33"
              }}
            >
              Professional Experience
            </h3>
            <div className={itemSpacingClass}>
              {workExperience.map((exp) => (
                <div key={exp.id} className="page-break-avoid grid grid-cols-1 md:grid-cols-12 gap-1 py-1">
                  <div className="md:col-span-3 text-slate-500 font-medium">
                    {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
                  </div>
                  <div className="md:col-span-9 space-y-1">
                    <div className="flex items-start justify-between flex-wrap">
                      <span className="font-bold text-slate-800">{exp.position}</span>
                      <span className="text-slate-600 font-medium italic text-xs">{exp.company} {exp.location ? `| ${exp.location}` : ""}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {exp.description.map((bullet, i) => bullet && (
                        <li key={i} className="leading-relaxed">
                          {highlightMetrics(bullet)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "projects":
        if (projects.length === 0) return null;
        return (
          <div key="projects" className="space-y-3">
            <h3 
              className={`font-semibold uppercase tracking-wider ${titleSizeClass} border-b pb-1`}
              style={{ 
                color: template !== 'minimal' && template !== 'executive' ? colorTheme : undefined,
                borderColor: colorTheme + "33"
              }}
            >
              Key Projects
            </h3>
            <div className={itemSpacingClass}>
              {projects.map((proj) => (
                <div key={proj.id} className="page-break-avoid grid grid-cols-1 md:grid-cols-12 gap-1 py-1">
                  <div className="md:col-span-3 font-medium text-slate-500">
                    {proj.link ? (
                      <a 
                        href={`https://${proj.link}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center space-x-0.5 text-xs inline-flex"
                        style={{ color: colorTheme }}
                      >
                        <span>Project Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-xs italic text-slate-400">Featured Project</span>
                    )}
                  </div>
                  <div className="md:col-span-9 space-y-1">
                    <div className="flex items-start justify-between flex-wrap">
                      <span className="font-bold text-slate-800">{proj.title}</span>
                      {proj.role && <span className="text-slate-600 font-medium italic text-xs">{proj.role}</span>}
                    </div>
                    {proj.technologies.length > 0 && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Technologies: {proj.technologies.join(", ")}
                      </div>
                    )}
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {proj.description.map((bullet, i) => bullet && (
                        <li key={i} className="leading-relaxed">
                          {highlightMetrics(bullet)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "education":
        if (education.length === 0) return null;
        return (
          <div key="education" className="space-y-3">
            <h3 
              className={`font-semibold uppercase tracking-wider ${titleSizeClass} border-b pb-1`}
              style={{ 
                color: template !== 'minimal' && template !== 'executive' ? colorTheme : undefined,
                borderColor: colorTheme + "33"
              }}
            >
              Education
            </h3>
            <div className={itemSpacingClass}>
              {education.map((edu) => (
                <div key={edu.id} className="page-break-avoid grid grid-cols-1 md:grid-cols-12 gap-1 py-1">
                  <div className="md:col-span-3 text-slate-500 font-medium">
                    {formatDate(edu.startDate)} – {edu.endDate ? formatDate(edu.endDate) : "Present"}
                  </div>
                  <div className="md:col-span-9 flex justify-between items-start flex-wrap">
                    <div>
                      <span className="font-bold text-slate-800">{edu.degree} in {edu.fieldOfStudy}</span>
                      <div className="text-slate-600 text-xs">{edu.institution} {edu.location ? `| ${edu.location}` : ""}</div>
                    </div>
                    {edu.gpa && (
                      <div className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">
                        GPA: {edu.gpa}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "skills":
        if (skills.length === 0 && template !== "split") return null;
        return (
          <div key="skills">
            {renderSkillsCloud(template)}
          </div>
        );

      case "languages":
        if (languages.length === 0 && template !== "split") return null;
        return (
          <div key="languages" className="page-break-avoid space-y-1.5">
            <h4 
              className="text-xs font-bold text-slate-800 uppercase tracking-wider"
              style={{ color: template !== 'minimal' && template !== 'executive' ? colorTheme : undefined }}
            >
              Languages
            </h4>
            <p className="text-slate-700 text-xs">{languages.join(", ")}</p>
          </div>
        );

      case "certifications":
        if (certifications.length === 0 && template !== "split") return null;
        return (
          <div key="certifications" className="page-break-avoid space-y-1.5">
            <h4 
              className="text-xs font-bold text-slate-800 uppercase tracking-wider"
              style={{ color: template !== 'minimal' && template !== 'executive' ? colorTheme : undefined }}
            >
              Certifications & Affiliations
            </h4>
            <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5">
              {certifications.map((cert, i) => (
                <li key={i}>{cert}</li>
              ))}
            </ul>
          </div>
        );

      case "customSection":
        if (!customSection.show || !customSection.content) return null;
        return (
          <div key="customSection" className="page-break-avoid space-y-2">
            <h3 
              className={`font-semibold uppercase tracking-wider ${titleSizeClass} border-b pb-1`}
              style={{ 
                color: template !== 'minimal' && template !== 'executive' ? colorTheme : undefined,
                borderColor: colorTheme + "33"
              }}
            >
              {customSection.title || "Additional Information"}
            </h3>
            <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-line">{customSection.content}</p>
          </div>
        );

      default:
        return null;
    }
  };

  // MAIN RENDER SELECTOR BASED ON TEMPLATES

  // 1. SPLIT TEMPLATE (2 Column layout, left sidebar, right body)
  if (template === "split") {
    return (
      <div 
        id="resume-print-area"
        className={`bg-white shadow-xl w-full max-w-[800px] min-h-[1050px] mx-auto text-left relative flex overflow-hidden ${fontClass} ${fontSizeClass}`}
        style={{ 
          transform: `scale(${zoom})`, 
          transformOrigin: "top center",
          marginBottom: `calc((1050px * ${zoom}) - 1050px)` // Offset height overflow from scale
        }}
      >
        {/* SIDEBAR (Left Column) */}
        <div className="w-[33%] bg-slate-50 border-r border-slate-100 p-6 flex flex-col justify-between shrink-0 space-y-6">
          <div className="space-y-6">
            {/* Contact info Block */}
            <div className="space-y-3 pt-4">
              <span className="text-xs font-bold uppercase tracking-widest block text-slate-400">Contact Details</span>
              <div className="space-y-2 text-slate-600 text-xs">
                {personalInfo.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 opacity-60 text-slate-600 shrink-0" />
                    <span className="break-all">{personalInfo.email}</span>
                  </div>
                )}
                {personalInfo.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 opacity-60 text-slate-600 shrink-0" />
                    <span>{personalInfo.phone}</span>
                  </div>
                )}
                {personalInfo.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 opacity-60 text-slate-600 shrink-0" />
                    <span>{personalInfo.location}</span>
                  </div>
                )}
                {personalInfo.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-3.5 h-3.5 opacity-60 text-slate-600 shrink-0" />
                    <span>{personalInfo.website}</span>
                  </div>
                )}
                {personalInfo.linkedin && (
                  <div className="flex items-center space-x-2">
                    <Linkedin className="w-3.5 h-3.5 opacity-60 text-slate-600 shrink-0" />
                    <span className="truncate">{personalInfo.linkedin.replace(/linkedin\.com\/in\//, "")}</span>
                  </div>
                )}
                {personalInfo.github && (
                  <div className="flex items-center space-x-2">
                    <Github className="w-3.5 h-3.5 opacity-60 text-slate-600 shrink-0" />
                    <span className="truncate">{personalInfo.github.replace(/github\.com\//, "")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Skills */}
            {renderSkillsCloud("split")}

            {/* Languages */}
            {languages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest block text-slate-400">Languages</span>
                <div className="flex flex-wrap gap-1">
                  {languages.map((l, idx) => (
                    <span key={idx} className="text-[11px] text-slate-600 font-medium bg-slate-200/50 py-0.5 px-2 rounded">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest block text-slate-400">Certifications</span>
                <ul className="text-xs text-slate-600 space-y-1 list-none pl-0">
                  {certifications.map((cert, idx) => (
                    <li key={idx} className="border-l-2 pl-2 border-slate-200 py-0.5 font-medium leading-relaxed">
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 font-mono italic">
            Powered by Resume Builder
          </div>
        </div>

        {/* BODY (Right Column) */}
        <div className={`flex-1 p-8 space-y-6 ${spacingClass}`}>
          {/* Header */}
          <div className="space-y-2">
            <h1 className={`font-bold text-slate-900 leading-none ${headerSizeClass}`}>{personalInfo.fullName || "Your Full Name"}</h1>
            <h2 
              style={{ color: colorTheme }}
              className="text-base font-semibold tracking-wider uppercase"
            >
              {personalInfo.jobTitle || "Your Professional Role"}
            </h2>
          </div>

          {/* Render main sections in order, excluding sidebar items */}
          <div className="space-y-5">
            {sectionOrder.map((section) => {
              if (["skills", "languages", "certifications"].includes(section)) return null;
              return renderSection(section);
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. MODERN TEMPLATE (Bold Accent top bar layout)
  if (template === "modern") {
    return (
      <div 
        id="resume-print-area"
        className={`bg-white shadow-xl w-full max-w-[800px] min-h-[1050px] mx-auto text-left relative overflow-hidden ${fontClass} ${fontSizeClass}`}
        style={{ 
          transform: `scale(${zoom})`, 
          transformOrigin: "top center",
          marginBottom: `calc((1050px * ${zoom}) - 1050px)`
        }}
      >
        {/* Top Accent Header Bar */}
        <div 
          style={{ backgroundColor: colorTheme }}
          className="p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="space-y-1">
            <h1 className={`font-bold tracking-tight leading-none ${headerSizeClass}`}>{personalInfo.fullName || "Your Full Name"}</h1>
            <h2 className="text-sm font-medium tracking-widest uppercase text-white/80">{personalInfo.jobTitle || "Your Professional Role"}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/90">
            {personalInfo.email && <div className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 shrink-0" /><span>{personalInfo.email}</span></div>}
            {personalInfo.phone && <div className="flex items-center space-x-1"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{personalInfo.phone}</span></div>}
            {personalInfo.location && <div className="flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>{personalInfo.location}</span></div>}
            {personalInfo.website && <div className="flex items-center space-x-1"><Globe className="w-3.5 h-3.5 shrink-0" /><span>{personalInfo.website}</span></div>}
            {personalInfo.linkedin && <div className="flex items-center space-x-1"><Linkedin className="w-3.5 h-3.5 shrink-0" /><span>{personalInfo.linkedin}</span></div>}
            {personalInfo.github && <div className="flex items-center space-x-1"><Github className="w-3.5 h-3.5 shrink-0" /><span>{personalInfo.github}</span></div>}
          </div>
        </div>

        {/* Content Body */}
        <div className={`p-8 ${spacingClass}`}>
          {sectionOrder.map((section) => renderSection(section))}
        </div>
      </div>
    );
  }

  // 3. MINIMAL TEMPLATE (Ultra-clean modern single column)
  if (template === "minimal") {
    return (
      <div 
        id="resume-print-area"
        className={`bg-white shadow-xl w-full max-w-[800px] min-h-[1050px] mx-auto text-left relative overflow-hidden ${fontClass} ${fontSizeClass}`}
        style={{ 
          transform: `scale(${zoom})`, 
          transformOrigin: "top center",
          marginBottom: `calc((1050px * ${zoom}) - 1050px)`
        }}
      >
        <div className={`${paddingClass} ${spacingClass}`}>
          {/* Header */}
          <div className="border-b border-slate-200 pb-5 space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">{personalInfo.fullName || "Your Full Name"}</h1>
                <h2 
                  style={{ color: colorTheme }}
                  className="text-sm font-semibold tracking-widest uppercase"
                >
                  {personalInfo.jobTitle || "Your Professional Role"}
                </h2>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono">
                {personalInfo.location && <div>{personalInfo.location}</div>}
                {personalInfo.website && <div className="hover:underline">{personalInfo.website}</div>}
              </div>
            </div>

            {/* Sub-contact details horizontal list */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              {personalInfo.email && <span className="flex items-center space-x-1"><Mail className="w-3 h-3 text-slate-400" /><span>{personalInfo.email}</span></span>}
              {personalInfo.phone && <span className="flex items-center space-x-1"><Phone className="w-3 h-3 text-slate-400" /><span>{personalInfo.phone}</span></span>}
              {personalInfo.linkedin && <span className="flex items-center space-x-1"><Linkedin className="w-3 h-3 text-slate-400" /><span>{personalInfo.linkedin}</span></span>}
              {personalInfo.github && <span className="flex items-center space-x-1"><Github className="w-3 h-3 text-slate-400" /><span>{personalInfo.github}</span></span>}
            </div>
          </div>

          {/* Sections ordered dynamically */}
          <div className={spacingClass}>
            {sectionOrder.map((section) => renderSection(section))}
          </div>
        </div>
      </div>
    );
  }

  // 4. EXECUTIVE TEMPLATE (Serif centered professional design)
  return (
    <div 
      id="resume-print-area"
      className={`bg-white shadow-xl w-full max-w-[800px] min-h-[1050px] mx-auto text-left relative overflow-hidden ${fontClass} ${fontSizeClass}`}
      style={{ 
        transform: `scale(${zoom})`, 
        transformOrigin: "top center",
        marginBottom: `calc((1050px * ${zoom}) - 1050px)`
      }}
    >
      <div className={`${paddingClass} ${spacingClass}`}>
        {/* Centered Professional Header */}
        <div className="text-center space-y-2 pb-4 border-b-2 border-slate-900/10">
          <h1 className="text-3xl font-serif font-semibold text-slate-900 tracking-tight leading-none uppercase">{personalInfo.fullName || "Your Full Name"}</h1>
          <h2 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">{personalInfo.jobTitle || "Your Professional Role"}</h2>
          
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 font-serif pt-1">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
            {personalInfo.website && (
              <span>
                • <a href={`https://${personalInfo.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.website}</a>
              </span>
            )}
            {personalInfo.linkedin && <span>• {personalInfo.linkedin.replace(/linkedin\.com\/in\//, "LinkedIn: ")}</span>}
            {personalInfo.github && <span>• {personalInfo.github.replace(/github\.com\//, "GitHub: ")}</span>}
          </div>
        </div>

        {/* Dynamically Ordered Content */}
        <div className="space-y-5 pt-4">
          {sectionOrder.map((section) => renderSection(section))}
        </div>
      </div>
    </div>
  );
}
