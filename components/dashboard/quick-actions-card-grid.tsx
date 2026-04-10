"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type QuickActionCardItem = {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconWrap: string;
};

export function QuickActionsCardGrid({
  items,
  className,
}: {
  items: readonly QuickActionCardItem[];
  className?: string;
}) {
  return (
    <section
      aria-label="Quick actions"
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4",
        className
      )}
    >
      {items.map(({ href, title, subtitle, icon: Icon, iconWrap }) => (
        <Link
          key={href + title}
          href={href}
          className={cn(
            "flex min-h-[4.25rem] items-center gap-3 rounded-xl border border-[#c1c6d7]/15 bg-white p-3.5 shadow-sm transition-colors",
            "hover:border-[#0058bc]/25 hover:bg-[#f8f9fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/40"
          )}
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg sm:size-11",
              iconWrap
            )}
          >
            <Icon className="size-[18px] sm:size-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-xs font-bold text-[#191c1d] sm:text-sm">
              {title}
            </span>
            <span className="mt-0.5 block text-[10px] leading-snug text-[#4d5b7f] sm:text-[11px]">
              {subtitle}
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}
