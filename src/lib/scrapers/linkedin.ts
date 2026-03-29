// LinkedIn public job search scraper — uses scrape.do proxy.
// Auto-disables when SCRAPE_DO_TOKEN is not set.
// No login required — scrapes LinkedIn's public job search pages.

import { RawJob, SearchConfigData } from "@/types";
import { Scraper, ScraperResult } from "./types";
import { passesGeoFilter } from "./geo-filter";
import { scrapeDOFetch, isScrapeDOEnabled } from "./scrape-do";
import { firecrawlFetch, isFirecrawlEnabled } from "./firecrawl";

const LINKEDIN_JOBS_BASE = "https://www.linkedin.com/jobs/search/";
const REQUEST_TIMEOUT_MS = 30000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface ParsedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  postedDate?: string;
}

function parseJobCards(html: string): ParsedJob[] {
  const jobs: ParsedJob[] = [];

  // Split on each job card
  const cardPattern = /class="base-card[^"]*base-search-card[^"]*job-search-card"([\s\S]*?)(?=class="base-card[^"]*base-search-card|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = cardPattern.exec(html)) !== null) {
    const block = match[0];

    // Title: <h3 class="base-search-card__title">...</h3>
    const titleMatch = block.match(/class="base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : undefined;
    if (!title || title.length < 2) continue;

    // Company: <h4 class="base-search-card__subtitle">...<a>Company</a>
    const companyMatch = block.match(/class="base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/i);
    const company = companyMatch ? stripHtml(companyMatch[1]) : undefined;
    if (!company || company.length < 2) continue;

    // URL: href on the base-card__full-link anchor
    const urlMatch = block.match(/class="base-card__full-link[^"]*"[^>]*href="([^"]+)"/i)
      ?? block.match(/href="(https:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]+)"/i);
    const url = urlMatch ? urlMatch[1].replace(/&amp;/g, "&") : undefined;
    if (!url) continue;

    // Location: <span class="job-search-card__location">...</span>
    const locationMatch = block.match(/class="job-search-card__location"[^>]*>([\s\S]*?)<\/span>/i);
    const location = locationMatch ? stripHtml(locationMatch[1]) : "India";

    // Posted date: <time datetime="...">
    const dateMatch = block.match(/<time[^>]+datetime="([^"]+)"/i);
    const postedDate = dateMatch ? dateMatch[1] : undefined;

    jobs.push({ title, company, location, url, postedDate });
  }

  return jobs;
}

// ─── Experience / location inference ──────────────────────────────────────────

function inferExperienceLevel(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("intern")) return "intern";
  if (t.includes("junior") || t.includes("jr ") || t.includes("entry")) return "junior";
  if (t.includes("principal") || t.includes("staff ")) return "lead";
  if (t.includes("lead ") || t.includes("tech lead") || t.includes("head of")) return "lead";
  if (t.includes("senior") || t.includes("sr ") || t.includes("sr.")) return "senior";
  return "mid";
}

function inferLocationType(location: string): string {
  const l = location.toLowerCase();
  if (l.includes("remote") || l.includes("work from home")) return "remote";
  if (l.includes("hybrid")) return "hybrid";
  return "onsite";
}

function mapToRawJob(parsed: ParsedJob): RawJob {
  return {
    title: parsed.title,
    company: parsed.company,
    location: parsed.location,
    locationType: inferLocationType(parsed.location),
    url: parsed.url,
    source: "linkedin",
    experienceLevel: inferExperienceLevel(parsed.title),
    postedAt: parsed.postedDate ? new Date(parsed.postedDate) : undefined,
  };
}

// ─── Config matching ───────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function titleMatches(jobTitle: string, configTitles: string[]): boolean {
  if (configTitles.length === 0) return true;
  const jobNorm = normalize(jobTitle);
  const jobWords = new Set(jobNorm.split(/\s+/));
  return configTitles.some((candidate) => {
    const cn = normalize(candidate);
    if (jobNorm.includes(cn) || cn.includes(jobNorm)) return true;
    return cn.split(/\s+/).filter((w) => w.length > 2).some((w) => jobWords.has(w));
  });
}

