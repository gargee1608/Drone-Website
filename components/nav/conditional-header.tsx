"use client";

import { usePathname } from "next/navigation";

import { LandingHeader } from "@/components/nav/landing-header";
import { SiteHeader } from "@/components/nav/site-header";

export function ConditionalHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  if (isHome) {
    return <LandingHeader />;
  }
  return <SiteHeader />;
}
