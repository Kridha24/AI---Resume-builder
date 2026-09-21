import { describe, it, expect } from "vitest";
import { computeSessionHash } from "../src/utils/hashing";

describe("userIsolation and sessionHashing", () => {
  it("generates different storage keys for different users and anonymous sessions", () => {
    const getDraftKey = (uid?: string | null) => `resume_draft_${uid || "anon"}`;
    const getLayoutKey = (uid?: string | null) => `resume_layout_${uid || "anon"}`;

    const anonKey = getDraftKey(null);
    const user1Key = getDraftKey("user_abc123");
    const user2Key = getDraftKey("user_xyz789");

    expect(anonKey).toBe("resume_draft_anon");
    expect(user1Key).toBe("resume_draft_user_abc123");
    expect(user2Key).toBe("resume_draft_user_xyz789");

    expect(user1Key).not.toBe(anonKey);
    expect(user1Key).not.toBe(user2Key);

    expect(getLayoutKey("user_abc123")).toBe("resume_layout_user_abc123");
  });

  it("computeSessionHash produces deterministic hashes for unchanged content", () => {
    const resume = { fullName: "Alex", skills: ["React", "TypeScript"] };
    const jd = "Senior React Developer";

    const hash1 = computeSessionHash(resume, jd);
    const hash2 = computeSessionHash(resume, jd);

    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe("string");
    expect(hash1.length).toBeGreaterThan(0);
  });

  it("computeSessionHash changes when resume content or job description changes", () => {
    const resume1 = { fullName: "Alex", skills: ["React"] };
    const resume2 = { fullName: "Alex", skills: ["React", "TypeScript"] };
    const jd1 = "React Developer";
    const jd2 = "Full Stack Developer";

    const hashBase = computeSessionHash(resume1, jd1);
    const hashResumeChanged = computeSessionHash(resume2, jd1);
    const hashJdChanged = computeSessionHash(resume1, jd2);

    expect(hashResumeChanged).not.toBe(hashBase);
    expect(hashJdChanged).not.toBe(hashBase);
  });

  it("detects unresolved bracketed placeholders in resume text", () => {
    const textWithPlaceholders = [
      "Engineered dashboard improving load time by [15%] and saving [insert amount].",
      "Managed a team of [X] engineers across multiple locations.",
      "Designed clean microservices architecture with 99.9% uptime.",
    ];

    const placeholders: string[] = [];
    const regex = /\[(.*?)\]/g;

    textWithPlaceholders.forEach((text) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        placeholders.push(match[0]);
      }
    });

    expect(placeholders).toContain("[15%]");
    expect(placeholders).toContain("[insert amount]");
    expect(placeholders).toContain("[X]");
    expect(placeholders.length).toBe(3);
  });
});
