"use client";

import { Suspense } from "react";
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
    pathname === "/signup" ||
    pathname === "/pilot-registration" ||
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
    return (
      <Suspense fallback={null}>
        <LandingHeader />
      </Suspense>
    );
  }
  return <SiteHeader />;
}
