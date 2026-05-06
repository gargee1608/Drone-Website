import {
  parsePilotProfileSnapshot,
  PILOT_PROFILE_STORAGE_KEY,
  pilotProfileSnapshotKeyForSub,
} from "@/lib/pilot-profile-snapshot";

function decodeJwtRole(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad)) as { role?: string };
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

function decodeJwtSub(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad)) as { sub?: string };
    const sub = json.sub;
    if (typeof sub !== "string") return null;
    const t = sub.trim();
    return t || null;
  } catch {
    return null;
  }
}

function pilotEmailFromLoginObject(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("pilot");
    if (!raw) return undefined;
    const p = JSON.parse(raw) as { email?: string };
    return p.email?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Storage key for the pilot profile JSON blob in this browser.
 * Signed-in **pilots** use a key scoped by `JWT sub`; everyone else uses the legacy global key
 * (registration draft, pre-login flows).
 */
export function activePilotProfileSnapshotStorageKey(): string {
  if (typeof window === "undefined") return PILOT_PROFILE_STORAGE_KEY;
  const token = localStorage.getItem("token");
  if (!token) return PILOT_PROFILE_STORAGE_KEY;
  const role = decodeJwtRole(token);
  const sub = decodeJwtSub(token);
  if (role === "pilot" && sub) return pilotProfileSnapshotKeyForSub(sub);
  return PILOT_PROFILE_STORAGE_KEY;
}

/**
 * One-time: if this pilot has no scoped blob yet but the legacy global snapshot matches their
 * login email (same device, pre-scoping data), copy it to the scoped key so they keep their profile.
 */
export function maybeMigrateLegacyPilotProfileSnapshotToScoped(): void {
  if (typeof window === "undefined") return;
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (decodeJwtRole(token) !== "pilot") return;
    const sub = decodeJwtSub(token);
    if (!sub) return;
    const scoped = pilotProfileSnapshotKeyForSub(sub);
    if (localStorage.getItem(scoped) || sessionStorage.getItem(scoped)) return;
    const pilotEmail = pilotEmailFromLoginObject();
    if (!pilotEmail) return;
    const legacyRaw =
      sessionStorage.getItem(PILOT_PROFILE_STORAGE_KEY) ??
      localStorage.getItem(PILOT_PROFILE_STORAGE_KEY);
    if (!legacyRaw) return;
    const snap = parsePilotProfileSnapshot(legacyRaw);
    if (!snap?.email?.trim()) return;
    if (snap.email.trim().toLowerCase() !== pilotEmail.toLowerCase()) return;
    localStorage.setItem(scoped, legacyRaw);
  } catch {
    /* ignore */
  }
}

/**
 * Prefer the snapshot that includes the most drone rows when session vs local
 * differ (they can drift if only one store was updated).
 */
function pickPilotSnapshotRawPreferMostDrones(
  sessionRaw: string | null,
  localRaw: string | null
): string | null {
  if (!sessionRaw && !localRaw) return null;
  if (!sessionRaw) return localRaw;
  if (!localRaw) return sessionRaw;
  if (sessionRaw === localRaw) return sessionRaw;

  const sessionSnap = parsePilotProfileSnapshot(sessionRaw);
  const localSnap = parsePilotProfileSnapshot(localRaw);
  if (!sessionSnap) return localRaw;
  if (!localSnap) return sessionRaw;

  const sd = sessionSnap.drones?.length ?? 0;
  const ld = localSnap.drones?.length ?? 0;
  if (ld > sd) return localRaw;
  if (sd > ld) return sessionRaw;
  return localRaw;
}

export function readPilotProfileSnapshotRawFromBrowser(): string | null {
  if (typeof window === "undefined") return null;
  maybeMigrateLegacyPilotProfileSnapshotToScoped();
  const key = activePilotProfileSnapshotStorageKey();
  const sessionRaw = sessionStorage.getItem(key);
  const localRaw = localStorage.getItem(key);
  const picked = pickPilotSnapshotRawPreferMostDrones(sessionRaw, localRaw);
  if (
    picked &&
    sessionRaw &&
    localRaw &&
    (sessionRaw !== picked || localRaw !== picked)
  ) {
    try {
      localStorage.setItem(key, picked);
      sessionStorage.setItem(key, picked);
    } catch {
      /* ignore */
    }
  }
  return picked;
}
