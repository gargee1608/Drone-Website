import { getPilotById, getPilots } from "@/app/services/pilotServices";

/**
 * Resolves the signed-in pilot's `pilots` row the same way as the Flight Deck:
 * `GET /api/pilots/:id`, then a match on `GET /api/pilots` when the by-id call fails.
 */
export async function fetchPilotSessionRow(
  sub: string | null | undefined
): Promise<Record<string, unknown> | null> {
  const subStr = typeof sub === "string" ? sub.trim() : "";
  if (!subStr) return null;

  const one = await getPilotById(subStr);
  if (one && typeof one === "object" && !Array.isArray(one)) {
    return one as Record<string, unknown>;
  }

  const data = await getPilots();
  const rows = data != null && Array.isArray(data) ? data : [];
  const row = rows.find(
    (p: unknown) => p != null && typeof p === "object" && String((p as Record<string, unknown>).id) === String(subStr)
  );
  if (row && typeof row === "object" && !Array.isArray(row)) {
    return row as Record<string, unknown>;
  }
  return null;
}
