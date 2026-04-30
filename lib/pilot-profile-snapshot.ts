/**
 * sessionStorage: latest submit (for /pilot-profile right after registration).
 * localStorage: last successful registration (pilot profile page; not used to pre-fill registration).
 */
export const PILOT_PROFILE_STORAGE_KEY = "aerolaminar_pilot_profile_snapshot";

/** Per signed-in pilot (`JWT sub` = `pilots.id`) so multiple pilots on one device do not share one blob. */
export function pilotProfileSnapshotKeyForSub(sub: string): string {
  const t = sub.trim();
  if (!t) return PILOT_PROFILE_STORAGE_KEY;
  return `${PILOT_PROFILE_STORAGE_KEY}::pilot::${t}`;
}

/** Dispatched on window after a pilot profile snapshot is saved (e.g. registration submit). */
export const PILOT_PROFILE_UPDATED_EVENT = "aerolaminar-pilot-profile-updated";

export type PilotProfileDrone = {
  id: string;
  modelName: string;
  type: string;
  camera: string;
  payloadKg: string;
  flightTimeMin: string;
  rangeKm: string;
  useCases: string[];
};

export type PilotProfileSnapshot = {
  fullName: string;
  email?: string;
  phone?: string;
  city: string;
  state: string;
  /** Full digits; optional for snapshots saved before this field existed */
  aadhaar?: string;
  flightHours: number;
  bio: string;
  skills: string[];
  drones: PilotProfileDrone[];
  dgca: string;
  /** Optional avatar from profile photo (data URL); set from pilot profile UI */
  photoDataUrl?: string;
};

function normalizePhotoDataUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t.startsWith("data:image/")) return undefined;
  /* Avoid huge strings breaking storage */
  if (t.length > 4_000_000) return undefined;
  return t;
}

/** Legacy strip list (empty) — pilot registration uses full skill labels including FPV & Mapping. */
const REMOVED_SKILL_LABELS = new Set<string>();

export function filterRemovedSkills(skills: string[]): string[] {
  return skills.filter(
    (s) => !REMOVED_SKILL_LABELS.has(s.trim().toLowerCase())
  );
}

const PLACEHOLDER_ABC = /^abc$/i;

/** Replace whole-string placeholder `abc` (any case) with Command Manager. */
export function replaceAbcPlaceholder(value: string): string {
  return PLACEHOLDER_ABC.test(value.trim()) ? "Command Manager" : value;
}

/** Legacy / placeholder skill labels → current product copy. */
function migrateSkillLabels(skills: string[]): string[] {
  return skills.map((s) => replaceAbcPlaceholder(s));
}

/** Skills as stored on the pilot profile snapshot (strip removed + rename legacy). */
export function normalizePilotSkillsForSnapshot(skills: string[]): string[] {
  return migrateSkillLabels(filterRemovedSkills(skills));
}

export function parsePilotProfileSnapshot(
  raw: string | null
): PilotProfileSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PilotProfileSnapshot;
    const skills = Array.isArray(parsed.skills)
      ? normalizePilotSkillsForSnapshot(parsed.skills)
      : [];
    const fullName = replaceAbcPlaceholder(
      typeof parsed.fullName === "string" ? parsed.fullName : ""
    );
    const bio =
      typeof parsed.bio === "string" ? replaceAbcPlaceholder(parsed.bio) : "";
    const photoDataUrl = normalizePhotoDataUrl(parsed.photoDataUrl);
    return { ...parsed, fullName, bio, skills, photoDataUrl };
  } catch {
    return null;
  }
}
