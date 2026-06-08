import { isUserRequestCompletedDelivery, type UserRequestAdminRow } from "@/lib/user-requests";

/** Client id prefix for Post Your Requirement (`/post-your-requirement`). */
export const PROJECT_REQUEST_CLIENT_ID_PREFIX = "#PR-";

export const PROJECT_REQUESTS_UPDATED_EVENT =
  "aerolaminar-project-requests-updated";

export function isProjectRequirementRequest(
  clientRequestId: string | null | undefined
): boolean {
  const id = String(clientRequestId ?? "").trim();
  return id.startsWith(PROJECT_REQUEST_CLIENT_ID_PREFIX);
}

/** Splits `reason — Phone: …` written by Post Your Requirement. */
export function parseRequirementReasonWithPhone(reason: string): {
  title: string;
  phone: string | null;
} {
  const raw = reason.trim();
  const sep = " — Phone: ";
  const idx = raw.indexOf(sep);
  if (idx === -1) {
    return { title: raw, phone: null };
  }
  const title = raw.slice(0, idx).trim();
  const phone = raw.slice(idx + sep.length).trim();
  return {
    title: title || raw,
    phone: phone || null,
  };
}

/** Set automatically when a requirement is submitted via Post Your Requirement. */
export const DEFAULT_SUBMITTED_REQUIREMENT_STATUS = "Undereview" as const;

/** Admin-managed status for submitted project requirements. */
export const REQUIREMENT_STATUS_OPTIONS = [
  "Assigned",
  "Unassigned",
  "Undereview",
] as const;

export type RequirementStatus = (typeof REQUIREMENT_STATUS_OPTIONS)[number];

export function normalizeRequirementStatus(
  value: string
): RequirementStatus | null {
  const trimmed = value.trim();
  if (
    (REQUIREMENT_STATUS_OPTIONS as readonly string[]).includes(trimmed)
  ) {
    return trimmed as RequirementStatus;
  }
  const lower = trimmed.toLowerCase();
  if (
    lower === "under review" ||
    lower === "underreview" ||
    lower === "undereview" ||
    lower === "unreview"
  ) {
    return "Undereview";
  }
  return null;
}

export function resolveRequirementStatus(
  raw: string | null | undefined,
  clientRequestId?: string | null
): RequirementStatus | null {
  const normalized = normalizeRequirementStatus(String(raw ?? ""));
  if (normalized) return normalized;
  if (isProjectRequirementRequest(clientRequestId)) {
    return DEFAULT_SUBMITTED_REQUIREMENT_STATUS;
  }
  return null;
}

export function requirementStatusBadgeClass(
  status: RequirementStatus
): string {
  switch (status) {
    case "Assigned":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "Unassigned":
      return "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-200";
    case "Undereview":
      return "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
  }
}

export function notifyProjectRequestsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROJECT_REQUESTS_UPDATED_EVENT));
}

/** Project requirement rows that are fulfilled (admin or linked mission completed). */
export function isCompletedProjectRequest(row: {
  adminStatus?: string;
  missionStatus?: string | null;
}): boolean {
  return isUserRequestCompletedDelivery(row);
}

/** Mission `request_ref` for admin-assigned project requests (prefer `#PR-…`). */
export function projectRequestMissionRef(row: UserRequestAdminRow): string {
  const clientId = row.queueDisplayId?.trim();
  if (clientId) return clientId;
  return row.backendRequest?.id?.trim() || row.key.trim();
}

/** All refs that identify the same project request row in missions / tracking. */
export function projectRequestRefAliases(row: UserRequestAdminRow): string[] {
  const aliases = new Set<string>();
  for (const ref of [
    row.queueDisplayId,
    row.backendRequest?.id,
    row.key,
  ]) {
    const trimmed = String(ref ?? "").trim();
    if (trimmed) aliases.add(trimmed.toLowerCase());
  }
  return [...aliases];
}

