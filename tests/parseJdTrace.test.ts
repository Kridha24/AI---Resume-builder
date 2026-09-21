import { describe, it, expect } from "vitest";
import app from "../src/serverApp";
import { invokeApp } from "./testHelper";

describe("POST /api/ai/parse-jd endpoint trace", () => {
  it("handles request when multiple roles are detected (user screenshot input)", async () => {
    const postData = {
      rawText:
        "Backend Developer Internship, Quality Assurance Intern, React JS Full Stack Developer, Software Engineer Intern, Business Analyst.",
    };

    const response = await invokeApp(app, {
      method: "POST",
      url: "/api/ai/parse-jd",
      body: postData,
    });

    console.log("Response Status:", response.status);
    console.log("Response Content-Type:", response.headers["content-type"]);
    console.log("Response Data:", response.data);

    expect(response.status).toBe(422);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.data.code).toBe("MULTIPLE_ROLES_DETECTED");
    expect(response.data.detectedRoles).toHaveLength(5);
    expect(response.data.requestId).toBeDefined();
  });
});
