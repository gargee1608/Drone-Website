"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { apiUrl } from "@/lib/api-url";
import { jwtPayloadPilotFullName, jwtPayloadSub } from "@/lib/pilot-display-name";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";

const COMPLETED_MISSION_PREVIEW_KEY = "aerolaminar_completed_mission_preview_v1";

type DeliveryRow = {
  id: string;
  rowCtid: string;
  pilotSub: string;
  missionId: string;
  assignedAt: string;
  completedAt: string;
  customer: string;
  service: string;
  dropoff: string;
  pilot: string;
  droneUnit: string;
  status: string;
};

type BackendMissionRow = {
  id?: number | string;
  row_ctid?: string;
  pilot_sub?: string;
  request_ref?: string;
  customer?: string;
  service?: string;
  dropoff?: string;
  pilot_name?: string;
  drone_model?: string;
  assigned_at?: string;
  completed_at?: string;
  status?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

function formatDateTime(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

const PAGE_SIZE = 4;

function dedupeDeliveryRows(rows: DeliveryRow[]): DeliveryRow[] {
  const bySignature = new Map<string, DeliveryRow>();
  const order: string[] = [];
  const timeValue = (v: string) => {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  const completenessScore = (row: DeliveryRow) =>
    [
      row.customer,
      row.service,
      row.dropoff,
      row.pilot,
      row.droneUnit,
      row.assignedAt,
      row.completedAt,
    ].filter((v) => v && v !== "—").length;

  const out: DeliveryRow[] = [];
  for (const row of rows) {
    const key = [
      row.missionId.trim().toLowerCase(),
      row.customer.trim().toLowerCase(),
      row.service.trim().toLowerCase(),
      row.dropoff.trim().toLowerCase(),
      row.pilot.trim().toLowerCase(),
      row.droneUnit.trim().toLowerCase(),
    ].join("::");

    const prev = bySignature.get(key);
    if (!prev) {
      bySignature.set(key, row);
      order.push(key);
      continue;
    }

    const prevTime = Math.max(timeValue(prev.completedAt), timeValue(prev.assignedAt));
    const nextTime = Math.max(timeValue(row.completedAt), timeValue(row.assignedAt));
    const prevScore = completenessScore(prev);
    const nextScore = completenessScore(row);

    if (nextScore > prevScore || nextTime > prevTime) {
      bySignature.set(key, row);
    }
  }

  for (const key of order) {
    const row = bySignature.get(key);
    if (row) out.push(row);
  }
  return out;
}

function readCompletedMissionPreview(expectedPilotSub?: string | null): DeliveryRow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COMPLETED_MISSION_PREVIEW_KEY);
    if (!raw) return null;
    // One-time bridge row: consume once to avoid cross-login leakage.
    sessionStorage.removeItem(COMPLETED_MISSION_PREVIEW_KEY);
    const parsed = JSON.parse(raw) as Partial<DeliveryRow> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const parsedPilotSub = String(parsed.pilotSub ?? "").trim();
    if (expectedPilotSub && parsedPilotSub !== expectedPilotSub) {
      return null;
    }
    return {
      id: String(parsed.id ?? "").trim(),
      rowCtid: String(parsed.rowCtid ?? "").trim(),
      pilotSub: parsedPilotSub,
      missionId: String(parsed.missionId ?? "").trim() || "—",
      assignedAt: String(parsed.assignedAt ?? "").trim(),
      completedAt: String(parsed.completedAt ?? "").trim() || new Date().toISOString(),
      customer: String(parsed.customer ?? "").trim() || "—",
      service: String(parsed.service ?? "").trim() || "—",
      dropoff: String(parsed.dropoff ?? "").trim() || "—",
      pilot: String(parsed.pilot ?? "").trim() || "—",
      droneUnit: String(parsed.droneUnit ?? "").trim() || "—",
      status: String(parsed.status ?? "completed").trim() || "completed",
    };
  } catch {
    return null;
  }
}

