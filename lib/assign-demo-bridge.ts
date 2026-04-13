import { parsePayloadAndTarget } from "@/components/dashboard/user-request-table";

import {
  loadAssignPilotRequestQueue,
  loadUserRequests,
  type AssignPilotRequestRow,
  type UserRequestAdminRow,
} from "@/lib/user-requests";

export const DEMO_ASSIGN_BRIDGE_STORAGE_KEY =
  "aerolaminar_demo_accept_for_assign_v1";

/** Same-tab / cross-component refresh when demo accepts are written for Assign Pilot. */
export const DEMO_ASSIGN_BRIDGE_UPDATED_EVENT =
  "aerolaminar-demo-assign-bridge-updated";

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
  const ids = new Set(loadUserRequests().map((r) => r.id));
  for (const d of loadDemoAcceptedForAssign()) {
    ids.add(d.requestRef);
  }
  return ids;
}

/** Real accepted missions + built-in demo rows accepted for assignment. */
export function mergeAssignPilotDisplayQueue(): AssignPilotRequestRow[] {
  const real = loadAssignPilotRequestQueue();
  const demo = loadDemoAcceptedForAssign();
  const seen = new Set(real.map((r) => r.requestRef));
  const out = [...real];
  for (const d of demo) {
    if (!seen.has(d.requestRef)) {
      out.push(d);
      seen.add(d.requestRef);
    }
  }
  return out;
}
