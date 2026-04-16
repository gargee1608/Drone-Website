"use client";

import { usePathname } from "next/navigation";

import { LandingHeader } from "@/components/landing/landing-header";
import { SiteHeader } from "@/components/nav/site-header";

/** Landing-style marketing chrome (same header as main / pilot registration). */
export function ConditionalSiteHeader() {
  const pathname = usePathname();
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
    pathname === "/settings" ||
    pathname?.startsWith("/settings/") ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/") ||
    pathname?.startsWith("/user-dashboard");
  if (isLandingChrome) {
    return <LandingHeader />;
  }
  return <SiteHeader />;
}
