import { flightHoursFromPilotRow } from "@/lib/pilot-db-metrics";
import { readPilotProfileSnapshotRawFromBrowser } from "@/lib/pilot-profile-browser-storage";
import { parsePilotProfileSnapshot } from "@/lib/pilot-profile-snapshot";

/** Browser snapshot `flightHours` (session → local), same backing field as Profile `data.flightHours`. */
export function snapshotFlightHoursFromStorage(): number {
  if (typeof window === "undefined") return 0;
  const raw = readPilotProfileSnapshotRawFromBrowser();
  const snap = parsePilotProfileSnapshot(raw);
  const h = Number(snap?.flightHours);
  if (!Number.isFinite(h) || h < 0) return 0;
  return Math.min(50000, Math.floor(h));
}

/**
 * Same rule as **Pilot Dashboard → Profile → Professional → Flight hours**:
 * if a `pilots` API row is available for this session, use `flightHoursFromPilotRow`;
 * otherwise `snapshotFallbackHours` (Profile uses merged `data.flightHours`).
 */
export function displayFlightHoursLikeProfilePage(
  apiPilotRow: Record<string, unknown> | null | undefined,
  opts: {
    preferApiRowWhenPresent: boolean;
    snapshotFallbackHours: number;
  }
): number {
  if (
    opts.preferApiRowWhenPresent &&
    apiPilotRow != null &&
    typeof apiPilotRow === "object" &&
    !Array.isArray(apiPilotRow)
  ) {
    return flightHoursFromPilotRow(apiPilotRow);
  }
  return opts.snapshotFallbackHours;
}
