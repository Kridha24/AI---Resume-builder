import { describe, it, expect } from "vitest";
import {
  extractCandidateFacts,
  mapRequirementsToEvidence,
  validateChangeProposal,
  applyAcceptedChanges,
} from "../src/services/tailoringEngine";
import { ResumeData, TargetJob, ChangeProposal } from "../src/types";

describe("evidenceValidator and tailoringEngine", () => {
  const profile: ResumeData = {
    schemaVersion: "2.0",
    personalInfo: {
      fullName: "Marcus Vance",
      jobTitle: "Senior DevOps Engineer",
      email: "marcus@example.com",
      phone: "+1 555 8899",
      location: "Seattle, WA",
      website: "",
      linkedin: "",
      github: "",
    },
    summary: "DevOps Engineer with 5+ years specializing in AWS, Docker, and Kubernetes.",
    workExperience: [
      {
        id: "exp-1",
        company: "CloudScale Inc",
        position: "DevOps Engineer",
        location: "Seattle, WA",
        startDate: "2021-06",
        endDate: "Present",
        current: true,
        description: [
          "Automated infrastructure deployment using Terraform and AWS CDK.",
          "Reduced deployment rollback incidents by 30% through CI/CD pipelines.",
        ],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "University of Washington",
        degree: "B.S. in Software Engineering",
        fieldOfStudy: "Software Engineering",
        location: "Seattle, WA",
        startDate: "2017",
        endDate: "2021",
        current: false,
        gpa: "",
      },
    ],
    projects: [
      {
        id: "proj-1",
        title: "K8s Cluster Monitor",
        role: "Creator",
        technologies: ["Go", "Kubernetes", "Prometheus"],
        link: "",
        description: ["Built open source monitoring agent for Kubernetes clusters."],
      },
    ],
    skills: [
      {
        id: "skill-1",
        name: "Cloud & DevOps",
        skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
      },
    ],
    languages: ["English"],
    certifications: ["AWS Certified Solutions Architect"],
    customSection: {
      title: "Achievements",
      content: "",
      show: false,
    },
  };

  const job: TargetJob = {
    id: "job-1",
    role: "Platform Engineer",
    company: "DataStream",
    location: "Seattle, WA",
    workMode: "hybrid",
    responsibilities: ["Maintain Kubernetes infrastructure"],
    requiredSkills: ["Kubernetes", "Terraform", "AWS", "Python"],
    preferredSkills: ["Prometheus", "Go"],
    experienceRequirements: ["3+ years in DevOps or Platform Engineering"],
    educationRequirements: ["B.S. in Computer Science or related"],
    excerpts: [],
    uncertainties: [],
    rawText: "",
  };

  it("extractCandidateFacts extracts deterministic, verifiable facts with unique IDs", () => {
    const facts = extractCandidateFacts(profile);
    expect(facts.length).toBeGreaterThan(5);

    const summaryFact = facts.find((f) => f.id === "fact-summary");
    expect(summaryFact).toBeDefined();
    expect(summaryFact?.text).toContain("DevOps Engineer");

    const workBullet = facts.find((f) => f.id === "fact-work-bullet-exp-1-0");
    expect(workBullet).toBeDefined();
    expect(workBullet?.text).toContain("Automated infrastructure deployment");

    const certFact = facts.find((f) => f.category === "certification");
    expect(certFact?.text).toBe("AWS Certified Solutions Architect");
  });

  it("mapRequirementsToEvidence marks supported vs not_evidenced requirements accurately", () => {
    const matches = mapRequirementsToEvidence(job, profile);
    
    const k8sMatch = matches.find((m) => m.requirementText.includes("Kubernetes"));
    expect(k8sMatch?.status).toBe("supported");
    expect(k8sMatch?.candidateFactIds.length).toBeGreaterThan(0);

    const pythonMatch = matches.find((m) => m.requirementText.includes("Python"));
    expect(pythonMatch?.status).toBe("not_evidenced");
    expect(pythonMatch?.clarificationQuestion).toBeDefined();
  });

  it("validateChangeProposal rejects unverified fact IDs", () => {
    const facts = extractCandidateFacts(profile);

    const badProposal: ChangeProposal = {
      id: "prop-1",
      section: "summary",
      originalText: profile.summary,
      proposedText: "Platform Engineer specializing in AWS and Kubernetes.",
      reason: "Aligns with Platform Engineer role.",
      supportingFactIds: ["fact-non-existent-id"],
      targetRequirementIds: ["Required Skill: Kubernetes"],
      status: "pending",
    };

    const validation = validateChangeProposal(badProposal, facts, profile);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("Proposal references unverified fact ID");
  });

  it("validateChangeProposal rejects hallucinated metrics not present in candidate background", () => {
    const facts = extractCandidateFacts(profile);

    const hallucinatedProposal: ChangeProposal = {
      id: "prop-2",
      section: "experience",
      itemId: "exp-1",
      field: "description[0]",
      originalText: "Automated infrastructure deployment using Terraform and AWS CDK.",
      proposedText: "Automated infrastructure deployment using Terraform, cutting cloud costs by 45% and saving $150K annually.",
      reason: "Adds metrics for impact.",
      supportingFactIds: ["fact-work-bullet-exp-1-0"],
      targetRequirementIds: ["Required Skill: Terraform"],
      status: "pending",
    };

    const validation = validateChangeProposal(hallucinatedProposal, facts, profile);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("introduced unverified metric");
  });

  it("validateChangeProposal accepts verified metrics or bracketed placeholders", () => {
    const facts = extractCandidateFacts(profile);

    // 30% already existed in bullet 1!
    const validProposalWithExistingMetric: ChangeProposal = {
      id: "prop-3",
      section: "experience",
      itemId: "exp-1",
      field: "description[1]",
      originalText: "Reduced deployment rollback incidents by 30% through CI/CD pipelines.",
      proposedText: "Spearheaded CI/CD pipeline automation, slashing deployment rollback incidents by 30%.",
      reason: "Strengthened action verb while preserving accurate metric.",
      supportingFactIds: ["fact-work-bullet-exp-1-1"],
      targetRequirementIds: ["Required Skill: CI/CD"],
      status: "pending",
    };

    const val1 = validateChangeProposal(validProposalWithExistingMetric, facts, profile);
    expect(val1.valid).toBe(true);

    // Bracketed placeholder is allowed for user to fill
    const validProposalWithBracket: ChangeProposal = {
      id: "prop-4",
      section: "experience",
      itemId: "exp-1",
      field: "description[0]",
      originalText: "Automated infrastructure deployment using Terraform and AWS CDK.",
      proposedText: "Automated infrastructure deployment using Terraform, accelerating provisioning speed by [insert %].",
      reason: "Added prompt for candidate to specify actual speed increase.",
      supportingFactIds: ["fact-work-bullet-exp-1-0"],
      targetRequirementIds: ["Required Skill: Terraform"],
      status: "pending",
    };

    const val2 = validateChangeProposal(validProposalWithBracket, facts, profile);
    expect(val2.valid).toBe(true);
  });

  it("applyAcceptedChanges applies ONLY accepted changes and leaves original profile untouched", () => {
    const proposals: ChangeProposal[] = [
      {
        id: "prop-1",
        section: "summary",
        originalText: profile.summary,
        proposedText: "Tailored Summary for Platform Engineer role.",
        reason: "Alignment",
        supportingFactIds: ["fact-summary"],
        targetRequirementIds: [],
        status: "accepted",
      },
      {
        id: "prop-2",
        section: "experience",
        itemId: "exp-1",
        field: "description[0]",
        originalText: profile.workExperience[0].description[0],
        proposedText: "Rejected change text",
        reason: "Testing rejection",
        supportingFactIds: ["fact-work-bullet-exp-1-0"],
        targetRequirementIds: [],
        status: "rejected",
      },
      {
        id: "prop-3",
        section: "experience",
        itemId: "exp-1",
        field: "description[1]",
        originalText: profile.workExperience[0].description[1],
        proposedText: "Pending change text",
        reason: "Testing pending",
        supportingFactIds: ["fact-work-bullet-exp-1-1"],
        targetRequirementIds: [],
        status: "pending",
      },
    ];

    const tailored = applyAcceptedChanges(profile, proposals);

    // Accepted change applied
    expect(tailored.summary).toBe("Tailored Summary for Platform Engineer role.");
    // Rejected change NOT applied
    expect(tailored.workExperience[0].description[0]).toBe(profile.workExperience[0].description[0]);
    // Pending change NOT applied
    expect(tailored.workExperience[0].description[1]).toBe(profile.workExperience[0].description[1]);

    // Original profile unmodified (immutability)
    expect(profile.summary).toContain("DevOps Engineer with 5+ years");
  });
});
