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
  const isAdminLoginPage =
    pathname === "/admin" || pathname === "/admin/";
  const isUserDashboard = pathname?.startsWith("/user-dashboard") ?? false;
  const isPilotDashboard =
    pathname?.startsWith("/pilot-dashboard") ||
    pathname?.startsWith("/pilot-profile") ||
    false;
  const isSettings =
    pathname === "/settings" ||
    pathname === "/settings/" ||
    (pathname?.startsWith("/settings/") ?? false);
  const isDashboardShellFooter =
    isUserDashboard || isPilotDashboard || isSettings;
  const whiteFooterChrome =
    isAdminDashboard ||
    isUserDashboard ||
    isPilotDashboard ||
    isSettings;
  const isLandingChrome =
    pathname === "/" ||
    pathname === "" ||
    pathname === "/pilot-login" ||
    pathname === "/signup" ||
    pathname === "/pilot-registration" ||
    pathname === "/services" ||
    pathname?.startsWith("/services/") ||
    pathname === "/blogs" ||
    pathname?.startsWith("/blogs/") ||
    pathname === "/contact" ||
    pathname?.startsWith("/contact/") ||
    pathname === "/matching-hub" ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/");

  if (isAdminDashboard || isAdminLoginPage) {
    return null;
  }

  if (isDashboardShellFooter) {
    return (
      <>
        <div className="h-px w-full shrink-0 bg-slate-200 dark:bg-white/15" aria-hidden />
        <SiteFooter className="bg-white text-foreground dark:bg-[#111315] dark:text-white" />
      </>
    );
  }

  if (isLandingChrome) {
    const sidebarShell = pathname?.startsWith("/dashboard");

    const landingFooterClass = sidebarShell
      ? cn(
          "z-30",
          "px-4 sm:px-6 lg:px-8",
          "lg:ml-[var(--admin-sidebar-footer-inset,0px)]",
          "lg:w-[calc(100%-var(--admin-sidebar-footer-inset,0px))]",
          "lg:transition-[margin-left,width] lg:duration-200 lg:ease-out"
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
