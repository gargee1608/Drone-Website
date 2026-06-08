"use client";

import {
  ClipboardList,
  Clock,
  Download,
  PackageCheck,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { UserRequestStatCard } from "@/components/dashboard/user-request-stat-card";
import { apiUrl } from "@/lib/api-url";
import {
  type BackendDroneHireRequestRow,
  mapBackendRequestToAdminRow,
} from "@/lib/drone-hire-request-admin-map";
import { isProjectRequirementRequest } from "@/lib/project-requests";
import { jwtPayloadPilotFullName, jwtPayloadSub } from "@/lib/pilot-display-name";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import { cn } from "@/lib/utils";
import {
  buildRequestOwnerLookup,
  findStoredUserRequestByAdminRef,
  isUserRequestCompletedDelivery,
  MISSIONS_DB_UPDATED_EVENT,
  normalizeUserMissionAdminStatus,
  notifyMissionsDbUpdated,
  type RequestOwnerInfo,
  resolveRequestOwnerDisplay,
  USER_REQUESTS_UPDATED_EVENT,
  type UserRequestAdminRow,
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

type DeliveryEditForm = {
  requestRef: string;
  userName: string;
  userEmail: string;
  customer: string;
  service: string;
  droneModel: string;
  pilotName: string;
  dropoff: string;
  assignedAt: string;
  completedAt: string;
  status: string;
};

function formatDateTime(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function parseCountPayload(payload: unknown): number | null {
  const raw =
    payload &&
    typeof payload === "object" &&
    "count" in payload &&
    (payload as { count: unknown }).count;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function toDateTimeLocalInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocalInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function deliveryRowToEditForm(row: DeliveryRow): DeliveryEditForm {
  return {
    requestRef: row.missionId === "—" ? "" : row.missionId,
    userName: row.userName === "—" ? "" : row.userName,
    userEmail: row.userEmail === "—" ? "" : row.userEmail,
    customer: row.customer === "—" ? "" : row.customer,
    service: row.service === "—" ? "" : row.service,
    droneModel: row.droneUnit === "—" ? "" : row.droneUnit,
    pilotName: row.pilot === "—" ? "" : row.pilot,
    dropoff: row.dropoff === "—" ? "" : row.dropoff,
    assignedAt: toDateTimeLocalInput(row.assignedAt),
    completedAt: toDateTimeLocalInput(row.completedAt),
    status: row.status || "completed",
  };
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
  const normalizeKeyPart = (value: string) => value.trim().toLowerCase();
  const hasRealValue = (value: string) => {
    const normalized = normalizeKeyPart(value);
    return normalized !== "" && normalized !== "—";
  };
  const canonicalRequestRef = (ref: string) => {
    const trimmed = ref.trim();
    const stored = trimmed ? findStoredUserRequestByAdminRef(trimmed) : undefined;
    return (stored?.backendRequestId || stored?.id || trimmed).trim().toLowerCase();
  };
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
      row.id,
      row.rowCtid,
      row.pilotSub,
    ].filter((v) => v && v !== "—").length;

  const out: DeliveryRow[] = [];
  for (const row of rows) {
    const requestRef = canonicalRequestRef(row.missionId);
    const pilotIdentity = normalizeKeyPart(row.pilotSub) || normalizeKeyPart(row.pilot);
    const key =
      hasRealValue(requestRef) && !requestRef.startsWith("ms-")
        ? `request:${requestRef}::pilot:${pilotIdentity}`
        : [
            requestRef,
            normalizeKeyPart(row.customer),
            normalizeKeyPart(row.service),
            normalizeKeyPart(row.dropoff),
            normalizeKeyPart(row.pilot),
            normalizeKeyPart(row.droneUnit),
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
  /** All `missions` rows (any status); null until loaded or on error. */
  const [totalDeliveriesDbCount, setTotalDeliveriesDbCount] = useState<
    number | null
  >(null);
  /** `missions` table count (completed); null until loaded or on error. */
  const [completedDeliveriesDbCount, setCompletedDeliveriesDbCount] = useState<
    number | null
  >(null);
  const [backendRequests, setBackendRequests] = useState<UserRequestAdminRow[]>(
    []
  );
  const [refreshTick, setRefreshTick] = useState(0);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryRow | null>(null);
  const [deliveryEditForm, setDeliveryEditForm] = useState<DeliveryEditForm>({
    requestRef: "",
    userName: "",
    userEmail: "",
    customer: "",
    service: "",
    droneModel: "",
    pilotName: "",
    dropoff: "",
    assignedAt: "",
    completedAt: "",
    status: "completed",
  });
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryEditError, setDeliveryEditError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const currentPilotSub = pilotScoped && token ? jwtPayloadSub(token) : null;
    const currentPilotName = pilotScoped && token ? jwtPayloadPilotFullName(token) : null;
    const previewRaw = readCompletedMissionPreview(currentPilotSub);
    const preview =
      previewRaw && !isProjectRequirementRequest(previewRaw.missionId)
        ? previewRaw
        : null;
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
        const apiRows = list
          .filter(
            (row) =>
              !isProjectRequirementRequest(String(row.request_ref ?? ""))
          )
          .map((row, i) => mapBackendMissionToDeliveryRow(row, i, ownerLookup));
        setRows((prev) => {
          const optimisticRows = prev.filter((row) => !row.id && !row.rowCtid);
          return dedupeDeliveryRows([
            ...(preview ? [preview] : []),
            ...apiRows,
            ...optimisticRows,
          ]);
        });
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
  }, [pilotScoped, refreshTick]);

  useEffect(() => {
    let cancelled = false;
    async function loadMissionStats() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const pilotSub = pilotScoped && token ? jwtPayloadSub(token) : null;
      const pilotName = pilotScoped && token ? jwtPayloadPilotFullName(token) : null;
      const nameTrim = pilotName?.trim() || "";

      if (pilotScoped && !pilotSub && !nameTrim) {
        if (!cancelled) {
          setTotalDeliveriesDbCount(0);
          setCompletedDeliveriesDbCount(0);
        }
        return;
      }

      const pilotQuery =
        pilotScoped && (pilotSub || nameTrim)
          ? `?pilotSub=${encodeURIComponent(pilotSub ?? "")}&pilotName=${encodeURIComponent(nameTrim)}`
          : "";

      try {
        const [totalRes, completedRes] = await Promise.all([
          fetch(apiUrl(`/api/missions/total-deliveries-count${pilotQuery}`), {
            cache: "no-store",
          }),
          fetch(apiUrl(`/api/missions/completed-deliveries-count${pilotQuery}`), {
            cache: "no-store",
          }),
        ]);

        if (cancelled) return;

        if (totalRes.ok) {
          const payload: unknown = await totalRes.json();
          setTotalDeliveriesDbCount(parseCountPayload(payload));
        } else {
          setTotalDeliveriesDbCount(null);
        }

        if (completedRes.ok) {
          const payload: unknown = await completedRes.json();
          setCompletedDeliveriesDbCount(parseCountPayload(payload));
        } else {
          setCompletedDeliveriesDbCount(null);
        }
      } catch {
        if (!cancelled) {
          setTotalDeliveriesDbCount(null);
          setCompletedDeliveriesDbCount(null);
        }
      }
    }
    void loadMissionStats();
    return () => {
      cancelled = true;
    };
  }, [pilotScoped, refreshTick]);

  useEffect(() => {
    let cancelled = false;
    const loadBackendRequests = async () => {
      try {
        const response = await fetch(apiUrl("/api/requests"), {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const data = Array.isArray((payload as { data?: unknown[] })?.data)
          ? ((payload as { data?: unknown[] }).data as BackendDroneHireRequestRow[])
          : [];
        if (!cancelled) {
          setBackendRequests(
            data
              .filter(
                (row) => !isProjectRequirementRequest(row.client_request_id)
              )
              .map(mapBackendRequestToAdminRow)
          );
        }
      } catch {
        if (!cancelled) setBackendRequests([]);
      }
    };
    void loadBackendRequests();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  useEffect(() => {
    const bump = () => setRefreshTick((n) => n + 1);
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, bump);
    window.addEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    return () => {
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, bump);
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    };
  }, []);

  const requestStats = useMemo(() => {
    let pending = 0;
    let completedDeliveries = 0;
    for (const row of backendRequests) {
      const s = normalizeUserMissionAdminStatus(
        typeof row.adminStatus === "string" ? row.adminStatus : undefined
      );
      const delivered = isUserRequestCompletedDelivery(row);

      if (s === "rejected") {
        /* excluded from workflow buckets; still in total */
      } else if (delivered) {
        completedDeliveries += 1;
      } else if (s === "accepted") {
        /* active / assigned — not shown on this page */
      } else {
        pending += 1;
      }
    }
    return {
      total: backendRequests.length,
      pending,
      completedDeliveries,
    };
  }, [backendRequests]);

  const stats = useMemo(() => {
    if (!pilotScoped) return requestStats;
    const total = totalDeliveriesDbCount ?? 0;
    const completed = completedDeliveriesDbCount ?? 0;
    return {
      total,
      pending: 0,
      completedDeliveries: completed,
    };
  }, [
    pilotScoped,
    requestStats,
    totalDeliveriesDbCount,
    completedDeliveriesDbCount,
  ]);

  const completedDeliveriesDisplay =
    !pilotScoped && completedDeliveriesDbCount !== null
      ? completedDeliveriesDbCount
      : stats.completedDeliveries;

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

  function openDeliveryEdit(row: DeliveryRow) {
    if (!row.id && !row.rowCtid) {
      alert("This completed delivery cannot be edited because it is not linked to a database row.");
      return;
    }
    setEditingDelivery(row);
    setDeliveryEditForm(deliveryRowToEditForm(row));
    setDeliveryEditError(null);
  }

  async function saveDeliveryEdit() {
    if (!editingDelivery) return;
    if (!deliveryEditForm.requestRef.trim()) {
      setDeliveryEditError("Request ID is required.");
      return;
    }
    if (!deliveryEditForm.customer.trim()) {
      setDeliveryEditError("User Requirement is required.");
      return;
    }

    setDeliverySaving(true);
    setDeliveryEditError(null);
    try {
      const response = await fetch(apiUrl("/api/missions"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDelivery.id,
          rowCtid: editingDelivery.rowCtid,
          requestRef: deliveryEditForm.requestRef.trim(),
          userName: deliveryEditForm.userName.trim(),
          userEmail: deliveryEditForm.userEmail.trim(),
          customer: deliveryEditForm.customer.trim(),
          service: deliveryEditForm.service.trim(),
          droneModel: deliveryEditForm.droneModel.trim(),
          pilotName: deliveryEditForm.pilotName.trim(),
          dropoff: deliveryEditForm.dropoff.trim(),
          assignedAt: fromDateTimeLocalInput(deliveryEditForm.assignedAt),
          completedAt: fromDateTimeLocalInput(deliveryEditForm.completedAt),
          status: deliveryEditForm.status.trim() || "completed",
        }),
      });
      if (!response.ok) {
        throw new Error("Could not update completed delivery.");
      }
      setEditingDelivery(null);
      setRefreshTick((n) => n + 1);
      notifyMissionsDbUpdated();
    } catch (error) {
      setDeliveryEditError(
        error instanceof Error ? error.message : "Could not update completed delivery."
      );
    } finally {
      setDeliverySaving(false);
    }
  }

  async function deleteDelivery(row: DeliveryRow) {
    if (!row.id && !row.rowCtid) {
      alert("This completed delivery cannot be deleted because it is not linked to a database row.");
      return;
    }
    const ok = window.confirm(`Delete completed delivery "${row.missionId}"? This cannot be undone.`);
    if (!ok) return;
    try {
      const response = await fetch(apiUrl("/api/missions"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          rowCtid: row.rowCtid,
          requestRef: row.missionId,
          completedAt: row.completedAt,
        }),
      });
      if (!response.ok) {
        throw new Error("Could not delete completed delivery.");
      }
      setRows((current) => current.filter((item) => item !== row));
      setRefreshTick((n) => n + 1);
      notifyMissionsDbUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete completed delivery.");
    }
  }

  return (
    <section
      className={cn(
        "rounded-2xl bg-card px-4 pb-4 sm:px-6 sm:pb-6",
        showPageTitle && ADMIN_PAGE_TOP_PADDING_CLASS
      )}
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
            className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </button>
        </div>

        <section
          className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3"
          aria-label="Request summary: total, pending requests, and completed deliveries"
        >
          <UserRequestStatCard
            label="Total requests"
            value={stats.total}
            icon={ClipboardList}
            iconClassName="text-[#008B8B]"
            iconWrapClassName="bg-[#008B8B]/10"
          />
          <UserRequestStatCard
            label="Pending Request"
            value={stats.pending}
            icon={Clock}
            iconClassName="text-amber-700"
            iconWrapClassName="bg-amber-100"
          />
          <UserRequestStatCard
            label="Completed Deliveries"
            value={completedDeliveriesDisplay}
            icon={PackageCheck}
            iconClassName="text-sky-800"
            iconWrapClassName="bg-sky-100"
          />
        </section>
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
            <CompletedDeliveryDetailCard
              key={`${row.missionId}-${row.completedAt}`}
              row={row}
              pilotScoped={pilotScoped}
              onEdit={() => openDeliveryEdit(row)}
              onDelete={() => void deleteDelivery(row)}
            />
          ))
        )}
      </section>

      {!pilotScoped && editingDelivery ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
            aria-label="Close edit completed delivery dialog"
            onClick={() => setEditingDelivery(null)}
          />
          <div className="relative z-10 max-h-[min(92dvh,46rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-white p-5 text-foreground shadow-2xl sm:rounded-2xl sm:p-6 dark:border-white/20 dark:bg-black dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Edit Completed Delivery
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Update the mission details shown on the completed deliveries page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDelivery(null)}
                className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DeliveryField
                label="Request ID"
                value={deliveryEditForm.requestRef}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, requestRef: value }))
                }
              />
              <DeliveryField
                label="User Name"
                value={deliveryEditForm.userName}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, userName: value }))
                }
              />
              <DeliveryField
                label="User Email Id"
                value={deliveryEditForm.userEmail}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, userEmail: value }))
                }
              />
              <DeliveryField
                label="User Requirement"
                value={deliveryEditForm.customer}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, customer: value }))
                }
              />
              <DeliveryField
                label="Service"
                value={deliveryEditForm.service}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, service: value }))
                }
              />
              <DeliveryField
                label="Drone"
                value={deliveryEditForm.droneModel}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, droneModel: value }))
                }
              />
              <DeliveryField
                label="Pilot Name"
                value={deliveryEditForm.pilotName}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, pilotName: value }))
                }
              />
              <DeliveryField
                label="Destination"
                value={deliveryEditForm.dropoff}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, dropoff: value }))
                }
              />
              <DeliveryField
                label="Assigned At"
                type="datetime-local"
                value={deliveryEditForm.assignedAt}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, assignedAt: value }))
                }
              />
              <DeliveryField
                label="Completed At"
                type="datetime-local"
                value={deliveryEditForm.completedAt}
                onChange={(value) =>
                  setDeliveryEditForm((form) => ({ ...form, completedAt: value }))
                }
              />
            </div>

            {deliveryEditError ? (
              <p className="mt-4 text-sm font-medium text-red-600">
                {deliveryEditError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDelivery(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deliverySaving}
                onClick={() => void saveDeliveryEdit()}
                className="rounded-lg bg-[#008B8B] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#007373] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deliverySaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}

function InlineDeliveryField({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0 text-xs leading-snug text-muted-foreground">
      <span className="font-semibold text-foreground">{label}</span>
      {" : "}
      <span className="text-foreground">{value}</span>
    </p>
  );
}

function CompletedDeliveryDetailCard({
  row,
  pilotScoped,
  onEdit,
  onDelete,
}: {
  row: DeliveryRow;
  pilotScoped: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const title =
    row.missionId !== "—" ? row.missionId : row.userName !== "—" ? row.userName : "Mission";
  const hasUserLine = row.userName !== "—" || row.userEmail !== "—";

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/20">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Completed delivery
          </p>
          <h2 className="mt-1 truncate text-sm font-semibold text-foreground">{title}</h2>
          {hasUserLine ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {row.userName !== "—" ? (
                <InlineDeliveryField label="User name" value={row.userName} />
              ) : null}
              {row.userEmail !== "—" ? (
                <InlineDeliveryField label="User email id" value={row.userEmail} />
              ) : null}
            </div>
          ) : null}
        </div>
        {!pilotScoped ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#008080] px-3 text-xs font-medium text-foreground transition hover:bg-[#008080]/10"
            >
              <Pencil className="size-3.5 shrink-0" aria-hidden />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-300 bg-transparent px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="size-3.5 shrink-0" aria-hidden />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 px-4 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <InlineDeliveryField label="Request ID" value={row.missionId} />
          <InlineDeliveryField label="User Requirement" value={row.customer} />
          <InlineDeliveryField label="Service" value={row.service} />
          <InlineDeliveryField label="Drone" value={row.droneUnit} />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <InlineDeliveryField label="Pilot" value={row.pilot} />
          <InlineDeliveryField label="Assigned at" value={formatDateTime(row.assignedAt)} />
          <InlineDeliveryField label="Completed at" value={formatDateTime(row.completedAt)} />
          <InlineDeliveryField
            label="Destination"
            value={row.dropoff !== "—" ? row.dropoff : "Destination TBD"}
          />
        </div>
      </div>
    </section>
  );
}

function DeliveryField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/30"
      />
    </label>
  );
}

