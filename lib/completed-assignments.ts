export const COMPLETED_ASSIGNMENTS_STORAGE_KEY =
  "aerolaminar_completed_assignments_v1";

export type CompletedAssignment = {
  requestRef: string;
  customer: string;
  service: string;
  dropoff: string;
  sectorLine: string;
  pilotName: string;
  pilotBadgeId: string;
  droneModel: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isCompletedAssignment(v: unknown): v is CompletedAssignment {
  if (!isRecord(v)) return false;
  const keys = [
    "requestRef",
    "customer",
    "service",
    "dropoff",
    "sectorLine",
    "pilotName",
    "pilotBadgeId",
    "droneModel",
  ] as const;
  return keys.every((k) => typeof v[k] === "string");
}

export function loadCompletedAssignments(): CompletedAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPLETED_ASSIGNMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCompletedAssignment);
  } catch {
    return [];
  }
}

export function saveCompletedAssignments(
  rows: CompletedAssignment[]
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    COMPLETED_ASSIGNMENTS_STORAGE_KEY,
    JSON.stringify(rows)
  );
}

/** Keep only the most recent completion (single row for Assigned Mission). */
export function normalizeToLatestCompleted(
  rows: CompletedAssignment[]
): CompletedAssignment[] {
  if (rows.length === 0) return [];
  return [rows[rows.length - 1]];
}
