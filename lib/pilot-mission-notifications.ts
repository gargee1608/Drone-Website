import { readPilotProfileSnapshotRawFromBrowser } from "@/lib/pilot-profile-browser-storage";
import { jwtPayloadSub } from "@/lib/pilot-display-name";
import { parsePilotProfileSnapshot } from "@/lib/pilot-profile-snapshot";

export const PILOT_MISSION_NOTIFICATIONS_STORAGE_KEY =
  "aerolaminar_pilot_mission_notifications_v1";

export const PILOT_MISSION_NOTIFICATIONS_SEEN_IDS_KEY =
  "aerolaminar_pilot_mission_notif_seen_ids_v1";

export const PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT =
  "aerolaminar-pilot-mission-notifications-updated";

const MAX_STORED = 50;

export type PilotMissionNotification = {
  id: string;
  requestRef: string;
  customer: string;
  service: string;
  dropoff: string;
  pilotName: string;
  pilotBadgeId: string;
  /** `pilots.id` (JWT `sub`) for exact pilot targeting. */
  pilotSub?: string;
  droneModel: string;
  assignedAt: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPilotMissionNotification(v: unknown): v is PilotMissionNotification {
  if (!isRecord(v)) return false;
  const keys = [
    "id",
    "requestRef",
    "customer",
    "service",
    "dropoff",
    "pilotName",
    "pilotBadgeId",
    "droneModel",
    "assignedAt",
  ] as const;
  return (
    keys.every((k) => typeof v[k] === "string") &&
    (v.pilotSub === undefined || typeof v.pilotSub === "string")
  );
}

export function loadPilotMissionNotifications(): PilotMissionNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PILOT_MISSION_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPilotMissionNotification);
  } catch {
    return [];
  }
}

function persistNotifications(rows: PilotMissionNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PILOT_MISSION_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(rows)
    );
  } catch {
    /* quota */
  }
}

function loadSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PILOT_MISSION_NOTIFICATIONS_SEEN_IDS_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistSeenIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PILOT_MISSION_NOTIFICATIONS_SEEN_IDS_KEY,
      JSON.stringify([...ids])
    );
  } catch {
    /* quota */
  }
}

function pilotProfileFullName(): string | null {
  if (typeof window === "undefined") return null;
  const p = parsePilotProfileSnapshot(
    readPilotProfileSnapshotRawFromBrowser()
  );
  const n = p?.fullName?.trim();
  return n || null;
}

function signedInPilotSub(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  return jwtPayloadSub(token);
}

/**
 * Missions the signed-in pilot should see.
 * Primary filter: exact `pilotSub` match (selected pilot from admin assignment).
 * Fallback for older rows (without `pilotSub`): profile full-name match.
 */
export function notificationsVisibleToPilot(): PilotMissionNotification[] {
  const all = loadPilotMissionNotifications();
  const sub = signedInPilotSub();
  if (sub) {
    const bySub = all.filter((n) => (n.pilotSub ?? "").trim() === sub);
    if (bySub.length > 0) {
      return bySub.sort(
        (a, b) =>
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
      );
    }
  }
  const name = pilotProfileFullName();
  if (!name) {
    return [...all].sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    );
  }
  const norm = (s: string) => s.trim().toLowerCase();
  const nn = norm(name);
  return all
    .filter((n) => norm(n.pilotName) === nn)
    .sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    );
}

export function countUnreadPilotMissionNotifications(): number {
  const seen = loadSeenIds();
  return notificationsVisibleToPilot().filter((n) => !seen.has(n.id)).length;
}

export function markPilotMissionNotificationIdsSeen(ids: string[]): void {
  if (ids.length === 0) return;
  const next = loadSeenIds();
  for (const id of ids) next.add(id);
  persistSeenIds(next);
}

/** Remove one mission notification after pilot marks it complete. */
export function removePilotMissionNotificationById(id: string): void {
  if (typeof window === "undefined") return;
  if (!id) return;
  const prev = loadPilotMissionNotifications();
  const next = prev.filter((row) => row.id !== id);
  if (next.length === prev.length) return;
  persistNotifications(next);
  const seen = loadSeenIds();
  if (seen.has(id)) {
    seen.delete(id);
    persistSeenIds(seen);
  }
  window.dispatchEvent(new Event(PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT));
}

/**
 * Called when admin confirms an assignment so the pilot inbox can show it.
 */
export function pushPilotMissionNotification(payload: {
  requestRef: string;
  customer: string;
  service: string;
  dropoff: string;
  pilotName: string;
  pilotBadgeId: string;
  pilotSub?: string;
  droneModel: string;
}): void {
  if (typeof window === "undefined") return;
  const assignedAt = new Date().toISOString();
  const id = `${payload.requestRef}:${assignedAt}`;
  const nextRow: PilotMissionNotification = {
    id,
    assignedAt,
    ...payload,
    pilotSub: payload.pilotSub?.trim() || undefined,
  };
  const prev = loadPilotMissionNotifications();
  const next = [nextRow, ...prev].slice(0, MAX_STORED);
  persistNotifications(next);
  window.dispatchEvent(new Event(PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT));
}
