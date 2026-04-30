"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getPilots } from "@/app/services/pilotServices";
import { apiUrl } from "@/lib/api-url";
import {
  flightHoursFromPilotRow,
  missionsCompletedFromPilotRow,
} from "@/lib/pilot-db-metrics";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

type DutyStatus = "ACTIVE" | "INACTIVE";

type PilotRow = {
  id: string;
  name: string;
  certLevel: number;
  flightHours: number;
  flightCount: number;
  dutyStatus: DutyStatus;
};

const PAGE_SIZE = 4;

type FilterTab = "all" | "active" | "inactive";

function CertificationBadge({ level }: { level: number }) {
  const high = level >= 5;
  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
        high
          ? "border-[#006a6e]/20 bg-[#006a6e]/10 text-[#006a6e] dark:border-white/25 dark:bg-white/10 dark:text-white"
          : level === 4
            ? "border-border bg-muted text-muted-foreground dark:text-white"
            : "border-border bg-muted text-muted-foreground/90 dark:text-white"
      )}
    >
      LEVEL {level}
    </div>
  );
}

function DutyBadge({ status }: { status: DutyStatus }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        active
          ? "bg-green-50 text-green-600 dark:bg-white/10 dark:text-white"
          : "bg-muted/40 text-muted-foreground/70 dark:bg-white/10 dark:text-white"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-green-500 dark:bg-white" : "bg-muted-foreground/40 dark:bg-white/70"
        )}
      />
      {status}
    </span>
  );
}

export function PilotStatusView({
  showPageTitle = true,
}: {
  showPageTitle?: boolean;
} = {}) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [apiPilots, setApiPilots] = useState<PilotRow[]>([]);
  /** `SELECT COUNT(*) FROM pilots` — preferred over `apiPilots.length` for the KPI. */
  const [totalPilotsFromDb, setTotalPilotsFromDb] = useState<number | null>(
    null
  );
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    return apiPilots.filter((row) => {
      if (filter === "active" && row.dutyStatus !== "ACTIVE") return false;
      if (filter === "inactive" && row.dutyStatus !== "INACTIVE")
        return false;
      return true;
    });
  }, [apiPilots, filter]);

  const totalFiltered = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  const pageNumbers = useMemo(() => {
    const maxShow = 5;
    if (totalPages <= maxShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, page - Math.floor(maxShow / 2));
    let end = Math.min(totalPages, start + maxShow - 1);
    start = Math.max(1, end - maxShow + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const kpi = useMemo(() => {
    const totalRegistered = totalPilotsFromDb ?? apiPilots.length;
    const currentlyActive = apiPilots.filter(
      (p) => p.dutyStatus === "ACTIVE"
    ).length;
    const inactiveOnLeave = Math.max(0, totalRegistered - currentlyActive);
    return {
      totalRegistered,
      currentlyActive,
      inactiveOnLeave,
    };
  }, [apiPilots, totalPilotsFromDb]);

  useEffect(() => {
    const fetchPilots = async () => {
      const data = await getPilots();
      const rows: Record<string, unknown>[] = data != null && Array.isArray(data) ? (data as Record<string, unknown>[]) : [];

      // map backend data -> UI format and derive status counts from available fields
      const formatted = rows.map((pilot) => {
        const rawStatus = String(
          pilot.duty_status ?? pilot.dutyStatus ?? pilot.status ?? "ACTIVE"
        ).toUpperCase();
        const dutyStatus: DutyStatus =
          rawStatus === "INACTIVE" ||
          rawStatus === "OFFLINE" ||
          rawStatus === "ON_LEAVE"
            ? "INACTIVE"
            : "ACTIVE";
        return {
          id: pilot.id?.toString() || "",
          name: String(pilot.name ?? "Unknown pilot"),
          certLevel: Number(pilot.cert_level ?? 3),
          flightHours: flightHoursFromPilotRow(pilot),
          flightCount: missionsCompletedFromPilotRow(pilot),
          dutyStatus,
        };
      });

      setApiPilots(formatted);
    };
  
    fetchPilots();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/pilots/total-count"), {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data: unknown = await res.json();
        if (
          data &&
          typeof data === "object" &&
          "count" in data &&
          typeof (data as { count: unknown }).count === "number"
        ) {
          const n = Number((data as { count: number }).count);
          if (!cancelled && Number.isFinite(n)) setTotalPilotsFromDb(n);
        }
      } catch {
        /* keep null; KPI falls back to apiPilots.length */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  return (
    <div className="relative text-foreground dark:text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-0 pb-2 pt-0 lg:px-2">
        {showPageTitle ? (
          <div className="mb-8 md:mb-10">
            <h1 className={ADMIN_PAGE_TITLE_CLASS}>Pilot Status</h1>
          </div>
        ) : (
          <div className="mb-5 md:mb-6" />
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:mb-10 lg:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 dark:text-white/90">
              Total registered
            </span>
            <div className="flex items-end">
              <span className="font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e] dark:text-white">
                {kpi.totalRegistered}
              </span>
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 dark:text-white/90">
              Currently active
            </span>
            <div className="flex items-end">
              <span className="font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e] dark:text-white">
                {kpi.currentlyActive}
              </span>
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 dark:text-white/90">
              Inactive / On-leave
            </span>
            <div className="flex items-end">
              <span className="font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e] dark:text-white">
                {kpi.inactiveOnLeave}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <label className="sr-only" htmlFor="pilot-status-filter">
            Duty status
          </label>
          <div className="relative w-full max-w-[9.5rem] sm:w-auto">
            <select
              id="pilot-status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterTab)}
              className="w-full cursor-pointer appearance-none rounded-md border border-border bg-transparent py-1.5 pl-2 pr-7 text-xs font-medium text-foreground outline-none transition hover:border-muted-foreground/40 focus-visible:border-[#006a6e] focus-visible:ring-1 focus-visible:ring-[#006a6e]/25 dark:text-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/80 dark:text-white"
              aria-hidden
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    "Pilot personnel",
                    "Certification",
                    "Flight hours",
                    "Missions",
                    "Duty status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 font-[family-name:var(--font-landing-headline)] text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground dark:text-white"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-white"
                    >
                      No pilots match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-[#1a1c1e] dark:text-white">
                          {row.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-tighter text-muted-foreground/80 dark:text-white/85">
                          ID: {row.id}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <CertificationBadge level={row.certLevel} />
                      </td>
                      <td className="px-6 py-5 font-mono text-sm tabular-nums text-[#1a1c1e] dark:text-white">
                        {row.flightHours.toLocaleString("en-US")} hrs
                      </td>
                      <td className="px-6 py-5 font-mono text-sm text-[#1a1c1e] dark:text-white">
                        {row.flightCount.toLocaleString("en-US")} completed
                      </td>
                      <td className="px-6 py-5">
                        <DutyBadge status={row.dutyStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-border bg-card p-1.5 text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-50 hover:text-[#006a6e] dark:text-white dark:hover:text-white"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-[18px]" />
              </button>
              <div className="flex gap-1">
                {pageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "size-8 rounded text-xs font-bold transition-colors",
                        p === page
                          ? "bg-[#006a6e] text-white shadow-sm"
                          : "border border-border bg-card text-muted-foreground hover:text-[#006a6e] dark:text-white dark:hover:text-white"
                      )}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  ))}
              </div>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                className="rounded border border-border bg-card p-1.5 text-muted-foreground/80 transition hover:text-[#006a6e] disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:hover:text-white"
                aria-label="Next page"
              >
                <ChevronRight className="size-[18px]" />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
