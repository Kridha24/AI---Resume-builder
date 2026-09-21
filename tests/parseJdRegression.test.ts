import { describe, it, expect } from "vitest";
import app, { detectJobDescriptionQuality } from "../src/serverApp";
import { TargetJobSchema, type TargetJob, type ResumeData } from "../src/schemas";
import { mapRequirementsToEvidence } from "../src/services/tailoringEngine";
import { invokeApp } from "./testHelper";

describe("POST /api/ai/parse-jd & Quality Handling Regression Tests", () => {
  // Scenario 1: Empty input
  it("Scenario 1: returns HTTP 400 with INVALID_INPUT for empty or whitespace input", async () => {
    const res = await invokeApp(app, {
      method: "POST",
      url: "/api/ai/parse-jd",
      body: { rawText: "   " },
    });
    expect(res.status).toBe(400);
    expect(res.data.code).toBe("INVALID_INPUT");
    expect(res.data.requestId).toBeDefined();
    expect(res.data.error).toContain("Job description text is required");
  });

  // Scenario 2: Multiple job titles without requirements (the exact user screenshot input)
  it("Scenario 2: detects multiple job titles without requirements honestly and returns 422 MULTIPLE_ROLES_DETECTED", async () => {
    const input =
      "Backend Developer Internship, Quality Assurance Intern, React JS Full Stack Developer, Software Engineer Intern, Business Analyst.";

    // Test quality detector directly
    const quality = detectJobDescriptionQuality(input);
    expect(quality.isMultipleRoles).toBe(true);
    expect(quality.detectedRoles).toContain("Backend Developer Internship");
    expect(quality.detectedRoles).toContain("Quality Assurance Intern");
    expect(quality.detectedRoles).toContain("React JS Full Stack Developer");
    expect(quality.detectedRoles).toContain("Software Engineer Intern");
    expect(quality.detectedRoles).toContain("Business Analyst");

    // Test HTTP endpoint behavior
    const res = await invokeApp(app, {
      method: "POST",
      url: "/api/ai/parse-jd",
      body: { rawText: input },
    });
    expect(res.status).toBe(422);
    expect(res.data.code).toBe("MULTIPLE_ROLES_DETECTED");
    expect(res.data.detectedRoles).toHaveLength(5);
    expect(res.data.error).toContain("Multiple job roles detected");
    expect(res.data.requestId).toBeDefined();
  });

  // Scenario 3: Single title without requirements
  it("Scenario 3: detects title-only input and returns 422 TITLE_ONLY_DETECTED", async () => {
    const input = "Backend Developer Internship";
    const quality = detectJobDescriptionQuality(input);
    expect(quality.isTitleOnly).toBe(true);
    expect(quality.extractedTitle).toBe("Backend Developer Internship");

    const res = await invokeApp(app, {
      method: "POST",
      url: "/api/ai/parse-jd",
      body: { rawText: input },
    });
    expect(res.status).toBe(422);
    expect(res.data.code).toBe("TITLE_ONLY_DETECTED");
    expect(res.data.detectedRole).toBe("Backend Developer Internship");
    expect(res.data.requestId).toBeDefined();
  });

  // Scenario 4: Concise but meaningful JD is NOT rejected as multiple titles or title-only
  it("Scenario 4: preserves concise but meaningful JD and does not reject it purely for brevity", () => {
    const conciseJd =
      "Frontend Engineer: Need 2+ years experience with React, TypeScript, and CSS. Responsible for developing responsive user interfaces.";
    const quality = detectJobDescriptionQuality(conciseJd);
    expect(quality.isMultipleRoles).toBe(false);
    expect(quality.isTitleOnly).toBe(false);
  });

  // Scenario 5: Missing API configuration returns 503 with MISSING_AI_CONFIG (when key absent)
  it("Scenario 5: returns 503 MISSING_AI_CONFIG when AI client is not configured", async () => {
    const substantiveJd =
      "Full Stack Engineer with 3+ years experience building Node.js and React web applications. Responsible for REST APIs and database design.";
    const res = await invokeApp(app, {
      method: "POST",
      url: "/api/ai/parse-jd",
      body: { rawText: substantiveJd },
    });
    // In test environment without GEMINI_API_KEY, ai is null -> 503
    expect(res.status).toBe(503);
    expect(res.data.code).toBe("MISSING_AI_CONFIG");
    expect(res.data.error).toContain("AI services are not configured");
    expect(res.data.requestId).toBeDefined();
  });

  // Scenario 6: Non-existent API route returns JSON 404, never HTML
  it("Scenario 6: non-existent /api route returns JSON 404, never HTML", async () => {
    const res = await invokeApp(app, {
      method: "POST",
      url: "/api/unknown-endpoint",
      body: { foo: "bar" },
    });
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.data.code).toBe("NOT_FOUND");
    expect(res.data.error).toContain("API route not found");
    expect(res.data.requestId).toBeDefined();
  });

  // Scenario 7: Schema validation on structured TargetJob output
  it("Scenario 7: TargetJobSchema strictly validates parsed job structure", () => {
    const validJob: TargetJob = {
      id: "job-12345",
      role: "Backend Engineer",
      company: "Acme Corp",
      location: "San Francisco, CA",
      workMode: "hybrid",
      responsibilities: ["Design REST APIs", "Optimize database queries"],
      requiredSkills: ["Node.js", "PostgreSQL", "TypeScript"],
      preferredSkills: ["Docker", "Kubernetes"],
      experienceRequirements: ["3+ years in backend engineering"],
      educationRequirements: ["BS in Computer Science or equivalent"],
      excerpts: [
        {
          requirementId: "req-1",
          requirementText: "Node.js",
          excerpt: "Must have 3+ years with Node.js in production",
        },
      ],
      uncertainties: [],
      rawText: "Full job description text...",
    };

    const parsed = TargetJobSchema.safeParse(validJob);
    expect(parsed.success).toBe(true);

    // Invalid job missing required fields or having invalid types
    const invalidJob = {
      role: 12345, // role must be a string
      workMode: "invalid_mode", // should be handled/normalized
    };
    const invalidParsed = TargetJobSchema.safeParse(invalidJob);
    expect(invalidParsed.success).toBe(false);
  });

  // Scenario 8: Successful parsing advances cleanly to matching
  it("Scenario 8: successfully extracted TargetJob advances to candidate matching without errors", () => {
    const targetJob: TargetJob = {
      id: "job-test-1",
      role: "React Full Stack Developer",
      company: "TechNova",
      location: "Remote",
      workMode: "remote",
      responsibilities: ["Develop responsive UI components in React", "Integrate RESTful APIs"],
      requiredSkills: ["React", "TypeScript", "Node.js"],
      preferredSkills: ["Tailwind CSS", "GraphQL"],
      experienceRequirements: ["2+ years in full-stack web development"],
      educationRequirements: ["Bachelor's degree in CS or related field"],
      excerpts: [],
      uncertainties: [],
      rawText: "Full text",
    };

    const candidateProfile: ResumeData = {
      personalInfo: {
        fullName: "Jane Doe",
        jobTitle: "Software Developer",
        email: "jane@example.com",
        phone: "555-123-4567",
        location: "Austin, TX",
        website: "",
        linkedin: "",
        github: "",
      },
      summary: "Experienced developer proficient in React and TypeScript.",
      workExperience: [
        {
          id: "exp-1",
          company: "WebWorks",
          position: "Frontend Developer",
          location: "Austin, TX",
          startDate: "2022-01",
          endDate: "2024-01",
          current: false,
          description: [
            "Built responsive React web applications with TypeScript",
            "Collaborated with backend teams to integrate REST APIs",
          ],
        },
      ],
      education: [
        {
          id: "edu-1",
          institution: "University of Texas",
          degree: "BS",
          fieldOfStudy: "Computer Science",
          location: "Austin, TX",
          startDate: "2018",
          endDate: "2022",
          current: false,
          gpa: "3.8",
        },
      ],
      projects: [],
      skills: [
        {
          id: "skill-1",
          name: "Frontend",
          skills: ["React", "TypeScript", "Tailwind CSS"],
        },
        {
          id: "skill-2",
          name: "Backend",
          skills: ["Node.js", "Express"],
        },
      ],
      languages: [],
      certifications: [],
      customSection: {
        title: "Achievements",
        content: "",
        show: false,
      },
    };

    // Run matching engine
    const matches = mapRequirementsToEvidence(targetJob, candidateProfile);
    expect(matches.length).toBeGreaterThan(0);

    // Verify React requirement is supported
    const reactMatch = matches.find((m) => m.requirementText.toLowerCase().includes("react"));
    expect(reactMatch).toBeDefined();
    expect(reactMatch?.status).toBe("supported");
  });
});
