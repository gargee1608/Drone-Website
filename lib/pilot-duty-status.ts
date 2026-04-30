/** Aligns with `pilots.duty_status` and pilot-status-view mapping. */
export type PilotDutyStatusNormalized = "ACTIVE" | "INACTIVE";

export function normalizePilotDutyStatus(raw: unknown): PilotDutyStatusNormalized {
  const s = String(raw ?? "ACTIVE").toUpperCase().trim();
  if (
    s === "INACTIVE" ||
    s === "OFFLINE" ||
    s === "ON_LEAVE"
  ) {
    return "INACTIVE";
  }
  return "ACTIVE";
}
