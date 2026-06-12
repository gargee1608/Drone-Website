"use client";

import type { ComponentType } from "react";

import { ADMIN_DASH_STAT_CARD_SURFACE } from "@/lib/admin-dashboard-styles";
import { cn } from "@/lib/utils";

export function AdminKpiCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  iconBg,
  accentClass,
}: {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  iconBg: string;
  accentClass: string;
}) {
  return (
    <div
      className={cn(
        "admin-kpi-card group relative overflow-hidden cc-glass-card flex items-center justify-between rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5",
        ADMIN_DASH_STAT_CARD_SURFACE
      )}
    >
      <div
        className={cn("absolute inset-x-0 top-0 h-1 opacity-90", accentClass)}
        aria-hidden
      />
      <div className="min-w-0 pr-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
        <h2 className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.75rem]">
          {value}
        </h2>
      </div>
      <div
        className={cn(
          "shrink-0 rounded-xl p-3 ring-1 ring-black/[0.04] transition-transform duration-300 group-hover:scale-105 dark:ring-white/[0.06]",
          iconBg
        )}
      >
        <Icon className={cn("size-6 sm:size-7", iconClassName)} aria-hidden />
      </div>
    </div>
  );
}
