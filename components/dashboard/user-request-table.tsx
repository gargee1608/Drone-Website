"use client";

import {
  Building2,
  Eye,
  Map,
  Package,
  Pencil,
  ShoppingBag,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { COMPLETED_ASSIGNMENTS_UPDATED_EVENT } from "@/lib/completed-assignments";
import {
  loadUserRequests,
  MISSIONS_DB_UPDATED_EVENT,
  type UserRequestAdminRow,
  resolveRequestOwnerDisplay,
  userRequestQueueDisplayId,
  USER_REQUESTS_UPDATED_EVENT,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

import { parsePostRequirementDesc } from "@/lib/post-requirement-parse";

import { USER_REQUEST_DEMO_MISSIONS } from "./user-request-demos";

function projectTableCells(m: UserRequestAdminRow): {
  purpose: string;
  location: string;
  duration: string;
} {
  const p = m.projectRequirement;
  if (p) {
    return {
      purpose: p.purposeOfProject.trim() || "—",
      location: p.preferredLocation.trim() || "—",
      duration: p.expectedDuration.trim() || "—",
    };
  }
  const parsed = parsePostRequirementDesc(m.desc);
  return parsed;
}

export function parsePayloadAndTarget(desc: string): {
  payload: string;
  target: string;
} {
  const marketplace = desc.match(
    /^Marketplace inquiry \| .+? · ([\d.]+)\s*kg \| Target:\s*(.+)$/i
  );
  if (marketplace) {
    return {
      payload: `${marketplace[1]} kg`,
      target: marketplace[2].trim(),
    };
  }
  const m = desc.match(/Payload:\s*([^|]+?)\s*\|\s*Target:\s*(.+)/i);
  if (m) {
    return { payload: m[1].trim(), target: m[2].trim() };
  }
  return { payload: desc.trim() || "—", target: "—" };
}

export function extractPayloadWeightDisplay(payloadPart: string): string {
  const w = payloadPart.match(/([\d.]+)\s*kg/i);
  if (w) return `${w[1]} kg`;
  return payloadPart;
}

export function tableRequestId(m: UserRequestAdminRow): string {
  if (m.queueDisplayId?.trim()) {
    return m.queueDisplayId.trim();
  }
  if (!m.key.startsWith("demo-")) {
    return userRequestQueueDisplayId(m.key);
  }
  const title = m.key.slice("demo-".length);
  const idx = USER_REQUEST_DEMO_MISSIONS.findIndex((x) => x.title === title);
  const n = idx >= 0 ? 4029 + idx : 4029;
  return `#RQ-${n}`;
}

export function requirementTypeIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("additional inquire")) {
    return ShoppingBag;
  }
  if (t.includes("medical")) {
    return Stethoscope;
  }
  if (t.includes("industrial")) {
    return Building2;
  }
  if (t.includes("agricultural") || t.includes("mapping")) {
    return Map;
  }
  return Package;
}

function pilotTableCells(m: UserRequestAdminRow): {
  userId: string;
  userName: string;
  userRequirement: string;
  payload: string;
  destinations: string;
} {
  const parsed = parsePayloadAndTarget(m.desc);
  const weightFromDesc = extractPayloadWeightDisplay(parsed.payload);
  const apiUserName = m.userName?.trim();

  if (m.key.startsWith("demo-")) {
    return {
      userId: tableRequestId(m),
      userName: "—",
      userRequirement: m.title,
      payload: weightFromDesc,
      destinations:
        parsed.target.trim() && parsed.target !== "—"
          ? parsed.target.trim()
          : "—",
    };
  }

  const req = loadUserRequests().find((r) => r.id === m.key);
  if (!req) {
    const owner = resolveRequestOwnerDisplay(m.key);
    return {
      userId: tableRequestId(m),
      userName: apiUserName || owner.userName,
      userRequirement: m.title,
      payload: weightFromDesc,
      destinations:
        parsed.target.trim() && parsed.target !== "—"
          ? parsed.target.trim()
          : "—",
    };
  }

  const pickup = req.pickupLocation.trim();
  const drop = req.dropLocation.trim();
  const destinations =
    pickup && drop
      ? `${pickup} → ${drop}`
      : drop || pickup || "—";

  const reqLabel = req.requestType.trim();
  const reason = req.reasonOrTitle.trim();
  const userRequirement = reqLabel
    ? reason
      ? `${reqLabel} · ${reason}`
      : reqLabel
    : reason || m.title;

  const w = req.payloadWeightKg.trim();
  const payload = w ? `${w} kg` : weightFromDesc;

  const owner = resolveRequestOwnerDisplay(req.id);
  return {
    userId: userRequestQueueDisplayId(req.id),
    userName: apiUserName || owner.userName,
    userRequirement,
    payload,
    destinations,
  };
}

