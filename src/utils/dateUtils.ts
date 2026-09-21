/**
 * Robust date formatting and normalization utility.
 * Handles full dates, year-months, partial years, and freeform text without inventing dates or rendering "Invalid Date".
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTHS: { [key: string]: number } = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Normalizes and formats a date string for resume display.
 * Examples:
 * - "2023-03" -> "Mar 2023"
 * - "2023-03-01" -> "Mar 2023"
 * - "2023" -> "2023"
 * - "March 2021" -> "Mar 2021"
 * - "03/2021" -> "Mar 2021"
 * - "Present" -> "Present"
 * - "" -> ""
 */
export function formatResumeDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return "";
  const trimmed = dateStr.trim();

  // Handle "Present" or "Current"
  if (/^(present|current|now|ongoing)$/i.test(trimmed)) {
    return "Present";
  }

  // Handle YYYY-MM or YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthNum = parseInt(isoMatch[2], 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${MONTH_NAMES[monthNum - 1]} ${year}`;
    }
    return year;
  }

  // Handle MM/YYYY or M/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const monthNum = parseInt(slashMatch[1], 10);
    const year = slashMatch[2];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${MONTH_NAMES[monthNum - 1]} ${year}`;
    }
    return year;
  }

  // Handle Month YYYY (e.g. "March 2021", "Mar 2021")
  const monthYearMatch = trimmed.match(/^([a-zA-Z]+)[,\s]+(\d{4})$/);
  if (monthYearMatch) {
    const monthKey = monthYearMatch[1].toLowerCase();
    const year = monthYearMatch[2];
    if (monthKey in FULL_MONTHS) {
      return `${MONTH_NAMES[FULL_MONTHS[monthKey]]} ${year}`;
    }
  }

  // Handle Year only (e.g. "2021")
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle Year range (e.g. "2019 - 2023")
  const rangeMatch = trimmed.match(/^(\d{4})\s*[-–—]\s*(\d{4}|present)$/i);
  if (rangeMatch) {
    const end = /present/i.test(rangeMatch[2]) ? "Present" : rangeMatch[2];
    return `${rangeMatch[1]} – ${end}`;
  }

  // Fallback: If it's a known string like "Spring 2022" or "Expected 2025", return trimmed as-is.
  return trimmed;
}

/**
 * Formats a date range cleanly.
 */
export function formatResumeDateRange(
  startDate?: string | null,
  endDate?: string | null,
  isCurrent?: boolean
): string {
  const start = formatResumeDate(startDate);
  const end = isCurrent ? "Present" : formatResumeDate(endDate);

  if (start && end) {
    return `${start} – ${end}`;
  }
  if (start) {
    return isCurrent ? `${start} – Present` : start;
  }
  if (end) {
    return end;
  }
  return "";
}

/**
 * Checks whether a role is currently ongoing.
 */
export function isCurrentlyEmployed(isCurrent?: boolean, endDate?: string | null): boolean {
  if (isCurrent === true) return true;
  if (!endDate) return false;
  return /^(present|current|now|ongoing)$/i.test(endDate.trim());
}

/**
 * Parses date parts if valid.
 */
export function parseDateParts(dateStr?: string | null): { year?: number; month?: number } {
  if (!dateStr) return {};
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})(?:-(\d{1,2}))?/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: match[2] ? parseInt(match[2], 10) : undefined,
    };
  }
  return {};
}
