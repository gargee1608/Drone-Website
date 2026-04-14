"use client";

import { List, Plus } from "lucide-react";

import {
  QuickActionsCardGrid,
  type QuickActionCardItem,
} from "@/components/dashboard/quick-actions-card-grid";

const userDashboardQuickActions: readonly QuickActionCardItem[] = [
  {
    href: "/user-dashboard/create-request",
    title: "Create New Request",
    subtitle: "Initiate a drone logistics mission",
    icon: Plus,
    iconWrap: "bg-[#0058bc] text-white",
  },
  {
    href: "/user-dashboard/my-requests",
    title: "View My Requests",
    subtitle:"Manage your active and past orders",
    icon: List,
    iconWrap: "bg-[#d8e2ff] text-[#0058bc]",
  },
];

export function UserDashboardQuickActions() {
  return (
    <QuickActionsCardGrid
      items={userDashboardQuickActions}
      variant="prominent"
    />
  );
}
