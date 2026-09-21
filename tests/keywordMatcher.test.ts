import { describe, it, expect } from "vitest";
import { matchSkill, findSkillMatches, getSkillCanonicalName } from "../src/utils/keywordMatcher";

describe("keywordMatcher", () => {
  it("correctly matches skills with special punctuation (C++, C#, .NET, Node.js, CI/CD)", () => {
    expect(matchSkill("C++", "Experienced in C++ and systems programming")).toBe(true);
    expect(matchSkill("C#", "Built backend services using C# and ASP.NET")).toBe(true);
    expect(matchSkill(".NET", "Extensive experience with .NET Core frameworks")).toBe(true);
    expect(matchSkill("Node.js", "Developed microservices with Node.js and Express")).toBe(true);
    expect(matchSkill("CI/CD", "Maintained CI/CD pipelines using GitHub Actions")).toBe(true);
  });

  it("does not false-positive match Java when JavaScript is present and vice versa", () => {
    expect(matchSkill("Java", "Expert in JavaScript and TypeScript")).toBe(false);
    expect(matchSkill("JavaScript", "Expert in Java enterprise systems")).toBe(false);
    expect(matchSkill("Java", "Expert in Java 17 and Spring Boot")).toBe(true);
    expect(matchSkill("JavaScript", "Expert in modern JavaScript (ES6+)")).toBe(true);
  });

  it("handles case-insensitivity and aliases", () => {
    expect(matchSkill("react", "Built web apps with React.js")).toBe(true);
    expect(matchSkill("React.js", "Built web apps with React")).toBe(true);
    expect(matchSkill("golang", "Backend built in Go")).toBe(true);
    expect(matchSkill("k8s", "Deployed on Kubernetes cluster")).toBe(true);
    expect(matchSkill("PostgreSQL", "Database management using Postgres")).toBe(true);
  });

  it("findSkillMatches extracts matched and missing skills accurately", () => {
    const targetSkills = ["React", "TypeScript", "Docker", "Kubernetes", "AWS"];
    const documentText = "Full stack engineer with React, TypeScript, and AWS cloud experience.";

    const result = findSkillMatches(targetSkills, documentText);
    expect(result.matched).toContain("React");
    expect(result.matched).toContain("TypeScript");
    expect(result.matched).toContain("AWS");
    expect(result.missing).toContain("Docker");
    expect(result.missing).toContain("Kubernetes");
  });

  it("returns canonical names for known aliases", () => {
    expect(getSkillCanonicalName("reactjs")).toBe("React");
    expect(getSkillCanonicalName("k8s")).toBe("Kubernetes");
    expect(getSkillCanonicalName("postgres")).toBe("PostgreSQL");
  });
});
