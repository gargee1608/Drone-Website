"use client";

import type { ReactNode } from "react";

import { AdminDashboardNavProvider } from "@/components/dashboard/admin-dashboard-nav-context";
import { PilotDashboardNavProvider } from "@/components/pilot-dashboard/pilot-dashboard-nav-context";
import { ServiceRequestModalOverlayProvider } from "@/components/services/service-request-modal-overlay-context";
import { ThemeProvider } from "@/components/theme-provider";
import { UserDashboardNavProvider } from "@/components/user-dashboard/user-dashboard-nav-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ServiceRequestModalOverlayProvider>
        <UserDashboardNavProvider>
          <AdminDashboardNavProvider>
            <PilotDashboardNavProvider>{children}</PilotDashboardNavProvider>
          </AdminDashboardNavProvider>
        </UserDashboardNavProvider>
      </ServiceRequestModalOverlayProvider>
    </ThemeProvider>
  );
}
