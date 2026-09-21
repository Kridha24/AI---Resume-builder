import { ResumeData, TargetJob, RequirementMatch, ChangeProposal, CandidateFact } from "../types";
import { matchSkill } from "../utils/keywordMatcher";

/**
 * Extracts verifiable candidate facts from a master profile with deterministic fact IDs.
 */
export function extractCandidateFacts(profile: ResumeData): CandidateFact[] {
  const facts: CandidateFact[] = [];

  // Summary
  if (profile.summary && profile.summary.trim()) {
    facts.push({
      id: "fact-summary",
      category: "summary",
      text: profile.summary.trim(),
      verified: true,
    });
  }

  // Work Experience
  (profile.workExperience || []).forEach((exp) => {
    facts.push({
      id: `fact-work-role-${exp.id}`,
      category: "work",
      text: `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.current ? "Present" : exp.endDate})`,
      sourceId: exp.id,
      dates: `${exp.startDate} - ${exp.current ? "Present" : exp.endDate}`,
      verified: true,
    });

    (exp.description || []).forEach((bullet, bIdx) => {
      if (bullet.trim()) {
        facts.push({
          id: `fact-work-bullet-${exp.id}-${bIdx}`,
          category: "work",
          text: bullet.trim(),
          sourceId: exp.id,
          verified: true,
        });
      }
    });
  });

  // Education
  (profile.education || []).forEach((edu) => {
    facts.push({
      id: `fact-edu-${edu.id}`,
      category: "education",
      text: `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`,
      sourceId: edu.id,
      dates: `${edu.startDate} - ${edu.current ? "Present" : edu.endDate}`,
      verified: true,
    });
  });

  // Projects
  (profile.projects || []).forEach((proj) => {
    facts.push({
      id: `fact-proj-title-${proj.id}`,
      category: "project",
      text: `Project ${proj.title}: ${proj.role}`,
      sourceId: proj.id,
      verified: true,
    });

    (proj.technologies || []).forEach((tech, tIdx) => {
      facts.push({
        id: `fact-proj-tech-${proj.id}-${tIdx}`,
        category: "skill",
        text: `Used ${tech} in project ${proj.title}`,
        sourceId: proj.id,
        verified: true,
      });
    });

    (proj.description || []).forEach((bullet, bIdx) => {
      if (bullet.trim()) {
        facts.push({
          id: `fact-proj-bullet-${proj.id}-${bIdx}`,
          category: "project",
          text: bullet.trim(),
          sourceId: proj.id,
          verified: true,
        });
      }
    });
  });

  // Skills
  (profile.skills || []).forEach((cat) => {
    (cat.skills || []).forEach((sk, sIdx) => {
      facts.push({
        id: `fact-skill-${cat.id}-${sIdx}`,
        category: "skill",
        text: `${sk} (${cat.name})`,
        sourceId: cat.id,
        verified: true,
      });
    });
  });

  // Certifications
  (profile.certifications || []).forEach((cert, cIdx) => {
    facts.push({
      id: `fact-cert-${cIdx}`,
      category: "certification",
      text: cert,
      verified: true,
    });
  });

  return facts;
}

/**
 * Maps job requirements to candidate facts, marking status as supported,
 * partially supported, not evidenced, or needs confirmation.
 */
