// scrape.do proxy utility — routes requests through scrape.do's proxy network
// to bypass anti-scraping measures. Token set via SCRAPE_DO_TOKEN env var.
// Docs: https://scrape.do

const SCRAPE_DO_BASE = "https://api.scrape.do";

export function isScrapeDOEnabled(): boolean {
  return !!process.env.SCRAPE_DO_TOKEN;
}

export async function scrapeDOFetch(
  targetUrl: string,
  options: {
    render?: boolean; // render JavaScript (costs more credits)
    timeoutMs?: number;
    extraHeaders?: Record<string, string>;
  } = {}
): Promise<string> {
  const token = process.env.SCRAPE_DO_TOKEN;
  if (!token) throw new Error("SCRAPE_DO_TOKEN not set");

  const params = new URLSearchParams({
    token,
    url: targetUrl,
  });
  if (options.render) params.set("render", "true");

  const proxyUrl = `${SCRAPE_DO_BASE}?${params.toString()}`;

  const res = await fetch(proxyUrl, {
    headers: options.extraHeaders ?? {},
    signal: AbortSignal.timeout(options.timeoutMs ?? 30000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`scrape.do returned ${res.status} for ${targetUrl}: ${body.slice(0, 200)}`);
  }

  return res.text();
}
