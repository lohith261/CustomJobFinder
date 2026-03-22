// Register at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch — free tier: 500 req/month. Set JSEARCH_API_KEY in Vercel env vars.

import { RawJob, SearchConfigData } from "@/types";
import { Scraper, ScraperResult } from "./types";
import { passesGeoFilter } from "./geo-filter";

const JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com/search";
const REQUEST_TIMEOUT_MS = 15000;

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description?: string;
  job_apply_link: string;
  job_posted_at_datetime_utc?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_employment_type?: string;
  job_required_experience?: {
    required_experience_in_months?: number;
  };
  job_is_remote?: boolean;
  job_highlights?: {
    Qualifications?: string[];
  };
}

interface JSearchResponse {
  data: JSearchJob[];
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function inferExperienceLevel(title: string, description: string): string | undefined {
  const text = normalize(title + " " + description.slice(0, 500));
  if (text.includes("intern")) return "intern";
  if (text.includes("junior") || text.includes("entry level") || text.includes("jr ")) return "junior";
  if (text.includes("principal") || text.includes("staff engineer")) return "lead";
  if (text.includes("lead ") || text.includes("tech lead")) return "lead";
  if (text.includes("senior") || text.includes("sr ") || text.includes("sr.")) return "senior";
  return "mid";
}

function inferLocationType(job: JSearchJob): string {
  if (job.job_is_remote) return "remote";
  const desc = normalize(job.job_description ?? "");
  if (desc.includes("hybrid")) return "hybrid";
  return "onsite";
}

function buildLocation(job: JSearchJob): string {
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.join(", ") || "India";
}

function mapJSearchJob(raw: JSearchJob): RawJob | null {
  if (!raw.job_title || !raw.employer_name || !raw.job_apply_link) return null;

  const description = raw.job_description
    ? raw.job_description.slice(0, 2500)
    : undefined;

  const qualifications = raw.job_highlights?.Qualifications ?? [];
  const tags = qualifications
    .map((q) => normalize(q))
    .filter((q) => q.length > 0 && q.length < 60);

  return {
    title: raw.job_title.trim(),
    company: raw.employer_name.trim(),
    location: buildLocation(raw),
    locationType: inferLocationType(raw),
    url: raw.job_apply_link,
    source: "jsearch",
    description,
    salaryMin: raw.job_min_salary ? Math.round(raw.job_min_salary) : undefined,
    salaryMax: raw.job_max_salary ? Math.round(raw.job_max_salary) : undefined,
    salaryCurrency: "INR",
    experienceLevel: inferExperienceLevel(raw.job_title, raw.job_description ?? ""),
    tags,
    postedAt: raw.job_posted_at_datetime_utc
      ? new Date(raw.job_posted_at_datetime_utc)
      : undefined,
  };
}

function titleMatches(jobTitle: string, configTitles: string[]): boolean {
  if (configTitles.length === 0) return true;
  const jobWords = new Set(normalize(jobTitle).split(/\s+/));
  return configTitles.some((candidate) => {
    const candidateNorm = normalize(candidate);
    const jobNorm = normalize(jobTitle);
    if (jobNorm.includes(candidateNorm) || candidateNorm.includes(jobNorm)) return true;
    return candidateNorm.split(/\s+/).filter((w) => w.length > 2).some((w) => jobWords.has(w));
  });
}

function matchesConfig(job: RawJob, config: SearchConfigData): boolean {
  if (config.blacklistedCompanies.some((c) => normalize(c) === normalize(job.company))) {
    return false;
  }

  if (!titleMatches(job.title, config.titles)) return false;

  if (!passesGeoFilter(job.location, job.locationType)) return false;

  if (config.experienceLevel && job.experienceLevel) {
    if (normalize(config.experienceLevel) !== normalize(job.experienceLevel)) return false;
  }

  if (config.salaryMin && job.salaryMax && job.salaryMax < config.salaryMin) return false;
  if (config.salaryMax && job.salaryMin && job.salaryMin > config.salaryMax) return false;

  const searchable = normalize(
    [job.title, job.description, ...(job.tags ?? [])].filter(Boolean).join(" ")
  );

  if (
    config.includeKeywords.length > 0 &&
    !config.includeKeywords.some((kw) => searchable.includes(normalize(kw)))
  ) {
    return false;
  }

  if (config.excludeKeywords.some((kw) => searchable.includes(normalize(kw)))) {
    return false;
  }

  return true;
}

async function searchJSearch(query: string, apiKey: string): Promise<JSearchResponse> {
  const params = new URLSearchParams({
    query,
    num_pages: "1",
    page: "1",
    date_posted: "month",
    country: "in",
  });
  const url = `${JSEARCH_BASE_URL}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`JSearch returned ${res.status}: ${body.slice(0, 100)}`);
  }
  return (await res.json()) as JSearchResponse;
}

export class JSearchScraper implements Scraper {
  name = "jsearch";
  enabled: boolean;

  private apiKey: string;

  constructor() {
    this.apiKey = process.env.JSEARCH_API_KEY ?? "";
    this.enabled = !!this.apiKey;
  }

  async scrape(config: SearchConfigData): Promise<ScraperResult> {
    const start = Date.now();

    if (!this.enabled) {
      return {
        jobs: [],
        errors: [],
        source: this.name,
        durationMs: Date.now() - start,
      };
    }

    const errors: string[] = [];
    const seenIds = new Set<string>();
    const jobs: RawJob[] = [];

    // Build one query per title (up to 3) and search in parallel
    const location = config.locations[0] ?? "Bangalore";
    const titles = config.titles.slice(0, 3);
    const queries = titles.length > 0
      ? titles.map((title) => `${title} in ${location} India`)
      : [`software engineer in ${location} India`];

    const results = await Promise.allSettled(
      queries.map((query) => searchJSearch(query, this.apiKey))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const query = queries[i];
      if (result.status === "rejected") {
        const msg = result.reason instanceof Error ? result.reason.message : "Unknown error";
        errors.push(`JSearch query "${query}" failed: ${msg}`);
        continue;
      }
      for (const item of result.value.data ?? []) {
        if (seenIds.has(item.job_id)) continue;
        seenIds.add(item.job_id);
        const mapped = mapJSearchJob(item);
        if (mapped && matchesConfig(mapped, config)) {
          jobs.push(mapped);
        }
      }
    }

    return { jobs, errors, source: this.name, durationMs: Date.now() - start };
  }
}
