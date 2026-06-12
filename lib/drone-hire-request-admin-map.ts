import {
  ADMIN_URGENCY_BADGE_CRITICAL,
  ADMIN_URGENCY_BADGE_NORMAL,
  ADMIN_URGENCY_BADGE_ROUTINE,
} from "@/lib/admin-dashboard-styles";
import {
  formatPostRequirementDesc,
  parsePostRequirementBackend,
} from "@/lib/post-requirement-parse";
import {
  isProjectRequirementRequest,
  parseRequirementReasonWithPhone,
  resolveRequirementStatus,
  type RequirementStatus,
} from "@/lib/project-requests";
import {
  normalizeUserMissionAdminStatus,
  type UserMissionAdminStatus,
  type UserRequestAdminRow,
} from "@/lib/user-requests";

export type BackendDroneHireRequestRow = {
  id?: number | string;
  reason_or_title?: string;
  pickup_location?: string;
  drop_location?: string;
  payload_weight?: number | string;
  cargo_type?: string;
  mission_urgency?: string;
  admin_status?: string;
  adminStatus?: string;
  mission_status?: string | null;
  missionStatus?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  client_request_id?: string | null;
  requirement_status?: string | null;
  requirementStatus?: string | null;
};

function pickBackendAdminStatus(
  r: BackendDroneHireRequestRow
): string | undefined {
  if (typeof r.admin_status === "string") return r.admin_status;
  if (typeof r.adminStatus === "string") return r.adminStatus;
  return undefined;
}

function pickBackendMissionStatus(
  r: BackendDroneHireRequestRow
): string | null | undefined {
  if (typeof r.mission_status === "string") return r.mission_status;
  if (typeof r.missionStatus === "string") return r.missionStatus;
  if (r.mission_status === null || r.missionStatus === null) return null;
  return undefined;
}

export function mapBackendRequestToAdminRow(
  r: BackendDroneHireRequestRow
): UserRequestAdminRow {
  const urgency = String(r.mission_urgency ?? "")
    .trim()
    .toLowerCase();
  let badge: UserRequestAdminRow["badge"] = "NORMAL";
  let badgeClass = ADMIN_URGENCY_BADGE_NORMAL;
  let barColor = "#006195";

  if (urgency === "critical" || urgency === "urgent") {
    badge = "CRITICAL";
    badgeClass = ADMIN_URGENCY_BADGE_CRITICAL;
    barColor = "#ba1a1a";
  } else if (urgency === "standard" || urgency === "routine") {
    badge = "ROUTINE";
    badgeClass = ADMIN_URGENCY_BADGE_ROUTINE;
    barColor = "#008B8B";
  }

  const payloadWeight = String(r.payload_weight ?? "").trim();
  const cargoType = String(r.cargo_type ?? "").trim();
  const pickupLocation = String(r.pickup_location ?? "").trim();
  const dropLocation = String(r.drop_location ?? "").trim();
  const clientRequestId = String(r.client_request_id ?? "").trim();
  const requirementStatus = resolveRequirementStatus(
    r.requirement_status ?? r.requirementStatus,
    clientRequestId
  );

  const reasonRaw = String(r.reason_or_title ?? "").trim();
  const isProjectReq = isProjectRequirementRequest(clientRequestId);
  const projectRequirement = isProjectReq
    ? parsePostRequirementBackend({
        reason_or_title: reasonRaw,
        pickup_location: pickupLocation,
        drop_location: dropLocation,
        cargo_type: cargoType,
        user_name: r.user_name,
        user_email: r.user_email,
      })
    : undefined;
  const { title: legacyTitle } = isProjectReq
    ? parseRequirementReasonWithPhone(reasonRaw)
    : { title: reasonRaw };
  const displayTitle =
    projectRequirement?.projectTitle.trim() || legacyTitle || "Mission request";

  return {
    key: String(r.id ?? `${Date.now()}-${Math.random()}`),
    queueDisplayId: isProjectReq ? clientRequestId : undefined,
    title: displayTitle,
    badge,
    badgeClass,
    barColor,
    desc: projectRequirement
      ? formatPostRequirementDesc(projectRequirement)
      : `Payload: ${cargoType || "General cargo"} (${payloadWeight || "0"}kg) | Target: ${
          dropLocation || pickupLocation || "—"
        }`,
    projectRequirement,
    adminStatus: normalizeUserMissionAdminStatus(pickBackendAdminStatus(r)),
    missionStatus: pickBackendMissionStatus(r) ?? null,
    userName: String(r.user_name ?? "").trim() || undefined,
    userEmail: String(r.user_email ?? "").trim().toLowerCase() || undefined,
    requirementStatus: requirementStatus ?? undefined,
    backendRequest: {
      id: String(r.id ?? ""),
      reasonOrTitle: reasonRaw,
      pickupLocation,
      dropLocation,
      payloadWeight,
      cargoType,
      missionUrgency: String(r.mission_urgency ?? "").trim() || "normal",
      adminStatus: normalizeUserMissionAdminStatus(
        pickBackendAdminStatus(r)
      ) as UserMissionAdminStatus,
      requirementStatus: (requirementStatus ??
        undefined) as RequirementStatus | undefined,
    },
  };
}
