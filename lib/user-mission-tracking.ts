import {
  loadUserRequestsForCurrentUser,
  resolveRequestOwnerSnapshot,
  type UserMissionRequest,
} from "@/lib/user-requests";

export const USER_MISSION_TRACKING_STORAGE_KEY =
  "aerolaminar_user_mission_tracking_v1";

export const USER_MISSION_TRACKING_UPDATED_EVENT =
  "aerolaminar-user-mission-tracking-updated";

const MAX_STORED = 50;

export type UserMissionTrackingRequestSnapshot = {
  requestRef: string;
  reasonOrTitle: string;
  pickupLocation: string;
  dropLocation: string;
  payloadWeightKg: string;
  requestType: string;
  requestPriority: string;
  createdAt: string;
  /** Present when only an assign-queue row existed (e.g. demo / inspect). */
  sectorLine?: string;
};

export type UserMissionTrackingUserStatus = "in_progress" | "completed";

export type UserMissionTrackingEntry = {
  id: string;
  assignedAt: string;
  /** `pilots.id` from the API (same as JWT `sub` for that pilot). */
  pilotSub: string;
  pilotName: string;
  /** License / badge string shown in admin UI. */
  pilotBadgeId: string;
  droneModel: string;
  /** Shown on the end-user User Tracking table. */
  userStatus?: UserMissionTrackingUserStatus;
  /**
   * When true, User Tracking does not show the live pilot mission comment for
   * this row (e.g. after admin reassigned pilot/drone via Update User Tracking).
   */
  hidePilotCommentInUserTracking?: boolean;
  ownerUserId?: string;
  ownerEmail?: string;
  request: UserMissionTrackingRequestSnapshot;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isRequestSnapshot(
  v: unknown
): v is UserMissionTrackingRequestSnapshot {
  if (!isRecord(v)) return false;
  const keys = [
    "requestRef",
    "reasonOrTitle",
    "pickupLocation",
    "dropLocation",
    "payloadWeightKg",
    "requestType",
    "requestPriority",
    "createdAt",
  ] as const;
  if (!keys.every((k) => typeof v[k] === "string")) return false;
  return (
    v.sectorLine === undefined || typeof v.sectorLine === "string"
  );
}

function isUserMissionTrackingEntry(
  v: unknown
): v is UserMissionTrackingEntry {
  if (!isRecord(v)) return false;
  const stringKeys = [
    "id",
    "assignedAt",
    "pilotSub",
    "pilotName",
    "pilotBadgeId",
    "droneModel",
  ] as const;
  if (!stringKeys.every((k) => typeof v[k] === "string")) return false;
  if (!isRequestSnapshot(v.request)) return false;
  if (
    v.userStatus !== undefined &&
    v.userStatus !== "in_progress" &&
    v.userStatus !== "completed"
  ) {
    return false;
  }
  if (
    v.ownerUserId !== undefined &&
    typeof v.ownerUserId !== "string"
  ) {
    return false;
  }
  if (
    v.ownerEmail !== undefined &&
    typeof v.ownerEmail !== "string"
  ) {
    return false;
  }
  if (
    v.hidePilotCommentInUserTracking !== undefined &&
    typeof v.hidePilotCommentInUserTracking !== "boolean"
  ) {
    return false;
  }
  return true;
}

export function loadUserMissionTrackingEntries(): UserMissionTrackingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_MISSION_TRACKING_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isUserMissionTrackingEntry);
  } catch {
    return [];
  }
}

/** Latest row for a request ref (current assignment for admin UI). */
export function getUserMissionTrackingEntryForRequest(
  requestRef: string
): UserMissionTrackingEntry | null {
  const norm = requestRef.trim();
  const matches = loadUserMissionTrackingEntries().filter(
    (e) => e.request.requestRef.trim() === norm
  );
  if (matches.length === 0) return null;
  return matches.sort(
    (a, b) =>
      new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  )[0]!;
}

function persist(rows: UserMissionTrackingEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      USER_MISSION_TRACKING_STORAGE_KEY,
      JSON.stringify(rows)
    );
  } catch {
    /* quota */
  }
}

