import { RawJob } from "@/types";

/**
 * Generate a normalized deduplication key from a job's title and company.
 * This handles variations like casing, extra whitespace, punctuation,
 * and common suffixes (Inc, Ltd, Corp, etc.).
 */
function dedupKey(job: RawJob): string {
  const normalizedTitle = normalizeString(job.title);
  const normalizedCompany = normalizeCompany(job.company);
  return `${normalizedTitle}::${normalizedCompany}`;
}

/**
 * Normalize a generic string: lowercase, collapse whitespace,
 * strip punctuation, and trim.
 */
function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

/**
 * Normalize a company name by removing common corporate suffixes
 * and applying standard normalization.
 */
function normalizeCompany(company: string): string {
  let normalized = company.toLowerCase().trim();

  // Remove common corporate suffixes
  const suffixes = [
    /\b(inc\.?|incorporated)$/,
    /\b(ltd\.?|limited)$/,
    /\b(llc\.?)$/,
    /\b(corp\.?|corporation)$/,
    /\b(co\.?|company)$/,
    /\b(gmbh)$/,
    /\b(plc)$/,
    /\b(s\.?a\.?)$/,
  ];

  for (const suffix of suffixes) {
    normalized = normalized.replace(suffix, "");
  }

  return normalizeString(normalized);
}

/**
 * Select the preferred job entry when duplicates are found.
 * Prefers the entry with the most complete data (more non-null fields)
 * and the one posted most recently.
 */
function selectPreferred(existing: RawJob, candidate: RawJob): RawJob {
  const existingScore = completenessScore(existing);
  const candidateScore = completenessScore(candidate);

  if (candidateScore > existingScore) return candidate;
  if (existingScore > candidateScore) return existing;

  // If equal completeness, prefer the more recently posted one
  if (existing.postedAt && candidate.postedAt) {
    return candidate.postedAt > existing.postedAt ? candidate : existing;
  }

  return existing;
}

/**
 * Score a job entry by how many optional fields are filled in.
 * Higher score means more complete data.
 */
function completenessScore(job: RawJob): number {
  let score = 0;
  if (job.description) score += 2; // Description is most valuable
  if (job.salaryMin) score += 1;
  if (job.salaryMax) score += 1;
  if (job.location) score += 1;
  if (job.locationType) score += 1;
  if (job.experienceLevel) score += 1;
  if (job.companySize) score += 1;
  if (job.industry) score += 1;
  if (job.tags && job.tags.length > 0) score += 1;
  if (job.postedAt) score += 1;
  return score;
}

/**
 * Merge source information when the same job appears from multiple scrapers.
 * Appends source names separated by commas.
 */
function mergeSources(existingSource: string, newSource: string): string {
  const sources = new Set(existingSource.split(",").map((s) => s.trim()));
  sources.add(newSource.trim());
  return Array.from(sources).join(", ");
}

/**
 * Deduplicate a list of jobs by normalized title + company.
 *
 * When the same job is found from multiple sources:
 * - Keeps the entry with the most complete data
 * - Merges source names so we know where it was found
 *
 * @param jobs - Raw job listings from all scrapers
 * @returns Deduplicated job array
 */
export function deduplicateJobs(jobs: RawJob[]): RawJob[] {
  const seen = new Map<string, RawJob>();

  for (const job of jobs) {
    const key = dedupKey(job);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, { ...job });
    } else {
      // Select the better entry and merge sources
      const preferred = selectPreferred(existing, job);
      const mergedSource = mergeSources(existing.source, job.source);
      seen.set(key, { ...preferred, source: mergedSource });
    }
  }

  return Array.from(seen.values());
}

/**
 * Check if two jobs are likely duplicates.
 * Exported for testing purposes.
 */
export function areDuplicates(a: RawJob, b: RawJob): boolean {
  return dedupKey(a) === dedupKey(b);
}
