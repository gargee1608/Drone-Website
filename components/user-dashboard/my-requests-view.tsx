"use client";

import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import {
  loadUserRequests,
  USER_REQUESTS_UPDATED_EVENT,
  userMissionAdminStatusLabel,
  userRequestQueueDisplayId,
  type UserMissionRequest,
} from "@/lib/user-requests";

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  express: "Express",
  standard: "Standard",
};

function formatPriority(value: string): string {
  if (!value) return "—";
  return priorityLabels[value] ?? value;
}

function formatSubmitted(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function adminStatusBadgeClass(status: UserMissionRequest["adminStatus"]) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-300/20";
    case "accepted":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-300/20";
    case "rejected":
      return "bg-red-50 text-red-900 ring-1 ring-red-200/80 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-300/20";
    default:
      return "bg-[#008B8B]/14 text-[#0a3030] dark:text-white";
  }
}

export function MyRequestsView() {
  const [requests, setRequests] = useState<UserMissionRequest[]>([]);

  useEffect(() => {
    const refresh = () => setRequests(loadUserRequests());
    refresh();
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
  }, []);

  return (
    <UserDashboardShell
      pageTitle="My Request"
      pageTitleClassName="text-xl sm:text-2xl"
      pageTitleBarClassName="text-xs"
    >
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c1c6d7] bg-[#f8f9fa] px-6 py-16 text-center dark:border-white/20 dark:bg-[#161a1d]">
            <ClipboardList
              className="mb-4 size-12 text-[#c1c6d7] dark:text-white/50"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-base font-semibold text-[#191c1d] dark:text-white">
              No requests yet
            </p>
            <p className="mt-2 max-w-sm text-xs text-[#414755] dark:text-white/75">
              Submit a request from the User Dashboard. After you submit, it will
              show up here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#c1c6d7]/15 bg-white shadow-sm dark:border-white/15 dark:bg-[#161a1d]">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead className="bg-[#f3f4f5]/85 dark:bg-[#1b2024]">
                  <tr className="border-b border-[#edeeef] dark:border-white/10">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Request ID
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Pickup
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Drop
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Payload
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-[#edeeef] last:border-b-0 dark:border-white/10"
                    >
                      <td className="px-4 py-3 text-xs font-semibold text-[#008B8B]">
                        <span className="font-mono">
                          {userRequestQueueDisplayId(req.id)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#191c1d] dark:text-white">
                        {req.reasonOrTitle || "(No title)"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#191c1d] dark:text-white">
                        {req.pickupLocation || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#191c1d] dark:text-white">
                        {req.dropLocation || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#191c1d] dark:text-white">
                        {req.payloadWeightKg ? `${req.payloadWeightKg} kg` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#191c1d] dark:text-white">
                        {req.requestType || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#191c1d] dark:text-white">
                        {formatPriority(req.requestPriority)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#414755] dark:text-white/75">
                        {formatSubmitted(req.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${adminStatusBadgeClass(req.adminStatus)}`}
                        >
                          {userMissionAdminStatusLabel(req.adminStatus)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </UserDashboardShell>
  );
}
