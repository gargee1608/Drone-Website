"use client";

import type { ReactNode } from "react";

import { AdminDashboardNavProvider } from "@/components/dashboard/admin-dashboard-nav-context";
import { PilotDashboardNavProvider } from "@/components/pilot-dashboard/pilot-dashboard-nav-context";
import { UserDashboardNavProvider } from "@/components/user-dashboard/user-dashboard-nav-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UserDashboardNavProvider>
      <AdminDashboardNavProvider>
        <PilotDashboardNavProvider>{children}</PilotDashboardNavProvider>
      </AdminDashboardNavProvider>
    </UserDashboardNavProvider>
  );
}
