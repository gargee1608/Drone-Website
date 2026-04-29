"use client";

import { CheckCircle2, ClipboardList, Clock, PackageCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";

import {
  resolveUserRequestDetail,
  UserRequestDetailModal,
  type UserRequestDetailPayload,
} from "@/components/dashboard/user-request-detail-modal";
import { UserRequestTable } from "@/components/dashboard/user-request-table";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
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

type BackendRequestRow = {
  id?: number | string;
  reason_or_title?: string;
  pickup_location?: string;
  drop_location?: string;
  payload_weight?: number | string;
  cargo_type?: string;
  mission_urgency?: string;
  admin_status?: string;
  adminStatus?: string;
  mission_status?: string | null;
  missionStatus?: string | null;
};

function pickBackendAdminStatus(r: BackendRequestRow): string | undefined {
  if (typeof r.admin_status === "string") return r.admin_status;
  if (typeof r.adminStatus === "string") return r.adminStatus;
  return undefined;
}

function pickBackendMissionStatus(r: BackendRequestRow): string | null | undefined {
  if (typeof r.mission_status === "string") return r.mission_status;
  if (typeof r.missionStatus === "string") return r.missionStatus;
  if (r.mission_status === null || r.missionStatus === null) return null;
  return undefined;
}

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
      badgeClass: "bg-[#ffdad6] text-[#93000a]",
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
      badgeClass: "bg-[#cde5ff] text-[#001d32]",
      barColor: "#006195",
      desc,
      adminStatus,
    };
  }
  return {
    key: `demo-${r.title}`,
    title: r.title,
    badge: "ROUTINE",
    badgeClass: "bg-[#008B8B]/14 text-[#0a3030]",
    barColor: "#008B8B",
    desc,
    adminStatus,
  };
}

function mapBackendRequestToAdminRow(r: BackendRequestRow): UserRequestAdminRow {
  const urgency = String(r.mission_urgency ?? "")
    .trim()
    .toLowerCase();
  let badge: UserRequestAdminRow["badge"] = "NORMAL";
  let badgeClass = "bg-[#cde5ff] text-[#001d32]";
  let barColor = "#006195";

  if (urgency === "critical" || urgency === "urgent") {
    badge = "CRITICAL";
    badgeClass = "bg-[#ffdad6] text-[#93000a]";
    barColor = "#ba1a1a";
  } else if (urgency === "standard" || urgency === "routine") {
    badge = "ROUTINE";
    badgeClass = "bg-[#008B8B]/14 text-[#0a3030]";
    barColor = "#008B8B";
  }

  const payloadWeight = String(r.payload_weight ?? "").trim();
  const cargoType = String(r.cargo_type ?? "").trim();
  const pickupLocation = String(r.pickup_location ?? "").trim();
  const dropLocation = String(r.drop_location ?? "").trim();

  return {
    key: String(r.id ?? `${Date.now()}-${Math.random()}`),
    title: String(r.reason_or_title ?? "").trim() || "Mission request",
    badge,
    badgeClass,
    barColor,
    desc: `Payload: ${cargoType || "General cargo"} (${payloadWeight || "0"}kg) | Target: ${
      dropLocation || pickupLocation || "—"
    }`,
    adminStatus: normalizeUserMissionAdminStatus(pickBackendAdminStatus(r)),
    missionStatus: pickBackendMissionStatus(r) ?? null,
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
          ? ((payload as { data?: unknown[] }).data as BackendRequestRow[])
          : [];
        if (!cancelled) {
          setBackendRequests(data.map(mapBackendRequestToAdminRow));
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

  return (
    <div className="mx-auto w-full max-w-6xl">
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
        className={`grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 ${showPageTitle ? "mt-6" : "mt-4"}`}
        aria-label="Request summary: total, pending requests, active or assigned, and completed deliveries"
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
          label="Active / Assigned"
          value={stats.activeAssigned}
          icon={CheckCircle2}
          iconClassName="text-emerald-700"
          iconWrapClassName="bg-emerald-100"
        />
        <UserRequestStatCard
          label="Completed Deliveries"
          value={completedDeliveriesDisplay}
          icon={PackageCheck}
          iconClassName="text-sky-800"
          iconWrapClassName="bg-sky-100"
        />
      </section>

      <div className="mt-6 space-y-8 sm:mt-8 sm:space-y-10">
        <section aria-label="Mission and user requests">
          <UserRequestTable
            title="User requests"
            rows={primaryTableRows}
            showTitle
            showTotalSubtitle
            columnPreset={tablePreset}
            onViewDetails={openRequestDetails}
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
    </div>
  );
}

function UserRequestStatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  iconWrapClassName,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  iconWrapClassName: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-4 py-4 text-center shadow-sm sm:px-5 sm:py-5">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg sm:size-10",
          iconWrapClassName
        )}
      >
        <Icon className={cn("size-[18px]", iconClassName)} aria-hidden />
      </span>
      <p className="mt-2.5 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 max-w-[9rem] text-[10px] font-medium leading-tight text-muted-foreground sm:max-w-none sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}
