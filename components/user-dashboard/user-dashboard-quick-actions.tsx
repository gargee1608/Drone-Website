"use client";

import { List, Navigation, Plus, UserRoundPen } from "lucide-react";

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
    subtitle: "Manage your active and past orders",
    icon: List,
    iconWrap: "bg-[#d8e2ff] text-[#0058bc]",
  },
  {
    href: "/user-dashboard#recent-missions",
    title: "Track Delivery",
    subtitle: "Real-time telemetry for active drones",
    icon: Navigation,
    iconWrap: "bg-[#e7e8e9] text-[#414755]",
  },
  {
    href: "/settings",
    title: "Update Profile",
    subtitle: "Manage account and verification status",
    icon: UserRoundPen,
    iconWrap: "bg-[#e7e8e9] text-[#414755]",
  },
];

export function UserDashboardQuickActions() {
  return <QuickActionsCardGrid items={userDashboardQuickActions} />;
}
