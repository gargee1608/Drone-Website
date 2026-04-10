export const USER_REQUESTS_STORAGE_KEY = "aerolaminar_user_requests_v1";

/** Fired on same-document saves so UIs (e.g. Admin dashboard) can refresh without relying on `storage`. */
export const USER_REQUESTS_UPDATED_EVENT = "aerolaminar-user-requests-updated";

export type UserMissionRequest = {
  id: string;
  createdAt: string;
  reasonOrTitle: string;
  pickupLocation: string;
  dropLocation: string;
  payloadWeightKg: string;
  requestType: string;
  requestPriority: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isUserMissionRequest(v: unknown): v is UserMissionRequest {
  if (!isRecord(v)) return false;
  const strings = [
    "id",
    "createdAt",
    "reasonOrTitle",
    "pickupLocation",
    "dropLocation",
    "payloadWeightKg",
    "requestType",
    "requestPriority",
  ] as const;
  return strings.every((k) => typeof v[k] === "string");
}

export function loadUserRequests(): UserMissionRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isUserMissionRequest);
  } catch {
    return [];
  }
}

export function saveUserRequests(requests: UserMissionRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
}

export function appendUserRequest(
  payload: Omit<UserMissionRequest, "id" | "createdAt">
): UserMissionRequest {
  const id = `#UR-${Date.now().toString(36).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const entry: UserMissionRequest = { ...payload, id, createdAt };
  const all = loadUserRequests();
  saveUserRequests([entry, ...all]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_REQUESTS_UPDATED_EVENT));
  }
  return entry;
}

/** Row shape for Admin Dashboard “User Request” list (matches command center UI). */
export type UserRequestAdminRow = {
  key: string;
  title: string;
  badge: "CRITICAL" | "NORMAL" | "ROUTINE";
  badgeClass: string;
  barColor: string;
  desc: string;
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
  };
}
