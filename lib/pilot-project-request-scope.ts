import { apiUrl } from "@/lib/api-url";
import type { BackendDroneHireRequestRow } from "@/lib/drone-hire-request-admin-map";
import {
  jwtPayloadPilotFullName,
  jwtPayloadSub,
} from "@/lib/pilot-display-name";
import { getUserMissionTrackingEntryForRequest } from "@/lib/user-mission-tracking";
import {
  isCompletedProjectRequest,
  isProjectRequirementRequest,
  projectRequestRefAliases,
} from "@/lib/project-requests";
import {
  findStoredUserRequestByAdminRef,
  normalizeUserMissionAdminStatus,
  type UserRequestAdminRow,
} from "@/lib/user-requests";

export type PilotMissionRow = {
  request_ref?: string;
  status?: string;
};

function normalizeMissionRef(ref: string): string {
  return ref.trim().toLowerCase();
}

export function expandMissionRefsFromRequests(
  missionRefs: Iterable<string>,
  hireRows: BackendDroneHireRequestRow[]
): Set<string> {
  const expanded = new Set<string>();
  const byId = new Map<string, BackendDroneHireRequestRow>();
  const byClientId = new Map<string, BackendDroneHireRequestRow>();

  for (const row of hireRows) {
    const id = String(row.id ?? "").trim().toLowerCase();
    const clientId = String(row.client_request_id ?? "").trim().toLowerCase();
    if (id) byId.set(id, row);
    if (clientId) byClientId.set(clientId, row);
  }

  for (const rawRef of missionRefs) {
    const ref = normalizeMissionRef(rawRef);
    if (!ref) continue;
    expanded.add(ref);

    const hire = byId.get(ref) ?? byClientId.get(ref);
    if (hire) {
      const id = String(hire.id ?? "").trim().toLowerCase();
      const clientId = String(hire.client_request_id ?? "").trim().toLowerCase();
      if (id) expanded.add(id);
      if (clientId) expanded.add(clientId);
    }
  }

  return expanded;
}

export function rowMatchesPilotMissions(
  row: UserRequestAdminRow,
  pilotMissionRefs: Set<string>
): boolean {
  return projectRequestRefAliases(row).some((alias) => {
    if (pilotMissionRefs.has(alias)) return true;
    const stored = findStoredUserRequestByAdminRef(alias);
    const storedAliases = [stored?.backendRequestId, stored?.id]
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean);
    return storedAliases.some((storedAlias) => pilotMissionRefs.has(storedAlias));
  });
}

export function rowMatchesPilotTracking(
  row: UserRequestAdminRow,
  pilotSub: string | null
): boolean {
  if (!pilotSub) return false;
  return projectRequestRefAliases(row).some((alias) => {
    const tracking = getUserMissionTrackingEntryForRequest(alias);
    return tracking?.pilotSub?.trim() === pilotSub;
  });
}

export function filterPilotAssignedProjectRows(
  rows: UserRequestAdminRow[],
  pilotMissionRefs: Set<string> | null,
  pilotSub: string | null
): UserRequestAdminRow[] {
  if (!pilotMissionRefs) return [];
  return rows.filter(
    (row) =>
      rowMatchesPilotMissions(row, pilotMissionRefs) ||
      rowMatchesPilotTracking(row, pilotSub)
  );
}

export function computeProjectRequestStats(rows: UserRequestAdminRow[]) {
  let pending = 0;
  let activeAssigned = 0;
  let completedDeliveries = 0;
  for (const row of rows) {
    const s = normalizeUserMissionAdminStatus(
      typeof row.adminStatus === "string" ? row.adminStatus : undefined
    );
    const delivered = isCompletedProjectRequest(row);

    if (s === "rejected") {
      /* excluded from workflow buckets; still in total */
    } else if (delivered) {
      completedDeliveries += 1;
    } else if (s === "accepted") {
      activeAssigned += 1;
    } else {
      pending += 1;
    }
  }
  return {
    total: rows.length,
    pending,
    activeAssigned,
    completedDeliveries,
  };
}

export async function fetchPilotProjectMissionRefs(): Promise<{
  pilotSub: string | null;
  refs: Set<string>;
}> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const pilotSub = token ? jwtPayloadSub(token) : null;
  const pilotName = token ? jwtPayloadPilotFullName(token) : null;
  const nameTrim = pilotName?.trim() || "";

  if (!pilotSub && !nameTrim) {
    return { pilotSub, refs: new Set() };
  }

  const pendingUrl =
    pilotSub != null && pilotSub !== ""
      ? apiUrl(
          `/api/missions/pending-assignments?pilotSub=${encodeURIComponent(pilotSub)}`
        )
      : null;

  const [missionsRes, pendingRes, requestsRes] = await Promise.all([
    fetch(
      apiUrl(
        `/api/missions?pilotSub=${encodeURIComponent(pilotSub ?? "")}&pilotName=${encodeURIComponent(nameTrim)}`
      ),
      { cache: "no-store" }
    ),
    pendingUrl
      ? fetch(pendingUrl, { cache: "no-store" })
      : Promise.resolve(null),
    fetch(apiUrl("/api/requests"), { cache: "no-store" }),
  ]);

  if (!missionsRes.ok) {
    return { pilotSub, refs: new Set() };
  }

  const payload: unknown = await missionsRes.json();
  const completedList = Array.isArray((payload as { data?: unknown[] })?.data)
    ? ((payload as { data?: unknown[] }).data as PilotMissionRow[])
    : [];

  let pendingList: PilotMissionRow[] = [];
  if (pendingRes?.ok) {
    const pendingPayload: unknown = await pendingRes.json();
    pendingList = Array.isArray((pendingPayload as { data?: unknown[] })?.data)
      ? ((pendingPayload as { data?: unknown[] }).data as PilotMissionRow[])
      : [];
  }

  const projectMissionRefs = [...completedList, ...pendingList]
    .map((row) => String(row.request_ref ?? "").trim())
    .filter((ref) => isProjectRequirementRequest(ref));

  let hireRows: BackendDroneHireRequestRow[] = [];
  if (requestsRes.ok) {
    const requestsPayload: unknown = await requestsRes.json();
    hireRows = Array.isArray((requestsPayload as { data?: unknown[] })?.data)
      ? ((requestsPayload as { data?: unknown[] }).data as BackendDroneHireRequestRow[])
      : [];
  }

  return {
    pilotSub,
    refs: expandMissionRefsFromRequests(projectMissionRefs, hireRows),
  };
}
