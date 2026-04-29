"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, ClipboardList, Mail } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  buildUnreadAdminInboxRows,
  countUnreadAdminInbox,
  markAdminInboxKeysSeen,
  type AdminInboxRow,
} from "@/lib/admin-inbox";
import { CONTACT_INQUIRIES_UPDATED_EVENT } from "@/lib/contact-inquiries";
import { USER_REQUESTS_UPDATED_EVENT } from "@/lib/user-requests";
import { cn } from "@/lib/utils";

const MAX_ROWS = 12;

export function AdminInboxMenu() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AdminInboxRow[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const sync = useCallback(() => {
    setRows(buildUnreadAdminInboxRows().slice(0, MAX_ROWS));
    setUnread(countUnreadAdminInbox());
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
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, on);
    window.addEventListener(CONTACT_INQUIRIES_UPDATED_EVENT, on);
    return () => {
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, on);
      window.removeEventListener(CONTACT_INQUIRIES_UPDATED_EVENT, on);
    };
  }, [sync]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Notifications"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative text-slate-500 hover:text-[#008B8B] dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
        )}
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-[70] mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-xl border border-border bg-popover py-2 text-popover-foreground shadow-xl ring-1 ring-black/5 sm:w-[24rem]"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Notifications
            </p>
          </div>

          <div className="max-h-[min(70dvh,22rem)] overflow-y-auto">
            {rows.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No new submissions right now.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((row) => (
                  <li key={row.key}>
                    <Link
                      href={row.href}
                      className="flex gap-3 px-3 py-2.5 text-left transition hover:bg-muted/60"
                      onClick={() => {
                        markAdminInboxKeysSeen([row.key]);
                        sync();
                        setOpen(false);
                      }}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                          row.kind === "user_request"
                            ? "bg-[#008B8B]/12 text-[#008B8B]"
                            : "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                        )}
                      >
                        {row.kind === "user_request" ? (
                          <ClipboardList className="size-4" aria-hidden />
                        ) : (
                          <Mail className="size-4" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#008B8B]">
                          {row.sourceLabel}
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
                          {row.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                          {row.subtitle}
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
                  markAdminInboxKeysSeen(
                    buildUnreadAdminInboxRows().map((r) => r.key)
                  );
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
