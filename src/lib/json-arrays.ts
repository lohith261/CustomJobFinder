/**
 * Helpers for JSON array fields in SQLite.
 * SQLite doesn't support native arrays, so we store them as JSON strings.
 */

export function toJsonArray(arr: string[]): string {
  return JSON.stringify(arr);
}

export function fromJsonArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Convert a Job record from DB (JSON string tags) to API response (array tags) */
export function serializeJob(job: Record<string, unknown>) {
  return {
    ...job,
    tags: fromJsonArray(job.tags as string),
  };
}

/** Parse timeline JSON string to TimelineEvent array */
export function parseTimeline(json: string | null | undefined): import("@/types").TimelineEvent[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Convert a SearchConfig record from DB to API response with parsed arrays */
export function serializeConfig(config: Record<string, unknown>) {
  return {
    ...config,
    titles: fromJsonArray(config.titles as string),
    locations: fromJsonArray(config.locations as string),
    locationType: config.locationType ?? "",
    experienceLevel: config.experienceLevel ?? "",
    companySize: config.companySize ?? "",
    industries: fromJsonArray(config.industries as string),
    includeKeywords: fromJsonArray(config.includeKeywords as string),
    excludeKeywords: fromJsonArray(config.excludeKeywords as string),
    blacklistedCompanies: fromJsonArray(config.blacklistedCompanies as string),
  };
}
