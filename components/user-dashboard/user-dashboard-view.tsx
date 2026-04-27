"use client";

import { useEffect, useState } from "react";

import { UserDashboardFleetDashboard } from "@/components/user-dashboard/user-dashboard-fleet-dashboard";
import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import {
  loadUserRequests,
  USER_REQUESTS_UPDATED_EVENT,
  type UserMissionRequest,
} from "@/lib/user-requests";

export function UserDashboardView() {
  const [allRequests, setAllRequests] = useState<UserMissionRequest[]>([]);
  const [tableRequests, setTableRequests] = useState<UserMissionRequest[]>([]);

  useEffect(() => {
    const refresh = () => {
      const sorted = [...loadUserRequests()].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllRequests(sorted);
      setTableRequests(sorted.slice(0, 8));
    };
    refresh();
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
  }, []);

  return (
    <UserDashboardShell
      pageTitle="User Dashboard"
      mainMaxWidthClassName="max-w-[1400px]"
    >
      <UserDashboardFleetDashboard
        allRequests={allRequests}
        tableRequests={tableRequests}
      />
    </UserDashboardShell>
  );
}
