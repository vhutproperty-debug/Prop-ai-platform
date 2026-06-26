/** Firecrawl client tuning — used by import engine only. */
export const FIRECRAWL_REQUEST_TIMEOUT_MS = 60_000;
export const FIRECRAWL_MAX_RETRIES = 3;
export const FIRECRAWL_RETRY_BASE_MS = 1_500;
export const FIRECRAWL_RATE_LIMIT_BACKOFF_MS = 5_000;
export const FIRECRAWL_CONNECTIVITY_TEST_URL = "https://firecrawl.dev";
export const FIRECRAWL_DEFAULT_MAP_LIMIT = 200;
export const FIRECRAWL_DEFAULT_CRAWL_LIMIT = 50;

export const FIRECRAWL_SCRAPE_FORMATS = [
  "markdown",
  "html",
  "links",
  "images",
] as const;
