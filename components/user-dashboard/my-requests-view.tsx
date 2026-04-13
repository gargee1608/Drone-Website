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
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80";
    case "accepted":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80";
    case "rejected":
      return "bg-red-50 text-red-900 ring-1 ring-red-200/80";
    default:
      return "bg-[#d8e2ff] text-[#001a41]";
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
    <UserDashboardShell pageTitle="My Request">
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c1c6d7] bg-[#f8f9fa] px-6 py-16 text-center">
            <ClipboardList
              className="mb-4 size-12 text-[#c1c6d7]"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-lg font-semibold text-[#191c1d]">
              No requests yet
            </p>
            <p className="mt-2 max-w-sm text-sm text-[#414755]">
              Submit a request from the User Dashboard. After you submit, it will
              show up here automatically.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req.id}
                className="overflow-hidden rounded-xl border border-[#c1c6d7]/15 bg-white shadow-sm"
              >
                <div className="border-b border-[#edeeef] bg-[#f3f4f5]/80 px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-[#0058bc]">
                      {userRequestQueueDisplayId(req.id)}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-[#414755]">
                      Submitted {formatSubmitted(req.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-[#191c1d] sm:text-xl">
                    {req.reasonOrTitle || "(No title)"}
                  </h2>
                </div>
                <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                      Pickup location
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#191c1d]">
                      {req.pickupLocation || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                      Drop location
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#191c1d]">
                      {req.dropLocation || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                      Payload weight
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#191c1d]">
                      {req.payloadWeightKg ? `${req.payloadWeightKg} kg` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                      Type
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#191c1d]">
                      {req.requestType || "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                      Priority
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#191c1d]">
                      {formatPriority(req.requestPriority)}
                    </dd>
                  </div>
                </dl>
                <div className="border-t border-[#edeeef] px-5 py-3 sm:px-6">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${adminStatusBadgeClass(req.adminStatus)}`}
                  >
                    {userMissionAdminStatusLabel(req.adminStatus)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </UserDashboardShell>
  );
}
