"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Mail, Trash2 } from "lucide-react";

import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import {
  CONTACT_INQUIRIES_UPDATED_EVENT,
  deleteContactInquiry,
  loadContactInquiries,
  type ContactInquiry,
} from "@/lib/contact-inquiries";
import { cn } from "@/lib/utils";

function formatWhen(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        d
      ),
      time: new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(
        d
      ),
    };
  } catch {
    return { date: iso, time: "" };
  }
}

const thBase =
  "px-2.5 py-3 align-middle text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-3.5 sm:text-[10px] sm:tracking-wider";
const tdBase =
  "min-w-0 px-2.5 py-3 align-middle text-[10px] text-foreground sm:px-3 sm:py-3.5 sm:text-[11px]";

export function ContactInquiriesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<ContactInquiry[]>([]);

  const refresh = useCallback(() => {
    setRows([...loadContactInquiries()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refresh();
    });
    const on = () => refresh();
    window.addEventListener(CONTACT_INQUIRIES_UPDATED_EVENT, on);
    return () =>
      window.removeEventListener(CONTACT_INQUIRIES_UPDATED_EVENT, on);
  }, [refresh]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || rows.length === 0) return;
    if (!rows.some((r) => r.id === id)) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(`contact-inquiry-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const url = new URL(window.location.href);
      if (url.searchParams.get("id") === id) {
        url.searchParams.delete("id");
        router.replace(url.pathname + (url.search ? url.search : ""), {
          scroll: false,
        });
      }
    });
  }, [searchParams, rows, router]);

  return (
    <div
      className={cn(
        "mx-auto min-w-0 w-full max-w-6xl pb-8",
        ADMIN_PAGE_TOP_PADDING_CLASS
      )}
    >
      <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "mb-2")}>Contact inquiries</h1>
      {rows.length > 0 ? (
        <p className="mb-6 text-[13px] font-medium text-muted-foreground sm:mb-8">
          Total {rows.length} inquir{rows.length === 1 ? "y" : "ies"}
        </p>
      ) : (
        <div className="mb-8" />
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card dark:bg-black px-6 py-14 text-center shadow-sm">
          <Mail
            className="mx-auto mb-3 size-10 text-[#c1c6d7]"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-sm font-semibold text-foreground">
            No inquiries yet
          </p>
          <p className="mt-2 text-xs text-[#414755]">
            When someone submits the Contact form, entries appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card dark:bg-black shadow-sm">
          <table className="w-full table-fixed border-collapse text-left text-[10px] leading-snug sm:text-[11px]">
              <thead>
                <tr className="border-b border-border bg-white dark:bg-black">
                  <th
                    scope="col"
                    className={cn(thBase, "w-[15%] text-left")}
                  >
                    Submitted
                  </th>
                  <th scope="col" className={cn(thBase, "w-[12%] text-left")}>
                    Name
                  </th>
                  <th scope="col" className={cn(thBase, "w-[20%] text-left")}>
                    Email
                  </th>
                  <th scope="col" className={cn(thBase, "w-[12%] text-left")}>
                    Phone
                  </th>
                  <th scope="col" className={cn(thBase, "text-left")}>
                    Message
                  </th>
                  <th
                    scope="col"
                    className={cn(thBase, "w-[4.75rem] px-2 text-center")}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const when = formatWhen(row.createdAt);
                  return (
                    <tr
                      key={row.id}
                      id={`contact-inquiry-${row.id}`}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/40 dark:hover:bg-white/5"
                    >
                      <td className={cn(tdBase, "text-left align-top")}>
                        <time
                          className="block leading-snug text-muted-foreground"
                          dateTime={row.createdAt}
                        >
                          <span className="block break-words">{when.date}</span>
                          {when.time ? (
                            <span className="mt-0.5 block tabular-nums">
                              {when.time}
                            </span>
                          ) : null}
                        </time>
                      </td>
                      <td className={cn(tdBase, "text-left align-top")}>
                        <span className="block break-words font-semibold text-foreground">
                          {row.fullName}
                        </span>
                      </td>
                      <td className={cn(tdBase, "text-left align-top")}>
                        <a
                          href={`mailto:${encodeURIComponent(row.email)}`}
                          className="break-words text-[#008B8B] no-underline hover:underline"
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className={cn(tdBase, "text-left align-top")}>
                        <span className="block break-words tabular-nums">
                          {row.phone?.trim() || "—"}
                        </span>
                      </td>
                      <td className={cn(tdBase, "text-left align-top")}>
                        <p className="break-words leading-snug [overflow-wrap:anywhere]">
                          {row.message}
                        </p>
                      </td>
                      <td
                        className={cn(
                          tdBase,
                          "w-[4.75rem] px-2 text-center align-middle"
                        )}
                      >
                        <button
                          type="button"
                          aria-label={`Delete inquiry from ${row.fullName}`}
                          onClick={() => deleteContactInquiry(row.id)}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/8 text-red-700 transition-colors hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 dark:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5 shrink-0" aria-hidden />
                          <span className="sr-only">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
