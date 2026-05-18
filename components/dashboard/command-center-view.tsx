"use client";

import { ClipboardList, Plane, User, UserCheck, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/dashboard/user-request-detail-modal";
import { apiUrl } from "@/lib/api-url";
import {
  ADMIN_PILOT_REG_STATE_STORAGE_KEY,
  getDefaultPilotRegState,
  loadPilotRegStateFromStorage,
  type PilotRegCard,
} from "@/lib/admin-pilot-registration-storage";
import {
  ADMIN_DASH_AVATAR_RING,
  ADMIN_DASH_DIVIDER_BORDER,
  ADMIN_DASH_PANEL_BORDER,
} from "@/lib/admin-dashboard-styles";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

/** No hardcoded approved-pilot baseline. */
const REGISTERED_PILOTS_COUNT_BASE = 0;

type DashboardPilotDbRow = {
  id?: number | string;
  name?: string | null;
  license_number?: string | null;
  duty_status?: string | null;
  experience?: string | number | null;
  flight_hours?: string | number | null;
  city?: string | null;
  state?: string | null;
  drone_details?: unknown;
};

function droneDetailsMissing(droneDetails: unknown): boolean {
  if (Array.isArray(droneDetails)) return droneDetails.length === 0;
  if (typeof droneDetails === "string") {
    const raw = droneDetails.trim();
    if (!raw) return true;
    try {
      const parsed: unknown = JSON.parse(raw);
      return !Array.isArray(parsed) || parsed.length === 0;
    } catch {
      return true;
    }
  }
  return true;
}

function droneDetailsCount(droneDetails: unknown): number {
  if (Array.isArray(droneDetails)) return droneDetails.length;
  if (typeof droneDetails === "string") {
    const raw = droneDetails.trim();
    if (!raw) return 0;
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

function mapDbPilotToPendingCard(row: DashboardPilotDbRow): PilotRegCard {
  const id = String(row.id ?? "").trim() || `pilot-${Math.random().toString(36).slice(2, 9)}`;
  const name = String(row.name ?? "").trim() || "Pilot";
  const license = String(row.license_number ?? "").trim() || "—";
  const flightHoursRaw = String(row.flight_hours ?? row.experience ?? "").trim();
  const region = [String(row.city ?? "").trim(), String(row.state ?? "").trim()]
    .filter(Boolean)
    .join(", ");

  return {
    id: `db-pending-${id}`,
    name,
    badge: "Pending drone details",
    submitted: "From database",
    rows: [
      { k: "License Type", v: license, vClass: "text-[#008B8B]" },
      { k: "Flight Experience", v: flightHoursRaw ? `${flightHoursRaw} Hours` : "—" },
      { k: "Region", v: region || "—" },
      { k: "Pilot ID", v: id, vClass: "font-mono text-xs" },
    ],
  };
}

function mapDbPilotToApprovedCard(row: DashboardPilotDbRow): PilotRegCard {
  const id = String(row.id ?? "").trim() || `pilot-${Math.random().toString(36).slice(2, 9)}`;
  const name = String(row.name ?? "").trim() || "Pilot";
  const license = String(row.license_number ?? "").trim() || "—";
  const region = [String(row.city ?? "").trim(), String(row.state ?? "").trim()]
    .filter(Boolean)
    .join(", ");
  const status = String(row.duty_status ?? "ACTIVE").trim().toUpperCase() || "ACTIVE";
  const drones = droneDetailsCount(row.drone_details);

  return {
    id: `db-approved-${id}`,
    name,
    badge: "Registered Pilot",
    submitted: "From database",
    rows: [
      { k: "License ID", v: license, vClass: "font-mono text-xs" },
      {
        k: "Status",
        v: status,
        vClass:
          status === "ACTIVE"
            ? "font-semibold text-green-700 dark:text-green-400"
            : "font-semibold text-amber-700 dark:text-amber-300",
      },
      { k: "Region", v: region || "—" },
      { k: "Drones registered", v: String(drones) },
    ],
  };
}

function makePilotLicenseId(): string {
  const mid = Math.random().toString(36).slice(2, 8).toUpperCase();
  const tail = String(Math.floor(100 + Math.random() * 900));
  return `AL-${mid}-${tail}`;
}

function formatApprovedRegisteredDate(): string {
  try {
    return new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function mapPendingToApproved(pilot: PilotRegCard): PilotRegCard {
  const region = pilot.rows.find((r) => r.k === "Region")?.v ?? "—";
  return {
    id: `approved-${pilot.id}`,
    name: pilot.name,
    badge: "Registered Pilot",
    submitted: formatApprovedRegisteredDate(),
    rows: [
      {
        k: "License ID",
        v: makePilotLicenseId(),
        vClass: "font-mono text-xs",
      },
      {
        k: "Status",
        v: "Active",
        vClass: "font-semibold text-green-700 dark:text-green-400",
      },
      { k: "Region", v: region },
    ],
  };
}

type PilotRegState = { pending: PilotRegCard[]; approved: PilotRegCard[] };

const initialPilotRegState: PilotRegState = getDefaultPilotRegState();

type PilotRegAction =
  | { type: "accept"; id: string }
  | { type: "reject"; id: string }
  | { type: "replace"; state: PilotRegState };

function pilotRegReducer(state: PilotRegState, action: PilotRegAction): PilotRegState {
  switch (action.type) {
    case "accept": {
      const pilot = state.pending.find((p) => p.id === action.id);
      if (!pilot) return state;
      return {
        pending: state.pending.filter((p) => p.id !== action.id),
        approved: [mapPendingToApproved(pilot), ...state.approved],
      };
    }
    case "reject":
      return {
        ...state,
        pending: state.pending.filter((p) => p.id !== action.id),
      };
    case "replace":
      return action.state;
    default:
      return state;
  }
}

export function DashboardHomeContent() {
  const router = useRouter();
  const [pilotRegState, dispatchPilotReg] = useReducer(
    pilotRegReducer,
    initialPilotRegState
  );
  const [pilotRegStorageReady, setPilotRegStorageReady] = useState(false);
  const [dbPendingPilots, setDbPendingPilots] = useState<PilotRegCard[]>([]);
  const [dbApprovedPilots, setDbApprovedPilots] = useState<PilotRegCard[]>([]);
  const [dbTotalPilots, setDbTotalPilots] = useState(0);
  const [dbTotalDrones, setDbTotalDrones] = useState(0);

  useEffect(() => {
    const stored = loadPilotRegStateFromStorage();
    if (stored) {
      dispatchPilotReg({ type: "replace", state: stored });
    }
    setPilotRegStorageReady(true);
  }, []);


  useEffect(() => {
    const onPendingUpdated = () => {
      const next = loadPilotRegStateFromStorage();
      if (next) dispatchPilotReg({ type: "replace", state: next });
    };
    window.addEventListener("aerolaminar-pending-pilots-updated", onPendingUpdated);
    return () =>
      window.removeEventListener(
        "aerolaminar-pending-pilots-updated",
        onPendingUpdated
      );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadDbPending = async () => {
      try {
        const [response, totalCountResponse] = await Promise.all([
          fetch(apiUrl("/api/pilots"), { cache: "no-store" }),
          fetch(apiUrl("/api/pilots/total-count"), { cache: "no-store" }),
        ]);
        let pilotsTotalFromDb: number | null = null;
        if (totalCountResponse.ok) {
          try {
            const tc: unknown = await totalCountResponse.json();
            if (
              tc &&
              typeof tc === "object" &&
              "count" in tc &&
              typeof (tc as { count: unknown }).count === "number"
            ) {
              const n = Number((tc as { count: number }).count);
              if (Number.isFinite(n)) pilotsTotalFromDb = n;
            }
          } catch {
            /* ignore */
          }
        }
        if (!response.ok) {
          if (!cancelled) {
            setDbPendingPilots([]);
            setDbApprovedPilots([]);
            setDbTotalPilots(pilotsTotalFromDb ?? 0);
            setDbTotalDrones(0);
          }
          return;
        }
        const data: unknown = await response.json();
        const list = Array.isArray(data) ? (data as DashboardPilotDbRow[]) : [];
        const pilotsCount = list.length;
        /** Total drones registered on pilot profiles (`pilots.drone_details` JSON arrays). */
        const dronesCount = list.reduce(
          (sum, row) => sum + droneDetailsCount(row.drone_details),
          0
        );
        const pending = list
          .filter((row) => droneDetailsMissing(row.drone_details))
          .map(mapDbPilotToPendingCard);
        const approved = list
          .filter((row) => !droneDetailsMissing(row.drone_details))
          .map(mapDbPilotToApprovedCard);
        if (!cancelled) {
          setDbTotalPilots(
            pilotsTotalFromDb !== null ? pilotsTotalFromDb : pilotsCount
          );
          setDbTotalDrones(dronesCount);
          setDbPendingPilots(pending);
          setDbApprovedPilots(approved);
        }
      } catch {
        if (!cancelled) {
          setDbTotalPilots(0);
          setDbTotalDrones(0);
          setDbPendingPilots([]);
          setDbApprovedPilots([]);
        }
      }
    };
    void loadDbPending();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pilotRegStorageReady || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        ADMIN_PILOT_REG_STATE_STORAGE_KEY,
        JSON.stringify(pilotRegState)
      );
    } catch {
      /* ignore quota */
    }
  }, [pilotRegState, pilotRegStorageReady]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#pilot-registrations") return;
    const t = window.setTimeout(() => {
      document
        .getElementById("pilot-registrations")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, []);

  const pendingPilots =
    dbPendingPilots.length > 0 ? dbPendingPilots : pilotRegState.pending;
  const approvedPilots =
    dbApprovedPilots.length > 0 ? dbApprovedPilots : pilotRegState.approved;

  const registeredTotalDisplay = (
    REGISTERED_PILOTS_COUNT_BASE + approvedPilots.length
  ).toLocaleString();

  const handleRejectPilot = (id: string) => {
    const pending = pendingPilots.find((p) => p.id === id);
    const pilotId = pending?.rows.find((r) => r.k === "Pilot ID")?.v?.trim();
    const query =
      pilotId && /^[0-9]+$/.test(pilotId)
        ? `?step=3&pilotId=${encodeURIComponent(pilotId)}&from=admin`
        : "?step=3&from=admin";
    router.push(`/pilot-registration${query}`);
  };

  return (
    <>
      <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "mt-8 mb-8")}>Admin Dashboard</h1>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Pilots"
          value={dbTotalPilots.toLocaleString()}
          icon={Users}
          iconClassName="text-[#008B8B]"
          iconBg="bg-[#008B8B]/5"
        />
        <KpiCard
          title="Total Drones"
          value={dbTotalDrones.toLocaleString()}
          icon={Plane}
          iconClassName="text-[#008B8B]"
          iconBg="bg-[#008B8B]/5"
        />
        <KpiCard
          title="Pilot registration pending"
          value={String(pendingPilots.length)}
          icon={ClipboardList}
          iconClassName="text-[#ba1a1a]"
          iconBg="bg-[#ffdad6]/80"
        />
        <KpiCard
          title="Registered pilots"
          value={registeredTotalDisplay}
          icon={UserCheck}
          iconClassName="text-green-700 dark:text-green-400"
          iconBg="bg-green-100 dark:bg-green-950/40"
        />
      </section>

      <PendingRegistrationsSection
        pendingPilots={pendingPilots}
        approvedPilots={approvedPilots}
        onRejectPilot={handleRejectPilot}
      />
    </>
  );
}

export function CommandCenterView() {
  return <DashboardHomeContent />;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  iconBg,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  iconBg: string;
}) {
  return (
    <div
      className={cn(
        "cc-glass-card flex items-center justify-between rounded-2xl p-5",
        ADMIN_DASH_PANEL_BORDER
      )}
    >
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <h2 className="mt-1 text-2xl font-bold tabular-nums text-foreground">
          {value}
        </h2>
      </div>
      <div className={cn("rounded-xl p-2.5", iconBg)}>
        <Icon className={cn("size-7", iconClassName)} aria-hidden />
      </div>
    </div>
  );
}

function PendingRegistrationsSection({
  pendingPilots,
  approvedPilots,
  onRejectPilot,
}: {
  pendingPilots: PilotRegCard[];
  approvedPilots: PilotRegCard[];
  onRejectPilot: (id: string) => void;
}) {
  const [pilotRegView, setPilotRegView] = useState<"pending" | "approved">(
    "pending"
  );
  const [profilePilot, setProfilePilot] = useState<PilotRegCard | null>(null);

  const list = pilotRegView === "pending" ? pendingPilots : approvedPilots;

  return (
    <section id="pilot-registrations" className="scroll-mt-24 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {pilotRegView === "approved"
              ? "Registered Pilot"
              : "Pilot Registrations Pending"}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            aria-pressed={pilotRegView === "pending"}
            className={cn(
              "rounded-lg text-xs font-semibold",
              pilotRegView === "pending"
                ? "bg-[#008B8B] text-white shadow-lg shadow-[#008B8B]/20 hover:bg-[#006b6b]"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            onClick={() => setPilotRegView("pending")}
          >
            Pending Pilots
          </Button>
          <Button
            type="button"
            size="sm"
            aria-pressed={pilotRegView === "approved"}
            className={cn(
              "rounded-lg text-xs font-semibold",
              pilotRegView === "approved"
                ? "bg-[#008B8B] text-white shadow-lg shadow-[#008B8B]/20 hover:bg-[#006b6b]"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            onClick={() => setPilotRegView("approved")}
          >
            Approved Pilots
          </Button>
        </div>
      </div>

      <PilotRegistrationsTable
        variant={pilotRegView}
        pilots={list}
        onRejectPilot={onRejectPilot}
        onViewProfile={(p) => setProfilePilot(p)}
      />

      <ApprovedPilotProfileModal
        pilot={profilePilot}
        onClose={() => setProfilePilot(null)}
      />
    </section>
  );
}

function pilotRowValue(
  pilot: PilotRegCard,
  key: string
): { v: string; vClass?: string } {
  const row = pilot.rows.find((r) => r.k === key);
  return { v: row?.v?.trim() || "—", vClass: row?.vClass };
}

const PENDING_TABLE_COLUMNS = [
  "License Type",
  "Flight Experience",
  "Pilot ID",
] as const;

const APPROVED_TABLE_COLUMNS = [
  "License ID",
  "Status",
] as const;

function PilotRegistrationsTable({
  variant,
  pilots,
  onRejectPilot,
  onViewProfile,
}: {
  variant: "pending" | "approved";
  pilots: PilotRegCard[];
  onRejectPilot: (id: string) => void;
  onViewProfile: (pilot: PilotRegCard) => void;
}) {
  const isPending = variant === "pending";
  const detailColumns = isPending ? PENDING_TABLE_COLUMNS : APPROVED_TABLE_COLUMNS;
  const thBase =
    "px-3 py-3 align-middle text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-4 sm:py-3.5 sm:text-[10px] sm:tracking-wider";
  const tdBase =
    "min-w-0 px-3 py-3 align-middle text-[10px] text-foreground sm:px-4 sm:py-3.5 sm:text-[11px]";

  if (pilots.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/80 bg-card px-6 py-12 text-center",
          ADMIN_DASH_PANEL_BORDER
        )}
      >
        <p className="text-sm font-medium text-muted-foreground">
          {isPending
            ? "No pending pilot registrations."
            : "No registered pilots yet."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card",
        ADMIN_DASH_PANEL_BORDER
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              <th scope="col" className={cn(thBase, "text-left")}>
                Pilot name
              </th>
              <th scope="col" className={cn(thBase, "text-left")}>
                Badge
              </th>
              {detailColumns.map((col) => (
                <th key={col} scope="col" className={cn(thBase, "text-left")}>
                  {col}
                </th>
              ))}
              <th scope="col" className={cn(thBase, "text-right")}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pilots.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <td className={cn(tdBase, "font-semibold")}>{p.name}</td>
                <td className={tdBase}>
                  <span
                    className={cn(
                      "inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                      isPending
                        ? "bg-[#cfe8e8] text-[#0a3030] dark:bg-primary/25 dark:text-primary"
                        : "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                    )}
                  >
                    {p.badge}
                  </span>
                </td>
                {detailColumns.map((col) => {
                  const { v, vClass } = pilotRowValue(p, col);
                  return (
                    <td key={col} className={cn(tdBase, "font-medium")}>
                      <span className={vClass}>{v}</span>
                    </td>
                  );
                })}
                <td className={cn(tdBase, "text-right")}>
                  {isPending ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-[#008B8B] text-xs font-bold text-[#008B8B] hover:bg-[#008B8B] hover:text-white"
                      onClick={() => onRejectPilot(p.id)}
                    >
                      Add drone details
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-[#008B8B] text-xs font-bold text-[#008B8B] hover:bg-[#008B8B] hover:text-white"
                      onClick={() => onViewProfile(p)}
                    >
                      View profile
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ApprovedPilotProfileModal({
  pilot,
  onClose,
}: {
  pilot: PilotRegCard | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!pilot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [pilot, onClose]);

  if (!pilot) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approved-pilot-profile-title"
        className={cn(
          "relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white text-foreground shadow-2xl dark:bg-black sm:rounded-2xl",
          ADMIN_DASH_PANEL_BORDER
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 px-5 py-4 sm:px-6",
            ADMIN_DASH_DIVIDER_BORDER
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full bg-muted",
                ADMIN_DASH_AVATAR_RING
              )}
              aria-hidden
            >
              <User
                className="size-6 text-muted-foreground"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0">
              <h2
                id="approved-pilot-profile-title"
                className="truncate text-base font-bold text-foreground sm:text-lg"
              >
                {pilot.name}
              </h2>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                {pilot.badge}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <p className="mb-5 text-[11px] font-medium text-muted-foreground">
            Registered: {pilot.submitted}
          </p>
          <dl className="grid gap-4 sm:grid-cols-2">
            {pilot.rows.map((row, i) => (
              <div
                key={`${row.k}-${i}`}
                className={cn(
                  row.k === "License ID" ? "sm:col-span-2" : undefined
                )}
              >
                <DetailField label={row.k}>
                  <span className={cn("font-semibold", row.vClass)}>{row.v}</span>
                </DetailField>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
