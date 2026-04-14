"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/nav/site-footer";

/** Hides the global footer on `/user-dashboard` where `UserDashboardShell` renders its own footer. */
export function ConditionalSiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/user-dashboard")) {
    return null;
  }
  return <SiteFooter />;
}
