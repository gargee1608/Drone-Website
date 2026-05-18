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
import {
  buildRequestOwnerLookup,
  type RequestOwnerInfo,
  resolveRequestOwnerDisplay,
} from "@/lib/user-requests";

const COMPLETED_MISSION_PREVIEW_KEY = "aerolaminar_completed_mission_preview_v1";

type DeliveryRow = {
  id: string;
  rowCtid: string;
  pilotSub: string;
  missionId: string;
  assignedAt: string;
  completedAt: string;
  userName: string;
  userEmail: string;
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
  user_name?: string;
  user_email?: string;
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

const PAGE_SIZE = 1000;

function mapBackendMissionToDeliveryRow(
  row: BackendMissionRow,
  index: number,
  ownerLookup?: Map<string, RequestOwnerInfo>
): DeliveryRow {
  const missionId =
    String(row.request_ref ?? "").trim() ||
    `MS-${String(row.id ?? index + 1)}`;
  const storedName = String(row.user_name ?? "").trim();
  const storedEmail = String(row.user_email ?? "").trim().toLowerCase();
  const owner = resolveRequestOwnerDisplay(missionId, ownerLookup);
  return {
    id: String(row.id ?? "").trim(),
    rowCtid: String(row.row_ctid ?? "").trim(),
    pilotSub: String(row.pilot_sub ?? "").trim(),
    missionId,
    assignedAt: String(row.assigned_at ?? "").trim(),
    completedAt: String(row.completed_at ?? "").trim(),
    userName: storedName || owner.userName,
    userEmail: storedEmail || owner.userEmail,
    customer: String(row.customer ?? "").trim() || "—",
    service: String(row.service ?? "").trim() || "—",
    dropoff: String(row.dropoff ?? "").trim() || "—",
    pilot: String(row.pilot_name ?? "").trim() || "—",
    droneUnit: String(row.drone_model ?? "").trim() || "—",
    status: String(row.status ?? "completed").trim() || "completed",
  };
}

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
    const missionId = String(parsed.missionId ?? "").trim() || "—";
    const owner = resolveRequestOwnerDisplay(missionId);
    return {
      id: String(parsed.id ?? "").trim(),
      rowCtid: String(parsed.rowCtid ?? "").trim(),
      pilotSub: parsedPilotSub,
      missionId,
      assignedAt: String(parsed.assignedAt ?? "").trim(),
      completedAt: String(parsed.completedAt ?? "").trim() || new Date().toISOString(),
      userName: String(parsed.userName ?? "").trim() || owner.userName,
      userEmail: String(parsed.userEmail ?? "").trim() || owner.userEmail,
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
        const missionsEndpoint =
          pilotScoped && (pilotSub || pilotName)
            ? apiUrl(
                `/api/missions?pilotSub=${encodeURIComponent(pilotSub ?? "")}&pilotName=${encodeURIComponent(pilotName)}`
              )
            : apiUrl("/api/missions");

        const [missionsRes, requestsRes] = await Promise.all([
          fetch(missionsEndpoint, { cache: "no-store" }),
          fetch(apiUrl("/api/requests"), { cache: "no-store" }),
        ]);

        if (!missionsRes.ok) {
          if (!cancelled) setRows([]);
          return;
        }

        let ownerLookup: Map<string, RequestOwnerInfo> | undefined;
        if (requestsRes.ok) {
          const requestsPayload: unknown = await requestsRes.json();
          const requestRows = Array.isArray(
            (requestsPayload as { data?: unknown[] })?.data
          )
            ? ((requestsPayload as { data?: unknown[] }).data as Array<{
                id?: number | string;
                client_request_id?: string | null;
                user_name?: string | null;
                user_email?: string | null;
              }>)
            : [];
          ownerLookup = buildRequestOwnerLookup(requestRows);
        }

        const payload: unknown = await missionsRes.json();
        const list = Array.isArray((payload as { data?: unknown[] })?.data)
          ? ((payload as { data?: unknown[] }).data as BackendMissionRow[])
          : [];
        if (cancelled) return;
        const apiRows = list.map((row, i) =>
          mapBackendMissionToDeliveryRow(row, i, ownerLookup)
        );
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
      "User Name",
      "User Email Id",
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
      row.userName,
      row.userEmail,
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
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <article className="mx-auto w-full max-w-[200px] rounded-lg border border-border bg-card px-3 py-2.5 text-center shadow-sm dark:border-white/20">
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground/80 dark:text-white/90">
              Total Deliveries
            </p>
            <p className="mt-1 font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e] dark:text-white">
              {formatNumber(filteredRows.length)}
            </p>
          </article>

          <article className="mx-auto w-full max-w-[200px] rounded-lg border border-border bg-card px-3 py-2.5 text-center shadow-sm dark:border-white/20">
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground/80 dark:text-white/90">
              Completed Deliveries
            </p>
            <p className="mt-1 font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e] dark:text-white">
              {formatNumber(completedDeliveriesStat)}
            </p>
          </article>

          <article className="mx-auto w-full max-w-[200px] rounded-lg border border-border bg-card px-3 py-2.5 text-center shadow-sm dark:border-white/20">
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground/80 dark:text-white/90">
              Active Pilots
            </p>
            <p className="mt-1 font-[family-name:var(--font-landing-headline)] text-4xl font-bold text-[#1a1c1e] dark:text-white">
              {formatNumber(activePilotsStat)}
            </p>
          </article>
        </div>
      </header>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground dark:border-white/20 dark:text-white">
            Loading completed missions...
          </div>
        ) : paginatedRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground dark:border-white/20 dark:text-white">
            No completed missions yet.
          </div>
        ) : (
          paginatedRows.map((row) => (
            <article
              key={`${row.missionId}-${row.completedAt}`}
              className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm dark:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#008B8B]">
                    Completed Mission
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-foreground">
                    {row.userName !== "—" ? row.userName : "Mission"}
                  </h3>
                  {row.userEmail !== "—" ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {row.userEmail}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700 dark:border-sky-400/40 dark:bg-sky-950/30 dark:text-sky-300">
                  Completed
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    User Name:
                  </span>{" "}
                  {row.userName}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    User Email Id:
                  </span>{" "}
                  {row.userEmail}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Request ID:
                  </span>{" "}
                  {row.missionId}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75 sm:col-span-2">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    User Requirement:
                  </span>{" "}
                  {row.customer}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Service:
                  </span>{" "}
                  {row.service || "—"}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Drone:
                  </span>{" "}
                  {row.droneUnit || "—"}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Pilot:
                  </span>{" "}
                  {row.pilot || "—"}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Assigned At:
                  </span>{" "}
                  {formatDateTime(row.assignedAt)}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Completed At:
                  </span>{" "}
                  {formatDateTime(row.completedAt)}
                </p>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 text-sm text-[#2d4f53] dark:text-white/85">
                <span className="font-semibold">Destination:</span> {row.dropoff || "Destination TBD"}
              </div>
            </article>
          ))
        )}
      </section>

    </section>
  );
}

