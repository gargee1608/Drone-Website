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
        <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <Clock className="size-4" aria-hidden />
        </span>
      );
    case "accepted":
      return (
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-4" aria-hidden />
        </span>
      );
    case "rejected":
      return (
        <span className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <XCircle className="size-4" aria-hidden />
        </span>
      );
    default:
      return null;
  }
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#717786] sm:text-xs">
      {children}
    </h2>
  );
}

function RecentActivityPanel({ requests }: { requests: UserMissionRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col rounded-xl border border-[#c1c6d7]/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-[#191c1d] sm:text-lg">
            Recent activity
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#c1c6d7]/60 bg-[#f8f9fa] px-4 py-10 text-center">
          <ClipboardList
            className="mb-3 size-10 text-[#c1c6d7]"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-sm font-semibold text-[#191c1d]">
            No requests yet
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#4d5b7f]">
            Submit a mission request — status updates from admin will appear
            here.
          </p>
          <Link
            href="/user-dashboard/create-request"
            className="mt-4 text-xs font-semibold text-[#0058bc] underline-offset-2 hover:underline"
          >
            Create a request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#c1c6d7]/15 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#191c1d] sm:text-lg">
          Recent activity
        </h3>
        <Link
          href="/user-dashboard/my-requests"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0058bc] transition hover:text-[#004099]"
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-0 divide-y divide-[#e8eaef]">
        {requests.map((req) => (
          <li key={req.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span className="mt-0.5 shrink-0">
              {statusIconWrap(req.adminStatus)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#191c1d]">
                <span className="font-mono text-[#0058bc]">
                  {userRequestQueueDisplayId(req.id)}
                </span>
                {req.reasonOrTitle ? (
                  <span className="font-sans text-[#191c1d]">
                    {" "}
                    · {req.reasonOrTitle}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs font-medium leading-snug text-[#191c1d]">
                {userMissionAdminStatusLabel(req.adminStatus)}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-[#4d5b7f]">
                {req.dropLocation
                  ? `To ${req.dropLocation}`
                  : req.pickupLocation
                    ? `From ${req.pickupLocation}`
                    : "—"}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#9ca3b5]">
                {formatActivityTime(req.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
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
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#d8e2ff] p-2 text-[#0058bc]">
                <Rocket className="size-6" />
              </span>
              <span className="rounded-full bg-[#d8e2ff] px-2 py-1 text-xs font-bold text-[#001a41]">
                +12%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755]">Total Missions</p>
              <p className={cn("text-3xl font-bold text-[#191c1d]")}>1,284</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#cde5ff] p-2 text-[#006195]">
                <Cog className="size-6" />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-[#414755]">
                <span className="size-2 animate-pulse rounded-full bg-green-500" />
                Live
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755]">Active Units</p>
              <p className={cn("text-3xl font-bold text-[#191c1d]")}>
                {activeUnitsCount}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#dae2ff] p-2 text-[#505e83]">
                <BarChart3 className="size-6" />
              </span>
              <span className="text-xs font-medium text-[#414755]">
                Queue: {pendingTasksCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755]">Pending Tasks</p>
              <p className={cn("text-3xl font-bold text-[#191c1d]")}>
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
