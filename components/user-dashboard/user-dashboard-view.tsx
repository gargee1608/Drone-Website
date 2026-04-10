"use client";

import {
  BarChart3,
  Cog,
  Rocket,
} from "lucide-react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import { UserDashboardQuickActions } from "@/components/user-dashboard/user-dashboard-quick-actions";
import { cn } from "@/lib/utils";

type MissionStatus = "IN TRANSIT" | "COMPLETED" | "REVERTED";

const recentMissions: {
  id: string;
  dest: string;
  status: MissionStatus;
  eta: string;
  action: string;
}[] = [
  {
    id: "#AL-9421",
    dest: "Skyport Sector 7",
    status: "IN TRANSIT",
    eta: "14 mins",
    action: "Track",
  },
  {
    id: "#AL-9418",
    dest: "Downtown Medical",
    status: "COMPLETED",
    eta: "—",
    action: "Report",
  },
  {
    id: "#AL-9390",
    dest: "Logistics Hub B",
    status: "REVERTED",
    eta: "—",
    action: "Review",
  },
];

function statusBadge(status: MissionStatus) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide sm:text-xs";
  switch (status) {
    case "IN TRANSIT":
      return (
        <span
          className={`${base} bg-sky-100/90 text-sky-800 ring-1 ring-sky-200/80`}
        >
          IN TRANSIT
        </span>
      );
    case "COMPLETED":
      return (
        <span
          className={`${base} bg-emerald-100/90 text-emerald-900 ring-1 ring-emerald-200/70`}
        >
          COMPLETED
        </span>
      );
    case "REVERTED":
      return (
        <span
          className={`${base} bg-red-100/90 text-red-900 ring-1 ring-red-200/70`}
        >
          REVERTED
        </span>
      );
  }
}

export function UserDashboardView() {
  const activeUnitsCount = recentMissions.filter(
    (m) => m.status === "IN TRANSIT"
  ).length;
  const pendingTasksCount = recentMissions.filter(
    (m) => m.status !== "COMPLETED"
  ).length;

  return (
    <UserDashboardShell pageTitle="User Dashboard">
      <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#d8e2ff] p-2 text-[#0058bc]">
                <Rocket className="size-6" />
              </span>
              <span className="rounded-full bg-[#d8e2ff] px-2 py-1 text-xs font-bold text-[#001a41]">
                +12%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755]">
                Total Missions
              </p>
              <p
                className={cn(
                  "text-3xl font-bold text-[#191c1d]"
                )}
              >
                1,284
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6">
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
              <p className="text-sm font-medium text-[#414755]">
                Active Units
              </p>
              <p
                className={cn(
                  "text-3xl font-bold text-[#191c1d]"
                )}
              >
                {activeUnitsCount}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#dae2ff] p-2 text-[#505e83]">
                <BarChart3 className="size-6" />
              </span>
              <span className="text-xs font-medium text-[#414755]">
                Queue: {pendingTasksCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755]">
                Pending Tasks
              </p>
              <p
                className={cn(
                  "text-3xl font-bold text-[#191c1d]"
                )}
              >
                {pendingTasksCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8 sm:mt-10">
          <UserDashboardQuickActions />

          <section
            id="recent-missions"
            className="scroll-mt-8 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/40"
          >
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
              <h2 className="text-base font-bold tracking-tight text-[#191c1d] sm:text-lg">
                Recent missions
              </h2>
              <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
                Latest activity across your drone logistics queue.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[11px]">
                    <th className="w-[14%] px-5 py-2.5 sm:px-6">ID</th>
                    <th className="w-[26%] px-3 py-2.5">Destination</th>
                    <th className="w-[22%] px-3 py-2.5">Status</th>
                    <th className="w-[14%] px-3 py-2.5 text-right tabular-nums">
                      ETA
                    </th>
                    <th className="w-[24%] px-5 py-2.5 text-right sm:px-6">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#191c1d]">
                  {recentMissions.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-2.5 align-middle sm:px-6 sm:py-3">
                        <a
                          href="#recent-missions"
                          className="font-mono text-[13px] font-semibold text-[#0058bc] underline-offset-2 hover:text-[#004a9e] hover:underline"
                        >
                          {row.id}
                        </a>
                      </td>
                      <td className="px-3 py-2.5 align-middle text-[13px] font-medium text-[#334155] sm:py-3">
                        {row.dest}
                      </td>
                      <td className="px-3 py-2.5 align-middle sm:py-3">
                        {statusBadge(row.status)}
                      </td>
                      <td className="px-3 py-2.5 text-right align-middle text-[13px] tabular-nums text-[#475569] sm:py-3">
                        {row.eta}
                      </td>
                      <td className="px-5 py-2.5 text-right align-middle sm:px-6 sm:py-3">
                        <button
                          type="button"
                          className="text-[13px] font-bold text-[#0058bc] underline-offset-2 transition-colors hover:text-[#004a9e] hover:underline"
                        >
                          {row.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </>
    </UserDashboardShell>
  );
}
