import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    url.startsWith("https://")
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

  // In browser/client, NEXT_PUBLIC_API_URL might be "http://localhost:4000/api/v1" or "/api/v1"
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "")

  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    return `${apiBase}${path}`
  }

  return `/api/v1${path}`
}
