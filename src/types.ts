export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[]; // Bullet points
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  gpa: string;
}

export interface Project {
  id: string;
  title: string;
  role: string;
  technologies: string[];
  link: string;
  description: string[];
}

export interface SkillCategory {
  id: string;
  name: string; // e.g., "Frontend", "Backend", "Tools"
  skills: string[]; // e.g., ["React", "TypeScript", "Vite"]
}

export interface CustomSection {
  title: string;
  content: string;
  show: boolean;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: SkillCategory[];
  languages: string[];
  certifications: string[];
  customSection: CustomSection;
}

export type TemplateId = 'modern' | 'split' | 'minimal' | 'executive';
export type FontSize = 'sm' | 'base' | 'lg';
export type FontType = 'sans' | 'serif' | 'mono';

export interface LayoutSettings {
  template: TemplateId;
  colorTheme: string; // hex code or primary color key
  fontSize: FontSize;
  fontFamily: FontType;
  spacing: 'compact' | 'comfortable' | 'loose';
  sectionOrder: string[]; // ['summary', 'experience', 'projects', 'education', 'skills', 'languages', 'certifications', 'customSection']
}
