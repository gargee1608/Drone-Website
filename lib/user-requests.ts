import { jwtPayloadSub } from "@/lib/pilot-display-name";
import { readStoredUserSession } from "@/lib/user-session-browser";

export const USER_REQUESTS_STORAGE_KEY = "aerolaminar_user_requests_v1";

/** Fired on same-document saves so UIs (e.g. Admin dashboard) can refresh without relying on `storage`. */
export const USER_REQUESTS_UPDATED_EVENT = "aerolaminar-user-requests-updated";

/** Fired when a row is written to the `missions` table (e.g. after Assign To confirms). */
export const MISSIONS_DB_UPDATED_EVENT = "aerolaminar-missions-db-updated";

/** Cross-tab sync for mission DB changes (same origin). */
export const MISSIONS_DB_BROADCAST_CHANNEL = "aerolaminar-missions-db-broadcast";

/** Same-tab `MISSIONS_DB_UPDATED_EVENT` plus BroadcastChannel for other tabs/windows. */
export function notifyMissionsDbUpdated(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(MISSIONS_DB_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
  try {
    const bc = new BroadcastChannel(MISSIONS_DB_BROADCAST_CHANNEL);
    bc.postMessage({ type: "updated" });
    queueMicrotask(() => bc.close());
  } catch {
    /* ignore */
  }
}

/** Admin review + fulfillment (User Request queue). */
export type UserMissionAdminStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed";

export type UserMissionRequest = {
  id: string;
  createdAt: string;
  reasonOrTitle: string;
  pickupLocation: string;
  dropLocation: string;
  payloadWeightKg: string;
  requestType: string;
  requestPriority: string;
  /** Set when the row came from Marketplace “Add to inquiry”. */
  requestSource?: "marketplace_inquiry";
  adminStatus: UserMissionAdminStatus;
  /** `users.id` (JWT `sub`) when the row was created while signed in. */
  ownerUserId?: string;
  /** Lowercase email from session when the row was created. */
  ownerEmail?: string;
  /** `drone_hire_requests.id` when the row was also saved via `/api/submit-request`. */
  backendRequestId?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const USER_MISSION_STRING_KEYS = [
  "id",
  "createdAt",
  "reasonOrTitle",
  "pickupLocation",
  "dropLocation",
  "payloadWeightKg",
  "requestType",
  "requestPriority",
] as const;

function isRawUserMissionRequest(v: unknown): v is Record<string, unknown> {
  if (!isRecord(v)) return false;
  return USER_MISSION_STRING_KEYS.every((k) => typeof v[k] === "string");
}

export function normalizeUserMissionAdminStatus(
  raw: string | undefined
): UserMissionAdminStatus {
  if (
    raw === "accepted" ||
    raw === "rejected" ||
    raw === "pending" ||
    raw === "completed"
  ) {
    return raw;
  }
  return "pending";
}

/**
 * Same rule as the admin “Completed Deliveries” stat: fulfilled when
 * `adminStatus` is completed or latest mission status is completed (rejected rows excluded).
 */
export function isUserRequestCompletedDelivery(row: {
  adminStatus?: UserMissionAdminStatus | string;
  missionStatus?: string | null;
}): boolean {
  const s = normalizeUserMissionAdminStatus(
    typeof row.adminStatus === "string" ? row.adminStatus : undefined
  );
  if (s === "rejected") return false;
  const missionNorm = String(row.missionStatus ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return s === "completed" || missionNorm === "completed";
}

/** Short label for user-facing UI (dashboard activity, my requests). */
export function userMissionAdminStatusLabel(
  status: UserMissionAdminStatus
): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted by admin";
    case "rejected":
      return "Not accepted";
    case "completed":
      return "Completed";
    default:
      return "Pending";
  }
}

export function loadUserRequests(): UserMissionRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRawUserMissionRequest).map((r) => ({
      id: r.id as string,
      createdAt: r.createdAt as string,
      reasonOrTitle: r.reasonOrTitle as string,
      pickupLocation: r.pickupLocation as string,
      dropLocation: r.dropLocation as string,
      payloadWeightKg: r.payloadWeightKg as string,
      requestType: r.requestType as string,
      requestPriority: r.requestPriority as string,
      requestSource:
        r.requestSource === "marketplace_inquiry"
          ? "marketplace_inquiry"
          : undefined,
      adminStatus: normalizeUserMissionAdminStatus(
        typeof r.adminStatus === "string" ? r.adminStatus : undefined
      ),
      ownerUserId:
        typeof r.ownerUserId === "string" ? r.ownerUserId : undefined,
      ownerEmail:
        typeof r.ownerEmail === "string" ? r.ownerEmail : undefined,
      backendRequestId:
        typeof r.backendRequestId === "string"
          ? r.backendRequestId
          : undefined,
    }));
  } catch {
    return [];
  }
}

