import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Drone,
  FolderCheck,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Plane,
  Radar,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

import { ServiceIcon } from "@/components/icons/service-icon";

export type CommandCenterNavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
};

/** Admin command center — same list as `DashboardLayout` sidebar. */
export const commandCenterNavMain: readonly CommandCenterNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/user-requests", label: "User Request", icon: ClipboardList },
  { href: "/dashboard/assign", label: "Assign To", icon: Plane },
  {
    href: "/dashboard/completed-deliveries",
    label: "Completed Deliveries",
    icon: CheckCircle2,
  },
  {
    href: "/dashboard/project-requests",
    label: "Project Requests",
    icon: FolderKanban,
  },
  {
    href: "/dashboard/completed-projects",
    label: "Completed Project",
    icon: FolderCheck,
  },
  {
    href: "/dashboard/available-missions",
    label: "Available Mission",
    icon: Radar,
  },
  {
    href: "/dashboard/drone",
    label: "Add New Drone Details",
    icon: Drone,
  },
  {
    href: "/dashboard/pilot-details",
    label: "Add Pilot Details",
    icon: UserRound,
  },
  {
    href: "/dashboard/user-details",
    label: "User Management",
    icon: Users,
  },
    { href: "/dashboard/pilot-status", label: "Pilot Status", icon: BadgeCheck },
  { href: "/dashboard/blogs", label: "Add Blogs", icon: BookOpen },
  { href: "/dashboard/services", label: "Add Services", icon: ServiceIcon },
  {
    href: "/dashboard/contact-inquiries",
    label: "Contact inquiries",
    icon: Mail,
  },
  { href: "/settings?from=admin", label: "Settings", icon: Settings },
];

export const commandCenterNavFooter: readonly CommandCenterNavItem[] = [
  { href: "/admin", label: "Logout", icon: LogOut },
];

/** User-facing area — shown on Settings when `?from=user`. */
export const userCommandCenterNavMain: readonly CommandCenterNavItem[] = [
  { href: "/user-dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/user-dashboard/my-requests",
    label: "My Request",
    icon: ClipboardList,
  },
  {
    href: "/user-dashboard/request-monitoring",
    label: "Request Monitoring",
    icon: Activity,
  },
  { href: "/settings?from=user", label: "Settings", icon: Settings },
];

/** Path portion of a nav link — strips `?query` for pathname matching. */
export function commandCenterNavHrefPath(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

/** Mobile header title under the global nav (matches User Dashboard shell). */
export function adminMobilePageTitle(pathname: string | null): string {
  if (!pathname) return "Admin Dashboard";
  if (
    pathname === "/settings" ||
    pathname === "/settings/" ||
    pathname.startsWith("/settings/")
  ) {
    return "Settings";
  }
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return "Admin Dashboard";
  }
  if (
    pathname === "/dashboard/profile" ||
    pathname.startsWith("/dashboard/profile/")
  ) {
    return "My Profile";
  }
  const match = commandCenterNavMain.find(
    (item) =>
      item.href !== "/dashboard" &&
      commandCenterNavItemIsActive(pathname, item.href)
  );
  return match?.label ?? "Admin Dashboard";
}

export function commandCenterNavItemIsActive(
  pathname: string | null,
  href: string
): boolean {
  if (!pathname) return false;
  const base = commandCenterNavHrefPath(href);
  if (base === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  if (base === "/user-dashboard") {
    return pathname === "/user-dashboard" || pathname === "/user-dashboard/";
  }
  if (base === "/settings") {
    return (
      pathname === "/settings" ||
      pathname === "/settings/" ||
      pathname.startsWith("/settings/")
    );
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}
