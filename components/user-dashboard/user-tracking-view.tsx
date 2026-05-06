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
import { pilotMissionCommentForDisplay } from "@/lib/pilot-mission-comment-display";
import { userRequestQueueDisplayId } from "@/lib/user-requests";

const PILOT_MISSION_COMMENTS_KEY = "aerolaminar_pilot_mission_comments_v1";

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

function readPilotMissionComment(requestRef: string): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(PILOT_MISSION_COMMENTS_KEY);
    if (!raw) return "";
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return "";
    const row = (parsed as Record<string, unknown>)[requestRef.trim()];
    if (row && typeof row === "object" && "text" in row) {
      const text = (row as { text?: unknown }).text;
      return typeof text === "string" ? text.trim() : "";
    }
    if (typeof row === "string") return row.trim();
    return "";
  } catch {
    return "";
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
    const sync = () => setEntries(loadUserMissionTrackingForCurrentUser());
    sync();
    window.addEventListener(USER_MISSION_TRACKING_UPDATED_EVENT, sync);
    const onFocus = () => setCommentsVersion((v) => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_MISSION_TRACKING_STORAGE_KEY) sync();
      if (e.key === PILOT_MISSION_COMMENTS_KEY) {
        setCommentsVersion((v) => v + 1);
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(USER_MISSION_TRACKING_UPDATED_EVENT, sync);
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c1c6d7] bg-white px-6 py-16 text-center dark:border-[#c1c6d7] dark:bg-white">
            <MapPinned
              className="mb-4 size-12 text-[#c1c6d7] dark:text-[#c1c6d7]"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-base font-semibold text-[#191c1d] dark:text-[#191c1d]">
              No assigned missions yet
            </p>
            <p className="mt-2 max-w-md text-xs text-[#414755] dark:text-[#414755]">
              When an admin assigns a pilot to your request from the dashboard,
              you&apos;ll see the pilot name and your request
              details here. Assignments are stored in this browser for demo
              use; use the same session where you submitted the request.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#c1c6d7]/15 bg-white shadow-sm dark:border-[#c1c6d7]/25 dark:bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[7.5rem]" />
                  <col className="w-[6.5rem]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[8%]" />
                  <col className="w-[7.5%]" />
                  <col className="w-[7.5%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead className="bg-[#f3f4f5]/85 dark:bg-[#f3f4f5]/85">
                  <tr className="border-b border-[#edeeef] dark:border-[#edeeef]">
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Assigned
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Request ID
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Pilot name
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Title
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Pickup
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Drop-off
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Type
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Priority
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-[#4d5b7f]">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const r = entry.request;
                    const displayReqId = userRequestQueueDisplayId(
                      r.requestRef
                    );
                    const liveComment = readPilotMissionComment(r.requestRef);
                    const liveForDisplay =
                      pilotMissionCommentForDisplay(liveComment);
                    const comment =
                      entry.hidePilotCommentInUserTracking === true
                        ? ""
                        : liveForDisplay;
                    const sub = entry.pilotSub?.trim() ?? "";
                    const pilotDisplayName =
                      (sub && pilotNameByPilotId[sub]) ||
                      entry.pilotName?.trim() ||
                      "";
                    const statusLabel =
                      entry.userStatus === "completed"
                        ? "Completed"
                        : "In progress";
                    return (
                      <tr
                        key={`${entry.id}-${commentsVersion}`}
                        className="border-b border-[#edeeef] last:border-b-0 dark:border-[#edeeef]"
                      >
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-[#191c1d] dark:text-[#191c1d]">
                          {formatAssignedAt(entry.assignedAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-[#191c1d] dark:text-[#191c1d]">
                          <span className="font-mono">{displayReqId}</span>
                        </td>
                        <td className="px-3 py-3 text-xs font-medium break-words text-[#191c1d] dark:text-[#191c1d]">
                          {pilotDisplayName || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-[#191c1d]">
                          {r.reasonOrTitle?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-[#191c1d]">
                          {r.pickupLocation?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-[#191c1d]">
                          {r.dropLocation?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-[#191c1d]">
                          {r.requestType?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs whitespace-nowrap text-[#191c1d] dark:text-[#191c1d]">
                          {r.requestPriority?.trim() || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-[#006767] dark:text-primary">
                          {statusLabel}
                        </td>
                        <td
                          className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-[#191c1d]"
                          title={comment || undefined}
                        >
                          {comment ? comment : "\u00a0"}
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
