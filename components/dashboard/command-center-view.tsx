"use client";

import { ClipboardList, Plane, User, UserCheck, Users, X } from "lucide-react";
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
        const response = await fetch(apiUrl("/api/pilots"), { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setDbPendingPilots([]);
            setDbApprovedPilots([]);
            setDbTotalPilots(0);
            setDbTotalDrones(0);
          }
          return;
        }
        const data: unknown = await response.json();
        const list = Array.isArray(data) ? (data as DashboardPilotDbRow[]) : [];
        const pilotsCount = list.length;
        const dronesFromPilots = list.reduce(
          (sum, row) => sum + droneDetailsCount(row.drone_details),
          0
        );
        let dronesCount = dronesFromPilots;
        try {
          const dronesResponse = await fetch(apiUrl("/api/drones"), {
            cache: "no-store",
          });
          if (dronesResponse.ok) {
            const dronesData: unknown = await dronesResponse.json();
            if (Array.isArray(dronesData)) {
              dronesCount = dronesData.length;
            }
          }
        } catch {
          // Fallback remains drones count inferred from pilots.drone_details
        }
        const pending = list
          .filter((row) => droneDetailsMissing(row.drone_details))
          .map(mapDbPilotToPendingCard);
        const approved = list
          .filter((row) => !droneDetailsMissing(row.drone_details))
          .map(mapDbPilotToApprovedCard);
        if (!cancelled) {
          setDbTotalPilots(pilotsCount);
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

  const handleAcceptPilot = (id: string) => {
    dispatchPilotReg({ type: "accept", id });
  };

  const handleRejectPilot = (id: string) => {
    const pending = pendingPilots.find((p) => p.id === id);
    const pilotId = pending?.rows.find((r) => r.k === "Pilot ID")?.v?.trim();
    const query =
      pilotId && /^[0-9]+$/.test(pilotId)
        ? `?step=3&pilotId=${encodeURIComponent(pilotId)}`
        : "?step=3";
    window.location.href = `/pilot-registration${query}`;
  };

  return (
    <>
      <h1 className={ADMIN_PAGE_TITLE_CLASS}>Admin Dashboard</h1>

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
        onAcceptPilot={handleAcceptPilot}
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
    <div className="cc-glass-card flex items-center justify-between rounded-2xl border border-border/60 p-5 shadow-sm">
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
  onAcceptPilot,
  onRejectPilot,
}: {
  pendingPilots: PilotRegCard[];
  approvedPilots: PilotRegCard[];
  onAcceptPilot: (id: string) => void;
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
            Pilot registrations
          </h3>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
            {pilotRegView === "pending"
              ? "Pilots awaiting review — accept or reject each application."
              : "Pilots who have completed registration and are cleared to operate."}
          </p>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <PendingPilotCard
            key={p.id}
            variant={pilotRegView === "pending" ? "pending" : "approved"}
            name={p.name}
            badge={p.badge}
            submitted={p.submitted}
            rows={p.rows}
            onAccept={() => onAcceptPilot(p.id)}
            onReject={() => onRejectPilot(p.id)}
            onViewProfile={
              pilotRegView === "approved"
                ? () => setProfilePilot(p)
                : undefined
            }
          />
        ))}
      </div>

      <ApprovedPilotProfileModal
        pilot={profilePilot}
        onClose={() => setProfilePilot(null)}
      />
    </section>
  );
}

function PendingPilotCard({
  name,
  badge,
  submitted,
  rows,
  variant,
  onAccept,
  onReject,
  onViewProfile,
}: {
  name: string;
  badge: string;
  submitted: string;
  rows: readonly { k: string; v: string; vClass?: string }[];
  variant: "pending" | "approved";
  onAccept: () => void;
  onReject: () => void;
  onViewProfile?: () => void;
}) {
  const isApproved = variant === "approved";

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted"
            aria-hidden
          >
            <User
              className="size-5 text-muted-foreground"
              strokeWidth={2}
            />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{name}</h4>
            <span
              className={cn(
                "mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                isApproved
                  ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                  : "bg-[#cfe8e8] text-[#0a3030] dark:bg-primary/25 dark:text-primary"
              )}
            >
              {badge}
            </span>
          </div>
        </div>
        <span className="max-w-[10rem] text-right text-[9px] font-bold text-muted-foreground sm:max-w-none">
          {isApproved ? "Registered: " : "Submitted: "}
          {submitted}
        </span>
      </div>
      <div className="mb-5 space-y-2.5">
        {rows.map(({ k, v, vClass }) => (
          <div key={k} className="flex justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{k}</span>
            <span className={cn("text-right font-semibold text-foreground", vClass)}>
              {v}
            </span>
          </div>
        ))}
      </div>
      {isApproved ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full rounded-lg border-[#008B8B] text-xs font-bold text-[#008B8B] hover:bg-[#008B8B] hover:text-white"
          onClick={onViewProfile}
        >
          View profile
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            size="sm"
            className="border border-[#008B8B] bg-transparent text-xs font-bold text-[#008B8B] hover:bg-[#008B8B]/10"
            onClick={onAccept}
          >
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border border-[#008B8B] bg-transparent text-xs font-bold text-[#008B8B] hover:bg-[#008B8B]/10"
            onClick={onReject}
          >
            Add Drone Details
          </Button>
        </div>
      )}
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
        className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-foreground shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted"
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
