"use client";

import { Activity } from "lucide-react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";

export function RequestMonitoringView() {
  return (
    <UserDashboardShell
      pageTitle="Request Monitoring"
      pageTitleClassName="text-xl sm:text-2xl"
      pageTitleBarClassName="text-xs"
      pageSubtitle="Track and review the status of your mission requests."
    >
      <div className="rounded-xl border border-slate-200 bg-[#f8f9fa] px-6 py-12 text-center dark:border-white/15 dark:bg-[#161a1d]">
        <Activity
          className="mx-auto mb-4 size-12 text-[#008B8B] opacity-90"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="text-sm font-semibold text-[#191c1d] dark:text-white">
          Monitoring tools will appear here
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs text-[#414755] dark:text-white/75">
          Use this area for live updates, alerts, or detailed request analytics
          when you connect them to your backend.
        </p>
      </div>
    </UserDashboardShell>
  );
}
