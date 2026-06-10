"use client";

import {
  Activity,
  ClipboardList,
  Clock,
  IdCard,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  Plane,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminKpiCard } from "@/components/dashboard/admin-kpi-card";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api-url";
import { PROFILE_INFO_POPUP_SHELL_CLASS } from "@/lib/profile-popup-styles";
import { type PilotRegCard } from "@/lib/admin-pilot-registration-storage";
import {
  ADMIN_DASH_AVATAR_RING,
  ADMIN_DASH_PANEL_BORDER,
} from "@/lib/admin-dashboard-styles";
import {
  ADMIN_PROFILE_UPDATED_EVENT,
  getAdminDisplayName,
} from "@/lib/admin-profile-storage";
import { jwtPayloadRole } from "@/lib/pilot-display-name";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

/** No hardcoded approved-pilot baseline. */
const REGISTERED_PILOTS_COUNT_BASE = 0;

type DashboardPilotDbRow = {
  id?: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
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
      { k: "License ID", v: license, vClass: "text-[#008B8B]" },
      { k: "Flight Experience", v: flightHoursRaw ? `${flightHoursRaw} hours` : "—" },
      { k: "Region", v: region || "—" },
      { k: "Pilot ID", v: id, vClass: "font-mono text-xs" },
    ],
  };
}

function mapDbPilotToApprovedCard(row: DashboardPilotDbRow): PilotRegCard {
  const id = String(row.id ?? "").trim() || `pilot-${Math.random().toString(36).slice(2, 9)}`;
  const name = String(row.name ?? "").trim() || "Pilot";
  const license = String(row.license_number ?? "").trim() || "—";
  const email = String(row.email ?? "").trim() || "—";
  const phone = String(row.phone ?? "").trim() || "—";
  const region = [String(row.city ?? "").trim(), String(row.state ?? "").trim()]
    .filter(Boolean)
    .join(", ");
  const status = String(row.duty_status ?? "ACTIVE").trim().toUpperCase() || "ACTIVE";
  const flightHoursRaw = String(row.flight_hours ?? row.experience ?? "").trim();
  const flightExperience = flightHoursRaw ? `${flightHoursRaw} hours` : "—";
  const drones = droneDetailsCount(row.drone_details);

  return {
    id: `db-approved-${id}`,
    name,
    badge: "Registered Pilot",
    submitted: "",
    rows: [
      { k: "Pilot ID", v: id, vClass: "font-mono text-xs" },
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
      { k: "Email", v: email },
      { k: "Phone", v: phone },
      { k: "Flight experience", v: flightExperience },
      { k: "Drones registered", v: String(drones) },
    ],
  };
}