type AdminStatusLabel =
  | "Pending Request"
  | "In process"
  | "Completed"
  | "Rejected";

/** Matches User Request stat cards + admin table body typography. */
const ADMIN_TABLE_TEXT =
  "text-[10px] font-medium leading-tight text-foreground sm:text-[11px]";

function urgencyBadgeLabel(badge: UserRequestAdminRow["badge"]): string {
  if (badge === "CRITICAL") return "Critical";
  if (badge === "NORMAL") return "Normal";
  return "Routine";
}

/** Map `missions.status` from Postgres to table UI. */
function displayFromMissionDb(raw: string): {
  label: AdminStatusLabel;
  pillClassName: string;
} | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (!s) return null;
  if (s === "completed") {
    return {
      label: "Completed",
      pillClassName: "bg-green-100 text-green-800",
    };
  }
  if (s === "in_progress" || s === "assigned" || s === "active") {
    return {
      label: "In process",
      pillClassName: "bg-amber-100 text-amber-800",
    };
  }
  if (s === "pending") {
    return {
      label: "Pending Request",
      pillClassName: "bg-amber-100 text-amber-800",
    };
  }
  if (s === "rejected" || s === "cancelled" || s === "canceled") {
    return {
      label: "Rejected",
      pillClassName: "bg-red-100 text-red-800",
    };
  }
  return null;
}

/** Status column: latest row in `missions` only (`/api/requests` → `mission_status`). */
function statusDisplayForAdminRow(m: UserRequestAdminRow): {
  label: AdminStatusLabel | string;
  pillClassName: string;
} {
  const missionRaw =
    typeof m.missionStatus === "string" ? m.missionStatus.trim() : "";
  if (missionRaw) {
    const fromMission = displayFromMissionDb(missionRaw);
    if (fromMission) return fromMission;
    return {
      label: missionRaw,
      pillClassName: "bg-slate-100 text-slate-700",
    };
  }

  return {
    label: "Pending Request",
    pillClassName: "bg-amber-100 text-amber-800",
  };
}

export type UserRequestTableProps = {
  rows: UserRequestAdminRow[];
  /** Opens detail view (e.g. modal). If omitted, the View button is inert. */
  onViewDetails?: (row: UserRequestAdminRow) => void;
  /** Opens the admin edit form for editable backend rows. */
  onEditRequest?: (row: UserRequestAdminRow) => void;
  /** Deletes editable backend rows. */
  onDeleteRequest?: (row: UserRequestAdminRow) => void;
  /** Optional title override (default: "User Request"). */
  title?: string;
  /** Show the title heading inside the card (default true). */
  showTitle?: boolean;
  /** Show count subtitle under title. */
  showTotalSubtitle?: boolean;
  /** Drop outer card border/shadow (Project Requests page). */
  omitOuterBorder?: boolean;
  /** Pilot dashboard: User Id, User Name, User Requirement, Payload, Destinations. */
  columnPreset?: "admin" | "pilot" | "project";
};

