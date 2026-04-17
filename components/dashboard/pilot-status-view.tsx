"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type DutyStatus = "ACTIVE" | "INACTIVE";

type PilotRow = {
  id: string;
  name: string;
  certLevel: number;
  experienceYears: number;
  experienceRank: string;
  flightCount: number;
  dutyStatus: DutyStatus;
  lastDate: string;
  lastTimeUtc: string;
};

const KPI = {
  totalRegistered: 84,
  totalDelta: "+4 this month",
  currentlyActive: 52,
  inactiveOnLeave: 12,
  inactiveDelta: "14% decrease",
  pendingApproval: 20,
} as const;

const SEED_ROWS: PilotRow[] = [
  {
    id: "AE-9042",
    name: "Capt. Sarah Chen",
    certLevel: 5,
    experienceYears: 8,
    experienceRank: "Commercial Master",
    flightCount: 142,
    dutyStatus: "ACTIVE",
    lastDate: "Oct 24, 2024",
    lastTimeUtc: "14:22 UTC",
  },
  {
    id: "AE-8112",
    name: "Marcus Thorne",
    certLevel: 4,
    experienceYears: 5,
    experienceRank: "Logistics Spec.",
    flightCount: 98,
    dutyStatus: "INACTIVE",
    lastDate: "Oct 12, 2024",
    lastTimeUtc: "09:15 UTC",
  },
  {
    id: "AE-2201",
    name: "Lt. Elena Kovac",
    certLevel: 5,
    experienceYears: 10,
    experienceRank: "Senior Commander",
    flightCount: 205,
    dutyStatus: "ACTIVE",
    lastDate: "Oct 23, 2024",
    lastTimeUtc: "22:10 UTC",
  },
  {
    id: "AE-5531",
    name: "Capt. James Orion",
    certLevel: 3,
    experienceYears: 4,
    experienceRank: "Fleet Support",
    flightCount: 76,
    dutyStatus: "INACTIVE",
    lastDate: "Oct 22, 2024",
    lastTimeUtc: "11:05 UTC",
  },
];

function buildFleetRows(): PilotRow[] {
  const extra: PilotRow[] = [];
  for (let i = 5; i <= 84; i++) {
    const duty: DutyStatus = i % 3 === 0 ? "INACTIVE" : "ACTIVE";
    extra.push({
      id: `AE-${String(7000 + i).padStart(4, "0")}`,
      name: i % 5 === 0 ? `Cmdr. Alex Row ${i}` : `Lt. Pilot ${i}`,
      certLevel: (i % 3) + 3,
      experienceYears: 2 + (i % 12),
      experienceRank:
        i % 4 === 0
          ? "Fleet Support"
          : i % 4 === 1
            ? "Commercial Master"
            : i % 4 === 2
              ? "Logistics Spec."
              : "Senior Commander",
      flightCount: 40 + (i % 200),
      dutyStatus: duty,
      lastDate: "Oct 20, 2024",
      lastTimeUtc: `${String(8 + (i % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")} UTC`,
    });
  }
  return [...SEED_ROWS, ...extra];
}

const ALL_ROWS = buildFleetRows();

const PAGE_SIZE = 4;

type FilterTab = "all" | "active" | "inactive";

function CertificationBadge({ level }: { level: number }) {
  const high = level >= 5;
  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
        high
          ? "border-[#006a6e]/20 bg-[#006a6e]/10 text-[#006a6e]"
          : level === 4
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : "border-slate-200 bg-slate-100 text-slate-500"
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
          ? "bg-green-50 text-green-600"
          : "bg-slate-50 text-slate-400"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-green-500" : "bg-slate-300"
        )}
      />
      {status}
    </span>
  );
}

export function PilotStatusView() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    return ALL_ROWS.filter((row) => {
      if (filter === "active" && row.dutyStatus !== "ACTIVE") return false;
      if (filter === "inactive" && row.dutyStatus !== "INACTIVE")
        return false;
      return true;
    });
  }, [filter]);

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

  useEffect(() => {
    setPage(1);
  }, [filter]);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.14] [background-image:radial-gradient(circle,#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-7xl px-0 pb-2 pt-0 lg:px-2">
        <div className="mb-8 md:mb-10">
          <h1 className="font-[family-name:var(--font-landing-headline)] text-3xl font-bold tracking-tighter text-[#1a1c1e] sm:text-4xl">
            Pilot Status
          </h1>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:mb-10 lg:grid-cols-4">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
            <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Total registered
            </span>
            <div className="flex items-end gap-3">
              <span className="font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e]">
                {KPI.totalRegistered}
              </span>
              <span className="mb-1 font-mono text-xs font-bold text-[#006a6e]">
                {KPI.totalDelta}
              </span>
            </div>
          </div>
          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
            <div className="absolute -right-4 -top-4 size-20 rounded-full bg-green-50 blur-2xl" />
            <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Currently active
            </span>
            <div className="flex items-end gap-3">
              <span className="font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e]">
                {KPI.currentlyActive}
              </span>
              <span className="mb-1 flex items-center text-[10px] font-bold text-[#1a1c1e]">
                <span className="mr-2 size-2 animate-pulse rounded-full bg-[#1a1c1e]" />
                IN-FLIGHT
              </span>
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
            <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Inactive / On-leave
            </span>
            <div className="flex items-end gap-3">
              <span className="font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e]">
                {KPI.inactiveOnLeave}
              </span>
              <span className="mb-1 font-mono text-xs text-slate-400">
                {KPI.inactiveDelta}
              </span>
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-[#006a6e]/20 bg-slate-50/50 p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
            <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Pending approval
            </span>
            <div className="flex items-end gap-3">
              <span className="font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e]">
                {KPI.pendingApproval}
              </span>
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#1a1c1e]">
                Needs review
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="pilot-status-filter">
            Duty status
          </label>
          <div className="relative w-full max-w-[9.5rem] sm:ml-auto sm:w-auto">
            <select
              id="pilot-status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterTab)}
              className="w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs font-medium text-[#1a1c1e] shadow-sm outline-none transition hover:border-slate-300 focus:border-[#006a6e] focus:ring-1 focus:ring-[#006a6e]/25"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {[
                    "Pilot personnel",
                    "Certification",
                    "Experience",
                    "Flight record",
                    "Duty status",
                    "Last telemetry",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 font-[family-name:var(--font-landing-headline)] text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No pilots match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-[#1a1c1e]">
                          {row.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-tighter text-slate-400">
                          ID: {row.id}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <CertificationBadge level={row.certLevel} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-medium text-[#1a1c1e]">
                          {row.experienceYears} Years
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.experienceRank}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-sm text-[#1a1c1e]">
                        {row.flightCount} Flights
                      </td>
                      <td className="px-6 py-5">
                        <DutyBadge status={row.dutyStatus} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-medium text-[#1a1c1e]">
                          {row.lastDate}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.lastTimeUtc}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          className="rounded p-1 text-slate-400 transition hover:text-[#006a6e]"
                          aria-label={`Actions for ${row.name}`}
                        >
                          <MoreHorizontal className="size-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-200 bg-white p-1.5 text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 hover:text-[#006a6e]"
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
                          : "border border-slate-200 bg-white text-slate-500 hover:text-[#006a6e]"
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
                className="rounded border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:text-[#006a6e] disabled:cursor-not-allowed disabled:opacity-50"
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