/** Match admin / assign-queue `requestRef` (local `#UR-…` or DB numeric id). */
export function findStoredUserRequestByAdminRef(
  ref: string
): UserMissionRequest | undefined {
  const trimmed = ref.trim();
  if (!trimmed) return undefined;
  return loadUserRequests().find(
    (r) => r.id === trimmed || r.backendRequestId === trimmed
  );
}

/** JWT `sub` + session email for attributing new rows to the signed-in app user. */
export function resolveRequestOwnerSnapshot(): {
  ownerUserId: string;
  ownerEmail: string;
} {
  if (typeof window === "undefined") {
    return { ownerUserId: "", ownerEmail: "" };
  }
  const session = readStoredUserSession();
  const token = localStorage.getItem("token") ?? "";
  const sub = String(jwtPayloadSub(token) ?? session?.id ?? "").trim();
  const email = String(session?.email ?? "")
    .trim()
    .toLowerCase();
  return { ownerUserId: sub, ownerEmail: email };
}

function requestHasOwnerTag(r: UserMissionRequest): boolean {
  return (
    String(r.ownerUserId ?? "").trim() !== "" ||
    String(r.ownerEmail ?? "").trim() !== ""
  );
}

function requestBelongsToSnapshot(
  r: UserMissionRequest,
  sub: string,
  email: string
): boolean {
  const rid = String(r.ownerUserId ?? "").trim();
  const rem = String(r.ownerEmail ?? "").trim().toLowerCase();
  if (sub && rid === sub) return true;
  if (email && rem === email) return true;
  return false;
}

/**
 * Older rows had no `ownerUserId` / `ownerEmail`. If the queue has no other user's
 * tagged requests, attach legacy rows to the signed-in user once and persist.
 */
function migrateLegacyUserRequestsIfNeeded(): void {
  if (typeof window === "undefined") return;
  const { ownerUserId: sub, ownerEmail: email } = resolveRequestOwnerSnapshot();
  if (!sub && !email) return;

  const all = loadUserRequests();
  const orphans = all.filter((r) => !requestHasOwnerTag(r));
  if (orphans.length === 0) return;

  const tagged = all.filter((r) => requestHasOwnerTag(r));
  const hasForeignTagged = tagged.some(
    (r) => !requestBelongsToSnapshot(r, sub, email)
  );
  if (hasForeignTagged) return;

  const next = all.map((r) => {
    if (requestHasOwnerTag(r)) return r;
    return {
      ...r,
      ownerUserId: sub || undefined,
      ownerEmail: email || undefined,
    };
  });
  saveUserRequests(next);
  window.dispatchEvent(new Event(USER_REQUESTS_UPDATED_EVENT));
}

/**
 * Requests created by the current browser user (JWT `sub` and/or session email).
 * Legacy untagged rows are migrated to this user when safe (see `migrateLegacyUserRequestsIfNeeded`).
 */
export function loadUserRequestsForCurrentUser(): UserMissionRequest[] {
  if (typeof window !== "undefined") {
    migrateLegacyUserRequestsIfNeeded();
  }
  const all = loadUserRequests();
  if (typeof window === "undefined") return all;

  const { ownerUserId: sub, ownerEmail: email } = resolveRequestOwnerSnapshot();
  if (!sub && !email) {
    return [];
  }

  return all.filter((r) => {
    const rid = String(r.ownerUserId ?? "").trim();
    const rem = String(r.ownerEmail ?? "").trim().toLowerCase();
    if (!rid && !rem) return false;
    if (sub && rid && rid === sub) return true;
    if (email && rem && rem === email) return true;
    return false;
  });
}

