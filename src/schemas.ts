import { z } from "zod";

// --- Personal Info Schema ---
export const PersonalInfoSchema = z.object({
  fullName: z.string().default(""),
  jobTitle: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  website: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
});

// --- Work Experience Schema ---
export const WorkExperienceSchema = z.object({
  id: z.string(),
  company: z.string().default(""),
  position: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  description: z.array(z.string()).default([]),
});

// --- Education Schema ---
export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().default(""),
  degree: z.string().default(""),
  fieldOfStudy: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  gpa: z.string().default(""),
});

// --- Project Schema ---
export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  role: z.string().default(""),
  technologies: z.array(z.string()).default([]),
  link: z.string().default(""),
  description: z.array(z.string()).default([]),
});

// --- Skill Category Schema ---
export const SkillCategorySchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  skills: z.array(z.string()).default([]),
});

// --- Custom Section Schema ---
export const CustomSectionSchema = z.object({
  title: z.string().default("Custom Achievements"),
  content: z.string().default(""),
  show: z.boolean().default(false),
});

// --- Resume Data Schema (v2.0) ---
export const ResumeDataSchema = z.object({
  schemaVersion: z.string().default("2.0").optional(),
  personalInfo: PersonalInfoSchema.default({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
  }),
  summary: z.string().default(""),
  workExperience: z.array(WorkExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  skills: z.array(SkillCategorySchema).default([]),
  languages: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  customSection: CustomSectionSchema.default({
    title: "Custom Achievements",
    content: "",
    show: false,
  }),
});

// --- Layout Settings Schema ---
export const LayoutSettingsSchema = z.object({
  template: z.enum(["modern", "split", "minimal", "executive"]).default("modern"),
  colorTheme: z.string().default("#4f46e5"),
  fontSize: z.enum(["sm", "base", "lg"]).default("base"),
  fontFamily: z.enum(["sans", "serif", "mono"]).default("sans"),
  spacing: z.enum(["compact", "comfortable", "loose"]).default("comfortable"),
  sectionOrder: z.array(z.string()).default([
    "summary",
    "experience",
    "projects",
    "education",
    "skills",
    "languages",
    "certifications",
    "customSection",
  ]),
});

// --- Target Job Schema ---
export const TargetJobRequirementExcerptSchema = z.object({
  requirementId: z.string(),
  requirementText: z.string(),
  excerpt: z.string(),
});

export const TargetJobSchema = z.object({
  id: z.string().default(() => `job-${Date.now()}`),
  role: z.string().default(""),
  company: z.string().default(""),
  location: z.string().default(""),
  workMode: z.string().default("unspecified"), // remote, hybrid, on-site, unspecified
  responsibilities: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  experienceRequirements: z.array(z.string()).default([]),
  educationRequirements: z.array(z.string()).default([]),
  excerpts: z.array(TargetJobRequirementExcerptSchema).default([]),
  uncertainties: z.array(z.string()).default([]),
  rawText: z.string().default(""),
});

// --- Requirement Match Schema ---
export const RequirementMatchSchema = z.object({
  id: z.string(),
  requirementText: z.string(),
  type: z.enum([
    "required_skill",
    "preferred_skill",
    "experience",
    "education",
    "responsibility",
  ]),
  status: z.enum([
    "supported",
    "partially_supported",
    "not_evidenced",
    "needs_confirmation",
  ]),
  supportingCandidateEvidence: z.array(z.string()).default([]),
  candidateFactIds: z.array(z.string()).default([]),
  gapExplanation: z.string().default(""),
  clarificationQuestion: z.string().optional(),
});

// --- Change Proposal Schema ---
export const ChangeProposalSchema = z.object({
  id: z.string(),
  section: z.enum([
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "customSection",
  ]),
  itemId: z.string().optional(),
  field: z.string().optional(),
  originalText: z.string().default(""),
  proposedText: z.string(),
  reason: z.string(),
  supportingFactIds: z.array(z.string()).default([]),
  targetRequirementIds: z.array(z.string()).default([]),
  status: z.enum(["pending", "accepted", "rejected"]).default("pending"),
  needsConfirmation: z.string().optional(),
});

// --- Tailoring Session Schema ---
export const TailoringSessionSchema = z.object({
  id: z.string(),
  targetJob: TargetJobSchema,
  masterProfile: ResumeDataSchema,
  tailoredResume: ResumeDataSchema,
  matches: z.array(RequirementMatchSchema).default([]),
  clarificationAnswers: z.record(z.string(), z.string()).default({}),
  changeProposals: z.array(ChangeProposalSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// --- Alignment Score Schema ---
export const AlignmentScoreSchema = z.object({
  score: z.number().min(0).max(100),
  requiredSkillsScore: z.number().min(0).max(100),
  preferredSkillsScore: z.number().min(0).max(100),
  experienceScore: z.number().min(0).max(100),
  educationScore: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  summaryExplanation: z.string(),
  matchedSkills: z.array(z.string()),
  missingRequiredSkills: z.array(z.string()),
  missingPreferredSkills: z.array(z.string()),
  recommendations: z.array(z.string()),
  isFresherProfile: z.boolean(),
  weights: z.object({
    requiredSkills: z.number(),
    preferredSkills: z.number(),
    experience: z.number(),
    education: z.number(),
    quality: z.number(),
  }),
});

// --- ATS Review Feedback Schema ---
export const AtsFeedbackItemSchema = z.object({
  category: z.string(),
  description: z.string(),
  howToFix: z.string(),
});

export const AtsReviewResultSchema = z.object({
  score: z.number().min(1).max(10),
  scoreExplanation: z.string(),
  feedback: z.array(AtsFeedbackItemSchema),
  suggestedKeywords: z.array(z.string()),
  atsTips: z.array(z.string()),
  matchScore: z.number().min(0).max(100).optional(),
  matchingKeywords: z.array(z.string()).optional(),
  missingKeywords: z.array(z.string()).optional(),
});

// Type exports inferred from schemas
export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type CustomSection = z.infer<typeof CustomSectionSchema>;
export type LayoutSettings = z.infer<typeof LayoutSettingsSchema>;
export type TargetJob = z.infer<typeof TargetJobSchema>;
export type RequirementMatch = z.infer<typeof RequirementMatchSchema>;
export type ChangeProposal = z.infer<typeof ChangeProposalSchema>;
export type TailoringSession = z.infer<typeof TailoringSessionSchema>;
export type AlignmentScore = z.infer<typeof AlignmentScoreSchema>;
export type AtsReviewResult = z.infer<typeof AtsReviewResultSchema>;
