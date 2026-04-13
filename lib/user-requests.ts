export const USER_REQUESTS_STORAGE_KEY = "aerolaminar_user_requests_v1";

/** Fired on same-document saves so UIs (e.g. Admin dashboard) can refresh without relying on `storage`. */
export const USER_REQUESTS_UPDATED_EVENT = "aerolaminar-user-requests-updated";

/** Admin review state for submissions (User Request queue). */
export type UserMissionAdminStatus = "pending" | "accepted" | "rejected";

export type UserMissionRequest = {
  id: string;
  createdAt: string;
  reasonOrTitle: string;
  pickupLocation: string;
  dropLocation: string;
  payloadWeightKg: string;
  requestType: string;
  requestPriority: string;
  adminStatus: UserMissionAdminStatus;
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
  if (raw === "accepted" || raw === "rejected" || raw === "pending") {
    return raw;
  }
  return "pending";
}

/** Short label for user-facing UI (dashboard activity, my requests). */
export function userMissionAdminStatusLabel(
  status: UserMissionAdminStatus
): string {
  switch (status) {
    case "pending":
      return "Pending admin review";
    case "accepted":
      return "Accepted by admin";
    case "rejected":
      return "Not accepted";
    default:
      return "Pending admin review";
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
      adminStatus: normalizeUserMissionAdminStatus(
        typeof r.adminStatus === "string" ? r.adminStatus : undefined
      ),
    }));
  } catch {
    return [];
  }
}

const RQ_DISPLAY_BASE = 4029;

/**
 * Display ref for stored submissions (e.g. `#RQ-4029`). Oldest by `createdAt` → 4029, next → 4030, …
 * Internal storage ids (`#UR-…`) are unchanged; this is for UI only.
 */
export function userRequestQueueDisplayId(id: string): string {
  const all = loadUserRequests();
  if (all.length === 0) {
    return id.startsWith("#") ? id : `#${id}`;
  }
  const sorted = [...all].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const idx = sorted.findIndex((r) => r.id === id);
  if (idx >= 0) return `#RQ-${RQ_DISPLAY_BASE + idx}`;
  return id.startsWith("#") ? id : `#${id}`;
}

export function saveUserRequests(requests: UserMissionRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
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
  const idx = all.findIndex((r) => r.id === id);
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
  const entry: UserMissionRequest = {
    ...payload,
    id,
    createdAt,
    adminStatus: "pending",
  };
  const all = loadUserRequests();
  saveUserRequests([entry, ...all]);
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
    badgeClass = "bg-[#d8e2ff] text-[#001a41]";
    barColor = "#0058bc";
  } else {
    badge = "NORMAL";
    badgeClass = "bg-[#cde5ff] text-[#001d32]";
    barColor = "#006195";
  }

  const title =
    req.reasonOrTitle.trim() ||
    (req.requestType ? `${req.requestType} request` : "Mission request");

  const payloadLabel = req.requestType
    ? `${req.requestType} cargo`
    : req.reasonOrTitle.trim() || "General cargo";

  const desc = `Payload: ${payloadLabel} (${req.payloadWeightKg || "0"}kg) | Target: ${
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
  };
}
