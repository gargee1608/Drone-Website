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
  /** Auth endpoints are served directly by backend, not through express proxy */
  if (normalized.startsWith("/api/auth")) {
    return normalized;
  }
  /** User requests endpoint is served directly by backend, not through express proxy */
  if (normalized.startsWith("/api/user-requests")) {
    return normalized;
  }
  /** Matching hub / admin mission catalog — Next route handlers proxy to Express */
  if (normalized.startsWith("/api/missions-requests")) {
    return normalized;
  }
  /** Service hire requests — Next route handler writes to PostgreSQL (same as blogs). */
  if (normalized === "/api/submit-request") {
    return normalized;
  }
  /** Admin-deleted built-in catalog slugs (Next route handler, same DB as Express). */
  if (
    normalized === "/api/services/suppressed" ||
    normalized === "/api/services/suppress"
  ) {
    return normalized;
  }
  /** All other /api routes: strip leading /api to avoid duplicate /api/express/api/... */
  if (normalized.startsWith("/api/")) {
    return `/api/express${normalized.replace(/^\/api/, "")}`;
  }
  return `/api/express${normalized}`;
}
