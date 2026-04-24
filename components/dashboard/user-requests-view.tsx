"use client";

import { CheckCircle2, ClipboardList, Clock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";

import {
  detailPayloadMatchesRow,
  resolveUserRequestDetail,
  UserRequestDetailModal,
  type UserRequestDetailPayload,
} from "@/components/dashboard/user-request-detail-modal";
import { UserRequestTable } from "@/components/dashboard/user-request-table";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import {
  demoAdminRowToAssignPilotRow,
  upsertDemoAcceptedForAssign,
} from "@/lib/assign-demo-bridge";
import {
  loadUserRequests,
  mapUserRequestToAdminRow,
  normalizeUserMissionAdminStatus,
  pruneDuplicateMarketplaceInquiries,
  updateUserRequestAdminStatus,
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

export function UserRequestsView({
  showPageTitle = true,
  pilotTables = false,
}: {
  showPageTitle?: boolean;
  /** Pilot dashboard: table columns User Id, User Name, User Requirement, Payload, Destinations. */
  pilotTables?: boolean;
} = {}) {
  const router = useRouter();
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

  const { primaryTableRows, additionalInquireTableRows } = useMemo(() => {
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
  }, [storedRequestsSnapshot, demoAdminByKey]);

  /**
   * Accepted / Rejected / Pending = exact counts from the two tables below:
   * `User requests` (stored missions + demo rows) + `Additional Inquires` (marketplace).
   */
  const stats = useMemo(() => {
    const rows = [...primaryTableRows, ...additionalInquireTableRows];
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    for (const row of rows) {
      const s = normalizeUserMissionAdminStatus(
        typeof row.adminStatus === "string" ? row.adminStatus : undefined
      );
      if (s === "accepted") accepted += 1;
      else if (s === "rejected") rejected += 1;
      else pending += 1;
    }
    return {
      total: rows.length,
      pending,
      accepted,
      rejected,
    };
  }, [primaryTableRows, additionalInquireTableRows]);

  const openRequestDetails = (row: UserRequestAdminRow) => {
    const p = resolveUserRequestDetail(row);
    if (p) setDetailModal(p);
  };

  const handleAcceptRow = (row: UserRequestAdminRow) => {
    if (row.key.startsWith("demo-")) {
      setDemoAdminByKey((prev) => ({ ...prev, [row.key]: "accepted" }));
      upsertDemoAcceptedForAssign(demoAdminRowToAssignPilotRow(row));
      setDetailModal((prev) =>
        prev && detailPayloadMatchesRow(prev, row) ? null : prev
      );
      router.push(`/dashboard/assign?focus=${encodeURIComponent(row.key)}`);
      return;
    }
    updateUserRequestAdminStatus(row.key, "accepted");
    setUserRequestRefresh((n) => n + 1);
    setDetailModal((prev) =>
      prev && detailPayloadMatchesRow(prev, row) ? null : prev
    );
    if (row.requestSource !== "marketplace_inquiry") {
      router.push(`/dashboard/assign?focus=${encodeURIComponent(row.key)}`);
    }
  };

  const handleRejectRow = (row: UserRequestAdminRow) => {
    if (row.key.startsWith("demo-")) {
      setDemoAdminByKey((prev) => ({ ...prev, [row.key]: "rejected" }));
      setDetailModal((prev) =>
        prev && detailPayloadMatchesRow(prev, row) ? null : prev
      );
      return;
    }
    updateUserRequestAdminStatus(row.key, "rejected");
    setUserRequestRefresh((n) => n + 1);
    setDetailModal((prev) =>
      prev && detailPayloadMatchesRow(prev, row) ? null : prev
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      {showPageTitle ? <h1 className={ADMIN_PAGE_TITLE_CLASS}>User Request</h1> : null}
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
        Summary figures count every request in{" "}
        <span className="font-semibold text-foreground">User requests</span> and{" "}
        <span className="font-semibold text-foreground">Additional Inquires</span>{" "}
        below.
      </p>

      <section
        className={`grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 ${showPageTitle ? "mt-6" : "mt-4"}`}
        aria-label="Request summary: User requests and Additional Inquires combined"
      >
        <UserRequestStatCard
          label="Total requests"
          value={stats.total}
          icon={ClipboardList}
          iconClassName="text-[#008B8B]"
          iconWrapClassName="bg-[#008B8B]/10"
        />
        <UserRequestStatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          iconClassName="text-amber-700"
          iconWrapClassName="bg-amber-100"
        />
        <UserRequestStatCard
          label="Accepted"
          value={stats.accepted}
          icon={CheckCircle2}
          iconClassName="text-emerald-700"
          iconWrapClassName="bg-emerald-100"
        />
        <UserRequestStatCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          iconClassName="text-red-700"
          iconWrapClassName="bg-red-100"
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
            onAcceptRow={handleAcceptRow}
            onRejectRow={handleRejectRow}
          />
        </section>

        <section aria-label="Additional product inquiries">
          <UserRequestTable
            title="Additional Inquires"
            rows={additionalInquireTableRows}
            showTitle
            showTotalSubtitle
            columnPreset={tablePreset}
            onViewDetails={openRequestDetails}
            onAcceptRow={handleAcceptRow}
            onRejectRow={handleRejectRow}
          />
        </section>
      </div>

      <UserRequestDetailModal
        payload={detailModal}
        onClose={() => setDetailModal(null)}
      />
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
