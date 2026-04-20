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
  variant = "default",
}: {
  items: readonly QuickActionCardItem[];
  className?: string;
  /** Larger, stronger CTAs for the main user dashboard. */
  variant?: "default" | "prominent";
}) {
  const prominent = variant === "prominent";
  return (
    <section
      aria-label="Quick actions"
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4",
        className
      )}
    >
      {items.map(({ href, title, subtitle, icon: Icon, iconWrap }, index) => (
        <Link
          key={href + title}
          href={href}
          className={cn(
            "group flex items-center gap-3 rounded-xl border border-border/80 bg-card text-foreground transition-colors",
            prominent
              ? "min-h-[5.25rem] p-4 shadow-md sm:min-h-[5.5rem] sm:p-5"
              : "min-h-[4.25rem] p-3.5 shadow-sm",
            prominent &&
              index === 0 &&
              "border-[#008B8B]/30 ring-1 ring-[#008B8B]/15",
            "hover:border-[#008B8B]/35 hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/40"
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-[1.02]",
              prominent ? "size-12 sm:size-14" : "size-10 sm:size-11 rounded-lg",
              iconWrap
            )}
          >
            <Icon
              className={cn(
                prominent ? "size-5 sm:size-6" : "size-[18px] sm:size-5"
              )}
              strokeWidth={2}
              aria-hidden
            />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span
              className={cn(
                "block font-bold text-foreground",
                prominent ? "text-sm sm:text-base" : "text-xs sm:text-sm"
              )}
            >
              {title}
            </span>
            <span
              className={cn(
                "mt-0.5 block leading-snug text-muted-foreground",
                prominent ? "text-xs sm:text-sm" : "text-[10px] sm:text-[11px]"
              )}
            >
              {subtitle}
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}
