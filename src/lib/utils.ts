import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a Date object into a local 'YYYY-MM-DD' string based on the user's local timezone.
 * Avoids the UTC-offset bug where new Date().toISOString() returns yesterday between 00:00 and 03:00.
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Resolves media URLs (MinIO files, logos) so that relative paths like `/media/files/...`
 * or `/api/v1/media/files/...` point directly to the active API base URL.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ""
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/brand/") ||
    url.startsWith("/icons/") ||
    url.startsWith("/images/") ||
    url.startsWith("/favicon")
  ) {
    return url
  }

  // Normalize path by stripping any leading /api/v1 or api/v1
  let path = url
  if (path.startsWith("/api/v1/")) {
    path = path.slice("/api/v1".length)
  } else if (path.startsWith("api/v1/")) {
    path = path.slice("api/v1".length)
  }

  if (!path.startsWith("/")) {
    path = `/${path}`
  }

  // In browser/client, always use same-origin relative path /api/v1 so that Next rewrites
  // and reverse proxies route the media request without CORS or loopback address space blocking.
  if (typeof window !== "undefined") {
    return `/api/v1${path}`
  }

  const isDocker = Boolean(process.env.HOSTNAME === "0.0.0.0" || process.env.API_INTERNAL_URL)
  const serverApi = process.env.API_INTERNAL_URL || (isDocker ? "http://api:4000/api/v1" : "http://localhost:4000/api/v1")
  return `${serverApi.replace(/\/$/, "")}${path}`
}
