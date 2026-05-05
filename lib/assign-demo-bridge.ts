import { parsePayloadAndTarget } from "@/components/dashboard/user-request-table";

import {
  findStoredUserRequestByAdminRef,
  loadAssignPilotRequestQueue,
  loadUserRequests,
  userMissionRequestToAssignPilotRow,
  type AssignPilotRequestRow,
  type UserRequestAdminRow,
} from "@/lib/user-requests";

export const DEMO_ASSIGN_BRIDGE_STORAGE_KEY =
  "aerolaminar_demo_accept_for_assign_v1";

/** Last request opened from User Request (any status); merged first into Assign queue for preview. */
export const ASSIGN_INSPECT_STORAGE_KEY = "aerolaminar_assign_inspect_request_v1";

/** Same-tab / cross-component refresh when demo accepts are written for Assign Pilot. */
export const DEMO_ASSIGN_BRIDGE_UPDATED_EVENT =
  "aerolaminar-demo-assign-bridge-updated";

/** Fired when the inspect row is set from User Request (opens Assign with that mission). */
export const ASSIGN_INSPECT_UPDATED_EVENT = "aerolaminar-assign-inspect-updated";

function isAssignPilotRequestRow(v: unknown): v is AssignPilotRequestRow {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.requestRef === "string" &&
    typeof o.customer === "string" &&
    typeof o.service === "string" &&
    typeof o.dropoff === "string" &&
    typeof o.sectorLine === "string"
  );
}

function serviceLabelFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("medical")) return "Medical";
  if (t.includes("industrial")) return "Industrial";
  if (t.includes("agricultural") || t.includes("mapping")) return "Survey";
  return "Delivery";
}

/** Build an assign-queue row from a built-in demo table row after admin accepts it. */
export function demoAdminRowToAssignPilotRow(m: UserRequestAdminRow): AssignPilotRequestRow {
  const { payload, target } = parsePayloadAndTarget(m.desc);
  const ref = m.key;
  return {
    id: ref,
    requestRef: ref,
    customer: m.title,
    service: serviceLabelFromTitle(m.title),
    dropoff: target,
    sectorLine: payload,
  };
}

/** Build assign-queue row from any User Request table row (stored mission, demo, or parse fallback). */
export function userRequestAdminRowToAssignPilotRow(
  m: UserRequestAdminRow
): AssignPilotRequestRow {
  if (m.key.startsWith("demo-")) {
    return demoAdminRowToAssignPilotRow(m);
  }
  const req = findStoredUserRequestByAdminRef(m.key);
  if (req) {
    return userMissionRequestToAssignPilotRow(req);
  }
  return demoAdminRowToAssignPilotRow(m);
}

export function loadAssignInspectRow(): AssignPilotRequestRow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ASSIGN_INSPECT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAssignPilotRequestRow(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAssignInspectRow(row: AssignPilotRequestRow): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ASSIGN_INSPECT_STORAGE_KEY, JSON.stringify(row));
  window.dispatchEvent(new Event(ASSIGN_INSPECT_UPDATED_EVENT));
}

export function loadDemoAcceptedForAssign(): AssignPilotRequestRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEMO_ASSIGN_BRIDGE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAssignPilotRequestRow);
  } catch {
    return [];
  }
}

export function upsertDemoAcceptedForAssign(row: AssignPilotRequestRow): void {
  if (typeof window === "undefined") return;
  const next = loadDemoAcceptedForAssign().filter(
    (r) => r.requestRef !== row.requestRef
  );
  next.push(row);
  localStorage.setItem(DEMO_ASSIGN_BRIDGE_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(DEMO_ASSIGN_BRIDGE_UPDATED_EVENT));
}

/** IDs/refs that may appear in assign tracking (real missions + demo bridge). */
export function assignQueueValidRefsForPrune(): Set<string> {
  const ids = new Set<string>();
  for (const r of loadUserRequests()) {
    ids.add(r.id);
    if (r.backendRequestId) ids.add(r.backendRequestId);
  }
  for (const d of loadDemoAcceptedForAssign()) {
    ids.add(d.requestRef);
  }
  const inspect = loadAssignInspectRow();
  if (inspect) ids.add(inspect.requestRef);
  return ids;
}

/** Inspect row (optional) + real accepted missions + built-in demo rows accepted for assignment. */
export function mergeAssignPilotDisplayQueue(): AssignPilotRequestRow[] {
  const inspect = loadAssignInspectRow();
  const real = loadAssignPilotRequestQueue();
  const demo = loadDemoAcceptedForAssign();
  const seen = new Set<string>();
  const out: AssignPilotRequestRow[] = [];
  if (inspect) {
    out.push(inspect);
    seen.add(inspect.requestRef);
  }
  for (const r of real) {
    if (!seen.has(r.requestRef)) {
      out.push(r);
      seen.add(r.requestRef);
    }
  }
  for (const d of demo) {
    if (!seen.has(d.requestRef)) {
      out.push(d);
      seen.add(d.requestRef);
    }
  }
  return out;
}