function snapshotFromUserRequest(
  req: UserMissionRequest
): UserMissionTrackingRequestSnapshot {
  return {
    requestRef: req.id,
    reasonOrTitle: req.reasonOrTitle,
    pickupLocation: req.pickupLocation,
    dropLocation: req.dropLocation,
    payloadWeightKg: req.payloadWeightKg,
    requestType: req.requestType,
    requestPriority: req.requestPriority,
    createdAt: req.createdAt,
  };
}

/**
 * After admin confirms Assign Mission: store a snapshot so the end-user dashboard
 * can show pilot + request details (same browser / localStorage demo model).
 */
export function recordUserMissionAssignment(args: {
  requestRef: string;
  pilotSub: string;
  pilotName: string;
  pilotBadgeId: string;
  droneModel: string;
  /** Default `in_progress` so User Tracking shows an active mission. */
  userStatus?: UserMissionTrackingUserStatus;
  storedUserRequest: UserMissionRequest | undefined;
  assignRowFallback: {
    customer: string;
    service: string;
    dropoff: string;
    sectorLine: string;
  };
  /**
   * When true, end-user User Tracking hides the pilot comment for this row.
   * Also set automatically whenever this write replaces an existing tracking
   * row for the same request (pilot/drone update).
   */
  hidePilotCommentInUserTracking?: boolean;
}): void {
  if (typeof window === "undefined") return;

  const stored = args.storedUserRequest;
  const request: UserMissionTrackingRequestSnapshot = stored
    ? snapshotFromUserRequest(stored)
    : {
        requestRef: args.requestRef,
        reasonOrTitle: args.assignRowFallback.customer,
        pickupLocation: "—",
        dropLocation: args.assignRowFallback.dropoff,
        payloadWeightKg: "—",
        requestType: args.assignRowFallback.service,
        requestPriority: "—",
        createdAt: new Date().toISOString(),
        sectorLine: args.assignRowFallback.sectorLine,
      };

  const prev = loadUserMissionTrackingEntries();
  const norm = args.requestRef.trim();
  const hadExistingForRef = prev.some(
    (r) => r.request.requestRef.trim() === norm
  );
  const hideCommentForUser =
    hadExistingForRef || args.hidePilotCommentInUserTracking === true;

  const assignedAt = new Date().toISOString();
  const id = `${args.requestRef}:${assignedAt}`;

  const entry: UserMissionTrackingEntry = {
    id,
    assignedAt,
    pilotSub: args.pilotSub.trim(),
    pilotName: args.pilotName,
    pilotBadgeId: args.pilotBadgeId,
    droneModel: args.droneModel,
    userStatus: args.userStatus ?? "in_progress",
    hidePilotCommentInUserTracking: hideCommentForUser ? true : undefined,
    ownerUserId: stored?.ownerUserId?.trim() || undefined,
    ownerEmail: stored?.ownerEmail?.trim().toLowerCase() || undefined,
    request,
  };

  const base = prev.filter((r) => r.request.requestRef.trim() !== norm);

  const next = [entry, ...base].slice(0, MAX_STORED);
  persist(next);
  window.dispatchEvent(new Event(USER_MISSION_TRACKING_UPDATED_EVENT));
}

/**
 * Entries for the signed-in app user (same rules as “My Request”).
 */
export function loadUserMissionTrackingForCurrentUser(): UserMissionTrackingEntry[] {
  if (typeof window === "undefined") return [];

  const { ownerUserId: sub, ownerEmail: email } = resolveRequestOwnerSnapshot();
  if (!sub && !email) return [];

  const mineRequestIds = new Set<string>();
  for (const r of loadUserRequestsForCurrentUser()) {
    mineRequestIds.add(r.id);
    if (r.backendRequestId) mineRequestIds.add(r.backendRequestId);
  }

  const normEmail = email.trim().toLowerCase();

  return loadUserMissionTrackingEntries()
    .filter((e) => {
      const rid = String(e.ownerUserId ?? "").trim();
      const rem = String(e.ownerEmail ?? "").trim().toLowerCase();
      if (sub && rid && rid === sub) return true;
      if (normEmail && rem && rem === normEmail) return true;
      if (!rid && !rem && mineRequestIds.has(e.request.requestRef)) {
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      const refCmp = a.request.requestRef.localeCompare(b.request.requestRef);
      if (refCmp !== 0) return refCmp;
      return (
        new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime()
      );
    });
}
