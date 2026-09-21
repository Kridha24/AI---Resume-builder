import { describe, it, expect } from "vitest";
import { calculateAlignmentScore } from "../src/utils/alignmentScore";
import { ResumeData, TargetJob } from "../src/types";

describe("alignmentScore", () => {
  const sampleProfile: ResumeData = {
    schemaVersion: "2.0",
    personalInfo: {
      fullName: "Alex Rivera",
      jobTitle: "Frontend Engineer",
      email: "alex@example.com",
      phone: "+1 555 0192",
      location: "Austin, TX",
      website: "",
      linkedin: "",
      github: "",
    },
    summary: "Frontend engineer with 4 years building responsive web applications using React and TypeScript.",
    workExperience: [
      {
        id: "exp-1",
        company: "Stripe",
        position: "Software Engineer",
        location: "Austin, TX",
        startDate: "2020-03",
        endDate: "Present",
        current: true,
        description: [
          "Developed core dashboard components using React and TypeScript.",
          "Optimized bundle size by 20% through code splitting.",
        ],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "UT Austin",
        degree: "B.S. in Computer Science",
        fieldOfStudy: "Computer Science",
        location: "Austin, TX",
        startDate: "2016",
        endDate: "2020",
        current: false,
        gpa: "3.8",
      },
    ],
    projects: [
      {
        id: "proj-1",
        title: "E-Commerce App",
        role: "Lead Developer",
        technologies: ["React", "Redux", "Tailwind CSS"],
        link: "",
        description: ["Built full checkout flow with state management."],
      },
    ],
    skills: [
      {
        id: "skill-1",
        name: "Technical",
        skills: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Git"],
      },
    ],
    languages: ["English"],
    certifications: [],
    customSection: {
      title: "Achievements",
      content: "",
      show: false,
    },
  };

  const matchingJob: TargetJob = {
    id: "job-1",
    role: "Senior React Developer",
    company: "Meta",
    location: "Remote",
    workMode: "remote",
    responsibilities: ["Develop modern web applications in React"],
    requiredSkills: ["React", "TypeScript", "JavaScript"],
    preferredSkills: ["Tailwind CSS", "Redux"],
    experienceRequirements: ["3+ years experience with React"],
    educationRequirements: ["Bachelor's degree in Computer Science"],
    excerpts: [],
    uncertainties: [],
    rawText: "Job description for Senior React Developer...",
  };

  const mismatchedJob: TargetJob = {
    id: "job-2",
    role: "Embedded Systems Engineer",
    company: "Robotics Corp",
    location: "San Jose, CA",
    workMode: "on-site",
    responsibilities: ["Write low-level firmware in C and Rust"],
    requiredSkills: ["C", "Rust", "RTOS", "Embedded Linux", "Microcontrollers"],
    preferredSkills: ["PCB Design", "Soldering"],
    experienceRequirements: ["5+ years firmware development"],
    educationRequirements: ["B.S. in Electrical Engineering"],
    excerpts: [],
    uncertainties: [],
    rawText: "Job description for Embedded Systems Engineer...",
  };

  it("calculates high alignment score for matching profile", () => {
    const result = calculateAlignmentScore(sampleProfile, matchingJob);
    expect(result.score).toBeGreaterThan(70);
    expect(result.matchedSkills).toContain("React");
    expect(result.matchedSkills).toContain("TypeScript");
    expect(result.matchedSkills).toContain("JavaScript");
    expect(result.missingRequiredSkills.length).toBe(0);
  });

  it("calculates low alignment score for mismatched job with clear missing skills", () => {
    const result = calculateAlignmentScore(sampleProfile, mismatchedJob);
    expect(result.score).toBeLessThan(50);
    expect(result.missingRequiredSkills).toContain("C");
    expect(result.missingRequiredSkills).toContain("Rust");
    expect(result.missingRequiredSkills).toContain("RTOS");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("detects fresher profiles and adjusts weights towards projects and education", () => {
    const fresherProfile: ResumeData = {
      ...sampleProfile,
      workExperience: [], // No commercial work experience
      projects: [
        {
          id: "proj-1",
          title: "Capstone AI Project",
          role: "Developer",
          technologies: ["Python", "PyTorch"],
          link: "",
          description: ["Trained CNN classifier with 95% accuracy."],
        },
      ],
    };

    const mlJob: TargetJob = {
      id: "job-3",
      role: "Junior ML Engineer",
      company: "AI Labs",
      location: "Remote",
      workMode: "remote",
      responsibilities: ["Train models"],
      requiredSkills: ["Python", "PyTorch"],
      preferredSkills: [],
      experienceRequirements: ["Internship or academic project experience"],
      educationRequirements: ["B.S. in Computer Science"],
      excerpts: [],
      uncertainties: [],
      rawText: "",
    };

    const result = calculateAlignmentScore(fresherProfile, mlJob);
    expect(result.isFresherProfile).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });
});
