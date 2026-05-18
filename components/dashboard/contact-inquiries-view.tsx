"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Mail, Trash2 } from "lucide-react";

import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import {
  CONTACT_INQUIRIES_UPDATED_EVENT,
  deleteContactInquiry,
  loadContactInquiries,
  type ContactInquiry,
} from "@/lib/contact-inquiries";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

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
    <div className="mx-auto w-full max-w-4xl pb-8">
      <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "mb-8")}>Contact inquiries</h1>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
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
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              id={`contact-inquiry-${row.id}`}
              className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-2">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {row.fullName}
                  </p>
                  <a
                    href={`mailto:${encodeURIComponent(row.email)}`}
                    className="text-sm text-[#008B8B] no-underline hover:underline"
                  >
                    {row.email}
                  </a>
                </div>
                <div>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={row.createdAt}
                  >
                    {formatWhen(row.createdAt)}
                  </time>
                </div>
              </div>
              <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                {row.phone?.trim() ? (
                  <div>
                    <dt className="font-semibold text-muted-foreground">Phone</dt>
                    <dd>{row.phone}</dd>
                  </div>
                ) : null}
                {row.company?.trim() ? (
                  <div>
                    <dt className="font-semibold text-muted-foreground">Company</dt>
                    <dd>{row.company}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-3 flex items-start justify-between gap-3">
                <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {row.message}
                </p>
                <button
                  type="button"
                  aria-label={`Delete inquiry from ${row.fullName}`}
                  onClick={() => deleteContactInquiry(row.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
