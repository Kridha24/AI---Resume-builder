import { describe, it, expect } from "vitest";
import {
  formatResumeDate,
  formatResumeDateRange,
  parseDateParts,
  isCurrentlyEmployed,
} from "../src/utils/dateUtils";

describe("dateUtils", () => {
  it("formats standard YYYY-MM dates into human-readable Month Year", () => {
    expect(formatResumeDate("2023-01")).toBe("Jan 2023");
    expect(formatResumeDate("2021-12")).toBe("Dec 2021");
  });

  it("handles year-only dates without crashing or showing Invalid Date", () => {
    expect(formatResumeDate("2021")).toBe("2021");
    expect(formatResumeDate("1999")).toBe("1999");
  });

  it("handles already formatted textual dates gracefully and normalizes month names", () => {
    expect(formatResumeDate("Mar 2022")).toBe("Mar 2022");
    expect(formatResumeDate("August 2020")).toBe("Aug 2020");
    expect(formatResumeDate("Present")).toBe("Present");
    expect(formatResumeDate("Current")).toBe("Present");
  });

  it("returns empty string for null, undefined, or empty inputs without throwing", () => {
    expect(formatResumeDate("")).toBe("");
    expect(formatResumeDate(null as any)).toBe("");
    expect(formatResumeDate(undefined as any)).toBe("");
  });

  it("correctly formats date ranges including current employment with typographic en-dash", () => {
    expect(formatResumeDateRange("2021-03", "2023-08", false)).toBe("Mar 2021 – Aug 2023");
    expect(formatResumeDateRange("2022-01", "", true)).toBe("Jan 2022 – Present");
    expect(formatResumeDateRange("2022-01", "Present", false)).toBe("Jan 2022 – Present");
  });

  it("isCurrentlyEmployed detects current flags and strings accurately", () => {
    expect(isCurrentlyEmployed(true, "")).toBe(true);
    expect(isCurrentlyEmployed(false, "Present")).toBe(true);
    expect(isCurrentlyEmployed(false, "current")).toBe(true);
    expect(isCurrentlyEmployed(false, "now")).toBe(true);
    expect(isCurrentlyEmployed(false, "2023-05")).toBe(false);
  });

  it("parseDateParts parses year and month cleanly", () => {
    expect(parseDateParts("2023-05")).toEqual({ year: 2023, month: 5 });
    expect(parseDateParts("2021")).toEqual({ year: 2021, month: undefined });
  });
});
