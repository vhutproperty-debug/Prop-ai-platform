import { env, isFirecrawlConfigured } from "@/config/env";

const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v1";

export interface FirecrawlScrapeResult {
  url: string;
  markdown?: string;
  html?: string;
  links?: string[];
  metadata?: Record<string, unknown>;
}

export interface FirecrawlCrawlResult {
  status: string;
  total: number;
  completed: number;
  creditsUsed: number;
  data: FirecrawlScrapeResult[];
}

async function firecrawlRequest<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  if (!isFirecrawlConfigured) {
    throw new Error("FIRECRAWL_API_KEY is not configured");
  }

  const response = await fetch(`${FIRECRAWL_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl API error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as { success: boolean; data?: T; error?: string };
  if (!json.success) {
    throw new Error(json.error ?? "Firecrawl request failed");
  }

  return json.data as T;
}

export const firecrawlService = {
  isConfigured: () => isFirecrawlConfigured,

  async scrapeUrl(
    url: string,
    options?: { formats?: ("markdown" | "html" | "links")[] }
  ): Promise<FirecrawlScrapeResult> {
    const data = await firecrawlRequest<FirecrawlScrapeResult>("/scrape", {
      url,
      formats: options?.formats ?? ["markdown", "html", "links"],
      onlyMainContent: true,
    });
    return { ...data, url: data.url ?? url };
  },

  async crawlSite(
    url: string,
    options?: {
      limit?: number;
      includePaths?: string[];
      excludePaths?: string[];
    }
  ): Promise<FirecrawlCrawlResult> {
    const data = await firecrawlRequest<FirecrawlCrawlResult>("/crawl", {
      url,
      limit: options?.limit ?? 50,
      includePaths: options?.includePaths,
      excludePaths: options?.excludePaths,
      scrapeOptions: {
        formats: ["markdown", "html", "links"],
        onlyMainContent: true,
      },
    });
    return data;
  },

  async mapLinks(url: string, limit = 200): Promise<string[]> {
    const data = await firecrawlRequest<{ links: string[] }>("/map", {
      url,
      limit,
    });
    return data.links ?? [];
  },
};
