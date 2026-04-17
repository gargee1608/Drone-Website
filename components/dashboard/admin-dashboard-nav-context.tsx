"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AdminDashboardNavContextValue = {
  sidebarExpanded: boolean;
  setSidebarExpanded: (next: boolean) => void;
  expandSidebar: () => void;
};

const AdminDashboardNavContext =
  createContext<AdminDashboardNavContextValue | null>(null);

export function AdminDashboardNavProvider({ children }: { children: ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const expandSidebar = useCallback(() => setSidebarExpanded(true), []);

  const value = useMemo(
    () => ({
      sidebarExpanded,
      setSidebarExpanded,
      expandSidebar,
    }),
    [sidebarExpanded, expandSidebar]
  );

  return (
    <AdminDashboardNavContext.Provider value={value}>
      {children}
    </AdminDashboardNavContext.Provider>
  );
}

export function useAdminDashboardNav() {
  const ctx = useContext(AdminDashboardNavContext);
  if (!ctx) {
    throw new Error(
      "useAdminDashboardNav must be used within AdminDashboardNavProvider"
    );
  }
  return ctx;
}
