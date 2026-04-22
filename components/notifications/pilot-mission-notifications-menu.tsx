"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Plane } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  countUnreadPilotMissionNotifications,
  markPilotMissionNotificationIdsSeen,
  notificationsVisibleToPilot,
  PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT,
  type PilotMissionNotification,
} from "@/lib/pilot-mission-notifications";
import { PILOT_PROFILE_UPDATED_EVENT } from "@/lib/pilot-profile-snapshot";
import { cn } from "@/lib/utils";

const MAX_ROWS = 12;

function formatAssignedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function PilotMissionNotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PilotMissionNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const sync = useCallback(() => {
    setRows(notificationsVisibleToPilot().slice(0, MAX_ROWS));
    setUnread(countUnreadPilotMissionNotifications());
  }, []);

  useEffect(() => {
    const onDoc = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!open || !el || el.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const on = () => sync();
    window.addEventListener(PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT, on);
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, on);
    return () => {
      window.removeEventListener(PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT, on);
      window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, on);
    };
  }, [sync]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Mission notifications"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative text-slate-500 hover:text-[#008B8B] dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
        )}
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 ? (
          <span
            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ba1a1a] ring-2 ring-background"
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Mission notifications"
          className="absolute right-0 top-full z-[70] mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-xl border border-border bg-popover py-2 text-popover-foreground shadow-xl ring-1 ring-black/5 sm:w-[24rem]"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              New missions
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Assignments from the command center appear here.
            </p>
          </div>

          <div className="max-h-[min(70dvh,22rem)] overflow-y-auto">
            {rows.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No mission assignments yet. When an admin assigns you to a
                mission, it will show up here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((row) => (
                  <li key={row.id}>
                    <Link
                      href="/pilot-dashboard"
                      className="flex gap-3 px-3 py-2.5 text-left transition hover:bg-muted/60"
                      onClick={() => {
                        markPilotMissionNotificationIdsSeen([row.id]);
                        sync();
                        setOpen(false);
                      }}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#008B8B]/12 text-[#008B8B]">
                        <Plane className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#008B8B]">
                          New mission
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
                          {row.customer.trim() || "Mission"}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                          {[row.service, row.dropoff].filter(Boolean).join(" · ")}
                        </span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {row.requestRef}
                          {row.droneModel ? ` · ${row.droneModel}` : ""}
                          {formatAssignedAt(row.assignedAt)
                            ? ` · ${formatAssignedAt(row.assignedAt)}`
                            : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {rows.length > 0 ? (
            <div className="border-t border-border px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  markPilotMissionNotificationIdsSeen(rows.map((r) => r.id));
                  sync();
                }}
              >
                Mark all as read
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
