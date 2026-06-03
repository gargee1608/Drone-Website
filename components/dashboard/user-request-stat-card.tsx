"use client";

import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

export function UserRequestStatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  iconWrapClassName,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  iconWrapClassName: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-4 py-4 text-center shadow-sm sm:px-5 sm:py-5">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg sm:size-10",
          iconWrapClassName
        )}
      >
        <Icon className={cn("size-[18px]", iconClassName)} aria-hidden />
      </span>
      <p className="mt-2.5 text-xs font-bold tabular-nums text-foreground sm:text-sm">
        {value}
      </p>
      <p className="mt-1 max-w-[9rem] text-[10px] font-medium leading-tight text-muted-foreground sm:max-w-none sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}
