/**
 * URL for the Express API from the browser.
 * Default uses `/api/express/...` (Next Route Handler proxies to Express — works with Turbopack).
 * Pilot register uses `/api/pilots/register` (dedicated proxy) so the path is never truncated.
 * Set `NEXT_PUBLIC_API_URL` to the server origin only (e.g. `https://api.example.com`), not `.../api`.
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const envBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (envBase) {
    if (envBase.endsWith("/api") && normalized.startsWith("/api/")) {
      return `${envBase}${normalized.replace(/^\/api/, "")}`;
    }
    return `${envBase}${normalized}`;
  }
  if (normalized === "/api/pilots/register") {
    return "/api/pilots/register";
  }
  /** Served by Next Route Handlers (`app/api/blogs/...`) — same DB as backend; works without Express. */
  if (normalized.startsWith("/api/blogs")) {
    return normalized;
  }
  return `/api/express${normalized}`;
}
