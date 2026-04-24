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
    iconWrap: "bg-[#008B8B] text-white",
  },
  {
    href: "/user-dashboard/my-requests",
    title: "View My Requests",
    subtitle: "Manage your active and past orders",
    icon: List,
    iconWrap: "bg-[#008B8B]/14 text-[#008B8B]",
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
