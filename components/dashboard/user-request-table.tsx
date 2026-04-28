"use client";

import {
  Building2,
  Map,
  Package,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";

import {
  loadUserRequests,
  type UserMissionAdminStatus,
  type UserRequestAdminRow,
  userRequestQueueDisplayId,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

import { USER_REQUEST_DEMO_MISSIONS } from "./user-request-demos";

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

type RequestRowStatusLabel =
  | "Pending"
  | "Accepted"
  | "Rejected";

function statusLabelForAdminStatus(
  s: UserMissionAdminStatus
): RequestRowStatusLabel {
  switch (s) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
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

  return {
    userId: userRequestQueueDisplayId(req.id),
    userName: "—",
    userRequirement,
    payload,
    destinations,
  };
}

function statusDisplayForRow(m: UserRequestAdminRow): {
  label: RequestRowStatusLabel;
  dotClass: string;
  textClass: string;
} {
  if (m.adminStatus !== undefined) {
    const label = statusLabelForAdminStatus(m.adminStatus);
    if (label === "Pending") {
      return {
        label,
        dotClass: "bg-muted-foreground/50",
        textClass: "text-muted-foreground",
      };
    }
    if (label === "Accepted") {
      return {
        label,
        dotClass: "bg-emerald-600",
        textClass: "text-emerald-700",
      };
    }
    return {
      label: "Rejected",
      dotClass: "bg-red-500",
      textClass: "text-red-700",
    };
  }
  return {
    label: "Pending",
    dotClass: "bg-muted-foreground/50",
    textClass: "text-muted-foreground",
  };
}

export type UserRequestTableProps = {
  rows: UserRequestAdminRow[];
  /** Opens detail view (e.g. modal). If omitted, the View button is inert. */
  onViewDetails?: (row: UserRequestAdminRow) => void;
  /** Accept action (e.g. clear from queue). If omitted, Accept is disabled. */
  onAcceptRow?: (row: UserRequestAdminRow) => void;
  /** Reject action (e.g. remove request). If omitted, Reject is disabled. */
  onRejectRow?: (row: UserRequestAdminRow) => void;
  /** Edit action for admin table rows. */
  onEditRow?: (row: UserRequestAdminRow) => void;
  /** Delete action for admin table rows. */
  onDeleteRow?: (row: UserRequestAdminRow) => void;
  /** Optional title override (default: "User Request"). */
  title?: string;
  /** Show the title heading inside the card (default true). */
  showTitle?: boolean;
  /** Show count subtitle under title. */
  showTotalSubtitle?: boolean;
  /** Pilot dashboard: User Id, User Name, User Requirement, Payload, Destinations (+ Status). */
  columnPreset?: "admin" | "pilot";
};

export function UserRequestTable({
  rows,
  onViewDetails,
  onEditRow,
  onDeleteRow,
  title = "User Request",
  showTitle = true,
  showTotalSubtitle = false,
  columnPreset = "admin",
}: UserRequestTableProps) {
  const isPilot = columnPreset === "pilot";

  const thBase =
    "px-3 py-3 align-middle text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-4 sm:py-3.5 sm:text-[10px] sm:tracking-wider";
  const tdBase =
    "min-w-0 px-3 py-3 align-middle text-foreground sm:px-4 sm:py-3.5";

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
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
          "rounded-xl border border-border/90",
          isPilot ? "overflow-x-auto" : "overflow-hidden"
        )}
      >
        <table
          className={cn(
            "w-full table-fixed border-collapse text-left text-[10px] leading-snug sm:text-[11px]",
            isPilot && "min-w-[720px]"
          )}
        >
          {isPilot ? (
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[22%]" />
              <col className="w-[10%]" />
              <col className="w-[30%]" />
              <col className="w-[15%]" />
            </colgroup>
          ) : (
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[24%]" />
              <col className="w-[9%]" />
              <col className="w-[21%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
            </colgroup>
          )}
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {isPilot ? (
                <>
                  <th scope="col" className={cn(thBase, "text-left")}>
                    User Id
                  </th>
                  <th scope="col" className={cn(thBase, "text-left")}>
                    User Name
                  </th>
                  <th scope="col" className={cn(thBase, "text-left")}>
                    User Requirement
                  </th>
                  <th scope="col" className={cn(thBase, "text-right tabular-nums")}>
                    Payload
                  </th>
                  <th scope="col" className={cn(thBase, "text-left")}>
                    Destinations
                  </th>
                  <th scope="col" className={cn(thBase, "text-center")}>
                    Status
                  </th>
                </>
              ) : (
                <>
                  <th scope="col" className={cn(thBase, "text-left")}>
                    Request ID
                  </th>
                  <th scope="col" className={cn(thBase, "text-left")}>
                    Requirement type
                  </th>
                  <th scope="col" className={cn(thBase, "text-right tabular-nums")}>
                    Payload
                  </th>
                  <th scope="col" className={cn(thBase, "text-left")}>
                    Destination
                  </th>
                  <th scope="col" className={cn(thBase, "text-center")}>
                    Urgency
                  </th>
                  <th scope="col" className={cn(thBase, "text-center")}>
                    Status
                  </th>
                  <th scope="col" className={cn(thBase, "text-center")}>
                    Action
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
              const statusUi = statusDisplayForRow(m);
              const highlightRow = m.title === "Industrial Part Delivery";
              const pilotCells = isPilot ? pilotTableCells(m) : null;

              if (isPilot && pilotCells) {
                return (
                  <tr
                    key={m.key}
                    className={cn(
                      "border-b border-border transition-colors last:border-0 hover:bg-muted/50",
                      highlightRow && "bg-[#008B8B]/8 hover:bg-[#008B8B]/12"
                    )}
                  >
                    <td className={cn(tdBase, "text-left")}>
                      <span
                        className="inline-block max-w-full font-mono text-[10px] font-medium leading-snug tracking-tight text-muted-foreground [overflow-wrap:anywhere] sm:text-[11px]"
                        title={pilotCells.userId}
                      >
                        {pilotCells.userId}
                      </span>
                    </td>
                    <td className={cn(tdBase, "text-left")}>
                      <span className="block break-words leading-snug">
                        {pilotCells.userName}
                      </span>
                    </td>
                    <td className={cn(tdBase, "text-left")}>
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
                    <td className={cn(tdBase, "text-right tabular-nums")}>
                      <span className="inline-block w-full break-words leading-snug">
                        {pilotCells.payload}
                      </span>
                    </td>
                    <td className={cn(tdBase, "text-left")}>
                      <div className="break-words leading-snug font-medium">
                        {pilotCells.destinations}
                      </div>
                    </td>
                    <td className={cn(tdBase, "text-center")}>
                      <span
                        className={cn(
                          "inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 text-[9px] font-medium leading-snug sm:text-[10px]",
                          statusUi.textClass
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            statusUi.dotClass
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 break-words">{statusUi.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={m.key}
                  className={cn(
                    "border-b border-border transition-colors last:border-0 hover:bg-muted/50",
                    highlightRow && "bg-[#008B8B]/8 hover:bg-[#008B8B]/12"
                  )}
                >
                  <td className={cn(tdBase, "text-left")}>
                    <span
                      className="inline-block max-w-full font-mono text-[10px] font-medium leading-snug tracking-tight text-muted-foreground [overflow-wrap:anywhere] sm:text-[11px]"
                      title={tableRequestId(m)}
                    >
                      {tableRequestId(m)}
                    </span>
                  </td>
                  <td className={cn(tdBase, "text-left")}>
                    {onViewDetails ? (
                      <button
                        type="button"
                        className="flex min-w-0 w-full cursor-pointer items-center gap-2 rounded-md py-0.5 text-left outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-[#008B8B]/40"
                        aria-label={`View request details: ${m.title}`}
                        onClick={() => onViewDetails(m)}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/8 text-[#008B8B]">
                          <ReqIcon className="size-3 shrink-0" aria-hidden />
                        </span>
                        <span className="min-w-0 break-words leading-snug font-medium text-foreground underline-offset-2 hover:underline">
                          {m.title}
                        </span>
                      </button>
                    ) : (
                      <div className="flex min-w-0 items-center gap-2 py-0.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/8 text-[#008B8B]">
                          <ReqIcon className="size-3 shrink-0" aria-hidden />
                        </span>
                        <span className="min-w-0 break-words leading-snug font-medium text-foreground">
                          {m.title}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className={cn(tdBase, "text-right tabular-nums")}>
                    <span className="inline-block w-full break-words leading-snug">
                      {weightDisplay}
                    </span>
                  </td>
                  <td className={cn(tdBase, "text-left")}>
                    <div className="break-words leading-snug font-medium">{target}</div>
                    <div className="mt-1 break-words text-[8px] leading-snug text-muted-foreground sm:text-[9px]">
                      {payload.replace(/\s*\([^)]*kg\)\s*/i, "").trim() || "—"}
                    </div>
                  </td>
                  <td className={cn(tdBase, "text-center")}>
                    <span
                      className={cn(
                        "inline-flex max-w-full items-center justify-center rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide sm:text-[9px]",
                        m.badgeClass
                      )}
                    >
                      {m.badge}
                    </span>
                  </td>
                  <td className={cn(tdBase, "text-center")}>
                    <span
                      className={cn(
                        "inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 text-[9px] font-medium leading-snug sm:text-[10px]",
                        statusUi.textClass
                      )}
                    >
                      <span
                        className={cn("size-1.5 shrink-0 rounded-full", statusUi.dotClass)}
                        aria-hidden
                      />
                      <span className="min-w-0 break-words">{statusUi.label}</span>
                    </span>
                  </td>
                  <td className={cn(tdBase, "text-center")}>
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditRow?.(m)}
                        disabled={!onEditRow}
                        className="rounded border border-[#008B8B] px-2 py-1 text-[9px] font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10 disabled:cursor-not-allowed disabled:opacity-45 sm:text-[10px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRow?.(m)}
                        disabled={!onDeleteRow}
                        className="rounded border border-red-600 px-2 py-1 text-[9px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45 sm:text-[10px]"
                      >
                        Delete
                      </button>
                    </div>
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
