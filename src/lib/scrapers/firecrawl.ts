// Firecrawl scraper — primary scraping layer for job discovery.
// Uses Firecrawl's search API as the first attempt for each job source.
// Other scrapers (Apify, scrape.do) act as fallbacks when Firecrawl returns 0 jobs.
// Auto-disables when FIRECRAWL_API_KEY is not set.
// Docs: https://docs.firecrawl.dev/api-reference/endpoint/search

import type { RawJob, SearchConfigData } from "@/types";
import type { Scraper, ScraperResult } from "./types";

const FIRECRAWL_BASE = "https://api.firecrawl.dev";

// ─── Raw search response types ────────────────────────────────────────────────

interface FirecrawlMetadata {
  title?: string;
  description?: string;
  sourceURL?: string;
  statusCode?: number;
  error?: string | null;
}

interface FirecrawlSearchItem {
  url?: string;
  markdown?: string;
  metadata?: FirecrawlMetadata;
}

interface FirecrawlSearchResponse {
  success: boolean;
  data?: FirecrawlSearchItem[];
  warning?: string | null;
}

// ─── API client ───────────────────────────────────────────────────────────────

async function searchFirecrawl(
  query: string,
  limit = 20
): Promise<FirecrawlSearchItem[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");

  const res = await fetch(`${FIRECRAWL_BASE}/v1/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      limit,
      tbs: "qdr:w",            // last 7 days — prefer fresh postings
      scrapeOptions: {
        formats: ["markdown"],  // get page content for better description parsing
        onlyMainContent: true,
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as FirecrawlSearchResponse;
  return data.data ?? [];
}

// ─── Job parser ───────────────────────────────────────────────────────────────

/**
 * Normalise a raw title string into (job title, company) parts.
 * Handles common patterns:
 *   "Senior Engineer - Google | LinkedIn"
 *   "Google is hiring Senior Engineer"
 *   "Senior Engineer at Google"
 *   "Senior Engineer - Google - Bangalore, India"
 */
function parseTitle(raw: string): { jobTitle: string; company: string } | null {
  // Strip trailing board names like "| LinkedIn", "| Indeed", "| Glassdoor"
  const cleaned = raw.replace(/\|\s*(linkedin|indeed|glassdoor|naukri|wellfound|angellist|monster).*$/i, "").trim();

  // Pattern 1: "Title - Company" or "Title - Company - Location"
  const dashMatch = cleaned.match(/^(.+?)\s+-\s+([^-]+?)(?:\s+-\s+.+)?$/);
  if (dashMatch) {
    return { jobTitle: dashMatch[1].trim(), company: dashMatch[2].trim() };
  }

  // Pattern 2: "Title at Company"
  const atMatch = cleaned.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return { jobTitle: atMatch[1].trim(), company: atMatch[2].trim() };
  }

  // Pattern 3: "Company is hiring Title" / "Company - Title"
  const hiringMatch = cleaned.match(/^(.+?)\s+(?:is\s+)?hiring\s+(.+)$/i);
  if (hiringMatch) {
    return { jobTitle: hiringMatch[2].trim(), company: hiringMatch[1].trim() };
  }

  return null;
}

/** Pull a rough location hint from the description snippet. */
function extractLocation(description?: string, markdown?: string): string {
  const text = (description ?? "") + " " + (markdown?.slice(0, 500) ?? "");
  // Common patterns: "Remote", "Bangalore, India", "New York, NY"
  const remoteMatch = text.match(/\bremote\b/i);
  if (remoteMatch) return "Remote";
  const locMatch = text.match(/\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|india)\b/i);
  if (locMatch) return locMatch[1];
  return "";
}

/** Pull a rough experience level hint from description. */
function extractExperience(description?: string, title?: string): string {
  const text = ((description ?? "") + " " + (title ?? "")).toLowerCase();
  if (/\bintern(ship)?\b/.test(text)) return "intern";
  if (/\b(junior|entry.level|0.2 years?|fresher)\b/.test(text)) return "junior";
  if (/\b(senior|sr\.?|lead|principal|staff)\b/.test(text)) return "senior";
  if (/\b(mid.level|3.5 years?)\b/.test(text)) return "mid";
  return "mid";
}

function mapSearchItem(item: FirecrawlSearchItem, source: string): RawJob | null {
  const url = item.url?.trim();
  const rawTitle = item.metadata?.title?.trim();
  if (!url || !rawTitle) return null;

  const parsed = parseTitle(rawTitle);
  if (!parsed) return null;

  const { jobTitle, company } = parsed;
  if (!jobTitle || !company || company.length > 80) return null;

  const description = item.metadata?.description?.trim();
  const markdown = item.markdown;
  const location = extractLocation(description, markdown) || "India";

  return {
    title: jobTitle,
    company,
    url,
    source,
    location,
    locationType: location.toLowerCase().includes("remote") ? "remote" : "onsite",
    description: description || markdown?.slice(0, 1500) || undefined,
    experienceLevel: extractExperience(description, jobTitle),
  };
}

// ─── Scraper class ────────────────────────────────────────────────────────────

export class FirecrawlJobScraper implements Scraper {
  readonly name: string;
  readonly enabled: boolean;

  constructor(private readonly siteFilter: string = "") {
    // name encodes the site filter so it shows clearly in logs / dedup keys
    const suffix = siteFilter ? `-${siteFilter.replace(/[^a-z0-9]/gi, "")}` : "";
    this.name = `firecrawl${suffix}`;
    this.enabled = !!process.env.FIRECRAWL_API_KEY;
  }

  async scrape(config: SearchConfigData): Promise<ScraperResult> {
    const start = Date.now();

    if (!this.enabled) {
      return {
        jobs: [],
        errors: [`${this.name} disabled: FIRECRAWL_API_KEY not set`],
        source: this.name,
        durationMs: 0,
      };
    }

    try {
      const titles = config.titles.slice(0, 3);
      const location = config.locations[0] ?? "India";
      const siteClause = this.siteFilter
        ? ` ${this.siteFilter}`
        : " (site:linkedin.com OR site:indeed.com OR site:wellfound.com)";

      // Run one query per title in parallel for more targeted results
      const queries = (titles.length > 0 ? titles : ["Software Engineer"]).map(
        (title) => `${title} jobs ${location}${siteClause}`
      );

      console.log(`[FirecrawlScraper] ${this.name}: running ${queries.length} parallel queries`);

      const settled = await Promise.allSettled(
        queries.map((q) => searchFirecrawl(q, 25))
      );

      const seenUrls = new Set<string>();
      const errors: string[] = [];
      const jobs: RawJob[] = [];

      for (const result of settled) {
        if (result.status === "rejected") {
          const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
          errors.push(msg);
          continue;
        }
        for (const item of result.value) {
          const job = mapSearchItem(item, this.name);
          if (!job) continue;
          if (seenUrls.has(job.url)) continue;
          if (config.blacklistedCompanies.some((c) => c.toLowerCase() === job.company.toLowerCase())) continue;
          seenUrls.add(job.url);
          jobs.push(job);
        }
      }

      console.log(`[FirecrawlScraper] ${this.name}: ${jobs.length} unique jobs across ${queries.length} queries`);
      return { jobs, errors, source: this.name, durationMs: Date.now() - start };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[FirecrawlScraper] ${this.name} error:`, msg);
      return { jobs: [], errors: [msg], source: this.name, durationMs: Date.now() - start };
    }
  }
}
