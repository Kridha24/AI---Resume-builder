/**
 * Simple, deterministic hashing utilities for content-binding and staleness detection.
 */

/**
 * 32-bit FNV-1a hash algorithm returning a hex string.
 * Fast, deterministic, and runs in both browser and Node environments.
 */
export function hashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Computes a hash for resume data to track changes.
 */
export function hashResumeData(data: any): string {
  if (!data) return "empty";
  try {
    return hashString(JSON.stringify(data));
  } catch {
    return "unhashable";
  }
}

/**
 * Computes a combined hash of resume data and job description.
 */
export function computeSessionHash(resumeData: any, jobDescription: string): string {
  const rHash = hashResumeData(resumeData);
  const jHash = hashString(jobDescription || "");
  return `${rHash}_${jHash}`;
}
