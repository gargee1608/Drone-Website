"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UserDashboardNavContextValue = {
  sidebarExpanded: boolean;
  setSidebarExpanded: (next: boolean) => void;
  expandSidebar: () => void;
};

const UserDashboardNavContext =
  createContext<UserDashboardNavContextValue | null>(null);

export function UserDashboardNavProvider({ children }: { children: ReactNode }) {
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
    <UserDashboardNavContext.Provider value={value}>
      {children}
    </UserDashboardNavContext.Provider>
  );
}

export function useUserDashboardNav() {
  const ctx = useContext(UserDashboardNavContext);
  if (!ctx) {
    throw new Error(
      "useUserDashboardNav must be used within UserDashboardNavProvider"
    );
  }
  return ctx;
}
