"use client";

import {
  Building2,
  Check,
  Eye,
  Map,
  Package,
  ShoppingBag,
  Stethoscope,
  X,
} from "lucide-react";

import {
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
  /** Optional title override (default: "User Request"). */
  title?: string;
  /** Show the title heading inside the card (default true). */
  showTitle?: boolean;
  /** Show count subtitle under title. */
  showTotalSubtitle?: boolean;
};

export function UserRequestTable({
  rows,
  onViewDetails,
  onAcceptRow,
  onRejectRow,
  title = "User Request",
  showTitle = true,
  showTotalSubtitle = false,
}: UserRequestTableProps) {
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
      <div className="overflow-hidden rounded-xl border border-border/90">
        <table className="w-full table-fixed border-collapse text-left text-[10px] leading-snug sm:text-[11px]">
          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[23%]" />
            <col className="w-[8%]" />
            <col className="w-[21%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/60">
              <th
                scope="col"
                className="px-2 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3.5 sm:text-[10px] sm:tracking-wider"
              >
                Request ID
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3.5 sm:text-[10px] sm:tracking-wider"
              >
                Requirement type
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3.5 sm:text-[10px] sm:tracking-wider"
              >
                Payload
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3.5 sm:text-[10px] sm:tracking-wider"
              >
                Destination
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3.5 sm:text-[10px] sm:tracking-wider"
              >
                Urgency
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3.5 sm:text-[10px] sm:tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3.5 sm:text-[10px] sm:tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const { payload, target } = parsePayloadAndTarget(m.desc);
              const weightDisplay = extractPayloadWeightDisplay(payload);
              const ReqIcon = requirementTypeIcon(m.title);
              const statusUi = statusDisplayForRow(m);
              const reviewComplete =
                m.adminStatus === "accepted" || m.adminStatus === "rejected";
              const highlightRow = m.title === "Industrial Part Delivery";
              return (
                <tr
                  key={m.key}
                  className={cn(
                    "border-b border-border transition-colors last:border-0 hover:bg-muted/50",
                    highlightRow && "bg-[#008B8B]/8 hover:bg-[#008B8B]/12"
                  )}
                >
                  <td className="min-w-0 px-2 py-2.5 align-top sm:px-3 sm:py-3">
                    <span
                      className="inline-block max-w-full font-mono text-[10px] font-medium leading-tight tracking-tight text-muted-foreground [overflow-wrap:anywhere] sm:text-[11px]"
                      title={tableRequestId(m)}
                    >
                      {tableRequestId(m)}
                    </span>
                  </td>
                  <td className="min-w-0 px-2 py-2.5 align-top sm:px-3 sm:py-3">
                    {onViewDetails ? (
                      <button
                        type="button"
                        className="flex min-w-0 w-full cursor-pointer items-start gap-1.5 rounded-md text-left outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-[#008B8B]/40 sm:gap-2"
                        aria-label={`View request details: ${m.title}`}
                        onClick={() => onViewDetails(m)}
                      >
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/8 text-[#008B8B]">
                          <ReqIcon className="size-3 shrink-0" aria-hidden />
                        </span>
                        <span className="min-w-0 break-words font-medium leading-tight text-foreground underline-offset-2 hover:underline">
                          {m.title}
                        </span>
                      </button>
                    ) : (
                      <div className="flex min-w-0 items-start gap-1.5 sm:gap-2">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/8 text-[#008B8B]">
                          <ReqIcon className="size-3 shrink-0" aria-hidden />
                        </span>
                        <span className="min-w-0 break-words font-medium leading-tight text-foreground">
                          {m.title}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="min-w-0 px-2 py-2.5 align-top text-right tabular-nums text-foreground sm:px-3 sm:py-3">
                    <span className="inline-block break-words">{weightDisplay}</span>
                  </td>
                  <td className="min-w-0 px-2 py-2.5 align-top sm:px-3 sm:py-3">
                    <div className="break-words font-medium leading-tight text-foreground">
                      {target}
                    </div>
                    <div className="mt-0.5 break-words text-[8px] leading-snug text-muted-foreground sm:text-[9px]">
                      {payload.replace(/\s*\([^)]*kg\)\s*/i, "").trim() || "—"}
                    </div>
                  </td>
                  <td className="min-w-0 px-2 py-2.5 align-top sm:px-3 sm:py-3">
                    <div className="flex justify-center">
                      <span
                        className={cn(
                          "inline-flex max-w-full items-center justify-center rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide sm:text-[9px]",
                          m.badgeClass
                        )}
                      >
                        {m.badge}
                      </span>
                    </div>
                  </td>
                  <td className="min-w-0 px-2 py-2.5 align-top sm:px-3 sm:py-3">
                    <div className="flex justify-center">
                      <span
                        className={cn(
                          "inline-flex min-w-0 items-center justify-center gap-1 text-[9px] font-medium leading-tight sm:text-[10px]",
                          statusUi.textClass
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full sm:size-1.5",
                            statusUi.dotClass
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 break-words">{statusUi.label}</span>
                      </span>
                    </div>
                  </td>
                  <td className="min-w-0 px-2 py-2.5 align-middle sm:px-3 sm:py-3">
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                      <button
                        type="button"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/15 text-[#008B8B] transition-colors hover:bg-[#008B8B]/25 disabled:pointer-events-none disabled:opacity-40"
                        aria-label={`Accept request ${tableRequestId(m)}`}
                        disabled={!onAcceptRow || reviewComplete}
                        onClick={() => onAcceptRow?.(m)}
                      >
                        <Check className="size-[15px]" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:pointer-events-none disabled:opacity-40"
                        aria-label={`Reject request ${tableRequestId(m)}`}
                        disabled={!onRejectRow || reviewComplete}
                        onClick={() => onRejectRow?.(m)}
                      >
                        <X className="size-[15px]" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-50"
                        aria-label="View details"
                        disabled={!onViewDetails}
                        onClick={() => onViewDetails?.(m)}
                      >
                        <Eye className="size-[15px]" strokeWidth={2} />
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
