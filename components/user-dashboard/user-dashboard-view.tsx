"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Cog,
  Rocket,
  XCircle,
} from "lucide-react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import { UserDashboardQuickActions } from "@/components/user-dashboard/user-dashboard-quick-actions";
import {
  loadUserRequests,
  USER_REQUESTS_UPDATED_EVENT,
  userMissionAdminStatusLabel,
  userRequestQueueDisplayId,
  type UserMissionAdminStatus,
  type UserMissionRequest,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

function formatActivityTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 8) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function statusIconWrap(status: UserMissionAdminStatus) {
  switch (status) {
    case "pending":
      return (
        <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
          <Clock className="size-4" aria-hidden />
        </span>
      );
    case "accepted":
      return (
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
          <CheckCircle2 className="size-4" aria-hidden />
        </span>
      );
    case "rejected":
      return (
        <span className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-200">
          <XCircle className="size-4" aria-hidden />
        </span>
      );
    default:
      return null;
  }
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#717786] sm:text-xs dark:text-white/75">
      {children}
    </h2>
  );
}

function RecentActivityPanel({ requests }: { requests: UserMissionRequest[] }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[#c1c6d7]/15 bg-white p-5 sm:p-6 dark:border-white/15 dark:bg-[#161a1d]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#191c1d] sm:text-lg dark:text-white">
          Recent activity
        </h3>
        <Link
          href="/user-dashboard/my-requests"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#008B8B] transition hover:text-[#006060]"
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#e8eaef] dark:border-white/10">
        <table className="min-w-[760px] w-full border-collapse">
          <thead className="bg-[#f3f4f5]/85 dark:bg-[#1b2024]">
            <tr className="border-b border-[#e8eaef] dark:border-white/10">
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                Request ID
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                Title
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                Route
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                Status
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#4d5b7f] dark:text-white/70">
                Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm font-medium text-[#4d5b7f] dark:text-white/75"
                >
                  No requests yet. Submit a mission request to see activity.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-[#e8eaef] last:border-b-0 dark:border-white/10"
                >
                  <td className="px-3 py-3 text-xs font-semibold text-[#008B8B]">
                    <span className="font-mono">
                      {userRequestQueueDisplayId(req.id)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold text-[#191c1d] dark:text-white">
                    {req.reasonOrTitle || "(No title)"}
                  </td>
                  <td className="px-3 py-3 text-xs text-[#4d5b7f] dark:text-white/75">
                    {req.dropLocation
                      ? `To ${req.dropLocation}`
                      : req.pickupLocation
                        ? `From ${req.pickupLocation}`
                        : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#191c1d] dark:text-white">
                      {statusIconWrap(req.adminStatus)}
                      {userMissionAdminStatusLabel(req.adminStatus)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#4d5b7f] dark:text-white/75">
                    {formatActivityTime(req.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function UserDashboardView() {
  const activeUnitsCount = 1;
  const pendingTasksCount = 2;

  const [recentRequests, setRecentRequests] = useState<UserMissionRequest[]>(
    []
  );

  useEffect(() => {
    const refresh = () => {
      const sorted = [...loadUserRequests()].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentRequests(sorted.slice(0, 6));
    };
    refresh();
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
  }, []);

  return (
    <UserDashboardShell pageTitle="User Dashboard">
      <>
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6 dark:border-white/15 dark:bg-[#161a1d]">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#008B8B]/14 p-2 text-[#008B8B]">
                <Rocket className="size-6" />
              </span>
              <span className="rounded-full bg-[#008B8B]/14 px-2 py-1 text-xs font-bold text-[#0a3030] dark:text-white">
                +12%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755] dark:text-white/75">Total Missions</p>
              <p className={cn("text-3xl font-bold text-[#191c1d] dark:text-white")}>1,284</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6 dark:border-white/15 dark:bg-[#161a1d]">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#cde5ff] p-2 text-[#006195]">
                <Cog className="size-6" />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-[#414755] dark:text-white/75">
                <span className="size-2 animate-pulse rounded-full bg-green-500" />
                Live
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755] dark:text-white/75">Active Units</p>
              <p className={cn("text-3xl font-bold text-[#191c1d] dark:text-white")}>
                {activeUnitsCount}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6 dark:border-white/15 dark:bg-[#161a1d]">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#dae2ff] p-2 text-[#505e83]">
                <BarChart3 className="size-6" />
              </span>
              <span className="text-xs font-medium text-[#414755] dark:text-white/75">
                Queue: {pendingTasksCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755] dark:text-white/75">Pending Tasks</p>
              <p className={cn("text-3xl font-bold text-[#191c1d] dark:text-white")}>
                {pendingTasksCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-4 sm:mt-12">
          <SectionLabel>Quick actions</SectionLabel>
          <UserDashboardQuickActions />
        </div>

        <div className="mt-10 lg:mt-12">
          <RecentActivityPanel requests={recentRequests} />
        </div>
      </>
    </UserDashboardShell>
  );
}
