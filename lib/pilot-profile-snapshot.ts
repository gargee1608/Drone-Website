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

/** Pilot-uploaded certification files (Skills step), stored as data URLs in browser storage. */
export type PilotCertificationUpload = {
  name: string;
  mime: string;
  dataUrl: string;
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
  /** Optional DGCA / training certificates from registration (data URLs). */
  certifications?: PilotCertificationUpload[];
};

function normalizePhotoDataUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t.startsWith("data:image/")) return undefined;
  /* Avoid huge strings breaking storage */
  if (t.length > 4_000_000) return undefined;
  return t;
}

const MAX_CERT_FILES = 4;
/** ~350KB binary per file once base64-encoded */
const MAX_CERT_DATA_URL_CHARS = 480_000;

export function normalizeCertifications(
  raw: unknown
): PilotCertificationUpload[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: PilotCertificationUpload[] = [];
  for (const row of raw) {
    if (out.length >= MAX_CERT_FILES) break;
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name =
      typeof r.name === "string" ? r.name.trim().slice(0, 220) : "certificate";
    const mime =
      typeof r.mime === "string" ? r.mime.trim().slice(0, 120) : "";
    const dataUrl =
      typeof r.dataUrl === "string" ? r.dataUrl.trim() : "";
    if (!dataUrl.startsWith("data:") || dataUrl.length > MAX_CERT_DATA_URL_CHARS) {
      continue;
    }
    out.push({ name: name || "certificate", mime, dataUrl });
  }
  return out.length > 0 ? out : undefined;
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
    const certifications = normalizeCertifications(parsed.certifications);
    return { ...parsed, fullName, bio, skills, photoDataUrl, certifications };
  } catch {
    return null;
  }
}