const RQ_DISPLAY_BASE = 4029;

/**
 * Display ref for stored submissions (e.g. `#RQ-4029`). Oldest by `createdAt` → 4029, next → 4030, …
 * Internal storage ids (`#UR-…`) are unchanged; this is for UI only.
 */
export function userRequestQueueDisplayId(id: string): string {
  const all = loadUserRequests();
  return userRequestQueueDisplayIdInList(id, all);
}

/** Display ref `#RQ-…` using ordering within the given list (e.g. current user’s requests only). */
export function userRequestQueueDisplayIdInList(
  id: string,
  list: UserMissionRequest[]
): string {
  if (list.length === 0) {
    return id.startsWith("#") ? id : `#${id}`;
  }
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const idx = sorted.findIndex(
    (r) => r.id === id || r.backendRequestId === id
  );
  if (idx >= 0) return `#RQ-${RQ_DISPLAY_BASE + idx}`;
  return id.startsWith("#") ? id : `#${id}`;
}

export function saveUserRequests(requests: UserMissionRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
}

/**
 * Keeps one marketplace inquiry per product title (`reasonOrTitle`), preferring the newest
 * `createdAt`. Other rows are dropped (same array order preserved for survivors).
 */
export function dedupeMarketplaceInquiries(
  requests: UserMissionRequest[]
): UserMissionRequest[] {
  const bestByTitle = new Map<string, UserMissionRequest>();
  for (const r of requests) {
    if (r.requestSource !== "marketplace_inquiry") continue;
    const key = r.reasonOrTitle.trim().toLowerCase();
    const cur = bestByTitle.get(key);
    if (
      !cur ||
      new Date(r.createdAt).getTime() > new Date(cur.createdAt).getTime()
    ) {
      bestByTitle.set(key, r);
    }
  }
  const keptIds = new Set(
    [...bestByTitle.values()].map((r) => r.id)
  );
  return requests.filter((r) => {
    if (r.requestSource !== "marketplace_inquiry") return true;
    return keptIds.has(r.id);
  });
}

/** Persists deduped marketplace rows if anything was removed. */
export function pruneDuplicateMarketplaceInquiries(): void {
  if (typeof window === "undefined") return;
  const all = loadUserRequests();
  const next = dedupeMarketplaceInquiries(all);
  if (next.length === all.length) return;
  saveUserRequests(next);
  window.dispatchEvent(new Event(USER_REQUESTS_UPDATED_EVENT));
}

/** Removes a stored mission request (e.g. after admin reject or accept clearing the queue). */
export function removeUserRequestById(id: string): void {
  const all = loadUserRequests();
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return;
  saveUserRequests(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_REQUESTS_UPDATED_EVENT));
  }
}

export function updateUserRequestAdminStatus(
  id: string,
  adminStatus: UserMissionAdminStatus
): void {
  const all = loadUserRequests();
  const idx = all.findIndex(
    (r) => r.id === id || r.backendRequestId === id
  );
  if (idx < 0) return;
  all[idx] = { ...all[idx], adminStatus };
  saveUserRequests(all);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_REQUESTS_UPDATED_EVENT));
  }
}

