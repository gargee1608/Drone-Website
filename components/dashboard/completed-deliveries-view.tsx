"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  MessageSquareText,
  PackageCheck,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminKpiCard } from "@/components/dashboard/admin-kpi-card";
import { apiUrl } from "@/lib/api-url";
import {
  type BackendDroneHireRequestRow,
  mapBackendRequestToAdminRow,
} from "@/lib/drone-hire-request-admin-map";
import { isProjectRequirementRequest } from "@/lib/project-requests";
import { jwtPayloadPilotFullName, jwtPayloadSub } from "@/lib/pilot-display-name";
import {
  PILOT_COMMENT_WEATHER_PRESET,
  pilotMissionCommentForDisplay,
} from "@/lib/pilot-mission-comment-display";
import {
  loadPilotMissionCommentText,
  PILOT_MISSION_COMMENTS_KEY,
  PILOT_MISSION_COMMENT_SAVED_EVENT,
  savePilotMissionComment,
} from "@/lib/pilot-mission-comments-storage";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import { cn } from "@/lib/utils";
import { updateUserMissionTrackingStatusToCompleted } from "@/lib/user-mission-tracking";
import {
  buildRequestOwnerLookup,
  findStoredUserRequestByAdminRef,
  isUserRequestCompletedDelivery,
  MISSIONS_DB_UPDATED_EVENT,
  MISSIONS_DB_BROADCAST_CHANNEL,
  normalizeUserMissionAdminStatus,
  notifyMissionsDbUpdated,
  type RequestOwnerInfo,
  resolveRequestOwnerDisplay,
  updateUserRequestAdminStatus,
  USER_REQUESTS_UPDATED_EVENT,
  type UserRequestAdminRow,
} from "@/lib/user-requests";

const COMPLETED_MISSION_PREVIEW_KEY = "aerolaminar_completed_mission_preview_v1";
const ADMIN_CONFIRMED_DELIVERIES_KEY =
  "aerolaminar_admin_confirmed_deliveries_v1";
const ADMIN_CONFIRMED_DELIVERIES_EVENT =
  "aerolaminar-admin-confirmed-deliveries";

function canonicalAdminDeliveryRef(ref: string): string {
  const trimmed = ref.trim();
  const stored = trimmed ? findStoredUserRequestByAdminRef(trimmed) : undefined;
  return (stored?.backendRequestId || stored?.id || trimmed).trim().toLowerCase();
}

function loadAdminConfirmedDeliveryRefs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ADMIN_CONFIRMED_DELIVERIES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

function saveAdminConfirmedDeliveryRef(requestRef: string): void {
  if (typeof window === "undefined") return;
  const key = canonicalAdminDeliveryRef(requestRef);
  if (!key) return;
  const next = loadAdminConfirmedDeliveryRefs();
  next.add(key);
  localStorage.setItem(ADMIN_CONFIRMED_DELIVERIES_KEY, JSON.stringify([...next]));
  window.dispatchEvent(new Event(ADMIN_CONFIRMED_DELIVERIES_EVENT));
}

function isAdminConfirmedDelivery(
  requestRef: string,
  confirmedRefs: Set<string>
): boolean {
  return confirmedRefs.has(canonicalAdminDeliveryRef(requestRef));
}

function resolveDeliveryCommentDisplay(
  row: DeliveryRow,
  pilotScoped: boolean
): string {
  const dbComment = row.pilotComment.trim();
  if (!pilotScoped) return dbComment;
  const fromDb = pilotMissionCommentForDisplay(dbComment);
  if (fromDb) return fromDb;
  return pilotMissionCommentForDisplay(loadPilotMissionCommentText(row.missionId));
}

