/** Map `pilots` table / API row fields for dashboard UIs. */

/**
 * Parse **`experience`** when it encodes total hours (registration / legacy rows).
 * Avoids treating "5 years" as 5 hours — requires plain digit groups or an `h`/hours suffix.
 */
function flightHoursFromExperienceField(experience: unknown): number | null {
  if (experience == null) return null;
  const s = String(experience).trim();
  if (!s) return null;

  const plain = s.replace(/,/g, "");
  if (/^[0-9]+$/.test(plain)) {
    const n = Math.floor(Number(plain));
    if (Number.isFinite(n) && n >= 0 && n <= 50000) return n;
  }

  const withUnit = s.match(/^([\d,]+)\s*(hours?|hrs?|h)\b/i);
  if (withUnit) {
    const n = Math.floor(Number(withUnit[1].replace(/,/g, "")));
    if (Number.isFinite(n) && n >= 0 && n <= 50000) return n;
  }

  return null;
}

/**
 * Flight hours from a `pilots` API row: prefer **`flight_hours`** when it is set
 * and positive. If it is **0 or missing**, fall back to **`experience`** when that
 * field holds hours (many rows never back-filled `flight_hours` after registration).
 */
export function flightHoursFromPilotRow(
  pilot: Record<string, unknown>
): number {
  const colRaw = pilot.flight_hours ?? pilot.flightHours;
  let fromCol: number | null = null;
  if (colRaw != null && colRaw !== "") {
    const col = Number(colRaw);
    if (Number.isFinite(col) && col >= 0) {
      fromCol = Math.min(50000, Math.floor(col));
    }
  }

  const fromExp = flightHoursFromExperienceField(pilot.experience);

  if (fromCol != null && fromCol > 0) return fromCol;
  if (fromExp != null && fromExp > 0) return fromExp;
  if (fromCol != null) return fromCol;
  if (fromExp != null) return fromExp;
  return 0;
}

export function safetyRatingFromPilotRow(
  pilot: Record<string, unknown>
): number {
  const v = Number(pilot.safety_rating ?? pilot.safetyRating);
  if (!Number.isFinite(v)) return 99.5;
  return Math.min(100, Math.max(0, Math.round(v * 10) / 10));
}

export function assignedMissionCountFromPilotRow(
  pilot: Record<string, unknown>
): number {
  const raw =
    pilot.missions_assigned ??
    pilot.missionsAssigned ??
    pilot.missions_completed ??
    pilot.missionsCompleted ??
    pilot.flight_count ??
    pilot.flightCount;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function missionsCompletedFromPilotRow(
  pilot: Record<string, unknown>
): number {
  const raw =
    pilot.missions_completed ??
    pilot.missionsCompleted ??
    pilot.flight_count ??
    pilot.flightCount;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function experienceYearsFromPilotRow(
  pilot: Record<string, unknown>
): number {
  const y = Number(pilot.experience_years ?? pilot.experienceYears);
  if (!Number.isFinite(y) || y < 0) return 0;
  return Math.floor(y);
}

export function experienceSubtitleFromPilotRow(
  pilot: Record<string, unknown>
): string {
  const rank = pilot.experience_rank ?? pilot.experienceRank;
  if (typeof rank === "string" && rank.trim()) return rank.trim();
  const exp = pilot.experience != null ? String(pilot.experience).trim() : "";
  if (exp && !/^[0-9]+$/.test(exp))
    return exp.length > 80 ? `${exp.slice(0, 77)}…` : exp;
  return "Pilot";
}
