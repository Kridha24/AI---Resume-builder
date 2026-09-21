import { ResumeData, TargetJob, AlignmentScore } from "../types";
import { categorizeSkillsAgainstText, matchSkill } from "./keywordMatcher";

export const SCORE_WEIGHTS = {
  requiredSkills: 0.40,
  preferredSkills: 0.15,
  experience: 0.25,
  education: 0.10,
  quality: 0.10,
};

/**
 * Extracts all verified skills from a resume profile.
 */
export function extractCandidateSkills(resumeData: ResumeData): string[] {
  const skills: string[] = [];

  if (resumeData.skills && Array.isArray(resumeData.skills)) {
    for (const cat of resumeData.skills) {
      if (cat.skills && Array.isArray(cat.skills)) {
        skills.push(...cat.skills);
      }
    }
  }

  if (resumeData.projects && Array.isArray(resumeData.projects)) {
    for (const proj of resumeData.projects) {
      if (proj.technologies && Array.isArray(proj.technologies)) {
        skills.push(...proj.technologies);
      }
    }
  }

  return Array.from(new Set(skills.map(s => s.trim()).filter(Boolean)));
}

/**
 * Determines whether the candidate is a fresher profile (education and projects, no traditional employment).
 */
export function isFresher(resumeData: ResumeData): boolean {
  const workCount = (resumeData.workExperience || []).length;
  const projectCount = (resumeData.projects || []).length;
  const educationCount = (resumeData.education || []).length;

  return workCount === 0 && (projectCount > 0 || educationCount > 0);
}

/**
 * Calculates a fully deterministic JD Alignment Estimate (0-100%) with explicit weights.
 * Does not use LLM hallucinated scores.
 */