export function DashboardHomeContent() {
  const router = useRouter();
  const [adminWelcome, setAdminWelcome] = useState<string | null>(null);
  const [dbPendingPilots, setDbPendingPilots] = useState<PilotRegCard[]>([]);
  const [dbApprovedPilots, setDbApprovedPilots] = useState<PilotRegCard[]>([]);
  const [dbTotalPilots, setDbTotalPilots] = useState(0);
  const [dbTotalDrones, setDbTotalDrones] = useState(0);

  useEffect(() => {
    const sync = () => {
      const t =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!t || jwtPayloadRole(t) !== "admin") {
        setAdminWelcome(null);
        return;
      }
      setAdminWelcome(getAdminDisplayName());
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener(ADMIN_PROFILE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener(ADMIN_PROFILE_UPDATED_EVENT, sync);
    };
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
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#pilot-registrations") return;
    const t = window.setTimeout(() => {
      document
        .getElementById("pilot-registrations")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, []);

  const pendingPilots = dbPendingPilots;
  const approvedPilots = dbApprovedPilots;

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
      <AdminDashboardHero adminWelcome={adminWelcome} />

      <section className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          title="Total Pilots"
          value={dbTotalPilots.toLocaleString()}
          icon={Users}
          iconClassName="text-[#008B8B]"
          iconBg="bg-gradient-to-br from-[#008B8B]/15 to-[#008B8B]/5"
          accentClass="bg-gradient-to-r from-[#008B8B] to-[#00b4b4]"
        />
        <AdminKpiCard
          title="Total Drones"
          value={dbTotalDrones.toLocaleString()}
          icon={Plane}
          iconClassName="text-[#008B8B]"
          iconBg="bg-gradient-to-br from-[#008B8B]/15 to-[#008B8B]/5"
          accentClass="bg-gradient-to-r from-[#008B8B] to-[#00b4b4]"
        />
        <AdminKpiCard
          title="Pilot registration pending"
          value={String(pendingPilots.length)}
          icon={ClipboardList}
          iconClassName="text-[#ba1a1a]"
          iconBg="bg-gradient-to-br from-[#ffdad6] to-[#ffdad6]/40 dark:from-red-950/60 dark:to-red-950/30"
          accentClass="bg-gradient-to-r from-[#ba1a1a] to-[#e53935]"
        />
        <AdminKpiCard
          title="Registered pilots"
          value={registeredTotalDisplay}
          icon={UserCheck}
          iconClassName="text-green-700 dark:text-green-400"
          iconBg="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/50 dark:to-green-950/20"
          accentClass="bg-gradient-to-r from-green-600 to-emerald-400"
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

function AdminDashboardHero({
  adminWelcome,
}: {
  adminWelcome: string | null;
}) {
  return (
    <header
      className={cn(
        "admin-dash-hero relative mt-6 overflow-hidden rounded-2xl sm:mt-8",
        ADMIN_DASH_PANEL_BORDER
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[#008B8B]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 left-1/3 size-28 rounded-full bg-[#008B8B]/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#008B8B]/25 bg-[#008B8B]/10 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:size-11"
              aria-hidden
            >
              <LayoutDashboard
                className="size-5 text-[#008B8B] sm:size-6"
                strokeWidth={2.25}
              />
            </div>
            <div className="min-w-0">
              <h1 className={ADMIN_PAGE_TITLE_CLASS}>Admin Dashboard</h1>
              <span
                className="mt-1.5 block h-1 w-10 rounded-full bg-gradient-to-r from-[#008B8B] to-[#008B8B]/40"
                aria-hidden
              />
            </div>
          </div>
          {adminWelcome ? (
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Welcome back,{" "}
              <span className="font-semibold text-foreground">
                {adminWelcome}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor pilots, drones, and registrations at a glance.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5 self-start rounded-xl border border-[#008B8B]/20 bg-[#008B8B]/8 px-4 py-2.5 sm:self-center">
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#008B8B]/40 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#008B8B]" />
          </span>
          <Activity className="size-4 shrink-0 text-[#008B8B]" aria-hidden />
          <span className="text-xs font-semibold text-[#006b6b] dark:text-[#5ec4c4]">
            Live overview
          </span>
        </div>
      </div>
    </header>
  );
}

function pilotInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
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
    <section
      id="pilot-registrations"
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl bg-card",
        ADMIN_DASH_PANEL_BORDER
      )}
    >
      <div className="bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#008B8B]">
              Pilot management
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {pilotRegView === "approved"
                ? "Registered Pilots"
                : "Pending Pilot Registrations"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {pilotRegView === "approved"
                ? "Pilots with complete drone registration details."
                : "Pilots awaiting drone details before full approval."}
            </p>
          </div>
          <div
            className="inline-flex shrink-0 gap-2 self-start sm:self-center"
            role="tablist"
            aria-label="Pilot registration view"
          >
            <Button
              type="button"
              size="sm"
              role="tab"
              aria-selected={pilotRegView === "pending"}
              aria-pressed={pilotRegView === "pending"}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-semibold shadow-none",
                pilotRegView === "pending"
                  ? "bg-[#008B8B] text-white hover:bg-[#006b6b]"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
              onClick={() => setPilotRegView("pending")}
            >
              Pending Pilots
            </Button>
            <Button
              type="button"
              size="sm"
              role="tab"
              aria-selected={pilotRegView === "approved"}
              aria-pressed={pilotRegView === "approved"}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-semibold shadow-none",
                pilotRegView === "approved"
                  ? "bg-[#008B8B] text-white hover:bg-[#006b6b]"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
              onClick={() => setPilotRegView("approved")}
            >
              Approved Pilots
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <PilotRegistrationsTable
          variant={pilotRegView}
          pilots={list}
          onRejectPilot={onRejectPilot}
          onViewProfile={(p) => setProfilePilot(p)}
        />
      </div>

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
  const row =
    pilot.rows.find((r) => r.k === key) ??
    (key === "License ID"
      ? pilot.rows.find((r) => r.k === "License Type")
      : undefined);
  let v = row?.v?.trim() || "—";
  if (key === "Flight Experience" && v !== "—") {
    v = v.replace(/\s*hours?\s*$/i, " hours");
  }
  return { v, vClass: row?.vClass };
}

const PENDING_TABLE_COLUMNS = [
  "License ID",
  "Flight Experience",
  "Pilot ID",
  "Status",
] as const;

const APPROVED_TABLE_COLUMNS = [
  "License ID",
  "Status",
] as const;

function pilotRegistrationStatusPill(variant: "pending" | "approved"): {
  label: string;
  className: string;
} {
  if (variant === "pending") {
    return {
      label: "Review Pending",
      className:
        "bg-amber-100 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50",
    };
  }
  return {
    label: "Approved Pilot",
    className:
      "bg-green-100 text-green-800 ring-1 ring-green-200/80 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-800/50",
  };
}

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
    "whitespace-nowrap px-4 py-3.5 text-left align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:px-5 sm:py-4 sm:text-xs";
  const thCenter =
    "whitespace-nowrap px-4 py-3.5 text-center align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:px-5 sm:py-4 sm:text-xs";
  const thActions =
    "whitespace-nowrap px-4 py-3.5 text-right align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:px-5 sm:py-4 sm:text-xs";
  const tdBase =
    "min-w-0 px-4 py-3.5 align-middle text-left text-sm text-muted-foreground sm:px-5 sm:py-4";
  const tdCenter =
    "min-w-0 px-4 py-3.5 align-middle text-center text-sm text-muted-foreground sm:px-5 sm:py-4";
  const tdActions = "min-w-0 px-4 py-3.5 align-middle text-right text-sm sm:px-5 sm:py-4";

  if (pilots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
        <div
          className={cn(
            "mb-4 flex size-12 items-center justify-center rounded-full bg-[#008B8B]/10",
            ADMIN_DASH_AVATAR_RING
          )}
        >
          <Users className="size-5 text-[#008B8B]" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {isPending ? "No pending registrations" : "No registered pilots yet"}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {isPending
            ? "All pilot registrations are up to date."
            : "Approved pilots will appear here once drone details are complete."}
        </p>
      </div>
    );
  }

  const statusPill = pilotRegistrationStatusPill(variant);

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-gradient-to-r from-[#008B8B]/8 via-muted/40 to-transparent dark:from-[#008B8B]/15">
              <th scope="col" className={thBase}>
                Pilot Name
              </th>
              {detailColumns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className={col === "Status" ? thCenter : thBase}
                >
                  {col}
                </th>
              ))}
              <th scope="col" className={thActions}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pilots.map((p) => (
              <tr
                key={p.id}
                className="transition-colors hover:bg-[#008B8B]/[0.03] dark:hover:bg-[#008B8B]/10"
              >
                <td className={tdBase}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#008B8B]/20 to-[#008B8B]/5 text-xs font-bold text-[#006b6b] dark:text-[#5ec4c4]",
                        ADMIN_DASH_AVATAR_RING
                      )}
                      aria-hidden
                    >
                      {pilotInitials(p.name)}
                    </div>
                    <span
                      className="block truncate font-medium text-foreground"
                      title={p.name}
                    >
                      {p.name}
                    </span>
                  </div>
                </td>
                {detailColumns.map((col) => {
                  if (col === "Status") {
                    return (
                      <td key={col} className={tdCenter}>
                        <span
                          className={cn(
                            "inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium",
                            statusPill.className
                          )}
                        >
                          {statusPill.label}
                        </span>
                      </td>
                    );
                  }
                  const { v, vClass } = pilotRowValue(p, col);
                  return (
                    <td key={col} className={tdBase}>
                      <span
                        className={cn(
                          "block truncate",
                          vClass,
                          col === "Pilot ID" && "tabular-nums"
                        )}
                        title={v}
                      >
                        {v}
                      </span>
                    </td>
                  );
                })}
                <td className={tdActions}>
                  {isPending ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 whitespace-nowrap rounded-lg border-[#008B8B] bg-transparent px-3 text-[11px] font-bold text-[#008B8B] hover:border-[#008B8B] hover:bg-[#008B8B]/5 sm:text-xs"
                      onClick={() => onRejectPilot(p.id)}
                    >
                      Add Drone Details
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 whitespace-nowrap rounded-lg border-[#008B8B]/40 px-3 text-[11px] font-bold text-[#008B8B] hover:border-[#008B8B] hover:bg-[#008B8B]/5 sm:text-xs"
                      onClick={() => onViewProfile(p)}
                    >
                      View Profile
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


function pilotProfileRow(
  pilot: PilotRegCard,
  key: string
): { label: string; value: string; valueClass?: string } {
  const row = pilot.rows.find((r) => r.k === key);
  return {
    label: key,
    value: row?.v?.trim() || "—",
    valueClass: row?.vClass,
  };
}

function PilotProfileFieldCard({
  icon: Icon,
  label,
  value,
  valueClass,
  accentClass = "bg-[#008B8B]/10 text-[#008B8B]",
}: {
  icon: typeof User;
  label: string;
  value: string;
  valueClass?: string;
  accentClass?: string;
}) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-start gap-2.5 rounded-xl border border-neutral-200/80 bg-white p-2.5 transition-colors sm:p-3",
        "hover:border-[#008B8B]/25 hover:bg-[#008B8B]/[0.02]",
        "dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#008B8B]/30"
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8",
          accentClass
        )}
        aria-hidden
      >
        <Icon className="size-3.5 sm:size-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground sm:text-[10px]">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-xs font-semibold leading-snug text-foreground sm:text-sm",
            valueClass
          )}
          title={value}
        >
          {value}
        </p>
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

  const pilotId = pilotProfileRow(pilot, "Pilot ID");
  const license = pilotProfileRow(pilot, "License ID");
  const status = pilotProfileRow(pilot, "Status");
  const region = pilotProfileRow(pilot, "Region");
  const email = pilotProfileRow(pilot, "Email");
  const phone = pilotProfileRow(pilot, "Phone");
  const flightExperience = pilotProfileRow(pilot, "Flight experience");
  const dronesRegistered = pilotProfileRow(pilot, "Drones registered");
  const isActive = status.value.toUpperCase() === "ACTIVE";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#191c1d]/45 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approved-pilot-profile-title"
        className={cn(
          "relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:rounded-3xl",
          PROFILE_INFO_POPUP_SHELL_CLASS
        )}
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#008B8B]/12 via-[#008B8B]/5 to-transparent px-4 pb-4 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
          <div
            className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-[#008B8B]/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-6 bottom-0 size-28 rounded-full bg-[#008B8B]/8 blur-xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-3.5">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#008B8B] to-[#006d6d] shadow-[0_6px_16px_rgba(0,139,139,0.3)] sm:size-12 sm:rounded-2xl",
                  ADMIN_DASH_AVATAR_RING
                )}
                aria-hidden
              >
                <User className="size-5 text-white sm:size-6" strokeWidth={2} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#008B8B] sm:text-[10px]">
                  Pilot profile
                </p>
                <h2
                  id="approved-pilot-profile-title"
                  className="mt-0.5 truncate text-lg font-bold tracking-tight text-foreground sm:text-xl"
                >
                  {pilot.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                    <span
                      className="size-1.5 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    {pilot.badge}
                  </span>
                  {pilotId.value !== "—" ? (
                    <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-neutral-200/80 dark:bg-white/5 dark:ring-white/10">
                      <span className="font-semibold text-foreground">
                        ID
                      </span>
                      <span className="mx-1.5 text-neutral-300 dark:text-white/20">
                        |
                      </span>
                      <span className="font-mono text-foreground">
                        {pilotId.value}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative shrink-0 rounded-full bg-white/70 p-2 text-muted-foreground shadow-sm ring-1 ring-neutral-200/80 transition-all hover:bg-white hover:text-foreground dark:bg-white/10 dark:ring-white/10 dark:hover:bg-white/15"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="overflow-hidden px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
          <section className="mt-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-white/10" />
              <p className="shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
                Registration &amp; credentials
              </p>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              <PilotProfileFieldCard
                icon={IdCard}
                label="License ID"
                value={license.value}
                valueClass={cn("font-mono", license.valueClass)}
              />
              <div
                className={cn(
                  "group flex min-w-0 items-start gap-2.5 rounded-xl border border-neutral-200/80 bg-white p-2.5 transition-colors sm:p-3",
                  "hover:border-[#008B8B]/25 hover:bg-[#008B8B]/[0.02]",
                  "dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#008B8B]/30"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  )}
                  aria-hidden
                >
                  <ShieldCheck className="size-3.5 sm:size-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground sm:text-[10px]">
                    Status
                  </p>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-xs",
                      isActive
                        ? "bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300"
                        : "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/20 dark:text-amber-200"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        isActive ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{status.value}</span>
                  </span>
                </div>
              </div>
              <PilotProfileFieldCard
                icon={MapPin}
                label="Region"
                value={region.value}
                accentClass="bg-sky-500/10 text-sky-700 dark:text-sky-300"
              />
              <PilotProfileFieldCard
                icon={Plane}
                label="Drones registered"
                value={dronesRegistered.value}
                accentClass="bg-violet-500/10 text-violet-700 dark:text-violet-300"
              />
            </div>
          </section>

          <section className="mt-3 sm:mt-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-white/10" />
              <p className="shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
                Contact &amp; experience
              </p>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
              <PilotProfileFieldCard
                icon={Mail}
                label="Email"
                value={email.value}
                valueClass={email.valueClass}
                accentClass="bg-rose-500/10 text-rose-700 dark:text-rose-300"
              />
              <PilotProfileFieldCard
                icon={Phone}
                label="Phone"
                value={phone.value}
                valueClass={phone.valueClass}
                accentClass="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
              />
              <PilotProfileFieldCard
                icon={Clock}
                label="Flight experience"
                value={flightExperience.value}
                valueClass={cn("col-span-2 sm:col-span-1", flightExperience.valueClass)}
                accentClass="bg-orange-500/10 text-orange-700 dark:text-orange-300"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
