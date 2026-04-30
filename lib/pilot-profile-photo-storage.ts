import { jwtPayloadRole, jwtPayloadSub } from "@/lib/pilot-display-name";
import type { PilotProfileSnapshot } from "@/lib/pilot-profile-snapshot";

export const PILOT_PROFILE_PHOTOS_STORAGE_KEY =
  "aerolaminar_pilot_profile_photos_by_id_v1";

function isValidPhotoDataUrl(s: string): boolean {
  return typeof s === "string" && s.startsWith("data:image/");
}

export function readPilotProfilePhotosMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PILOT_PROFILE_PHOTOS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && isValidPhotoDataUrl(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function getPilotProfilePhotoDataUrl(
  pilotId: string | null | undefined
): string | undefined {
  if (!pilotId || typeof pilotId !== "string") return undefined;
  const map = readPilotProfilePhotosMap();
  const v = map[pilotId.trim()];
  return v && isValidPhotoDataUrl(v) ? v : undefined;
}

export function setPilotProfilePhotoDataUrl(
  pilotId: string,
  dataUrl: string
): void {
  const id = pilotId.trim();
  if (!id || !isValidPhotoDataUrl(dataUrl)) return;
  const map = readPilotProfilePhotosMap();
  map[id] = dataUrl;
  try {
    localStorage.setItem(PILOT_PROFILE_PHOTOS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

/**
 * Pilot dashboard: avatar only from the per-pilot map (`JWT sub` → `pilots.id`).
 * We intentionally do **not** fall back to the shared profile JSON photo: that blob
 * is one browser-wide snapshot and can belong to a previously signed-in pilot, so
 * reusing it would show the wrong face after another pilot logs in.
 */
export function getDashboardPilotProfilePhoto(
  pilotId: string,
  _base: PilotProfileSnapshot | null,
  _pilotEmail: string | undefined
): string | undefined {
  return getPilotProfilePhotoDataUrl(pilotId);
}

export function shouldStripPhotoFromSharedPilotSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const t = localStorage.getItem("token");
  if (!t) return false;
  return jwtPayloadRole(t) === "pilot" && Boolean(jwtPayloadSub(t));
}

/** Avoid storing avatar in shared snapshot while a pilot is logged in (same browser, multiple pilots). */
export function snapshotForSharedStorage(
  snapshot: PilotProfileSnapshot
): PilotProfileSnapshot {
  if (!shouldStripPhotoFromSharedPilotSnapshot()) return snapshot;
  const { photoDataUrl: _omit, ...rest } = snapshot;
  return rest;
}
