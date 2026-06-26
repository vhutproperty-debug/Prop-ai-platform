import { Firecrawl, type Document } from "firecrawl";
import { env, isFirecrawlConfigured } from "@/config/env";
import {
  FIRECRAWL_CONNECTIVITY_TEST_URL,
  FIRECRAWL_DEFAULT_CRAWL_LIMIT,
  FIRECRAWL_DEFAULT_MAP_LIMIT,
  FIRECRAWL_MAX_RETRIES,
  FIRECRAWL_RATE_LIMIT_BACKOFF_MS,
  FIRECRAWL_REQUEST_TIMEOUT_MS,
  FIRECRAWL_RETRY_BASE_MS,
  FIRECRAWL_SCRAPE_FORMATS,
} from "@/config/firecrawl";

export interface FirecrawlScrapeResult {
  url: string;
  markdown?: string;
  html?: string;
  links?: string[];
  images?: string[];
  metadata?: Record<string, unknown>;
}

export interface FirecrawlCrawlResult {
  status: string;
  total: number;
  completed: number;
  creditsUsed: number;
  data: FirecrawlScrapeResult[];
}

export interface FirecrawlConnectionTestResult {
  ok: boolean;
  configured: boolean;
  durationMs: number;
  error?: string;
  statusCode?: number;
  title?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClient(): Firecrawl | null {
  if (!isFirecrawlConfigured || !env.FIRECRAWL_API_KEY) return null;
  return new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    (error as { status?: number; statusCode?: number }).status ??
    (error as { status?: number; statusCode?: number }).statusCode;
  return status === 429 || /rate limit|429|too many requests/i.test(message);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getErrorStatus(error: unknown): number | undefined {
  return (
    (error as { status?: number }).status ??
    (error as { statusCode?: number }).statusCode
  );
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= FIRECRAWL_MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= FIRECRAWL_MAX_RETRIES) break;

      const delay = isRateLimitError(error)
        ? FIRECRAWL_RATE_LIMIT_BACKOFF_MS * attempt
        : FIRECRAWL_RETRY_BASE_MS * attempt;

      console.warn(
        `[Firecrawl] ${label} attempt ${attempt}/${FIRECRAWL_MAX_RETRIES} failed — retry in ${delay}ms`,
        getErrorMessage(error)
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

function documentToScrapeResult(
  url: string,
  document: Document
): FirecrawlScrapeResult {
  const metadata = document.metadata as Record<string, unknown> | undefined;
  const resolvedUrl =
    (metadata?.sourceURL as string | undefined) ??
    (metadata?.url as string | undefined) ??
    url;

  return {
    url: resolvedUrl,
    markdown: document.markdown,
    html: document.html,
    links: document.links,
    images: document.images,
    metadata,
  };
}

function normalizeMapLinks(links: unknown[]): string[] {
  const urls: string[] = [];

  for (const link of links) {
    if (typeof link === "string") {
      urls.push(link);
      continue;
    }
    if (link && typeof link === "object" && "url" in link) {
      const value = (link as { url?: unknown }).url;
      if (typeof value === "string") urls.push(value);
    }
  }

  return urls;
}

export const firecrawlService = {
  isConfigured: () => isFirecrawlConfigured,

  /** Lightweight connectivity check — never throws. */
  async testConnection(
    testUrl = FIRECRAWL_CONNECTIVITY_TEST_URL
  ): Promise<FirecrawlConnectionTestResult> {
    const started = Date.now();

    if (!isFirecrawlConfigured) {
      return {
        ok: false,
        configured: false,
        durationMs: Date.now() - started,
        error: "FIRECRAWL_API_KEY is not configured in .env.local",
      };
    }

    const client = getClient();
    if (!client) {
      return {
        ok: false,
        configured: false,
        durationMs: Date.now() - started,
        error: "Firecrawl client could not be initialized",
      };
    }

    try {
      const document = await withRetry("connectivity test", () =>
        client.scrape(testUrl, {
          formats: ["markdown"],
          onlyMainContent: true,
          timeout: Math.min(FIRECRAWL_REQUEST_TIMEOUT_MS, 30_000),
        })
      );

      return {
        ok: true,
        configured: true,
        durationMs: Date.now() - started,
        statusCode: document.metadata?.statusCode,
        title: document.metadata?.title,
      };
    } catch (error) {
      return {
        ok: false,
        configured: true,
        durationMs: Date.now() - started,
        error: getErrorMessage(error),
        statusCode: getErrorStatus(error),
      };
    }
  },

  async scrapeUrl(
    url: string,
    options?: { formats?: ("markdown" | "html" | "links" | "images")[] }
  ): Promise<FirecrawlScrapeResult> {
    const client = getClient();
    if (!client) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    const formats = options?.formats ?? [...FIRECRAWL_SCRAPE_FORMATS];

    const document = await withRetry(`scrape ${url}`, () =>
      client.scrape(url, {
        formats,
        onlyMainContent: true,
        timeout: FIRECRAWL_REQUEST_TIMEOUT_MS,
      })
    );

    return documentToScrapeResult(url, document);
  },

  async crawlSite(
    url: string,
    options?: {
      limit?: number;
      includePaths?: string[];
      excludePaths?: string[];
    }
  ): Promise<FirecrawlCrawlResult> {
    const client = getClient();
    if (!client) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    const job = await withRetry(`crawl ${url}`, () =>
      client.crawl(url, {
        limit: options?.limit ?? FIRECRAWL_DEFAULT_CRAWL_LIMIT,
        includePaths: options?.includePaths,
        excludePaths: options?.excludePaths,
        scrapeOptions: {
          formats: [...FIRECRAWL_SCRAPE_FORMATS],
          onlyMainContent: true,
          timeout: FIRECRAWL_REQUEST_TIMEOUT_MS,
        },
        timeout: Math.ceil(FIRECRAWL_REQUEST_TIMEOUT_MS / 1000) * 10,
      })
    );

    return {
      status: job.status,
      total: job.total,
      completed: job.completed,
      creditsUsed: job.creditsUsed ?? 0,
      data: (job.data ?? []).map((doc) =>
        documentToScrapeResult(url, doc)
      ),
    };
  },

  async mapLinks(url: string, limit = FIRECRAWL_DEFAULT_MAP_LIMIT): Promise<string[]> {
    const client = getClient();
    if (!client) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    const result = await withRetry(`map ${url}`, () =>
      client.map(url, {
        limit,
        timeout: FIRECRAWL_REQUEST_TIMEOUT_MS,
      })
    );

    return normalizeMapLinks(result.links ?? []);
  },
};
