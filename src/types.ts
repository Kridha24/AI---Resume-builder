export type {
  PersonalInfo,
  WorkExperience,
  Education,
  Project,
  SkillCategory,
  CustomSection,
  ResumeData,
  LayoutSettings,
  TargetJob,
  RequirementMatch,
  ChangeProposal,
  TailoringSession,
  AlignmentScore,
  AtsReviewResult,
} from "./schemas";

export type TemplateId = "modern" | "split" | "minimal" | "executive";
export type FontSize = "sm" | "base" | "lg";
export type FontType = "sans" | "serif" | "mono";

export interface CandidateFact {
  id: string;
  category: "work" | "education" | "project" | "skill" | "certification" | "summary";
  text: string;
  sourceId?: string;
  dates?: string;
  verified: boolean;
}
