import { describe, it, expect } from "vitest";
import {
  ResumeDataSchema,
  TargetJobSchema,
  ChangeProposalSchema,
  AtsReviewResultSchema,
  AlignmentScoreSchema,
} from "../src/schemas";

describe("schemasAndValidation", () => {
  it("ResumeDataSchema provides safe defaults for empty object", () => {
    const parsed = ResumeDataSchema.parse({});
    expect(parsed.schemaVersion).toBe("2.0");
    expect(parsed.personalInfo.fullName).toBe("");
    expect(parsed.personalInfo.email).toBe("");
    expect(parsed.workExperience).toEqual([]);
    expect(parsed.education).toEqual([]);
    expect(parsed.skills).toEqual([]);
  });

  it("ResumeDataSchema parses and normalizes complete resume data", () => {
    const data = {
      personalInfo: {
        fullName: "Jane Doe",
        jobTitle: "Senior Engineer",
        email: "jane@example.com",
        phone: "+1 555 123 4567",
        location: "San Francisco, CA",
      },
      summary: "Experienced software engineer with 6+ years in cloud architecture.",
      workExperience: [
        {
          id: "exp-1",
          company: "Tech Corp",
          position: "Staff Engineer",
          location: "San Francisco, CA",
          startDate: "2021-01",
          endDate: "Present",
          current: true,
          description: ["Engineered scalable distributed systems."],
        },
      ],
      skills: [
        {
          id: "skill-1",
          name: "Languages",
          skills: ["TypeScript", "Go", "Python"],
        },
      ],
    };

    const result = ResumeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.personalInfo.fullName).toBe("Jane Doe");
      expect(result.data.workExperience[0].current).toBe(true);
      expect(result.data.skills[0].skills).toContain("TypeScript");
    }
  });

  it("TargetJobSchema validates target job structure with defaults", () => {
    const job = {
      role: "Backend Lead",
      company: "Acme Cloud",
      requiredSkills: ["Node.js", "PostgreSQL", "Docker"],
      preferredSkills: ["Kubernetes", "GraphQL"],
      responsibilities: ["Lead engineering team of 5", "Design scalable APIs"],
      rawText: "We are hiring a Backend Lead at Acme Cloud...",
    };

    const result = TargetJobSchema.safeParse(job);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("Backend Lead");
      expect(result.data.workMode).toBe("unspecified");
      expect(result.data.id).toBeDefined();
    }
  });

  it("ChangeProposalSchema validates proposed changes with status and reasons", () => {
    const proposal = {
      id: "prop-1",
      section: "summary",
      originalText: "I am a web developer.",
      proposedText: "Frontend Engineer specializing in React and TypeScript with proven performance impact.",
      reason: "Aligns with required frontend skills and strengthens executive tone.",
      supportingFactIds: ["fact-summary", "fact-skill-1-0"],
      targetRequirementIds: ["Required Skill: React"],
      status: "pending",
    };

    const result = ChangeProposalSchema.safeParse(proposal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("pending");
      expect(result.data.supportingFactIds).toContain("fact-summary");
    }
  });

  it("AtsReviewResultSchema rejects malformed or missing score fields", () => {
    const invalidResult = {
      score: "ten", // Invalid type (should be number 1-10)
      feedback: [],
    };

    const result = AtsReviewResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it("AtsReviewResultSchema validates compliant review data", () => {
    const validResult = {
      score: 8,
      scoreExplanation: "Strong match for technical requirements with clear metrics.",
      feedback: [
        {
          category: "Action Verbs",
          description: "Good use of verbs.",
          howToFix: "Consider adding more scale indicators.",
        },
      ],
      suggestedKeywords: ["Docker", "Kubernetes"],
      atsTips: ["Use standard font headings."],
      matchScore: 82,
      matchingKeywords: ["React", "TypeScript"],
      missingKeywords: ["Docker"],
    };

    const result = AtsReviewResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });
});
