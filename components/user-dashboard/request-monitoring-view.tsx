"use client";

import { Activity } from "lucide-react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import { USER_DASH_PANEL_BORDER } from "@/lib/user-dashboard-styles";
import { cn } from "@/lib/utils";

export function RequestMonitoringView() {
  return (
    <UserDashboardShell
      pageTitle="Request Monitoring"
      pageTitleClassName="text-xl sm:text-2xl"
      pageTitleBarClassName="text-xs"
      pageSubtitle="Track and review the status of your mission requests."
    >
      <div
        className={cn(
          "rounded-xl bg-card px-6 py-12 text-center",
          USER_DASH_PANEL_BORDER
        )}
      >
        <Activity
          className="mx-auto mb-4 size-12 text-[#008B8B] opacity-90"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="text-sm font-semibold text-foreground">
          Monitoring tools will appear here
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
          Use this area for live updates, alerts, or detailed request analytics
          when you connect them to your backend.
        </p>
      </div>
    </UserDashboardShell>
  );
}
