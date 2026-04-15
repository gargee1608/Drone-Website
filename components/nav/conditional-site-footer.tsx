"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/nav/site-footer";
import { cn } from "@/lib/utils";

/** Hides the global footer on `/user-dashboard` where `UserDashboardShell` renders its own footer. */
export function ConditionalSiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/user-dashboard")) {
    return null;
  }
  const isSettings = pathname?.startsWith("/settings") ?? false;
  const isAdminDashboard =
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    (pathname?.startsWith("/dashboard/") ?? false);
  const whiteFooterChrome = isSettings || isAdminDashboard;
  return (
    <>
      <div
        className={cn(
          "h-px w-full shrink-0",
          whiteFooterChrome ? "bg-slate-200" : "bg-border"
        )}
        aria-hidden
      />
      <SiteFooter className={whiteFooterChrome ? "bg-white" : undefined} />
    </>
  );
}
