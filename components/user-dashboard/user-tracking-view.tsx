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
import { userRequestQueueDisplayId } from "@/lib/user-requests";

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

  useEffect(() => {
    const sync = () => setEntries(loadUserMissionTrackingForCurrentUser());
    sync();
    window.addEventListener(USER_MISSION_TRACKING_UPDATED_EVENT, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_MISSION_TRACKING_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(USER_MISSION_TRACKING_UPDATED_EVENT, sync);
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c1c6d7] bg-[#f8f9fa] px-6 py-16 text-center dark:border-white/20 dark:bg-[#161a1d]">
            <MapPinned
              className="mb-4 size-12 text-[#c1c6d7] dark:text-white/50"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-base font-semibold text-[#191c1d] dark:text-white">
              No assigned missions yet
            </p>
            <p className="mt-2 max-w-md text-xs text-[#414755] dark:text-white/75">
              When an admin assigns a pilot to your request from the dashboard,
              you&apos;ll see the pilot ID, pilot name, and your request
              details here. Assignments are stored in this browser for demo
              use; use the same session where you submitted the request.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#c1c6d7]/15 bg-white shadow-sm dark:border-white/15 dark:bg-[#161a1d]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[7.5rem]" />
                  <col className="w-[6.5rem]" />
                  <col className="w-[16%]" />
                  <col className="w-[20%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[11%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-[#f3f4f5]/85 dark:bg-[#1b2024]">
                  <tr className="border-b border-[#edeeef] dark:border-white/10">
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Assigned
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Request ID
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Pilot name
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Title
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Pickup
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Drop-off
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Type
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const r = entry.request;
                    const displayReqId = userRequestQueueDisplayId(
                      r.requestRef
                    );
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-[#edeeef] last:border-b-0 dark:border-white/10"
                      >
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-[#191c1d] dark:text-white">
                          {formatAssignedAt(entry.assignedAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-[#191c1d] dark:text-white">
                          <span className="font-mono">{displayReqId}</span>
                        </td>
                        <td className="px-3 py-3 text-xs font-medium break-words text-[#191c1d] dark:text-white">
                          {entry.pilotName || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-white">
                          {r.reasonOrTitle?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-white">
                          {r.pickupLocation?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-white">
                          {r.dropLocation?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs break-words text-[#191c1d] dark:text-white">
                          {r.requestType?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs whitespace-nowrap text-[#191c1d] dark:text-white">
                          {r.requestPriority?.trim() || "—"}
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
