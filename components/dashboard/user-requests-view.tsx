"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  PackageCheck,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  resolveUserRequestDetail,
  UserRequestDetailModal,
  type UserRequestDetailPayload,
} from "@/components/dashboard/user-request-detail-modal";
import { AdminKpiCard } from "@/components/dashboard/admin-kpi-card";
import { UserRequestTable } from "@/components/dashboard/user-request-table";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import {
  setAssignInspectRow,
  userRequestAdminRowToAssignPilotRow,
} from "@/lib/assign-demo-bridge";
import { apiUrl } from "@/lib/api-url";
import {
  COMPLETED_ASSIGNMENTS_UPDATED_EVENT,
} from "@/lib/completed-assignments";
import {
  loadUserRequests,
  mapUserRequestToAdminRow,
  MISSIONS_DB_UPDATED_EVENT,
  isUserRequestCompletedDelivery,
  normalizeUserMissionAdminStatus,
  pruneDuplicateMarketplaceInquiries,
  USER_REQUESTS_UPDATED_EVENT,
  type UserMissionAdminStatus,
  type UserMissionRequest,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import {
  type BackendDroneHireRequestRow,
  mapBackendRequestToAdminRow,
} from "@/lib/drone-hire-request-admin-map";
import { isProjectRequirementRequest } from "@/lib/project-requests";
import { cn } from "@/lib/utils";

type RequestTier = "critical" | "normal" | "routine";

type UserRequestRow = {
  id: string;
  title: string;
  tier: RequestTier;
  badgeLabel: string;
  payload: string;
  weight: string;
  target: string;
};

const REQUESTS: UserRequestRow[] = [
  {
    id: "1",
    title: "Medical Emergency",
    tier: "critical",
    badgeLabel: "CRITICAL",
    payload: "Medical cargo",
    weight: "0.2kg",
    target: "Downtown Medical",
  },
  {
    id: "2",
    title: "Medical Emergency Supply",
    tier: "critical",
    badgeLabel: "CRITICAL",
    payload: "Insulin Cool-Box",
    weight: "4.2kg",
    target: "Sector 7G Rural Clinic",
  },
  {
    id: "3",
    title: "Industrial Part Delivery",
    tier: "normal",
    badgeLabel: "NORMAL",
    payload: "Steel Coupling",
    weight: "12kg",
    target: "Port of Aerolia",
  },
  {
    id: "4",
    title: "Agricultural Mapping",
    tier: "routine",
    badgeLabel: "ROUTINE",
    payload: "Multispectral Camera",
    weight: "1.5kg",
    target: "Highland Farms",
  },
];

const DEMO_ADMIN_STORAGE_KEY = "aerolaminar_user_request_demo_admin_v1";

type RequestEditForm = {
  reasonOrTitle: string;
  pickupLocation: string;
  dropLocation: string;
  payloadWeight: string;
  cargoType: string;
  missionUrgency: string;
  adminStatus: UserMissionAdminStatus;
};

function staticRequestToAdminRow(
  r: UserRequestRow,
  adminStatus: UserMissionAdminStatus = "pending"
): UserRequestAdminRow {
  const desc = `Payload: ${r.payload} (${r.weight}) | Target: ${r.target}`;
  if (r.tier === "critical") {
    return {
      key: `demo-${r.title}`,
      title: r.title,
      badge: "CRITICAL",
      badgeClass:
        "bg-[#ffdad6] text-[#93000a] dark:bg-red-950/50 dark:text-red-200",
      barColor: "#ba1a1a",
      desc,
      adminStatus,
    };
  }
  if (r.tier === "normal") {
    return {
      key: `demo-${r.title}`,
      title: r.title,
      badge: "NORMAL",
      badgeClass:
        "bg-[#cde5ff] text-[#001d32] dark:bg-blue-950/50 dark:text-blue-200",
      barColor: "#006195",
      desc,
      adminStatus,
    };
  }
  return {
    key: `demo-${r.title}`,
    title: r.title,
    badge: "ROUTINE",
    badgeClass:
      "bg-[#008B8B]/14 text-[#0a3030] dark:bg-[#008B8B]/25 dark:text-teal-100",
    barColor: "#008B8B",
    desc,
    adminStatus,
  };
}

export function UserRequestsView({
  showPageTitle = true,
  pilotTables = false,
}: {
  showPageTitle?: boolean;
  /** Pilot dashboard: table columns User Id, User Name, User Requirement, Payload, Destinations. */
  pilotTables?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const tablePreset = pilotTables ? "pilot" : "admin";
  const demoAdminHydrated = useRef(false);
  /** Client-only review outcome for built-in demo table rows (localStorage keys use `demo-…`). */
  const [demoAdminByKey, setDemoAdminByKey] = useState<
    Record<string, UserMissionAdminStatus>
  >({});
  const [detailModal, setDetailModal] = useState<UserRequestDetailPayload | null>(
    null
  );
  const [userRequestRefresh, setUserRequestRefresh] = useState(0);
  /** Same as above — never read `localStorage` during render (avoids hydration mismatch). */
  const [storedRequestsSnapshot, setStoredRequestsSnapshot] = useState<
    UserMissionRequest[]
  >([]);
  const [backendRequests, setBackendRequests] = useState<UserRequestAdminRow[]>([]);
  const [backendRefresh, setBackendRefresh] = useState(0);
  const [editingRequest, setEditingRequest] = useState<UserRequestAdminRow | null>(null);
  const [requestEditForm, setRequestEditForm] = useState<RequestEditForm>({
    reasonOrTitle: "",
    pickupLocation: "",
    dropLocation: "",
    payloadWeight: "",
    cargoType: "",
    missionUrgency: "normal",
    adminStatus: "pending",
  });
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestEditError, setRequestEditError] = useState<string | null>(null);
  /** From `missions` table (admin only); falls back to derived stat if fetch fails. */
  const [missionsCompletedDeliveriesCount, setMissionsCompletedDeliveriesCount] =
    useState<number | null>(null);

  useEffect(() => {
    if (pilotTables) return;
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
                (row) =>
                  !isProjectRequirementRequest(row.client_request_id)
              )
              .map(mapBackendRequestToAdminRow)
          );
        }
      } catch {
        if (!cancelled) {
          setBackendRequests([]);
        }
      }
    };
    void loadBackendRequests();
    return () => {
      cancelled = true;
    };
  }, [pilotTables, backendRefresh]);

  useEffect(() => {
    if (pilotTables) return;
    let cancelled = false;
    const loadCompletedDeliveriesCount = async () => {
      try {
        const response = await fetch(
          apiUrl("/api/missions/completed-deliveries-count"),
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("bad response");
        const payload: unknown = await response.json();
        const raw =
          payload &&
          typeof payload === "object" &&
          "count" in payload &&
          (payload as { count: unknown }).count;
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!cancelled) {
          setMissionsCompletedDeliveriesCount(Number.isFinite(n) ? n : null);
        }
      } catch {
        if (!cancelled) setMissionsCompletedDeliveriesCount(null);
      }
    };
    void loadCompletedDeliveriesCount();
    return () => {
      cancelled = true;
    };
  }, [pilotTables, backendRefresh]);

  useEffect(() => {
    pruneDuplicateMarketplaceInquiries();
    const data = loadUserRequests();
    setStoredRequestsSnapshot(data);
  }, [userRequestRefresh]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEMO_ADMIN_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          setDemoAdminByKey(parsed as Record<string, UserMissionAdminStatus>);
        }
      }
    } catch {
      /* ignore */
    }
    demoAdminHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!demoAdminHydrated.current) return;
    try {
      localStorage.setItem(
        DEMO_ADMIN_STORAGE_KEY,
        JSON.stringify(demoAdminByKey)
      );
    } catch {
      /* ignore */
    }
  }, [demoAdminByKey]);

  useEffect(() => {
    const onUpdate = () => setUserRequestRefresh((n) => n + 1);
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, onUpdate);
    return () =>
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, onUpdate);
  }, []);

  useEffect(() => {
    const onAssignments = () => {
      if (pilotTables) setUserRequestRefresh((n) => n + 1);
      else setBackendRefresh((n) => n + 1);
    };
    window.addEventListener(COMPLETED_ASSIGNMENTS_UPDATED_EVENT, onAssignments);
    return () =>
      window.removeEventListener(
        COMPLETED_ASSIGNMENTS_UPDATED_EVENT,
        onAssignments
      );
  }, [pilotTables]);

  useEffect(() => {
    const onMissionsDb = () => {
      if (pilotTables) setUserRequestRefresh((n) => n + 1);
      else setBackendRefresh((n) => n + 1);
    };
    window.addEventListener(MISSIONS_DB_UPDATED_EVENT, onMissionsDb);
    return () =>
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, onMissionsDb);
  }, [pilotTables]);

  /** Refetch DB rows when navigating back to this page (e.g. after Assign To updates `admin_status`). */
  useEffect(() => {
    if (pilotTables) return;
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (pathname !== "/dashboard/user-requests") return;
    if (prev !== null && prev !== pathname) {
      setBackendRefresh((n) => n + 1);
    }
  }, [pathname, pilotTables]);

  const { primaryTableRows, additionalInquireTableRows } = useMemo(() => {
    if (!pilotTables) {
      return {
        primaryTableRows: backendRequests,
        additionalInquireTableRows: [] as UserRequestAdminRow[],
      };
    }

    const primaryStored: UserRequestAdminRow[] = [];
    const additionalStored: UserRequestAdminRow[] = [];
    for (const req of storedRequestsSnapshot) {
      const row = mapUserRequestToAdminRow(req);
      if (req.requestSource === "marketplace_inquiry") {
        additionalStored.push(row);
      } else {
        primaryStored.push(row);
      }
    }
    const demoRows = REQUESTS.map((r) =>
      staticRequestToAdminRow(
        r,
        demoAdminByKey[`demo-${r.title}`] ?? "pending"
      )
    );
    return {
      primaryTableRows: [...primaryStored, ...demoRows],
      additionalInquireTableRows: additionalStored,
    };
  }, [pilotTables, storedRequestsSnapshot, demoAdminByKey, backendRequests]);

  /**
   * Summary counts from `User requests` + `Additional Inquires` (when pilot).
   * Active / Assigned = accepted but not yet delivered; Completed Deliveries = completed (admin or mission).
   */
  const stats = useMemo(() => {
    const rows = [...primaryTableRows, ...additionalInquireTableRows];
    let pending = 0;
    let activeAssigned = 0;
    let completedDeliveries = 0;
    for (const row of rows) {
      const s = normalizeUserMissionAdminStatus(
        typeof row.adminStatus === "string" ? row.adminStatus : undefined
      );
      const delivered = isUserRequestCompletedDelivery(row);

      if (s === "rejected") {
        /* excluded from the three workflow buckets; still in total */
      } else if (delivered) {
        completedDeliveries += 1;
      } else if (s === "accepted") {
        activeAssigned += 1;
      } else {
        pending += 1;
      }
    }
    return {
      total: rows.length,
      pending,
      activeAssigned,
      completedDeliveries,
    };
  }, [primaryTableRows, additionalInquireTableRows]);

  const completedDeliveriesDisplay =
    !pilotTables && missionsCompletedDeliveriesCount !== null
      ? missionsCompletedDeliveriesCount
      : stats.completedDeliveries;

  const openRequestDetails = (row: UserRequestAdminRow) => {
    if (pilotTables) {
      const p = resolveUserRequestDetail(row);
      if (p) setDetailModal(p);
      return;
    }
    setAssignInspectRow(userRequestAdminRowToAssignPilotRow(row));
    router.push(`/dashboard/assign?focus=${encodeURIComponent(row.key)}`);
  };

  const openRequestEdit = (row: UserRequestAdminRow) => {
    if (!row.backendRequest?.id) {
      alert("This request cannot be edited because it is not linked to a database row.");
      return;
    }
    setEditingRequest(row);
    setRequestEditForm(row.backendRequest);
    setRequestEditError(null);
  };

  const saveRequestEdit = async () => {
    const id = editingRequest?.backendRequest?.id;
    if (!id) return;
    if (!requestEditForm.reasonOrTitle.trim()) {
      setRequestEditError("Requirement type is required.");
      return;
    }
    setRequestSaving(true);
    setRequestEditError(null);
    try {
      const response = await fetch(apiUrl(`/api/requests/${encodeURIComponent(id)}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason_or_title: requestEditForm.reasonOrTitle.trim(),
          pickup_location: requestEditForm.pickupLocation.trim(),
          drop_location: requestEditForm.dropLocation.trim(),
          payload_weight: requestEditForm.payloadWeight.trim(),
          cargo_type: requestEditForm.cargoType.trim(),
          mission_urgency: requestEditForm.missionUrgency,
          admin_status: requestEditForm.adminStatus,
        }),
      });
      if (!response.ok) {
        throw new Error("Could not update request.");
      }
      setEditingRequest(null);
      setBackendRefresh((n) => n + 1);
    } catch (error) {
      setRequestEditError(
        error instanceof Error ? error.message : "Could not update request."
      );
    } finally {
      setRequestSaving(false);
    }
  };

  const deleteRequest = async (row: UserRequestAdminRow) => {
    const id = row.backendRequest?.id;
    if (!id) {
      alert("This request cannot be deleted because it is not linked to a database row.");
      return;
    }
    const ok = window.confirm(`Delete request "${row.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      const response = await fetch(apiUrl(`/api/requests/${encodeURIComponent(id)}`), {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Could not delete request.");
      }
      setBackendRefresh((n) => n + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete request.");
    }
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl",
        showPageTitle && ADMIN_PAGE_TOP_PADDING_CLASS
      )}
    >
      {showPageTitle ? <h1 className={ADMIN_PAGE_TITLE_CLASS}>User Request</h1> : null}
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
        {pilotTables ? (
          <>
            Summary figures count every request in{" "}
            <span className="font-semibold text-foreground">User requests</span> and{" "}
            <span className="font-semibold text-foreground">Additional Inquires</span>{" "}
            below.
          </>
        ) : null}
      </p>

      <section
        className={cn(
          "grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4",
          showPageTitle ? "mt-6" : "mt-4"
        )}
        aria-label="Request summary: total, pending requests, active or assigned, and completed deliveries"
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
          title="Active / Assigned"
          value={stats.activeAssigned}
          icon={CheckCircle2}
          iconClassName="text-green-700 dark:text-green-400"
          iconBg="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/50 dark:to-green-950/20"
          accentClass="bg-gradient-to-r from-green-600 to-emerald-400"
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

      <div className="mt-6 space-y-8 sm:mt-8 sm:space-y-10">
        <section aria-label="Mission and user requests">
          <UserRequestTable
            title="User requests"
            rows={primaryTableRows}
            showTitle={pilotTables}
            showTotalSubtitle
            omitOuterBorder={!pilotTables}
            columnPreset={tablePreset}
            onViewDetails={openRequestDetails}
            onEditRequest={pilotTables ? undefined : openRequestEdit}
            onDeleteRequest={pilotTables ? undefined : deleteRequest}
          />
        </section>

        {pilotTables ? (
          <section aria-label="Additional product inquiries">
            <UserRequestTable
              title="Additional Inquires"
              rows={additionalInquireTableRows}
              showTitle
              showTotalSubtitle
              columnPreset={tablePreset}
              onViewDetails={openRequestDetails}
            />
          </section>
        ) : null}
      </div>

      {pilotTables ? (
        <UserRequestDetailModal
          payload={detailModal}
          onClose={() => setDetailModal(null)}
        />
      ) : null}

      {!pilotTables && editingRequest ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
            aria-label="Close edit request dialog"
            onClick={() => setEditingRequest(null)}
          />
          <div className="relative z-10 max-h-[min(92dvh,44rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-white p-5 text-foreground shadow-2xl sm:rounded-2xl sm:p-6 dark:border-white/20 dark:bg-black dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Edit User Request</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Update the request details shown in the admin dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted dark:text-white/80 dark:hover:bg-white/10"
                aria-label="Close edit request dialog"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <RequestField
                label="Requirement type"
                value={requestEditForm.reasonOrTitle}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, reasonOrTitle: value }))
                }
              />
              <RequestField
                label="Cargo type"
                value={requestEditForm.cargoType}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, cargoType: value }))
                }
              />
              <RequestField
                label="Pickup location"
                value={requestEditForm.pickupLocation}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, pickupLocation: value }))
                }
              />
              <RequestField
                label="Drop location"
                value={requestEditForm.dropLocation}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, dropLocation: value }))
                }
              />
              <RequestField
                label="Payload weight (kg)"
                value={requestEditForm.payloadWeight}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, payloadWeight: value }))
                }
              />
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Urgency
                </span>
                <select
                  value={requestEditForm.missionUrgency}
                  onChange={(event) =>
                    setRequestEditForm((form) => ({
                      ...form,
                      missionUrgency: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/30 dark:bg-black"
                >
                  <option value="critical">Critical</option>
                  <option value="normal">Normal</option>
                  <option value="routine">Routine</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Admin status
                </span>
                <select
                  value={requestEditForm.adminStatus}
                  onChange={(event) =>
                    setRequestEditForm((form) => ({
                      ...form,
                      adminStatus: event.target.value as UserMissionAdminStatus,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/30 dark:bg-black"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>

            {requestEditError ? (
              <p className="mt-4 text-sm font-medium text-red-600">{requestEditError}</p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestSaving}
                onClick={() => void saveRequestEdit()}
                className="rounded-lg border border-[#008B8B] bg-transparent px-4 py-2 text-sm font-bold text-[#008B8B] transition hover:bg-[#008B8B]/8 disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary dark:text-primary"
              >
                {requestSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RequestField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/30 dark:bg-black dark:text-white"
      />
    </label>
  );
}
