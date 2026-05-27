import { apiUrl } from "@/lib/api-url";

/** Loads slugs the admin removed (built-in catalog stays hidden after delete). */
export async function fetchSuppressedServiceSlugs(): Promise<string[]> {
  try {
    const res = await fetch(apiUrl("/api/services/suppressed"), {
      cache: "no-store",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(data)) return [];
    return data.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0
    );
  } catch {
    return [];
  }
}