function normalizeDeliveryStatus(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

function isDeliveryRowCompleted(row: DeliveryRow): boolean {
  return normalizeDeliveryStatus(row.status) === "completed";
}

function deliveryFieldValue(value: string): string {
  return value === "—" ? "" : value.trim();
}

function deliveryRowMarkKey(row: DeliveryRow): string {
  return `${row.id || row.rowCtid || row.missionId}::${row.missionId}`;
}

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
  pilotComment: string;
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
  pilot_comment?: string;
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
    pilotComment: String(row.pilot_comment ?? "").trim(),
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
      row.pilotComment,
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
    } else if (
      nextScore === prevScore &&
      nextTime === prevTime &&
      row.pilotComment.trim().length > prev.pilotComment.trim().length
    ) {
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
      pilotComment: String(parsed.pilotComment ?? "").trim(),
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
  const [commentDraft, setCommentDraft] = useState("");
  const [commentsForRow, setCommentsForRow] = useState<DeliveryRow | null>(null);
  const [commentsDisplayVers, setCommentsDisplayVers] = useState(0);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentSaveError, setCommentSaveError] = useState<string | null>(null);
  const [markingCompleteKey, setMarkingCompleteKey] = useState<string | null>(
    null
  );
  const [adminConfirmedVers, setAdminConfirmedVers] = useState(0);

  const adminConfirmedRefs = useMemo(() => {
    void adminConfirmedVers;
    return loadAdminConfirmedDeliveryRefs();
  }, [adminConfirmedVers]);

  useEffect(() => {
    if (pilotScoped) return;
    const bump = () => setAdminConfirmedVers((v) => v + 1);
    window.addEventListener(ADMIN_CONFIRMED_DELIVERIES_EVENT, bump);
    return () => {
      window.removeEventListener(ADMIN_CONFIRMED_DELIVERIES_EVENT, bump);
    };
  }, [pilotScoped]);

  useEffect(() => {
    if (pilotScoped) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setRefreshTick((n) => n + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pilotScoped]);

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

        const [missionsRes, requestsRes, activeRes] = await Promise.all([
          fetch(missionsEndpoint, { cache: "no-store" }),
          fetch(apiUrl("/api/requests"), { cache: "no-store" }),
          !pilotScoped
            ? fetch(apiUrl("/api/missions/active-assignments"), {
                cache: "no-store",
              })
            : Promise.resolve(null),
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

        let activeWithComments: DeliveryRow[] = [];
        if (!pilotScoped && activeRes?.ok) {
          const activePayload: unknown = await activeRes.json();
          const activeList = Array.isArray(
            (activePayload as { data?: unknown[] })?.data
          )
            ? ((activePayload as { data?: unknown[] }).data as BackendMissionRow[])
            : [];
          activeWithComments = activeList
            .filter(
              (row) =>
                !isProjectRequirementRequest(String(row.request_ref ?? "")) &&
                String(row.pilot_comment ?? "").trim().length > 0
            )
            .map((row, i) =>
              mapBackendMissionToDeliveryRow(row, i + list.length, ownerLookup)
            );
        }

        setRows((prev) => {
          const optimisticRows = prev.filter((row) => !row.id && !row.rowCtid);
          return dedupeDeliveryRows([
            ...(preview ? [preview] : []),
            ...apiRows,
            ...activeWithComments,
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
    window.addEventListener(PILOT_MISSION_COMMENT_SAVED_EVENT, bump);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(MISSIONS_DB_BROADCAST_CHANNEL);
      bc.onmessage = bump;
    } catch {
      /* BroadcastChannel unavailable */
    }
    return () => {
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, bump);
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
      window.removeEventListener(PILOT_MISSION_COMMENT_SAVED_EVENT, bump);
      bc?.close();
    };
  }, []);

  useEffect(() => {
    if (!pilotScoped) return;
    const bumpComments = () => setCommentsDisplayVers((v) => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === PILOT_MISSION_COMMENTS_KEY) bumpComments();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(PILOT_MISSION_COMMENT_SAVED_EVENT, bumpComments);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PILOT_MISSION_COMMENT_SAVED_EVENT, bumpComments);
    };
  }, [pilotScoped]);

  useEffect(() => {
    if (!commentsForRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCommentsForRow(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commentsForRow]);

  function openCommentsDialog(row: DeliveryRow) {
    const fromDb = row.pilotComment.trim();
    setCommentDraft(
      fromDb || loadPilotMissionCommentText(row.missionId)
    );
    setCommentsForRow(row);
    setCommentSaveError(null);
  }

  async function saveCommentsDialog() {
    if (!commentsForRow || commentSaving) return;
    setCommentSaving(true);
    setCommentSaveError(null);
    const ok = await savePilotMissionComment(
      {
        requestRef: commentsForRow.missionId,
        id: commentsForRow.id || undefined,
        rowCtid: commentsForRow.rowCtid || undefined,
        pilotSub: commentsForRow.pilotSub || undefined,
      },
      commentDraft
    );
    setCommentSaving(false);
    if (!ok) {
      setCommentSaveError("Could not save comment. Please try again.");
      return;
    }
    const savedText = commentDraft.trim();
    const savedRowKey = deliveryRowMarkKey(commentsForRow);
    setRows((prev) =>
      prev.map((row) =>
        deliveryRowMarkKey(row) === savedRowKey
          ? { ...row, pilotComment: savedText }
          : row
      )
    );
    setCommentsForRow(null);
    setCommentsDisplayVers((v) => v + 1);
    setRefreshTick((n) => n + 1);
    notifyMissionsDbUpdated();
  }

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

  async function markDeliveryAsCompleted(row: DeliveryRow) {
    if (!row.id && !row.rowCtid) {
      alert(
        "This delivery cannot be marked completed because it is not linked to a database row."
      );
      return;
    }
    const ok = window.confirm(
      `Complete mission "${row.missionId}"? This will mark the delivery as completed.`
    );
    if (!ok) return;

    const markKey = deliveryRowMarkKey(row);
    const alreadyDbCompleted = isDeliveryRowCompleted(row);
    setMarkingCompleteKey(markKey);
    try {
      if (!alreadyDbCompleted) {
        const response = await fetch(apiUrl("/api/missions"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: row.id,
            rowCtid: row.rowCtid,
            requestRef: row.missionId,
            customer: deliveryFieldValue(row.customer),
            service: deliveryFieldValue(row.service),
            dropoff: deliveryFieldValue(row.dropoff),
            pilotName: deliveryFieldValue(row.pilot),
            droneModel: deliveryFieldValue(row.droneUnit),
            userName: deliveryFieldValue(row.userName),
            userEmail: deliveryFieldValue(row.userEmail),
            assignedAt: row.assignedAt || undefined,
            completedAt: new Date().toISOString(),
            status: "completed",
          }),
        });
        if (!response.ok) {
          throw new Error("Could not mark delivery as completed.");
        }

        updateUserRequestAdminStatus(row.missionId, "completed");
        updateUserMissionTrackingStatusToCompleted(row.missionId);

        const numericId = String(row.missionId).replace(/^#/, "");
        if (/^\d+$/.test(numericId)) {
          void fetch(apiUrl(`/api/requests/${encodeURIComponent(numericId)}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_status: "completed" }),
          });
        }

        setRefreshTick((n) => n + 1);
        notifyMissionsDbUpdated();
      }

      saveAdminConfirmedDeliveryRef(row.missionId);
      setAdminConfirmedVers((v) => v + 1);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not mark delivery as completed."
      );
    } finally {
      setMarkingCompleteKey(null);
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
          className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3"
          aria-label="Request summary: total, pending requests, and completed deliveries"
        >
          <AdminKpiCard
            title="Total requests"
            value={stats.total}
            icon={ClipboardList}
            iconClassName="text-[#008B8B]"
            iconBg="bg-gradient-to-br from-[#008B8B]/15 to-[#008B8B]/5"
            accentClass="bg-gradient-to-r from-[#008B8B] to-[#00b4b4]"
          />
          <AdminKpiCard
            title="Pending Request"
            value={stats.pending}
            icon={Clock}
            iconClassName="text-[#ba1a1a]"
            iconBg="bg-gradient-to-br from-[#ffdad6] to-[#ffdad6]/40 dark:from-red-950/60 dark:to-red-950/30"
            accentClass="bg-gradient-to-r from-[#ba1a1a] to-[#e53935]"
          />
          <AdminKpiCard
            title="Completed Deliveries"
            value={completedDeliveriesDisplay}
            icon={PackageCheck}
            iconClassName="text-sky-800 dark:text-sky-300"
            iconBg="bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-950/50 dark:to-sky-950/20"
            accentClass="bg-gradient-to-r from-sky-600 to-sky-400"
          />
        </section>
      </header>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
            Loading completed missions...
          </div>
        ) : paginatedRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
            No completed missions yet.
          </div>
        ) : (
          paginatedRows.map((row) => {
            const savedCommentDisplay = resolveDeliveryCommentDisplay(
              row,
              pilotScoped
            );

            const rowCompleted = isDeliveryRowCompleted(row);
            const adminConfirmed =
              !pilotScoped &&
              isAdminConfirmedDelivery(row.missionId, adminConfirmedRefs);

            return (
              <CompletedDeliveryDetailCard
                key={`${row.missionId}-${row.completedAt}-${commentsDisplayVers}-${adminConfirmedVers}`}
                row={row}
                pilotScoped={pilotScoped}
                isAdminConfirmed={adminConfirmed}
                isDbCompleted={rowCompleted}
                savedCommentDisplay={savedCommentDisplay}
                markingComplete={
                  markingCompleteKey === deliveryRowMarkKey(row)
                }
                onOpenComments={
                  pilotScoped ? () => openCommentsDialog(row) : undefined
                }
                onMarkCompleted={
                  !pilotScoped
                    ? () => void markDeliveryAsCompleted(row)
                    : undefined
                }
                onEdit={() => openDeliveryEdit(row)}
                onDelete={() => void deleteDelivery(row)}
              />
            );
          })
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

      {pilotScoped && commentsForRow ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pilot-completed-delivery-comments-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/35 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => setCommentsForRow(null)}
          />
          <div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
              <h2
                id="pilot-completed-delivery-comments-dialog-title"
                className="text-base font-bold text-foreground"
              >
                Delivery comments
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {commentsForRow.customer !== "—"
                  ? commentsForRow.customer
                  : "Completed delivery"}{" "}
                · {commentsForRow.missionId}
              </p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <label
                htmlFor="pilot-completed-delivery-comment"
                className="mb-2 block text-xs font-semibold text-muted-foreground"
              >
                Your comment
              </label>
              <p className="mb-2 text-[11px] text-muted-foreground">
                Quick preset:{" "}
                <button
                  type="button"
                  className="font-medium text-[#008B8B] underline decoration-[#008B8B]/40 underline-offset-2 hover:decoration-[#008B8B] dark:text-primary"
                  onClick={() => setCommentDraft(PILOT_COMMENT_WEATHER_PRESET)}
                >
                  {PILOT_COMMENT_WEATHER_PRESET}
                </button>
              </p>
              <textarea
                id="pilot-completed-delivery-comment"
                rows={5}
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder={PILOT_COMMENT_WEATHER_PRESET}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#008B8B]/30"
              />
              {commentSaveError ? (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {commentSaveError}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setCommentsForRow(null)}
                disabled={commentSaving}
                className="rounded-lg border border-border bg-transparent px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveCommentsDialog()}
                disabled={commentSaving}
                className="rounded-lg border-2 border-[#008B8B] bg-[#008B8B] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#007a7a] disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary dark:bg-primary dark:hover:bg-primary/90"
              >
                {commentSaving ? "Saving..." : "Save comment"}
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
  isAdminConfirmed,
  isDbCompleted,
  savedCommentDisplay,
  markingComplete,
  onOpenComments,
  onMarkCompleted,
  onEdit,
  onDelete,
}: {
  row: DeliveryRow;
  pilotScoped: boolean;
  isAdminConfirmed: boolean;
  isDbCompleted: boolean;
  savedCommentDisplay?: string;
  markingComplete?: boolean;
  onOpenComments?: () => void;
  onMarkCompleted?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const title =
    row.missionId !== "—" ? row.missionId : row.userName !== "—" ? row.userName : "Mission";
  const hasUserLine = row.userName !== "—" || row.userEmail !== "—";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isAdminConfirmed ? "Completed delivery" : "Assigned delivery"}
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
        <div className="flex shrink-0 flex-wrap gap-2">
          {pilotScoped && onOpenComments ? (
            <button
              type="button"
              onClick={onOpenComments}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#008B8B] px-3 text-xs font-medium text-[#008B8B] transition hover:bg-[#008B8B]/10 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            >
              <MessageSquareText className="size-3.5 shrink-0" aria-hidden />
              Comments
            </button>
          ) : null}
          {!pilotScoped ? (
            <>
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
              {onMarkCompleted ? (
                <button
                  type="button"
                  onClick={onMarkCompleted}
                  disabled={isAdminConfirmed || markingComplete}
                  title={
                    isAdminConfirmed
                      ? "You confirmed this mission as completed"
                      : undefined
                  }
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition disabled:opacity-50",
                    isAdminConfirmed
                      ? "border-sky-300 bg-sky-50 text-sky-700"
                      : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                  )}
                >
                  <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                  {isAdminConfirmed
                    ? "Mission completed"
                    : markingComplete
                      ? "Completing…"
                      : "Completed Mission"}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
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
          <InlineDeliveryField
            label="Completed at"
            value={
              isAdminConfirmed
                ? formatDateTime(row.completedAt)
                : isDbCompleted
                  ? "Pending admin confirmation"
                  : "—"
            }
          />
          <InlineDeliveryField
            label="Destination"
            value={row.dropoff !== "—" ? row.dropoff : "Destination TBD"}
          />
        </div>

        {!pilotScoped ? (
          <InlineDeliveryField
            label="Comment"
            value={savedCommentDisplay || "—"}
          />
        ) : savedCommentDisplay ? (
          <InlineDeliveryField label="Comment" value={savedCommentDisplay} />
        ) : null}
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

