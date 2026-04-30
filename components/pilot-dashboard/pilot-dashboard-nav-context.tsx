"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PilotDashboardNavContextValue = {
  sidebarExpanded: boolean;
  setSidebarExpanded: (next: boolean) => void;
  expandSidebar: () => void;
};

const PilotDashboardNavContext =
  createContext<PilotDashboardNavContextValue | null>(null);

export function PilotDashboardNavProvider({
  children,
}: {
  children: ReactNode;
}) {
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
    <PilotDashboardNavContext.Provider value={value}>
      {children}
    </PilotDashboardNavContext.Provider>
  );
}

export function usePilotDashboardNav() {
  const ctx = useContext(PilotDashboardNavContext);
  if (!ctx) {
    throw new Error(
      "usePilotDashboardNav must be used within PilotDashboardNavProvider"
    );
  }
  return ctx;
}