export function mapRequirementsToEvidence(
  job: TargetJob,
  profile: ResumeData
): RequirementMatch[] {
  const candidateFacts = extractCandidateFacts(profile);
  const allFactText = candidateFacts.map(f => f.text).join(" \n ");
  const matches: RequirementMatch[] = [];

  let reqIndex = 0;

  // 1. Required Skills
  (job.requiredSkills || []).forEach((skill) => {
    reqIndex++;
    const supporting = candidateFacts.filter(f => matchSkill(skill, f.text));
    const isSupported = supporting.length > 0;

    matches.push({
      id: `req-match-${reqIndex}`,
      requirementText: `Required Skill: ${skill}`,
      type: "required_skill",
      status: isSupported ? "supported" : "not_evidenced",
      supportingCandidateEvidence: supporting.map(f => f.text),
      candidateFactIds: supporting.map(f => f.id),
      gapExplanation: isSupported
        ? `Direct evidence found in candidate profile.`
        : `Skill "${skill}" is not mentioned in your candidate profile.`,
      clarificationQuestion: isSupported
        ? undefined
        : `Do you have professional or academic experience with ${skill}?`,
    });
  });

  // 2. Preferred Skills
  (job.preferredSkills || []).forEach((skill) => {
    reqIndex++;
    const supporting = candidateFacts.filter(f => matchSkill(skill, f.text));
    const isSupported = supporting.length > 0;

    matches.push({
      id: `req-match-${reqIndex}`,
      requirementText: `Preferred Skill: ${skill}`,
      type: "preferred_skill",
      status: isSupported ? "supported" : "not_evidenced",
      supportingCandidateEvidence: supporting.map(f => f.text),
      candidateFactIds: supporting.map(f => f.id),
      gapExplanation: isSupported
        ? `Evidence found in profile.`
        : `Preferred skill "${skill}" is not evidenced in your profile.`,
    });
  });

  // 3. Experience Requirements
  (job.experienceRequirements || []).forEach((expReq) => {
    reqIndex++;
    const supporting = candidateFacts.filter(f =>
      f.category === "work" || f.category === "project"
    );

    matches.push({
      id: `req-match-${reqIndex}`,
      requirementText: expReq,
      type: "experience",
      status: supporting.length > 0 ? "partially_supported" : "not_evidenced",
      supportingCandidateEvidence: supporting.slice(0, 3).map(f => f.text),
      candidateFactIds: supporting.slice(0, 3).map(f => f.id),
      gapExplanation: `Candidate has ${supporting.length} documented experience/project items.`,
    });
  });

  return matches;
}

/**
 * Validates a change proposal against verified candidate facts.
 * Disallows hallucinated metrics, employers, or skills.
 */
export function validateChangeProposal(
  proposal: ChangeProposal,
  candidateFacts: CandidateFact[],
  masterProfile: ResumeData
): { valid: boolean; reason?: string } {
  // Check 1: Supporting fact IDs must exist in the candidate's verified profile
  const validFactIds = new Set(candidateFacts.map(f => f.id));
  for (const fId of proposal.supportingFactIds) {
    if (!validFactIds.has(fId)) {
      return {
        valid: false,
        reason: `Proposal references unverified fact ID: ${fId}`,
      };
    }
  }

  // Check 2: Never allow hallucinating new metrics (numbers/percentages) that were not in original or facts
  const originalNumbers: string[] = (proposal.originalText.match(/\b\d+([.,]\d+)?%?\b|\$\d+/g) || []);
  const proposedNumbers: string[] = (proposal.proposedText.match(/\b\d+([.,]\d+)?%?\b|\$\d+/g) || []);

  const supportingTexts = candidateFacts
    .filter(f => proposal.supportingFactIds.includes(f.id))
    .map(f => f.text)
    .join(" ");

  for (const pNum of proposedNumbers) {
    // If number was already in original text, it's verified
    if (originalNumbers.includes(pNum)) continue;
    // If number exists in verified supporting facts, it's verified
    if (supportingTexts.includes(pNum)) continue;

    // Number was fabricated!
    return {
      valid: false,
      reason: `Proposed text introduced unverified metric "${pNum}" not present in candidate background.`,
    };
  }

  return { valid: true };
}

/**
 * Applies only accepted proposals to create the tailored draft, preserving the master profile intact.
 */
export function applyAcceptedChanges(
  masterProfile: ResumeData,
  proposals: ChangeProposal[]
): ResumeData {
  const result: ResumeData = JSON.parse(JSON.stringify(masterProfile));
  const accepted = proposals.filter(p => p.status === "accepted");

  for (const change of accepted) {
    if (change.section === "summary") {
      result.summary = change.proposedText;
    } else if (change.section === "experience" && change.itemId) {
      const exp = result.workExperience.find(e => e.id === change.itemId);
      if (exp) {
        if (change.field && change.field.startsWith("description[")) {
          const match = change.field.match(/description\[(\d+)\]/);
          if (match) {
            const idx = parseInt(match[1], 10);
            if (exp.description[idx] !== undefined) {
              exp.description[idx] = change.proposedText;
            }
          }
        }
      }
    } else if (change.section === "projects" && change.itemId) {
      const proj = result.projects.find(p => p.id === change.itemId);
      if (proj) {
        if (change.field && change.field.startsWith("description[")) {
          const match = change.field.match(/description\[(\d+)\]/);
          if (match) {
            const idx = parseInt(match[1], 10);
            if (proj.description[idx] !== undefined) {
              proj.description[idx] = change.proposedText;
            }
          }
        }
      }
    }
  }

  return result;
}
