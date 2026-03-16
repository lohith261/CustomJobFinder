import { fromJsonArray, parseTimeline } from "@/lib/json-arrays";

/**
 * Fields selected when joining job data onto an application query.
 * Single source of truth — import this in every applications route.
 */
export const JOB_SELECT = {
  id: true,
  title: true,
  company: true,
  location: true,
  locationType: true,
  matchScore: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  url: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  scrapedAt: true,
} as const;

/**
 * Converts a raw Prisma application record (with joined job) into a JSON-safe
 * shape the client expects: ISO strings for dates, parsed timeline & tags arrays.
 */
export function serializeApplication(app: Record<string, unknown>) {
  const job = app.job as Record<string, unknown>;
  return {
    ...app,
    timeline: parseTimeline(app.timeline as string),
    followUpDate: app.followUpDate
      ? (app.followUpDate as Date).toISOString()
      : null,
    appliedAt: app.appliedAt ? (app.appliedAt as Date).toISOString() : null,
    createdAt: (app.createdAt as Date).toISOString(),
    updatedAt: (app.updatedAt as Date).toISOString(),
    job: job
      ? {
          ...job,
          tags: fromJsonArray(job.tags as string),
          createdAt: (job.createdAt as Date).toISOString(),
          updatedAt: (job.updatedAt as Date).toISOString(),
          scrapedAt: (job.scrapedAt as Date).toISOString(),
        }
      : null,
  };
}
