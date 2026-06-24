import { env } from "@/config/env";

export function absoluteUrl(path: string): string {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function projectCanonicalPath(slug: string): string {
  return `/project/${slug}`;
}

export function projectCanonicalUrl(slug: string): string {
  return absoluteUrl(projectCanonicalPath(slug));
}

export function truncateDescription(
  text: string,
  maxLength = 160
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
