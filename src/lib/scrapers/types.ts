import { RawJob, SearchConfigData } from "@/types";

export interface ScraperResult {
  jobs: RawJob[];
  errors: string[];
  source: string;
  durationMs: number;
}

export interface Scraper {
  /** Unique name identifying this scraper source */
  name: string;

  /** Whether this scraper is currently enabled */
  enabled: boolean;

  /**
   * Fetch jobs matching the given search configuration.
   * Implementations should handle their own error handling and return
   * partial results if some requests fail.
   */
  scrape(config: SearchConfigData): Promise<ScraperResult>;
}

export interface ScraperOrchestrationResult {
  jobs: RawJob[];
  totalBeforeDedup: number;
  totalAfterDedup: number;
  scraperResults: ScraperResult[];
  durationMs: number;
}