export function UserRequestTable({
  rows,
  onViewDetails,
  onEditRequest,
  onDeleteRequest,
  title = "User Request",
  showTitle = true,
  showTotalSubtitle = false,
  omitOuterBorder = false,
  columnPreset = "admin",
}: UserRequestTableProps) {
  const isPilot = columnPreset === "pilot";
  const isProject = columnPreset === "project";
  const isAdmin = columnPreset === "admin";
  /** Project Requests table matches stat-card typography (same as admin). */
  const compactTableText = isAdmin || isProject;
  const [statusSync, setStatusSync] = useState(0);

  useEffect(() => {
    const bump = () => setStatusSync((n) => n + 1);
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, bump);
    window.addEventListener(COMPLETED_ASSIGNMENTS_UPDATED_EVENT, bump);
    window.addEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    return () => {
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, bump);
      window.removeEventListener(COMPLETED_ASSIGNMENTS_UPDATED_EVENT, bump);
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    };
  }, []);

  const thBase = compactTableText
    ? "whitespace-nowrap px-5 py-4 text-left align-middle text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]"
    : "whitespace-nowrap px-5 py-4 text-left align-middle text-sm font-semibold text-slate-700";
  const thActions = compactTableText
    ? "whitespace-nowrap px-5 py-4 text-center align-middle text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]"
    : "whitespace-nowrap px-5 py-4 text-center align-middle text-sm font-semibold text-slate-700";
  const thCenter = compactTableText
    ? "whitespace-nowrap px-5 py-4 text-center align-middle text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]"
    : "whitespace-nowrap px-5 py-4 text-center align-middle text-sm font-semibold text-slate-700";
  const tdBase = compactTableText
    ? cn("min-w-0 px-5 py-4 align-middle text-left", ADMIN_TABLE_TEXT)
    : "min-w-0 px-5 py-4 align-middle text-left text-sm text-slate-600";
  const tdActions = compactTableText
    ? cn("min-w-0 px-5 py-4 align-middle text-center", ADMIN_TABLE_TEXT)
    : "min-w-0 px-5 py-4 align-middle text-center text-sm";
  const tdCenter = compactTableText
    ? cn("min-w-0 px-5 py-4 align-middle text-center", ADMIN_TABLE_TEXT)
    : "min-w-0 px-5 py-4 align-middle text-center text-sm text-slate-600";

  return (
    <div
      className={cn(
        omitOuterBorder
          ? ""
          : "rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      )}
      data-status-sync={statusSync}
    >
      {showTitle ? (
        <h2
          className={cn(
            "text-xl font-bold text-foreground",
            showTotalSubtitle ? "mb-2" : "mb-6 sm:mb-8"
          )}
        >
          {title}
        </h2>
      ) : null}
      {showTotalSubtitle ? (
        <p
          className={cn(
            "text-[13px] font-medium text-muted-foreground",
            showTitle ? "mb-6 sm:mb-8" : "mb-6 font-semibold text-foreground sm:mb-8"
          )}
        >
          Total {rows.length} request{rows.length === 1 ? "" : "s"}
        </p>
      ) : null}
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
          isPilot || isProject ? "overflow-x-auto" : ""
        )}
      >
        <table
          className={cn(
            "w-full table-fixed border-collapse",
            isPilot && "min-w-[640px]",
            isProject && "min-w-[52rem]"
          )}
        >
          {isPilot ? (
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[25%]" />
              <col className="w-[12%]" />
              <col className="w-[38%]" />
            </colgroup>
          ) : isProject ? (
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
            </colgroup>
          ) : (
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[20%]" />
              <col className="w-[10%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[15%]" />
              <col className="w-[16%]" />
            </colgroup>
          )}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {isPilot ? (
                <>
                  <th scope="col" className={thBase}>
                    User Id
                  </th>
                  <th scope="col" className={thBase}>
                    User Name
                  </th>
                  <th scope="col" className={thBase}>
                    User Requirement
                  </th>
                  <th scope="col" className={cn(thBase, "tabular-nums")}>
                    Payload
                  </th>
                  <th scope="col" className={thBase}>
                    Destinations
                  </th>
                </>
              ) : isProject ? (
                <>
                  <th scope="col" className={thBase}>
                    Request ID
                  </th>
                  <th scope="col" className={thBase}>
                    Project title
                  </th>
                  <th scope="col" className={thBase}>
                    Purpose
                  </th>
                  <th scope="col" className={thBase}>
                    Location
                  </th>
                  <th scope="col" className={thBase}>
                    Duration
                  </th>
                  <th scope="col" className={thCenter}>
                    Status
                  </th>
                  <th scope="col" className={thActions}>
                    Actions
                  </th>
                </>
              ) : (
                <>
                  <th scope="col" className={thBase}>
                    Request ID
                  </th>
                  <th scope="col" className={thCenter}>
                    Requirement type
                  </th>
                  <th scope="col" className={cn(thBase, "tabular-nums")}>
                    Payload
                  </th>
                  <th scope="col" className={thBase}>
                    Destination
                  </th>
                  <th scope="col" className={thBase}>
                    Urgency
                  </th>
                  <th scope="col" className={thCenter}>
                    Status
                  </th>
                  <th scope="col" className={thActions}>
                    Actions
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const { payload, target } = parsePayloadAndTarget(m.desc);
              const weightDisplay = extractPayloadWeightDisplay(payload);
              const ReqIcon = requirementTypeIcon(m.title);
              const highlightRow = m.title === "Industrial Part Delivery";
              const pilotCells = isPilot ? pilotTableCells(m) : null;
              const projectCells = isProject ? projectTableCells(m) : null;
              const adminStatusUi =
                !isPilot ? statusDisplayForAdminRow(m) : null;

              if (isPilot && pilotCells) {
                return (
                  <tr
                    key={m.key}
                    className={cn(
                      "border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60",
                      highlightRow && "bg-[#008B8B]/8 hover:bg-[#008B8B]/12"
                    )}
                  >
                    <td className={tdBase}>
                      <span
                        className="inline-block max-w-full font-mono text-sm font-medium leading-snug tracking-tight text-slate-500 [overflow-wrap:anywhere]"
                        title={pilotCells.userId}
                      >
                        {pilotCells.userId}
                      </span>
                    </td>
                    <td className={tdBase}>
                      <span className="block break-words font-medium text-slate-900">
                        {pilotCells.userName}
                      </span>
                    </td>
                    <td className={tdBase}>
                      {onViewDetails ? (
                        <button
                          type="button"
                          className="flex min-w-0 w-full cursor-pointer items-center gap-2 rounded-md py-0.5 text-left outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-[#008B8B]/40"
                          aria-label={`View request details: ${pilotCells.userRequirement}`}
                          onClick={() => onViewDetails(m)}
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/8 text-[#008B8B]">
                            <ReqIcon className="size-3 shrink-0" aria-hidden />
                          </span>
                          <span className="min-w-0 break-words leading-snug font-medium text-foreground underline-offset-2 hover:underline">
                            {pilotCells.userRequirement}
                          </span>
                        </button>
                      ) : (
                        <div className="flex min-w-0 items-center gap-2 py-0.5">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/8 text-[#008B8B]">
                            <ReqIcon className="size-3 shrink-0" aria-hidden />
                          </span>
                          <span className="min-w-0 break-words leading-snug font-medium text-foreground">
                            {pilotCells.userRequirement}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className={cn(tdBase, "tabular-nums")}>
                      <span className="block max-w-full break-words">
                        {pilotCells.payload}
                      </span>
                    </td>
                    <td className={tdBase}>
                      <div className="break-words font-medium text-slate-900">
                        {pilotCells.destinations}
                      </div>
                    </td>
                  </tr>
                );
              }

              if (isProject && projectCells) {
                return (
                  <tr
                    key={m.key}
                    className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60"
                  >
                    <td className={tdBase}>
                      <span
                        className="inline-block max-w-full font-mono text-[10px] font-medium leading-tight tracking-tight text-muted-foreground [overflow-wrap:anywhere] sm:text-[11px]"
                        title={tableRequestId(m)}
                      >
                        {tableRequestId(m)}
                      </span>
                    </td>
                    <td className={tdBase}>
                      {onViewDetails ? (
                        <button
                          type="button"
                          className="group flex min-w-0 w-full cursor-pointer items-center gap-2 rounded-md py-0.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#008B8B]/40"
                          aria-label={`View project request: ${m.title}`}
                          onClick={() => onViewDetails(m)}
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/15 text-[#008B8B]">
                            <ReqIcon className="size-3 shrink-0" aria-hidden />
                          </span>
                          <span
                            className={cn(
                              "min-w-0 break-words text-[#006767] underline decoration-[#008B8B]/35 underline-offset-2 transition-colors group-hover:text-[#005a5a] group-hover:decoration-[#008B8B]/70 dark:text-primary dark:group-hover:text-primary",
                              ADMIN_TABLE_TEXT
                            )}
                          >
                            {m.title}
                          </span>
                        </button>
                      ) : (
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/8 text-[#008B8B]">
                            <ReqIcon className="size-3 shrink-0" aria-hidden />
                          </span>
                          <span className={cn("min-w-0 break-words", ADMIN_TABLE_TEXT)}>
                            {m.title}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className={tdBase}>
                      <span className="break-words">{projectCells.purpose}</span>
                    </td>
                    <td className={tdBase}>
                      <span className="break-words">{projectCells.location}</span>
                    </td>
                    <td className={tdBase}>
                      <span className="break-words">{projectCells.duration}</span>
                    </td>
                    <td className={tdCenter}>
                      {adminStatusUi ? (
                        <span
                          className={cn(
                            "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-0.5",
                            ADMIN_TABLE_TEXT,
                            adminStatusUi.pillClassName
                          )}
                        >
                          {adminStatusUi.label}
                        </span>
                      ) : null}
                    </td>
                    <td className={tdActions}>
                      {onViewDetails || onEditRequest || onDeleteRequest ? (
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {onViewDetails ? (
                            <button
                              type="button"
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#008B8B]/35 bg-[#008B8B]/8 text-[#006767] transition-colors hover:bg-[#008B8B]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/40 dark:text-primary"
                              title="View"
                              aria-label={`View: ${m.title}`}
                              onClick={() => onViewDetails(m)}
                            >
                              <Eye className="size-3.5 shrink-0" aria-hidden />
                              <span className="sr-only">View</span>
                            </button>
                          ) : null}
                          {onEditRequest ? (
                            <button
                              type="button"
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/8 text-blue-700 transition-colors hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:text-blue-300"
                              title="Edit"
                              aria-label={`Edit: ${m.title}`}
                              onClick={() => onEditRequest(m)}
                            >
                              <Pencil className="size-3.5 shrink-0" aria-hidden />
                              <span className="sr-only">Edit</span>
                            </button>
                          ) : null}
                          {onDeleteRequest ? (
                            <button
                              type="button"
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/8 text-red-700 transition-colors hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 dark:text-red-300"
                              title="Delete"
                              aria-label={`Delete: ${m.title}`}
                              onClick={() => onDeleteRequest(m)}
                            >
                              <Trash2 className="size-3.5 shrink-0" aria-hidden />
                              <span className="sr-only">Delete</span>
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={m.key}
                  className={cn(
                    "border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60",
                    highlightRow && "bg-[#008B8B]/8 hover:bg-[#008B8B]/12"
                  )}
                >
                  <td className={tdBase}>
                    <span
                      className="inline-block max-w-full font-mono text-[10px] font-medium leading-tight tracking-tight text-muted-foreground [overflow-wrap:anywhere] sm:text-[11px]"
                      title={tableRequestId(m)}
                    >
                      {tableRequestId(m)}
                    </span>
                  </td>
                  <td className={tdCenter}>
                    {onViewDetails ? (
                      <button
                        type="button"
                        className="group inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md py-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#008B8B]/40"
                        title="Opens this request on the Assign To page"
                        aria-label={`Open Assign To for request: ${m.title}`}
                        onClick={() => onViewDetails(m)}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/15 text-[#008B8B] transition-colors group-hover:bg-[#008B8B]/25 dark:text-primary">
                          <ReqIcon className="size-3 shrink-0" aria-hidden />
                        </span>
                        <span
                          className={cn(
                            "min-w-0 break-words text-[#006767] underline decoration-[#008B8B]/35 underline-offset-2 transition-colors group-hover:text-[#005a5a] group-hover:decoration-[#008B8B]/70 dark:text-primary dark:group-hover:text-primary",
                            ADMIN_TABLE_TEXT
                          )}
                        >
                          {m.title}
                        </span>
                      </button>
                    ) : (
                      <div className="inline-flex min-w-0 items-center justify-center gap-2 py-0.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/8 text-[#008B8B]">
                          <ReqIcon className="size-3 shrink-0" aria-hidden />
                        </span>
                        <span className={cn("min-w-0 break-words", ADMIN_TABLE_TEXT)}>
                          {m.title}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className={cn(tdBase, "tabular-nums")}>
                    <span className="block max-w-full break-words">
                      {weightDisplay}
                    </span>
                  </td>
                  <td className={tdBase}>
                    <div className="break-words">{target}</div>
                    <div className="mt-1 break-words text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
                      {payload.replace(/\s*\([^)]*kg\)\s*/i, "").trim() || "—"}
                    </div>
                  </td>
                  <td className={tdBase}>
                    <span
                      className={cn(
                        "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-0.5 normal-case",
                        ADMIN_TABLE_TEXT,
                        m.badgeClass
                      )}
                    >
                      {urgencyBadgeLabel(m.badge)}
                    </span>
                  </td>
                  <td className={tdCenter}>
                    {adminStatusUi ? (
                      <span
                        className={cn(
                          "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-0.5",
                          ADMIN_TABLE_TEXT,
                          adminStatusUi.pillClassName
                        )}
                      >
                        {adminStatusUi.label}
                      </span>
                    ) : null}
                  </td>
                  <td className={tdActions}>
                    {onViewDetails || onEditRequest || onDeleteRequest ? (
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {onViewDetails ? (
                          <button
                            type="button"
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#008B8B]/35 bg-[#008B8B]/8 text-[#006767] transition-colors hover:bg-[#008B8B]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/40 dark:text-primary"
                            title="View"
                            aria-label={`View request details: ${m.title}`}
                            onClick={() => onViewDetails(m)}
                          >
                            <Eye className="size-3.5 shrink-0" aria-hidden />
                            <span className="sr-only">View</span>
                          </button>
                        ) : null}
                        {onEditRequest ? (
                          <button
                            type="button"
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/8 text-blue-700 transition-colors hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:text-blue-300"
                            title="Edit"
                            aria-label={`Edit request: ${m.title}`}
                            onClick={() => onEditRequest(m)}
                          >
                            <Pencil className="size-3.5 shrink-0" aria-hidden />
                            <span className="sr-only">Edit</span>
                          </button>
                        ) : null}
                        {onDeleteRequest ? (
                          <button
                            type="button"
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/8 text-red-700 transition-colors hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 dark:text-red-300"
                            title="Delete"
                            aria-label={`Delete request: ${m.title}`}
                            onClick={() => onDeleteRequest(m)}
                          >
                            <Trash2 className="size-3.5 shrink-0" aria-hidden />
                            <span className="sr-only">Delete</span>
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