function matchesConfig(job: RawJob, config: SearchConfigData): boolean {
  if (config.blacklistedCompanies.some((c) => normalize(c) === normalize(job.company))) return false;
  if (!titleMatches(job.title, config.titles)) return false;
  if (!passesGeoFilter(job.location, job.locationType)) return false;
  if (config.experienceLevel && job.experienceLevel) {
    if (normalize(config.experienceLevel) !== normalize(job.experienceLevel)) return false;
  }
  const searchable = normalize([job.title, job.description].filter(Boolean).join(" "));
  if (config.excludeKeywords.some((kw) => searchable.includes(normalize(kw)))) return false;
  return true;
}

// ─── Fetching ──────────────────────────────────────────────────────────────────

async function fetchLinkedInJobs(keyword: string, location: string): Promise<ParsedJob[]> {
  const params = new URLSearchParams({
    keywords: keyword,
    location,
    f_TPR: "r604800", // last 7 days
    sortBy: "DD",    // most recent
  });

  const url = `${LINKEDIN_JOBS_BASE}?${params.toString()}`;
  console.log(`[LinkedInScraper] Fetching: ${url}`);

  let html: string;
  if (isFirecrawlEnabled()) {
    html = await firecrawlFetch(url, { waitFor: 2000, timeoutMs: 45_000 });
    console.log(`[LinkedInScraper] Firecrawl: ${html.length} bytes for "${keyword}" @ ${location}`);
  } else {
    html = await scrapeDOFetch(url, { geoCode: "in", timeoutMs: REQUEST_TIMEOUT_MS });
    console.log(`[LinkedInScraper] scrape.do: ${html.length} bytes for "${keyword}" @ ${location}`);
  }

  const jobs = parseJobCards(html);
  console.log(`[LinkedInScraper] Parsed ${jobs.length} jobs for "${keyword}" @ ${location}`);
  return jobs;
}

// ─── Scraper class ─────────────────────────────────────────────────────────────

export class LinkedInScraper implements Scraper {
  name = "linkedin";
  enabled: boolean;

  constructor() {
    this.enabled = isFirecrawlEnabled() || isScrapeDOEnabled();
  }

  async scrape(config: SearchConfigData): Promise<ScraperResult> {
    const start = Date.now();
    const errors: string[] = [];
    const jobs: RawJob[] = [];
    const seenUrls = new Set<string>();

    if (!this.enabled) {
      return { jobs: [], errors: ["LinkedIn scraper disabled: FIRECRAWL_API_KEY and SCRAPE_DO_TOKEN not set"], source: this.name, durationMs: 0 };
    }

    // Search top 2 titles × top 2 locations (4 requests max)
    const titlesToSearch = config.titles.slice(0, 2);
    if (titlesToSearch.length === 0) titlesToSearch.push("Software Engineer");

    const locationsToSearch = config.locations.slice(0, 2);
    if (locationsToSearch.length === 0) locationsToSearch.push("India");

    const tasks: Array<{ keyword: string; location: string }> = [];
    for (const keyword of titlesToSearch) {
      for (const location of locationsToSearch) {
        tasks.push({ keyword, location });
      }
    }

    const results = await Promise.allSettled(
      tasks.map((t) => fetchLinkedInJobs(t.keyword, t.location))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        errors.push(`LinkedIn fetch failed for "${tasks[i].keyword}" @ "${tasks[i].location}": ${msg}`);
        continue;
      }
      for (const parsed of result.value) {
        if (seenUrls.has(parsed.url)) continue;
        seenUrls.add(parsed.url);
        const mapped = mapToRawJob(parsed);
        if (matchesConfig(mapped, config)) {
          jobs.push(mapped);
        }
      }
    }

    return { jobs, errors, source: this.name, durationMs: Date.now() - start };
  }
}
