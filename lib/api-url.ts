/**
 * URL for the Express API from the browser.
 * Default uses `/api/express/...` (Next Route Handler proxies to Express — works with Turbopack).
 * Set `NEXT_PUBLIC_API_URL` (no trailing slash) to call the API directly, e.g. production.
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const envBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (envBase) {
    return `${envBase}${normalized}`;
  }
  return `/api/express${normalized}`;
}
