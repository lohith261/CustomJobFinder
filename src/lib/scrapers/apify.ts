// Apify scraper — runs cloud actors for LinkedIn, Indeed, and Wellfound job scraping.
// Uses the official apify-client SDK for typed, structured API access.
// Auto-disables when APIFY_API_TOKEN is not set.

import { ApifyClient } from "apify-client";
import { RawJob, SearchConfigData } from "@/types";
import { Scraper, ScraperResult } from "./types";

// ─── Actor IDs ────────────────────────────────────────────────────────────────

const ACTORS = {
  linkedin:  "valig/linkedin-jobs-scraper",
  indeed:    "valig/indeed-jobs-scraper",
  wellfound: "adriano-rego/wellfound-jobs-scraper",
} as const;

// ─── Lazy client singleton ────────────────────────────────────────────────────

let _client: ApifyClient | null = null;

function getClient(): ApifyClient {
  if (!_client) {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) throw new Error("APIFY_API_TOKEN not set");
    _client = new ApifyClient({ token });
  }
  return _client;
}

// ─── Raw output types ─────────────────────────────────────────────────────────

interface ApifyLinkedInJob {
  title?: string;
  companyName?: string;
  location?: string;
  url?: string;
  jobUrl?: string;
  description?: string;
  descriptionHtml?: string;
  jobDescription?: string;
  postedDate?: string;
  postedAt?: string;
  date?: string;
  workType?: string;
  experienceLevel?: string;
  isRemote?: boolean;
}

interface ApifyIndeedJob {
  title?: string;
  url?: string;
  jobUrl?: string;
  location?: { city?: string; admin1Code?: string; countryName?: string } | string;
  employer?: { name?: string };
  description?: string;
  datePublished?: string;
  dateOnIndeed?: string;
  baseSalary?: { min?: number; max?: number; currency?: string } | null;
  jobTypes?: string[];
}

interface ApifyWellfoundJob {
  title?: string;
  company?: string;
  companyName?: string;
  location?: string;
  remote?: boolean;
  url?: string;
  jobUrl?: string;
  description?: string;
  postedAt?: string;
  createdAt?: string;
  salary?: string;
  experienceLevel?: string;
  skills?: string[];
}

// ─── SDK-based actor runner ───────────────────────────────────────────────────

