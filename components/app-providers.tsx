"use client";

import type { ReactNode } from "react";

import { AdminDashboardNavProvider } from "@/components/dashboard/admin-dashboard-nav-context";
// import { ThemeProvider } from "@/components/theme-provider";
import { UserDashboardNavProvider } from "@/components/user-dashboard/user-dashboard-nav-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    /* Dark mode: ThemeProvider disabled — uncomment to re-enable global light/dark. */
    <UserDashboardNavProvider>
      <AdminDashboardNavProvider>{children}</AdminDashboardNavProvider>
    </UserDashboardNavProvider>
  );
}
