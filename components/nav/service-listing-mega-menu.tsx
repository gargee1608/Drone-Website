"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** Flat list — links match anchors on /services */
export const serviceMegaMenuItems = [
  {
    href: "/services#delivery",
    title: "Delivery Services",
    description:
      "Last-mile logistics and medical supply transport for urban and remote areas.",
  },
  {
    href: "/services#emergency",
    title: "Emergency Logistics",
    description:
      "Rapid response for search & rescue, disasters, and critical cargo.",
  },
  {
    href: "/services#surveillance",
    title: "Surveillance & Monitoring",
    description:
      "Real-time aerial oversight with thermal and HD imaging.",
  },
  {
    href: "/services#infrastructure",
    title: "Infrastructure Inspection",
    description:
      "High-resolution asset surveys for turbines, lines, and sites.",
  },
] as const;

type ServiceListingMegaMenuProps = {
  triggerClassName?: string;
  label?: string;
  variant?: "site" | "landing";
};

export function ServiceListingMegaMenu({
  triggerClassName,
  label = "Service Listing",
  variant = "site",
}: ServiceListingMegaMenuProps) {
  const triggerBase =
    variant === "landing"
      ? "inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-[#0d6200]"
      : "site-header-marketing-link inline-flex items-center gap-1 text-[#191c1d] transition-colors hover:opacity-90";

  return (
    <div className="group relative">
      <Link href="/services" className={cn(triggerBase, triggerClassName)}>
        {label}
        <ChevronDown
          className="size-3.5 shrink-0 opacity-70 transition-transform duration-200 group-hover:rotate-180"
          aria-hidden
        />
      </Link>
      <div
        className="absolute left-1/2 top-full z-[100] hidden w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 pt-3 group-hover:block"
        role="presentation"
      >
        <div
          role="menu"
          aria-label="Services"
          className="overflow-hidden rounded-xl border border-border/80 bg-card/95 text-card-foreground shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10"
        >
          <div className="flex flex-col divide-y divide-border/60 p-1">
            {serviceMegaMenuItems.map(({ href, title }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                className="group/item block rounded-lg px-3 py-2.5 text-sm font-semibold leading-snug text-[#008C8C] outline-none transition-colors first:pt-2 last:pb-2 hover:bg-[#008C8C]/10 hover:text-[#007070] focus-visible:ring-2 focus-visible:ring-[#008C8C]/30 dark:text-[#008C8C] dark:hover:bg-[#008C8C]/15 dark:hover:text-[#00a8a8]"
              >
                {title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
