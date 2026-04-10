"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ChevronDown,
  Package,
  ScanSearch,
  Shield,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Mega-menu columns — links match anchors on /services */
export const serviceMegaColumns: {
  heading: string;
  items: {
    href: string;
    title: string;
    description: string;
    Icon: LucideIcon;
  }[];
}[] = [
  {
    heading: "Delivery & response",
    items: [
      {
        href: "/services#delivery",
        title: "Delivery Services",
        description:
          "Last-mile logistics and medical supply transport for urban and remote areas.",
        Icon: Package,
      },
      {
        href: "/services#emergency",
        title: "Emergency Logistics",
        description:
          "Rapid response for search & rescue, disasters, and critical cargo.",
        Icon: Zap,
      },
    ],
  },
  {
    heading: "Aerial intelligence",
    items: [
      {
        href: "/services#surveillance",
        title: "Surveillance & Monitoring",
        description:
          "Real-time aerial oversight with thermal and HD imaging.",
        Icon: Shield,
      },
      {
        href: "/services#infrastructure",
        title: "Infrastructure Inspection",
        description:
          "High-resolution asset surveys for turbines, lines, and sites.",
        Icon: ScanSearch,
      },
    ],
  },
];

type ServiceListingMegaMenuProps = {
  /** Applied to the "Service Listing" trigger link (e.g. when nav does not set muted on a parent) */
  triggerClassName?: string;
};

/**
 * Desktop hover mega-menu for Service Listing — same markup as the main site header.
 */
export function ServiceListingMegaMenu({
  triggerClassName,
}: ServiceListingMegaMenuProps) {
  return (
    <div className="group relative">
      <Link
        href="/services"
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          triggerClassName
        )}
      >
        Service Listing
        <ChevronDown
          className="size-3.5 shrink-0 opacity-70 transition-transform duration-200 group-hover:rotate-180"
          aria-hidden
        />
      </Link>
      <div
        className="absolute left-1/2 top-full z-[100] hidden w-[min(42rem,calc(100vw-2rem))] max-w-[42rem] -translate-x-1/2 pt-3 group-hover:block"
        role="presentation"
      >
        <div
          role="menu"
          aria-label="Services"
          className="overflow-hidden rounded-xl border border-border/80 bg-card/95 text-card-foreground shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10"
        >
          <div className="grid grid-cols-1 divide-y divide-border/60 md:grid-cols-2 md:divide-x md:divide-y-0">
            {serviceMegaColumns.map((col) => (
              <div key={col.heading} className="p-4 md:p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  {col.heading}
                </p>
                <div className="flex flex-col gap-3">
                  {col.items.map(({ href, title, description, Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      className="group/item flex gap-3 rounded-lg p-2 outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-blue-500/30"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/15">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-snug text-foreground group-hover/item:text-blue-700 dark:group-hover/item:text-blue-400">
                          {title}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-border/60 bg-muted/20 py-2 pl-3 pr-4 md:py-2.5 md:pl-4 md:pr-5">
            <Link
              href="/services"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "inline-flex w-auto shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:from-blue-600/90 hover:to-indigo-600/90"
              )}
            >
              View all services
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
