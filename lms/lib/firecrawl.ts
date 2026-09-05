import "server-only";

/**
 * Firecrawl scrape, called with raw fetch — one endpoint, one response shape,
 * so an SDK would only add a dependency. Returns clean markdown, whose heading
 * structure is also what the offline heuristic fallback keys off.
 */

const ENDPOINT = "https://api.firecrawl.dev/v2/scrape";

export function hasFirecrawlKey(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY?.trim());
}

export class ScrapeError extends Error {}

/**
 * Reject anything that is not a public https URL. The URL is user-supplied and
 * gets fetched by a third party on our behalf, so the cheap guard is worth it.
 */
export function assertPublicHttpsUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ScrapeError("That does not look like a valid URL.");
  }
  if (url.protocol !== "https:") throw new ScrapeError("Only https:// links are supported.");
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new ScrapeError("That host is not reachable from here.");
  return url;
}

export async function scrapeUrl(raw: string): Promise<{ markdown: string; title: string }> {
  const url = assertPublicHttpsUrl(raw);
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) throw new ScrapeError("Link scraping is not configured.");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      url: url.toString(),
      formats: ["markdown"],
      onlyMainContent: true,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new ScrapeError(`The page could not be fetched (${res.status}).`);
  }

  const body = (await res.json()) as {
    data?: { markdown?: string; content?: string; metadata?: { title?: string } };
  };
  const markdown = (body.data?.markdown || body.data?.content || "").trim();
  if (markdown.length < 200) {
    throw new ScrapeError("That page returned no readable text.");
  }
  const title = body.data?.metadata?.title?.trim() || url.hostname;
  return { markdown, title: `${title} (${url.hostname})` };
}
