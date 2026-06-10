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

export function pilotMissionCommentsForDisplay(
  comments: Array<{ text: string; createdAt: string }>
): Array<{ text: string; createdAt: string }> {
  return comments
    .map((entry) => ({
      ...entry,
      text: pilotMissionCommentForDisplay(entry.text),
    }))
    .filter((entry) => entry.text.trim().length > 0);
}

function formatCommentTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export { formatCommentTimestamp };