export function calculateAlignmentScore(
  resumeData: ResumeData,
  targetJob?: TargetJob | null,
  rawJobText?: string
): AlignmentScore {
  const candidateSkills = extractCandidateSkills(resumeData);
  const fresher = isFresher(resumeData);
  const recommendations: string[] = [];

  // If no job description or target job is supplied, calculate baseline readiness
  const effectiveJobText = targetJob?.rawText || rawJobText || "";
  const hasJob = effectiveJobText.trim().length > 0;

  let requiredSkillsList = targetJob?.requiredSkills || [];
  let preferredSkillsList = targetJob?.preferredSkills || [];

  // If structured TargetJob is not provided but raw text is, extract using keyword list
  if (hasJob && requiredSkillsList.length === 0 && preferredSkillsList.length === 0) {
    const { matched } = categorizeSkillsAgainstText(candidateSkills, effectiveJobText);
    requiredSkillsList = matched;
  }

  // 1. Required Skills Score (40%)
  let requiredSkillsScore = 100;
  let matchedSkills: string[] = [];
  let missingRequiredSkills: string[] = [];

  if (requiredSkillsList.length > 0) {
    const matched = requiredSkillsList.filter(req =>
      candidateSkills.some(cs => matchSkill(cs, req) || matchSkill(req, cs))
    );
    matchedSkills = matched;
    missingRequiredSkills = requiredSkillsList.filter(req => !matched.includes(req));
    requiredSkillsScore = Math.round((matched.length / requiredSkillsList.length) * 100);

    if (missingRequiredSkills.length > 0) {
      recommendations.push(
        `Consider adding evidence or coursework for key missing skills: ${missingRequiredSkills.slice(0, 3).join(", ")}.`
      );
    }
  } else if (hasJob) {
    const inJd = candidateSkills.filter(cs => matchSkill(cs, effectiveJobText));
    matchedSkills = inJd;
    requiredSkillsScore = candidateSkills.length > 0
      ? Math.min(100, Math.round((inJd.length / Math.min(10, candidateSkills.length)) * 100))
      : 30;
  }

  // 2. Preferred Skills Score (15%)
  let preferredSkillsScore = 100;
  let missingPreferredSkills: string[] = [];
  if (preferredSkillsList.length > 0) {
    const matched = preferredSkillsList.filter(pref =>
      candidateSkills.some(cs => matchSkill(cs, pref) || matchSkill(pref, cs))
    );
    missingPreferredSkills = preferredSkillsList.filter(pref => !matched.includes(pref));
    preferredSkillsScore = Math.round((matched.length / preferredSkillsList.length) * 100);
  }

  // 3. Experience Score (25%)
  let experienceScore = 0;
  if (fresher) {
    const projects = resumeData.projects || [];
    const validProjects = projects.filter(p => p.title && (p.description || []).length > 0);
    if (validProjects.length >= 2) {
      experienceScore = 95;
    } else if (validProjects.length === 1) {
      experienceScore = 75;
      recommendations.push("Add a second project to showcase technical depth as an entry-level candidate.");
    } else {
      experienceScore = 40;
      recommendations.push("Add at least 1-2 portfolio or academic projects highlighting relevant coursework.");
    }
  } else {
    const experiences = resumeData.workExperience || [];
    if (experiences.length === 0) {
      experienceScore = 20;
      recommendations.push("Add your past work experience or relevant roles.");
    } else {
      const allBullets = experiences.flatMap(e => e.description || []).filter(Boolean);
      const metricRegex = /\b\d+([.,]\d+)?%?\b|(?:\$|usd)\s*\d+|\b\d+\s*(?:\+|-|plus|years|hours|k|m|b)\b/i;
      const quantified = allBullets.filter(b => metricRegex.test(b));
      const metricRatio = allBullets.length > 0 ? quantified.length / allBullets.length : 0;

      let score = 70;
      if (allBullets.length >= 4) score += 15;
      if (metricRatio >= 0.25) score += 15;
      experienceScore = Math.min(100, score);

      if (metricRatio < 0.25 && allBullets.length > 0) {
        recommendations.push("Add verified quantitative metrics or outcomes to your work bullets.");
      }
    }
  }

  // 4. Education Score (10%)
  let educationScore = 0;
  const education = resumeData.education || [];
  if (education.length > 0 && education.some(e => e.institution && e.degree)) {
    educationScore = 100;
  } else if (education.length > 0) {
    educationScore = 70;
  } else {
    educationScore = fresher ? 20 : 60;
    if (fresher) {
      recommendations.push("Add your degree and university credentials.");
    }
  }

  // 5. Document Quality & Completeness (10%)
  let qualityScore = 0;
  const pInfo = resumeData.personalInfo;
  const hasContact = !!(pInfo?.email && pInfo?.phone && pInfo?.location);
  const hasSummary = !!(resumeData.summary && resumeData.summary.trim().length > 30);
  const hasSkillsCategory = (resumeData.skills || []).length > 0;

  let qPoints = 0;
  if (hasContact) qPoints += 40;
  if (hasSummary) qPoints += 30;
  if (hasSkillsCategory) qPoints += 30;

  // Penalty for unresolved bracket placeholders like [X%] or [...]
  const fullText = JSON.stringify(resumeData);
  const unresolvedPlaceholders = (fullText.match(/\[(?:X%|\.\.\.|\$\d+K|your\s+.*?|insert\s+.*?)\]/gi) || []).length;
  if (unresolvedPlaceholders > 0) {
    qPoints = Math.max(10, qPoints - (unresolvedPlaceholders * 15));
    recommendations.push(`Resolve ${unresolvedPlaceholders} placeholder brackets (e.g. [X%]) before final export.`);
  }

  qualityScore = qPoints;

  // Deterministic Weighted Sum
  const totalScore = Math.round(
    requiredSkillsScore * SCORE_WEIGHTS.requiredSkills +
    preferredSkillsScore * SCORE_WEIGHTS.preferredSkills +
    experienceScore * SCORE_WEIGHTS.experience +
    educationScore * SCORE_WEIGHTS.education +
    qualityScore * SCORE_WEIGHTS.quality
  );

  let summaryExplanation = "";
  if (hasJob) {
    summaryExplanation = `JD Alignment Estimate: ${totalScore}%. Profile demonstrates strong evidence for ${matchedSkills.length} target skills, with ${missingRequiredSkills.length} unevidenced required qualifications.`;
  } else {
    summaryExplanation = `Baseline Profile Readiness: ${totalScore}%. Add a target job description to see tailored alignment metrics.`;
  }

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    requiredSkillsScore,
    preferredSkillsScore,
    experienceScore,
    educationScore,
    qualityScore,
    summaryExplanation,
    matchedSkills,
    missingRequiredSkills,
    missingPreferredSkills,
    recommendations,
    isFresherProfile: fresher,
    weights: {
      requiredSkills: SCORE_WEIGHTS.requiredSkills * 100,
      preferredSkills: SCORE_WEIGHTS.preferredSkills * 100,
      experience: SCORE_WEIGHTS.experience * 100,
      education: SCORE_WEIGHTS.education * 100,
      quality: SCORE_WEIGHTS.quality * 100,
    },
  };
}
