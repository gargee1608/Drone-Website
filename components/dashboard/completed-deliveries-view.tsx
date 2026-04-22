"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";

type MissionStatus = "Success" | "Partial" | "Delayed";

type DeliveryRow = {
  missionId: string;
  executionDate: string; // ISO date
  payload: string;
  distanceKm: number;
  pilot: string;
  droneUnit: string;
  status: MissionStatus;
};

const ROWS: DeliveryRow[] = [
  {
    missionId: "MS-4092",
    executionDate: "2024-10-24",
    payload: "12.0 kg",
    distanceKm: 42,
    pilot: "Capt. Sarah Chen",
    droneUnit: "Atlas H2",
    status: "Success",
  },
  {
    missionId: "MS-4089",
    executionDate: "2024-10-23",
    payload: "8.5 kg",
    distanceKm: 118,
    pilot: "Cmdr. Marcus Vane",
    droneUnit: "Specter X-1",
    status: "Success",
  },
  {
    missionId: "MS-4085",
    executionDate: "2024-10-23",
    payload: "24.1 kg",
    distanceKm: 12,
    pilot: "Lt. Elena Kovac",
    droneUnit: "Titan Cargo",
    status: "Success",
  },
  {
    missionId: "MS-4081",
    executionDate: "2024-10-22",
    payload: "3.0 kg",
    distanceKm: 204,
    pilot: "Capt. James Orion",
    droneUnit: "Falcon SV",
    status: "Success",
  },
  {
    missionId: "MS-4079",
    executionDate: "2024-10-21",
    payload: "6.3 kg",
    distanceKm: 88,
    pilot: "Capt. Sarah Chen",
    droneUnit: "Atlas H2",
    status: "Partial",
  },
  {
    missionId: "MS-4076",
    executionDate: "2024-10-20",
    payload: "11.7 kg",
    distanceKm: 61,
    pilot: "Cmdr. Marcus Vane",
    droneUnit: "Specter X-1",
    status: "Success",
  },
  {
    missionId: "MS-4071",
    executionDate: "2024-10-18",
    payload: "5.1 kg",
    distanceKm: 97,
    pilot: "Lt. Elena Kovac",
    droneUnit: "Titan Cargo",
    status: "Delayed",
  },
  {
    missionId: "MS-4068",
    executionDate: "2024-10-16",
    payload: "9.8 kg",
    distanceKm: 36,
    pilot: "Capt. James Orion",
    droneUnit: "Falcon SV",
    status: "Success",
  },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

const PAGE_SIZE = 4;

export function CompletedDeliveriesView({
  showPageTitle = true,
}: {
  showPageTitle?: boolean;
} = {}) {
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => ROWS, []);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, []);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const totalDistance = filteredRows.reduce((sum, row) => sum + row.distanceKm, 0);
  const successfulCount = filteredRows.filter((row) => row.status === "Success").length;
  const reliability = filteredRows.length
    ? ((successfulCount / filteredRows.length) * 100).toFixed(1)
    : "0.0";

  function handleExportCsv() {
    const header = [
      "Mission ID",
      "Execution Date",
      "Payload",
      "Distance (km)",
      "Assigned Pilot",
      "Drone Unit",
      "Mission Status",
    ];
    const body = filteredRows.map((row) => [
      row.missionId,
      dateFormatter.format(new Date(`${row.executionDate}T00:00:00`)),
      row.payload,
      String(row.distanceKm),
      row.pilot,
      row.droneUnit,
      row.status,
    ]);
    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "completed-deliveries.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className="rounded-2xl bg-card px-4 pb-4 pt-0 sm:px-6 sm:pb-6 sm:pt-0"
      style={{
        backgroundImage: "radial-gradient(#e2e8f0 0.5px, transparent 0.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      <header className="mb-6">
        <div
          className={`flex flex-wrap items-end justify-between gap-3 ${showPageTitle ? "mb-6" : "mb-4"}`}
        >
          <div>
            {showPageTitle ? (
              <h1 className={ADMIN_PAGE_TITLE_CLASS}>Completed Deliveries</h1>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
            <p className="font-[family-name:var(--font-landing-headline)] text-[11px] font-normal uppercase tracking-[0.15em] text-muted-foreground">
              Total Deliveries
            </p>
            <p className="mt-2 font-[family-name:var(--font-landing-headline)] text-4xl font-normal tracking-tight text-foreground">
              {formatNumber(filteredRows.length)}
            </p>
            <p className="mt-2 text-xs font-normal text-[#0d6200]">
              Showing filtered mission count
            </p>
          </article>

          <article className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
            <p className="font-[family-name:var(--font-landing-headline)] text-[11px] font-normal uppercase tracking-[0.15em] text-muted-foreground">
              Total Distance Flow
            </p>
            <p className="mt-2 font-[family-name:var(--font-landing-headline)] text-4xl font-normal tracking-tight text-foreground">
              {formatNumber(totalDistance)} KM
            </p>
            <p className="mt-2 text-xs font-normal text-[#006a6e]">
              Sum of filtered route distance
            </p>
          </article>

          <article className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
            <p className="font-[family-name:var(--font-landing-headline)] text-[11px] font-normal uppercase tracking-[0.15em] text-muted-foreground">
              Reliability Rate
            </p>
            <p className="mt-2 font-[family-name:var(--font-landing-headline)] text-4xl font-normal tracking-tight text-[#0d6200]">
              {reliability}%
            </p>
            <p className="mt-2 text-xs font-normal text-muted-foreground">
              Success ratio in current filters
            </p>
          </article>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    "Mission ID",
                    "Execution Date",
                    "Payload",
                    "Distance",
                    "Assigned Pilot",
                    "Drone Unit",
                    "Mission Status",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-4 font-[family-name:var(--font-landing-headline)] text-[9px] font-normal uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {head}
                    </th>
                  ))}
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRows.map((row) => (
                  <tr
                    key={row.missionId}
                    className="group transition-colors hover:bg-muted/50/80"
                  >
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm font-normal tracking-wider text-[#006a6e]">
                        {row.missionId}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {dateFormatter.format(new Date(`${row.executionDate}T00:00:00`))}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{row.payload}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {row.distanceKm} km
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      {row.pilot}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {row.droneUnit}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded border px-2 py-0.5 text-[9px] font-normal uppercase tracking-wider ${
                          row.status === "Success"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : row.status === "Partial"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-orange-200 bg-orange-50 text-orange-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground/80 transition hover:text-[#006a6e]"
                        aria-label={`More actions for ${row.missionId}`}
                      >
                        <MoreVertical className="size-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-xs text-muted-foreground"
                    >
                      No missions match your current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:bg-muted disabled:text-muted-foreground/80"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`inline-flex size-8 items-center justify-center rounded-lg border text-sm font-semibold ${
                    p === page
                      ? "border-[#006a6e] bg-[#006a6e] text-white"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                  }`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:bg-muted disabled:text-muted-foreground/80"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>

    </section>
  );
}

