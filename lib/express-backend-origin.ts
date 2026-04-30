/**
 * Origin for the Express API (no trailing slash).
 * Strips a mistaken trailing `/api` from BACKEND_URL so paths like `api/pilots/register`
 * do not become `.../api/api/...` and so the proxy never targets `POST /api` alone.
 */
export function expressBackendOrigin(): string {
  let base = (process.env.BACKEND_URL ?? "http://127.0.0.1:4000").replace(
    /\/$/,
    ""
  );
  if (base.endsWith("/api")) {
    base = base.slice(0, -4).replace(/\/$/, "");
  }
  return base;
}