export function CompletedDeliveriesView({
  showPageTitle = true,
  pilotScoped = false,
}: {
  showPageTitle?: boolean;
  /** Pilot dashboard: only show rows for the signed-in pilot. */
  pilotScoped?: boolean;
} = {}) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  /** `missions` table count (completed); null until loaded or on error. */
  const [completedDeliveriesDbCount, setCompletedDeliveriesDbCount] = useState<
    number | null
  >(null);
  /** `pilots` table count (duty_status ACTIVE); null until loaded or on error. */
  const [activePilotsDbCount, setActivePilotsDbCount] = useState<number | null>(
    null
  );

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const currentPilotSub = pilotScoped && token ? jwtPayloadSub(token) : null;
    const currentPilotName = pilotScoped && token ? jwtPayloadPilotFullName(token) : null;
    const preview = readCompletedMissionPreview(currentPilotSub);
    if (preview) {
      setRows((prev) => dedupeDeliveryRows([preview, ...prev]));
    }

    let cancelled = false;
    async function loadMissions() {
      setLoading(true);
      try {
        const pilotSub = currentPilotSub;
        const pilotName = currentPilotName?.trim() || "";
        if (pilotScoped && !pilotSub && !pilotName) {
          if (!cancelled) {
            setRows((prev) => (preview ? dedupeDeliveryRows([preview, ...prev]) : []));
          }
          return;
        }
        const endpoint =
          pilotScoped && (pilotSub || pilotName)
            ? apiUrl(
                `/api/missions?pilotSub=${encodeURIComponent(pilotSub ?? "")}&pilotName=${encodeURIComponent(pilotName)}`
              )
            : apiUrl("/api/missions");
        const response = await fetch(endpoint, {
          cache: "no-store",
        });
        if (!response.ok) {
          if (!cancelled) setRows([]);
          return;
        }
        const payload: unknown = await response.json();
        const list = Array.isArray((payload as { data?: unknown[] })?.data)
          ? ((payload as { data?: unknown[] }).data as BackendMissionRow[])
          : [];
        if (cancelled) return;
        const apiRows = list.map((row, i) => ({
            id: String(row.id ?? "").trim(),
            rowCtid: String(row.row_ctid ?? "").trim(),
            pilotSub: String(row.pilot_sub ?? "").trim(),
            missionId:
              String(row.request_ref ?? "").trim() ||
              `MS-${String(row.id ?? i + 1)}`,
            assignedAt: String(row.assigned_at ?? "").trim(),
            completedAt: String(row.completed_at ?? "").trim(),
            customer: String(row.customer ?? "").trim() || "—",
            service: String(row.service ?? "").trim() || "—",
            dropoff: String(row.dropoff ?? "").trim() || "—",
            pilot: String(row.pilot_name ?? "").trim() || "—",
            droneUnit: String(row.drone_model ?? "").trim() || "—",
            status: String(row.status ?? "completed").trim() || "completed",
          }));
        setRows((prev) => dedupeDeliveryRows([...(preview ? [preview] : []), ...apiRows, ...prev]));
      } catch {
        if (!cancelled) {
          setRows((prev) => (preview ? dedupeDeliveryRows([preview, ...prev]) : prev));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadMissions();
    return () => {
      cancelled = true;
    };
  }, [pilotScoped]);

  useEffect(() => {
    let cancelled = false;
    async function loadCompletedCount() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const pilotSub = pilotScoped && token ? jwtPayloadSub(token) : null;
      const pilotName = pilotScoped && token ? jwtPayloadPilotFullName(token) : null;
      const nameTrim = pilotName?.trim() || "";

      if (pilotScoped && !pilotSub && !nameTrim) {
        if (!cancelled) setCompletedDeliveriesDbCount(0);
        return;
      }

      const url =
        pilotScoped && (pilotSub || nameTrim)
          ? apiUrl(
              `/api/missions/completed-deliveries-count?pilotSub=${encodeURIComponent(pilotSub ?? "")}&pilotName=${encodeURIComponent(nameTrim)}`
            )
          : apiUrl("/api/missions/completed-deliveries-count");

      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("bad response");
        const payload: unknown = await response.json();
        const raw =
          payload &&
          typeof payload === "object" &&
          "count" in payload &&
          (payload as { count: unknown }).count;
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!cancelled) {
          setCompletedDeliveriesDbCount(Number.isFinite(n) ? n : null);
        }
      } catch {
        if (!cancelled) setCompletedDeliveriesDbCount(null);
      }
    }
    void loadCompletedCount();
    return () => {
      cancelled = true;
    };
  }, [pilotScoped]);

  useEffect(() => {
    let cancelled = false;
    async function loadActivePilotsCount() {
      try {
        const response = await fetch(apiUrl("/api/pilots/active-count"), {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("bad response");
        const payload: unknown = await response.json();
        const raw =
          payload &&
          typeof payload === "object" &&
          "count" in payload &&
          (payload as { count: unknown }).count;
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!cancelled) {
          setActivePilotsDbCount(Number.isFinite(n) ? n : null);
        }
      } catch {
        if (!cancelled) setActivePilotsDbCount(null);
      }
    }
    void loadActivePilotsCount();
    return () => {
      cancelled = true;
    };
  }, [pilotScoped]);

  const filteredRows = useMemo(() => rows, [rows]);

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

  const completedDeliveriesStat =
    completedDeliveriesDbCount !== null
      ? completedDeliveriesDbCount
      : filteredRows.length;

  const uniquePilotsFromRows = new Set(
    filteredRows.map((row) => row.pilot).filter((name) => name !== "—")
  ).size;
  const activePilotsStat =
    activePilotsDbCount !== null ? activePilotsDbCount : uniquePilotsFromRows;

  function handleExportCsv() {
    const header = [
      "Request ID",
      "User Requirement",
      "Service",
      "Drone",
      "Pilot Name",
      "Assigned At",
      "Destination",
      "Completed At",
      "Status",
    ];
    const body = filteredRows.map((row) => [
      row.missionId,
      row.customer,
      row.service,
      row.droneUnit,
      row.pilot,
      formatDateTime(row.assignedAt),
      row.dropoff,
      formatDateTime(row.completedAt),
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
      <header className="mb-5">
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
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <article className="mx-auto w-full max-w-[250px] rounded-lg border border-border bg-card px-4 py-3.5 text-center shadow-sm dark:border-white/20">
            <p className="font-[family-name:var(--font-landing-headline)] text-[10px] font-normal uppercase tracking-[0.13em] text-muted-foreground dark:text-white">
              Total Deliveries
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-landing-headline)] text-[1.9rem] font-normal leading-none tracking-tight text-foreground sm:text-[2rem] dark:text-white">
              {formatNumber(filteredRows.length)}
            </p>
          </article>

          <article className="mx-auto w-full max-w-[250px] rounded-lg border border-border bg-card px-4 py-3.5 text-center shadow-sm dark:border-white/20">
            <p className="font-[family-name:var(--font-landing-headline)] text-[10px] font-normal uppercase tracking-[0.13em] text-muted-foreground dark:text-white">
              Completed Deliveries
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-landing-headline)] text-[1.9rem] font-normal leading-none tracking-tight text-foreground sm:text-[2rem] dark:text-white">
              {formatNumber(completedDeliveriesStat)}
            </p>
          </article>

          <article className="mx-auto w-full max-w-[250px] rounded-lg border border-border bg-card px-4 py-3.5 text-center shadow-sm dark:border-white/20">
            <p className="font-[family-name:var(--font-landing-headline)] text-[10px] font-normal uppercase tracking-[0.13em] text-muted-foreground dark:text-white">
              Active Pilots
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-landing-headline)] text-[1.9rem] font-normal leading-none tracking-tight text-foreground sm:text-[2rem] dark:text-white">
              {formatNumber(activePilotsStat)}
            </p>
          </article>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-card shadow-sm dark:border-white/20">
        <div className="p-4 sm:p-6">
          <div className="overflow-hidden">
            <table className="w-full table-fixed border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/50 dark:border-white/20 dark:bg-white/10">
                  {[
                    "Request ID",
                    "User Requirement",
                    "Service",
                    "Drone",
                    "Pilot Name",
                    "Assigned At",
                    "Destination",
                    "Completed At",
                    "Status",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-4 font-[family-name:var(--font-landing-headline)] text-[9px] font-normal uppercase tracking-[0.12em] text-muted-foreground dark:text-white"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-xs text-muted-foreground dark:text-white"
                    >
                      Loading completed missions...
                    </td>
                  </tr>
                ) : null}
                {paginatedRows.map((row) => (
                  <tr
                    key={`${row.missionId}-${row.completedAt}`}
                    className="group transition-colors hover:bg-muted/50/80"
                  >
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm font-normal tracking-wider text-[#006a6e]">
                        {row.missionId}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground dark:text-white">
                      {row.customer}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground dark:text-white">
                      {row.service}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground dark:text-white">
                      {row.droneUnit}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground dark:text-white">
                      {row.pilot}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground dark:text-white">
                      {formatDateTime(row.assignedAt)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground dark:text-white">{row.dropoff}</td>
                    <td className="px-4 py-4 text-foreground dark:text-white">
                      {formatDateTime(row.completedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[9px] font-normal uppercase tracking-wider text-green-700 dark:border-white/40 dark:bg-transparent dark:text-white"
                      >
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-xs text-muted-foreground dark:text-white"
                    >
                      No completed missions yet.
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
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:bg-muted disabled:text-muted-foreground/80 dark:border-white/25 dark:text-white dark:disabled:bg-white/10 dark:disabled:text-white/60"
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
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50 dark:border-white/25 dark:text-white dark:hover:bg-white/10"
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
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:bg-muted disabled:text-muted-foreground/80 dark:border-white/25 dark:text-white dark:disabled:bg-white/10 dark:disabled:text-white/60"
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

