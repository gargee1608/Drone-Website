"use client";

import { CheckCircle2, ClipboardList, Clock, Send } from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";

import {
  detailPayloadMatchesRow,
  resolveUserRequestDetail,
  UserRequestDetailModal,
  type UserRequestDetailPayload,
} from "@/components/dashboard/user-request-detail-modal";
import { UserRequestTable } from "@/components/dashboard/user-request-table";
import type { UserRequestAdminRow } from "@/lib/user-requests";
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

/** Matches demo row → status used in `UserRequestTable` for the static list. */
function demoRequestStatus(
  title: string
): "Pending" | "Assigned" | "Completed" {
  const map: Record<string, "Pending" | "Assigned" | "Completed"> = {
    "Medical Emergency": "Pending",
    "Medical Emergency Supply": "Assigned",
    "Industrial Part Delivery": "Completed",
    "Agricultural Mapping": "Assigned",
  };
  return map[title] ?? "Pending";
}

function requestPageStats(rows: UserRequestRow[]) {
  let pending = 0;
  let assigned = 0;
  let completed = 0;
  for (const r of rows) {
    const s = demoRequestStatus(r.title);
    if (s === "Pending") pending += 1;
    else if (s === "Assigned") assigned += 1;
    else completed += 1;
  }
  return {
    total: rows.length,
    pending,
    assigned,
    completed,
  };
}

function staticRequestToAdminRow(r: UserRequestRow): UserRequestAdminRow {
  const desc = `Payload: ${r.payload} (${r.weight}) | Target: ${r.target}`;
  if (r.tier === "critical") {
    return {
      key: `demo-${r.title}`,
      title: r.title,
      badge: "CRITICAL",
      badgeClass: "bg-[#ffdad6] text-[#93000a]",
      barColor: "#ba1a1a",
      desc,
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
    };
  }
  return {
    key: `demo-${r.title}`,
    title: r.title,
    badge: "ROUTINE",
    badgeClass: "bg-[#d8e2ff] text-[#001a41]",
    barColor: "#0058bc",
    desc,
  };
}

export function UserRequestsView() {
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [detailModal, setDetailModal] = useState<UserRequestDetailPayload | null>(
    null
  );

  const visibleRequests = useMemo(
    () => REQUESTS.filter((r) => !dismissedKeys.has(`demo-${r.title}`)),
    [dismissedKeys]
  );

  const tableRows = visibleRequests.map(staticRequestToAdminRow);
  const stats = requestPageStats(visibleRequests);

  const openRequestDetails = (row: UserRequestAdminRow) => {
    const p = resolveUserRequestDetail(row);
    if (p) setDetailModal(p);
  };

  const dismissRequestRow = (row: UserRequestAdminRow) => {
    setDismissedKeys((prev) => new Set(prev).add(row.key));
    setDetailModal((prev) =>
      prev && detailPayloadMatchesRow(prev, row) ? null : prev
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl">
        User Request
      </h1>

      <section
        className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
        aria-label="Request summary"
      >
        <UserRequestStatCard
          label="Total requests"
          value={stats.total}
          icon={ClipboardList}
          iconClassName="text-[#0058bc]"
          iconWrapClassName="bg-[#0058bc]/10"
        />
        <UserRequestStatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          iconClassName="text-amber-700"
          iconWrapClassName="bg-amber-100"
        />
        <UserRequestStatCard
          label="Assigned"
          value={stats.assigned}
          icon={Send}
          iconClassName="text-violet-700"
          iconWrapClassName="bg-violet-100"
        />
        <UserRequestStatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          iconClassName="text-green-700"
          iconWrapClassName="bg-green-100"
        />
      </section>

      <div className="mt-6 sm:mt-8">
        <UserRequestTable
          rows={tableRows}
          showTitle={false}
          showTotalSubtitle
          onViewDetails={openRequestDetails}
          onAcceptRow={dismissRequestRow}
          onRejectRow={dismissRequestRow}
        />
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
    <div className="flex flex-col items-center rounded-2xl border border-[#c1c6d7]/15 bg-white px-4 py-4 text-center shadow-sm sm:px-5 sm:py-5">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg sm:size-10",
          iconWrapClassName
        )}
      >
        <Icon className={cn("size-[18px]", iconClassName)} aria-hidden />
      </span>
      <p className="mt-2.5 text-xl font-bold tabular-nums text-[#191c1d] sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 max-w-[9rem] text-[10px] font-medium leading-tight text-slate-600 sm:max-w-none sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}
