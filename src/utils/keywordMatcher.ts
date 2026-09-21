/**
 * Robust, punctuation-aware skill and keyword matching utility.
 * Handles punctuation-based skills (C++, C#, .NET, Node.js, CI/CD) and aliases,
 * while preventing substring false positives (e.g., 'Java' in 'JavaScript').
 */

export interface SkillAliasMap {
  [canonical: string]: string[];
}

export const COMMON_SKILL_ALIASES: SkillAliasMap = {
  "c++": ["cpp", "c plus plus"],
  "c#": ["csharp", "c sharp"],
  ".net": ["dotnet", "dot net"],
  "node.js": ["nodejs", "node js", "node"],
  "react": ["react.js", "reactjs"],
  "next.js": ["nextjs", "next js"],
  "vue.js": ["vuejs", "vue js", "vue"],
  "angular": ["angularjs", "angular.js"],
  "typescript": ["ts"],
  "javascript": ["js", "es6", "ecmascript"],
  "postgresql": ["postgres"],
  "mongodb": ["mongo"],
  "ci/cd": ["cicd", "ci cd", "continuous integration", "continuous deployment"],
  "kubernetes": ["k8s"],
  "docker": ["containerization", "containers"],
  "aws": ["amazon web services"],
  "gcp": ["google cloud", "google cloud platform"],
  "azure": ["microsoft azure"],
  "rest api": ["restful api", "restful apis", "rest apis", "rest"],
  "graphql": ["gql"],
  "tailwind": ["tailwind css", "tailwindcss"],
  "ui/ux": ["ui ux", "user interface", "user experience"],
  "machine learning": ["ml"],
  "artificial intelligence": ["ai"],
  "go": ["golang"],
};

/**
 * Escapes regex special characters in a string.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Creates a boundary-safe regular expression for a term, supporting terms with punctuation.
 */
export function createKeywordRegex(term: string): RegExp {
  const trimmed = term.trim();
  const escaped = escapeRegex(trimmed);

  // Check if starts or ends with non-word character (like C++, C#, .NET)
  const startsWithWord = /^\w/.test(trimmed);
  const endsWithWord = /\w$/.test(trimmed);

  // Punctuation boundary pattern
  const leftBoundary = startsWithWord
    ? "(?:^|[^a-zA-Z0-9_#+])"
    : "(?:^|[\\s,;:({\\[/'\"“‘])";

  const rightBoundary = endsWithWord
    ? "(?:$|[^a-zA-Z0-9_#+])"
    : "(?:$|[\\s,;:)}\\]/'\"”’?.!])";

  return new RegExp(`${leftBoundary}${escaped}${rightBoundary}`, "i");
}

/**
 * Checks if a specific skill or its canonical aliases match the target text.
 */
export function matchSkill(skill: string, text: string): boolean {
  if (!skill || !text) return false;
  const trimmedSkill = skill.trim();
  if (!trimmedSkill || !text.trim()) return false;

  // Direct match using punctuation-aware regex
  if (createKeywordRegex(trimmedSkill).test(text)) {
    return true;
  }

  // Check aliases
  const lower = trimmedSkill.toLowerCase();
  const aliases = COMMON_SKILL_ALIASES[lower] || [];
  for (const alias of aliases) {
    if (createKeywordRegex(alias).test(text)) {
      return true;
    }
  }

  // Inverse alias lookup (e.g. if input skill is "cpp", check canonical "c++")
  for (const [canonical, aliasList] of Object.entries(COMMON_SKILL_ALIASES)) {
    if (aliasList.includes(lower)) {
      if (createKeywordRegex(canonical).test(text)) {
        return true;
      }
      for (const alt of aliasList) {
        if (alt !== lower && createKeywordRegex(alt).test(text)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Given a list of skills and target text, returns arrays of matched and missing skills.
 */
export function categorizeSkillsAgainstText(
  skills: string[],
  text: string
): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const skill of skills) {
    const trimmed = skill.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    if (matchSkill(trimmed, text)) {
      matched.push(trimmed);
    } else {
      missing.push(trimmed);
    }
  }

  return { matched, missing };
}

// Alias for ease of testing and consumption
export const findSkillMatches = categorizeSkillsAgainstText;

/**
 * Returns the canonical display name for a recognized skill alias.
 */
export function getSkillCanonicalName(skill: string): string {
  const lower = skill.trim().toLowerCase();
  const niceNames: Record<string, string> = {
    "react": "React",
    "kubernetes": "Kubernetes",
    "postgresql": "PostgreSQL",
    "c++": "C++",
    "c#": "C#",
    ".net": ".NET",
    "node.js": "Node.js",
    "go": "Go",
    "golang": "Go",
    "k8s": "Kubernetes",
    "postgres": "PostgreSQL",
    "reactjs": "React",
    "ts": "TypeScript",
    "js": "JavaScript",
  };

  if (niceNames[lower]) {
    return niceNames[lower];
  }

  for (const [canonical, aliases] of Object.entries(COMMON_SKILL_ALIASES)) {
    if (canonical === lower || aliases.includes(lower)) {
      return niceNames[canonical] || canonical.charAt(0).toUpperCase() + canonical.slice(1);
    }
  }

  return skill.trim();
}