export function appendUserRequest(
  payload: Omit<UserMissionRequest, "id" | "createdAt" | "adminStatus">
): UserMissionRequest {
  const id = `#UR-${Date.now().toString(36).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const owner = resolveRequestOwnerSnapshot();
  const entry: UserMissionRequest = {
    ...payload,
    ownerUserId: owner.ownerUserId || payload.ownerUserId,
    ownerEmail: owner.ownerEmail || payload.ownerEmail,
    id,
    createdAt,
    adminStatus: "pending",
  };
  const all = loadUserRequests();
  let rest = all;
  if (payload.requestSource === "marketplace_inquiry") {
    const key = payload.reasonOrTitle.trim().toLowerCase();
    rest = all.filter(
      (r) =>
        !(
          r.requestSource === "marketplace_inquiry" &&
          r.reasonOrTitle.trim().toLowerCase() === key
        )
    );
  }
  saveUserRequests([entry, ...rest]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_REQUESTS_UPDATED_EVENT));
  }
  return entry;
}

/** Same storage as `/dashboard/user-requests` (submissions from create request). */
export type AssignPilotRequestRow = {
  id: string;
  requestRef: string;
  customer: string;
  service: string;
  dropoff: string;
  sectorLine: string;
};

export function userMissionRequestToAssignPilotRow(
  req: UserMissionRequest
): AssignPilotRequestRow {
  const pickup = req.pickupLocation.trim();
  const priority = req.requestPriority.trim();
  const weight = req.payloadWeightKg.trim();
  const sectorParts = [
    pickup && `Pickup: ${pickup}`,
    weight && `${weight} kg`,
    priority && `Priority: ${priority}`,
  ].filter(Boolean);

  return {
    id: req.id,
    requestRef: req.id,
    customer: req.reasonOrTitle.trim() || "—",
    service: req.requestType.trim() || "—",
    dropoff: req.dropLocation.trim() || "—",
    sectorLine: sectorParts.length > 0 ? sectorParts.join(" · ") : "—",
  };
}

/**
 * Admin-accepted missions only (FIFO by submission time), for Assign Pilot & Drone.
 * Pending review and rejected requests are excluded.
 */
export function loadAssignPilotRequestQueue(): AssignPilotRequestRow[] {
  return [...loadUserRequests()]
    .filter((r) => r.adminStatus === "accepted")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map(userMissionRequestToAssignPilotRow);
}

/** Row shape for Admin Dashboard “User Request” list (matches command center UI). */
export type UserRequestAdminRow = {
  key: string;
  title: string;
  badge: "CRITICAL" | "NORMAL" | "ROUTINE";
  badgeClass: string;
  barColor: string;
  desc: string;
  /** Present for real stored submissions (not demo rows). */
  adminStatus?: UserMissionAdminStatus;
  /** Marketplace “Additional Inquire” rows only. */
  requestSource?: "marketplace_inquiry";
  /** Latest `missions.status` from DB for this request (`/api/requests` join), when present. */
  missionStatus?: string | null;
};

export function mapUserRequestToAdminRow(
  req: UserMissionRequest
): UserRequestAdminRow {
  const p = req.requestPriority.toLowerCase();
  let badge: UserRequestAdminRow["badge"];
  let badgeClass: string;
  let barColor: string;
  if (p === "urgent") {
    badge = "CRITICAL";
    badgeClass = "bg-[#ffdad6] text-[#93000a]";
    barColor = "#ba1a1a";
  } else if (p === "standard") {
    badge = "ROUTINE";
    badgeClass = "bg-[#008B8B]/14 text-[#0a3030]";
    barColor = "#008B8B";
  } else {
    badge = "NORMAL";
    badgeClass = "bg-[#cde5ff] text-[#001d32]";
    barColor = "#006195";
  }

  const baseTitle =
    req.reasonOrTitle.trim() ||
    (req.requestType ? `${req.requestType} request` : "Mission request");

  const title =
    req.requestSource === "marketplace_inquiry"
      ? `Additional Inquire · ${baseTitle}`
      : baseTitle;

  const payloadLabel = req.requestType
    ? `${req.requestType} cargo`
    : req.reasonOrTitle.trim() || "General cargo";

  const desc =
    req.requestSource === "marketplace_inquiry"
      ? `Marketplace inquiry | ${req.reasonOrTitle.trim() || "—"} · ${
          req.payloadWeightKg || "0"
        } kg | Target: ${req.dropLocation.trim() || "TBC"}`
      : `Payload: ${payloadLabel} (${req.payloadWeightKg || "0"}kg) | Target: ${
          req.dropLocation.trim() || "—"
        }`;

  return {
    key: req.id,
    title,
    badge,
    badgeClass,
    barColor,
    desc,
    adminStatus: req.adminStatus,
    requestSource: req.requestSource,
  };
}
