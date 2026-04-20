import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CircleUser,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  Plane,
  Settings,
} from "lucide-react";

export type CommandCenterNavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
};

/** Admin command center — same list as `DashboardLayout` sidebar. */
export const commandCenterNavMain: readonly CommandCenterNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/assign", label: "Assign To", icon: Plane },
  { href: "/dashboard/user-requests", label: "User Request", icon: ClipboardList },
  {
    href: "/dashboard/completed-deliveries",
    label: "Completed Deliveries",
    icon: CheckCircle2,
  },
  { href: "/dashboard/pilot-status", label: "Pilot Status", icon: BadgeCheck },
  { href: "/dashboard/blogs", label: "Blogs", icon: BookOpen },
  { href: "/dashboard/services", label: "Services", icon: Briefcase },
  {
    href: "/dashboard/contact-inquiries",
    label: "Contact inquiries",
    icon: Mail,
  },
  { href: "/dashboard/profile", label: "Profile", icon: CircleUser },
  { href: "/settings?from=admin", label: "Settings", icon: Settings },
];

export const commandCenterNavFooter: readonly CommandCenterNavItem[] = [
  { href: "/login", label: "Logout", icon: LogOut },
];

/** User-facing area — shown on Settings when `?from=user`. */
export const userCommandCenterNavMain: readonly CommandCenterNavItem[] = [
  { href: "/user-dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/user-dashboard/my-requests",
    label: "My Request",
    icon: ClipboardList,
  },
  { href: "/settings?from=user", label: "Settings", icon: Settings },
];

/** Path portion of a nav link — strips `?query` for pathname matching. */
export function commandCenterNavHrefPath(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
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
