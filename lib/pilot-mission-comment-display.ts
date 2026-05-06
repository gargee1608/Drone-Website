/** Matches the pilot preset in assign-mission-view (hidden from display surfaces). */
export const PILOT_COMMENT_WEATHER_PRESET =
  "Problem in the weather conditions.";

function normalizeCommentForCompare(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Strip preset / boilerplate text so it is not shown in User Tracking and similar UIs. */
export function pilotMissionCommentForDisplay(text: string): string {
  const raw = text.trim();
  if (!raw) return "";
  if (
    normalizeCommentForCompare(raw) ===
    normalizeCommentForCompare(PILOT_COMMENT_WEATHER_PRESET)
  ) {
    return "";
  }
  return raw;
}
