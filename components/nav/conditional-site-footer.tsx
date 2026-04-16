"use client";

import { usePathname } from "next/navigation";

import { LandingFooter } from "@/components/landing/landing-footer";
import { SiteFooter } from "@/components/nav/site-footer";
import { cn } from "@/lib/utils";

export function ConditionalSiteFooter() {
  const pathname = usePathname();
  const isAdminDashboard =
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    (pathname?.startsWith("/dashboard/") ?? false);
  const whiteFooterChrome = isAdminDashboard;
  const isLandingChrome =
    pathname === "/" ||
    pathname === "" ||
    pathname === "/login" ||
    pathname === "/pilot-registration" ||
    pathname === "/marketplace" ||
    pathname?.startsWith("/marketplace/") ||
    pathname === "/services" ||
    pathname?.startsWith("/services/") ||
    pathname === "/blogs" ||
    pathname?.startsWith("/blogs/") ||
    pathname === "/contact" ||
    pathname?.startsWith("/contact/") ||
    pathname === "/settings" ||
    pathname?.startsWith("/settings/") ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/") ||
    pathname?.startsWith("/user-dashboard");

  if (isLandingChrome) {
    const isSettingsShell = pathname?.startsWith("/settings") ?? false;
    const isDashboardShell =
      pathname?.startsWith("/dashboard") ||
      pathname?.startsWith("/user-dashboard");
    const sidebarShell = isSettingsShell || isDashboardShell;

    const landingFooterClass = sidebarShell
      ? cn(
          "px-0",
          "pl-[max(1rem,calc(var(--admin-sidebar-footer-inset,0px)+1rem))] pr-4",
          "sm:pl-[max(1.5rem,calc(var(--admin-sidebar-footer-inset,0px)+1.5rem))] sm:pr-6",
          isSettingsShell
            ? "lg:pl-[calc(var(--admin-sidebar-footer-inset,0px)+2.5rem)] lg:pr-10"
            : "lg:pl-[calc(var(--admin-sidebar-footer-inset,0px)+2rem)] lg:pr-8"
        )
      : "px-4 sm:px-8";

    return <LandingFooter className={landingFooterClass} />;
  }

  return (
    <>
      <div
        className={cn(
          "h-px w-full shrink-0",
          whiteFooterChrome ? "bg-slate-200" : "bg-border"
        )}
        aria-hidden
      />
      <SiteFooter
        className={cn(whiteFooterChrome && "bg-white")}
      />
    </>
  );
}
