"use client";

import { MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import {
  USER_MISSION_TRACKING_STORAGE_KEY,
  USER_MISSION_TRACKING_UPDATED_EVENT,
  loadUserMissionTrackingForCurrentUser,
  type UserMissionTrackingEntry,
} from "@/lib/user-mission-tracking";
import { apiUrl } from "@/lib/api-url";
import { userRequestQueueDisplayId } from "@/lib/user-requests";
import {
  USER_DASH_DIVIDER_BORDER,
  USER_DASH_PANEL_BORDER,
  USER_DASH_TABLE,
  USER_DASH_TABLE_HEAD,
  USER_DASH_TABLE_TD,
  USER_DASH_TABLE_TH,
} from "@/lib/user-dashboard-styles";
import { cn } from "@/lib/utils";

const PILOT_MISSION_COMMENTS_KEY = "aerolaminar_pilot_mission_comments_v1";

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  express: "Express",
  standard: "Standard",
};

function formatPriority(value: string): string {
  if (!value?.trim()) return "—";
  const key = value.trim().toLowerCase();
  return priorityLabels[key] ?? value.trim();
}

function trackingStatusBadgeClass(statusLabel: string): string {
  if (statusLabel === "Completed") {
    return "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100";
  }
  return "bg-sky-50 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100";
}

function formatAssignedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function UserTrackingView() {
  const [entries, setEntries] = useState<UserMissionTrackingEntry[]>([]);
  const [commentsVersion, setCommentsVersion] = useState(0);
  const [pilotNameByPilotId, setPilotNameByPilotId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl("/api/pilots"));
        if (!res.ok || cancelled) return;
        const data: unknown = await res.json();
        if (!Array.isArray(data) || cancelled) return;
        const next: Record<string, string> = {};
        for (const row of data) {
          if (row == null || typeof row !== "object") continue;
          const rec = row as Record<string, unknown>;
          const id = String(rec.id ?? "").trim();
          const name = String(rec.name ?? "").trim();
          if (id && name) next[id] = name;
        }
        if (!cancelled) setPilotNameByPilotId(next);
      } catch {
        /* demo / offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let isUpdating = false;
    
    const sync = () => {
      if (isUpdating) return;
      isUpdating = true;
      setEntries(loadUserMissionTrackingForCurrentUser());
      setTimeout(() => { isUpdating = false; }, 100);
    };
    
    sync();
    
    const handleTrackingUpdate = () => {
      if (isUpdating) return;
      sync();
    };
    
    const onFocus = () => {
      if (isUpdating) return;
      setCommentsVersion((v) => v + 1);
    };
    
    const onStorage = (e: StorageEvent) => {
      if (isUpdating) return;
      if (e.key === USER_MISSION_TRACKING_STORAGE_KEY) {
        sync();
      }
      if (e.key === PILOT_MISSION_COMMENTS_KEY) {
        setCommentsVersion((v) => v + 1);
      }
    };
    
    window.addEventListener(USER_MISSION_TRACKING_UPDATED_EVENT, handleTrackingUpdate);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    
    return () => {
      window.removeEventListener(USER_MISSION_TRACKING_UPDATED_EVENT, handleTrackingUpdate);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <UserDashboardShell
      pageTitle="User Tracking"
      pageTitleClassName="text-xl sm:text-2xl"
      pageTitleBarClassName="text-xs"
    >
      <div className="space-y-6">
        {entries.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl bg-neutral-50/80 px-6 py-16 text-center dark:bg-white/[0.04]"
            )}
          >
            <MapPinned
              className="mb-4 size-12 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-base font-semibold text-foreground">
              No assigned missions yet
            </p>
            <p className="mt-2 max-w-md text-xs text-muted-foreground">
              When an admin assigns a pilot to your request from the dashboard,
              you&apos;ll see the pilot name and your request
              details here. Assignments are stored in this browser for demo
              use; use the same session where you submitted the request.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "overflow-hidden rounded-xl bg-card",
              USER_DASH_PANEL_BORDER
            )}
          >
            <div className="overflow-x-auto">
              <table className={USER_DASH_TABLE}>
                <colgroup>
                  <col className="w-[9rem]" />
                  <col className="w-[7rem]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className={USER_DASH_TABLE_HEAD}>
                  <tr className={USER_DASH_DIVIDER_BORDER}>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Assigned
                    </th>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Request ID
                    </th>
                    <th scope="col" className={USER_DASH_TABLE_TH}>
                      Pilot name
                    </th>
                    <th scope="col" className={USER_DASH_TABLE_TH}>
                      Title
                    </th>
                    <th scope="col" className={USER_DASH_TABLE_TH}>
                      Pickup
                    </th>
                    <th scope="col" className={USER_DASH_TABLE_TH}>
                      Drop-off
                    </th>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Type
                    </th>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Priority
                    </th>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const r = entry.request;
                    const displayReqId = userRequestQueueDisplayId(
                      r.requestRef
                    );
                    const sub = entry.pilotSub?.trim() ?? "";
                    const pilotDisplayName =
                      (sub && pilotNameByPilotId[sub]) ||
                      entry.pilotName?.trim() ||
                      "";
                    const statusLabel =
                      entry.userStatus === "completed" ||
                      r.adminStatus === "completed"
                        ? "Completed"
                        : "In progress";
                    return (
                      <tr
                        key={`${entry.id}-${commentsVersion}`}
                        className={cn(
                          USER_DASH_DIVIDER_BORDER,
                          "transition-colors last:border-b-0 hover:bg-neutral-50/80 dark:hover:bg-white/[0.03]"
                        )}
                      >
                        <td className={cn(USER_DASH_TABLE_TD, "whitespace-nowrap")}>
                          {formatAssignedAt(entry.assignedAt)}
                        </td>
                        <td className={cn(USER_DASH_TABLE_TD, "whitespace-nowrap")}>
                          <span className="font-mono tabular-nums">{displayReqId}</span>
                        </td>
                        <td className={cn(USER_DASH_TABLE_TD, "break-words font-medium")}>
                          {pilotDisplayName || "—"}
                        </td>
                        <td className={cn(USER_DASH_TABLE_TD, "break-words")}>
                          {r.reasonOrTitle?.trim() || "—"}
                        </td>
                        <td className={cn(USER_DASH_TABLE_TD, "break-words")}>
                          {r.pickupLocation?.trim() || "—"}
                        </td>
                        <td className={cn(USER_DASH_TABLE_TD, "break-words")}>
                          {r.dropLocation?.trim() || "—"}
                        </td>
                        <td className={cn(USER_DASH_TABLE_TD, "break-words")}>
                          {r.requestType?.trim() || "—"}
                        </td>
                        <td className={cn(USER_DASH_TABLE_TD, "whitespace-nowrap")}>
                          {formatPriority(r.requestPriority ?? "")}
                        </td>
                        <td className={cn(USER_DASH_TABLE_TD, "whitespace-nowrap")}>
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              trackingStatusBadgeClass(statusLabel)
                            )}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </UserDashboardShell>
  );
}