async function runActorSync<T>(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSecs = 180
): Promise<T[]> {
  const client = getClient();

  console.log(`[ApifyScraper] Starting actor ${actorId}`);

  const run = await client.actor(actorId).call(input, { timeout: timeoutSecs });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log(`[ApifyScraper] Actor ${actorId} returned ${items.length} items`);
  return items as T[];
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function parseSalaryINR(salary: unknown): { min?: number; max?: number } {
  if (!salary) return {};
  if (typeof salary === "object" && salary !== null) {
    const s = salary as { min?: number; max?: number };
    return { min: s.min, max: s.max };
  }
  if (typeof salary !== "string") return {};
  const lpa = salary.match(/([\d.]+)\s*[-–]\s*([\d.]+)\s*lpa/i);
  if (lpa) return { min: Math.round(parseFloat(lpa[1]) * 100_000), max: Math.round(parseFloat(lpa[2]) * 100_000) };
  const single = salary.match(/([\d.]+)\s*lpa/i);
  if (single) { const v = Math.round(parseFloat(single[1]) * 100_000); return { min: v, max: v }; }
  return {};
}

function inferLocationType(location?: string, isRemote?: boolean): string {
  if (isRemote) return "remote";
  const l = (location ?? "").toLowerCase();
  if (l.includes("remote")) return "remote";
  if (l.includes("hybrid")) return "hybrid";
  return "onsite";
}

function inferExperienceLevel(level?: string, title?: string): string {
  const t = ((level ?? "") + " " + (title ?? "")).toLowerCase();
  if (t.includes("intern")) return "intern";
  if (t.includes("entry") || t.includes("junior") || t.includes("associate")) return "junior";
  if (t.includes("principal") || t.includes("staff ") || t.includes("director")) return "lead";
  if (t.includes("lead") || t.includes("head")) return "lead";
  if (t.includes("senior") || t.includes("sr ")) return "senior";
  return "mid";
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapLinkedInJob(item: ApifyLinkedInJob, source: string): RawJob | null {
  const title = item.title?.trim();
  const company = item.companyName?.trim();
  const url = (item.url ?? item.jobUrl)?.trim();
  if (!title || !company || !url) return null;

  const isRemote = item.isRemote ?? (item.workType?.toLowerCase().includes("remote") ?? false);

  return {
    title,
    company,
    location: item.location ?? "India",
    locationType: inferLocationType(item.location, isRemote),
    url,
    source,
    description: item.description ?? item.descriptionHtml ?? item.jobDescription ?? undefined,
    experienceLevel: inferExperienceLevel(item.experienceLevel, title),
    postedAt: item.postedDate
      ? new Date(item.postedDate)
      : item.postedAt
        ? new Date(item.postedAt)
        : item.date
          ? new Date(item.date)
          : undefined,
  };
}

function resolveIndeedLocation(loc: ApifyIndeedJob["location"]): string {
  if (!loc) return "India";
  if (typeof loc === "string") return loc;
  const parts = [loc.city, loc.admin1Code, loc.countryName].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "India";
}

function mapIndeedJob(item: ApifyIndeedJob, source: string): RawJob | null {
  const title = item.title?.trim();
  const company = item.employer?.name?.trim();
  const url = (item.url ?? item.jobUrl)?.trim();
  if (!title || !company || !url) return null;

  const locationStr = resolveIndeedLocation(item.location);
  const salary = parseSalaryINR(item.baseSalary);

  return {
    title,
    company,
    location: locationStr,
    locationType: inferLocationType(locationStr),
    url,
    source,
    description: item.description ?? undefined,
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryCurrency: salary.min ? "INR" : undefined,
    experienceLevel: inferExperienceLevel(undefined, title),
    postedAt: item.datePublished
      ? new Date(item.datePublished)
      : item.dateOnIndeed
        ? new Date(item.dateOnIndeed)
        : undefined,
  };
}

function mapWellfoundJob(item: ApifyWellfoundJob, source: string): RawJob | null {
  const title = item.title?.trim();
  const company = (item.company ?? item.companyName)?.trim();
  const url = (item.url ?? item.jobUrl)?.trim();
  if (!title || !company || !url) return null;

  const locationStr = item.location ?? (item.remote ? "Remote" : "");
  const salary = parseSalaryINR(item.salary);

  return {
    title,
    company,
    location: locationStr || "Remote",
    locationType: inferLocationType(locationStr, item.remote),
    url,
    source,
    description: item.description ?? undefined,
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryCurrency: salary.min ? "USD" : undefined,
    experienceLevel: inferExperienceLevel(item.experienceLevel, title),
    tags: Array.isArray(item.skills) ? item.skills : undefined,
    postedAt: item.postedAt
      ? new Date(item.postedAt)
      : item.createdAt
        ? new Date(item.createdAt)
        : undefined,
  };
}

// ─── Config filter ────────────────────────────────────────────────────────────

function normalize(s: string) { return s.toLowerCase().trim(); }

function titleMatches(jobTitle: string, configTitles: string[]): boolean {
  if (configTitles.length === 0) return true;
  const jobNorm = normalize(jobTitle);
  const jobWords = new Set(jobNorm.split(/\s+/));
  return configTitles.some((c) => {
    const cn = normalize(c);
    if (jobNorm.includes(cn) || cn.includes(jobNorm)) return true;
    return cn.split(/\s+/).filter((w) => w.length > 2).some((w) => jobWords.has(w));
  });
}

function matchesConfig(job: RawJob, config: SearchConfigData): boolean {
  if (config.blacklistedCompanies.some((c) => normalize(c) === normalize(job.company))) return false;
  if (!titleMatches(job.title, config.titles)) return false;
  if (config.salaryMin && job.salaryMax && job.salaryMax < config.salaryMin) return false;
  if (config.salaryMax && job.salaryMin && job.salaryMin > config.salaryMax) return false;
  const searchable = normalize([job.title, job.description].filter(Boolean).join(" "));
  if (config.excludeKeywords.some((kw) => searchable.includes(normalize(kw)))) return false;
  return true;
}

// ─── Per-source fetch functions ───────────────────────────────────────────────

async function fetchLinkedIn(config: SearchConfigData): Promise<RawJob[]> {
  const keyword = config.titles.slice(0, 2).join(" OR ") || "Software Engineer";
  const location = config.locations[0] ?? "India";

  const items = await runActorSync<ApifyLinkedInJob>(ACTORS.linkedin, {
    searchKeywords: keyword,
    location,
    maxResults: 25,
    fetchFullDescription: false,
  });

  return items.flatMap((item) => {
    const job = mapLinkedInJob(item, "apify-linkedin");
    return job ? [job] : [];
  });
}

async function fetchIndeed(config: SearchConfigData): Promise<RawJob[]> {
  const query = config.titles[0] ?? "Software Engineer";
  const location = config.locations[0] ?? "India";

  const items = await runActorSync<ApifyIndeedJob>(ACTORS.indeed, {
    searchQuery: query,
    location,
    country: "in",
    maxResults: 25,
  });

  return items.flatMap((item) => {
    const job = mapIndeedJob(item, "apify-indeed");
    return job ? [job] : [];
  });
}

async function fetchWellfound(config: SearchConfigData): Promise<RawJob[]> {
  const keyword = config.titles[0] ?? "Software Engineer";

  const items = await runActorSync<ApifyWellfoundJob>(ACTORS.wellfound, {
    searchQuery: keyword,
    maxResults: 100,
  });

  return items.flatMap((item) => {
    const job = mapWellfoundJob(item, "apify-wellfound");
    return job ? [job] : [];
  });
}

// ─── Scraper classes ──────────────────────────────────────────────────────────

function isApifyEnabled(): boolean {
  return !!process.env.APIFY_API_TOKEN;
}

class ApifyBaseScraper implements Scraper {
  name: string;
  enabled: boolean;
  private fetchFn: (config: SearchConfigData) => Promise<RawJob[]>;

  constructor(name: string, fetchFn: (config: SearchConfigData) => Promise<RawJob[]>) {
    this.name = name;
    this.enabled = isApifyEnabled();
    this.fetchFn = fetchFn;
  }

  async scrape(config: SearchConfigData): Promise<ScraperResult> {
    const start = Date.now();
    if (!this.enabled) {
      return { jobs: [], errors: [`${this.name} disabled: APIFY_API_TOKEN not set`], source: this.name, durationMs: 0 };
    }
    try {
      const raw = await this.fetchFn(config);
      const jobs = raw.filter((j) => matchesConfig(j, config));
      console.log(`[ApifyScraper] ${this.name}: ${raw.length} fetched, ${jobs.length} matched config`);
      return { jobs, errors: [], source: this.name, durationMs: Date.now() - start };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ApifyScraper] ${this.name} error:`, msg);
      return { jobs: [], errors: [msg], source: this.name, durationMs: Date.now() - start };
    }
  }
}

export class ApifyLinkedInScraper extends ApifyBaseScraper {
  constructor() { super("apify-linkedin", fetchLinkedIn); }
}

export class ApifyIndeedScraper extends ApifyBaseScraper {
  constructor() { super("apify-indeed", fetchIndeed); }
}

export class ApifyWellfoundScraper extends ApifyBaseScraper {
  constructor() { super("apify-wellfound", fetchWellfound); }
}
