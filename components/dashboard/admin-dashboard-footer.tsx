"use client";

import Link from "next/link";
import { Globe, Plane, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type AdminDashboardFooterProps = {
  className?: string;
};

export function AdminDashboardFooter({ className }: AdminDashboardFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "box-border w-full min-w-0 shrink-0 border-t-[0.5px] border-slate-200/60 bg-white text-foreground",
        "dark:border-border/60 dark:bg-background",
        className
      )}
      role="contentinfo"
    >
      {/*
        Horizontal padding matches `DashboardLayout` main inner (`px-3 sm:px-5`)
        so footer edges line up with page content beside the sidebar.
      */}
      <div className="flex w-full min-w-0 flex-col gap-3 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <Plane
            className="size-7 shrink-0 text-[#008B8B] sm:size-8"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-foreground sm:text-lg">
            Drone Hire
          </span>
        </Link>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-border dark:bg-background dark:text-muted-foreground dark:hover:bg-muted"
              aria-label="Scroll to top"
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            >
              <X className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
            <Link
              href="/"
              className="inline-flex size-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-border dark:bg-background dark:text-muted-foreground dark:hover:bg-muted"
              aria-label="Open site home"
            >
              <Globe className="size-3.5" strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <p className="text-left text-xs text-slate-600 sm:text-right dark:text-muted-foreground">
            © {year} Drone Hire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
