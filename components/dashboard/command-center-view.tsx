"use client";

import { ClipboardList, Plane, User, UserCheck, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      <h1 className="sr-only lg:hidden">Admin Dashboard</h1>
      <h1
        className={cn(
          ADMIN_PAGE_TITLE_CLASS,
          "mb-4 mt-8 hidden lg:block sm:mb-5"
        )}
      >
        Admin Dashboard
      </h1>
      {adminWelcome ? (
        <h2 className="mb-4 text-xl font-bold text-foreground sm:mb-5">
          Welcome, {adminWelcome}
        </h2>
      ) : null}

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
          iconBg="bg-[#ffdad6]/80 dark:bg-red-950/50"
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
              ? "Registered Pilots"
              : "Pending Pilot Registrations"}
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
        "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50",
    };
  }
  return {
    label: "Approved Pilot",
    className:
      "bg-green-50 text-green-800 ring-1 ring-green-200/80 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-800/50",
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
  const columnCount = detailColumns.length + 2;
  const thBase =
    "whitespace-nowrap px-2 py-2.5 align-middle text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-2.5 sm:py-3 sm:text-[10px]";
  const tdBase =
    "min-w-0 px-2 py-2.5 align-middle text-center text-[10px] leading-snug text-foreground sm:px-2.5 sm:py-3 sm:text-[11px]";

  if (pilots.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {isPending
            ? "No pending pilot registrations at this time."
            : "No registered pilots at this time."}
        </p>
      </div>
    );
  }

  const statusPill = pilotRegistrationStatusPill(variant);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-[10px] leading-snug sm:text-[11px]">
          <colgroup>
            {Array.from({ length: columnCount }, (_, index) => (
              <col key={index} style={{ width: `${100 / columnCount}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/60">
              <th scope="col" className={thBase}>
                Pilot Name
              </th>
              {detailColumns.map((col) => (
                <th key={col} scope="col" className={thBase}>
                  {col}
                </th>
              ))}
              <th scope="col" className={thBase}>
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
                <td className={cn(tdBase, "font-semibold")}>
                  <span className="block truncate" title={p.name}>
                    {p.name}
                  </span>
                </td>
                {detailColumns.map((col) => {
                  if (col === "Status") {
                    return (
                      <td key={col} className={tdBase}>
                        <span
                          className={cn(
                            "inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold normal-case leading-tight sm:text-[11px]",
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
                    <td key={col} className={cn(tdBase, "font-medium")}>
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
                <td className={tdBase}>
                  {isPending ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 whitespace-nowrap rounded-lg border-[#008B8B] px-2.5 text-[10px] font-bold text-[#008B8B] hover:bg-[#008B8B] hover:text-white sm:px-3 sm:text-[11px]"
                      onClick={() => onRejectPilot(p.id)}
                    >
                      Add Drone Details
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 whitespace-nowrap rounded-lg border-[#008B8B] px-2.5 text-[10px] font-bold text-[#008B8B] hover:bg-[#008B8B] hover:text-white sm:px-3 sm:text-[11px]"
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

function InlinePilotProfileField({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <p className="min-w-0 text-xs leading-snug text-muted-foreground">
      <span className="font-semibold text-foreground">{label}</span>
      {" : "}
      <span className={cn("text-foreground", valueClass)}>{value}</span>
    </p>
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
        className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approved-pilot-profile-title"
        className={cn(
          "relative z-10 flex max-h-[min(90dvh,640px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border shadow-2xl sm:rounded-2xl dark:border-white/20",
          PROFILE_INFO_POPUP_SHELL_CLASS
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/10",
                ADMIN_DASH_AVATAR_RING
              )}
              aria-hidden
            >
              <User className="size-5 text-[#008B8B]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Pilot profile
              </p>
              <h2
                id="approved-pilot-profile-title"
                className="mt-1 truncate text-base font-semibold text-foreground sm:text-lg"
              >
                {pilot.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800 dark:bg-green-950/50 dark:text-green-300">
                  {pilot.badge}
                </span>
                {pilotId.value !== "—" ? (
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Pilot ID</span>
                    {" : "}
                    <span className="font-mono">{pilotId.value}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <section
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/20"
            )}
          >
            <div className="border-b border-border bg-muted/20 px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Registration &amp; credentials
              </p>
            </div>
            <div className="space-y-4 px-4 py-3 sm:px-5 sm:py-4">
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                <InlinePilotProfileField
                  label="License ID"
                  value={license.value}
                  valueClass={license.valueClass}
                />
                <div className="min-w-0">
                  <p className="text-xs leading-snug text-muted-foreground">
                    <span className="font-semibold text-foreground">Status</span>
                    {" : "}
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                      )}
                    >
                      {status.value}
                    </span>
                  </p>
                </div>
                <InlinePilotProfileField label="Region" value={region.value} />
                <InlinePilotProfileField
                  label="Drones registered"
                  value={dronesRegistered.value}
                />
              </div>
            </div>
          </section>

          <section
            className={cn(
              "mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/20"
            )}
          >
            <div className="border-b border-border bg-muted/20 px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Contact &amp; experience
              </p>
            </div>
            <div className="space-y-4 px-4 py-3 sm:px-5 sm:py-4">
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <InlinePilotProfileField
                  label="Email"
                  value={email.value}
                  valueClass="break-all"
                />
                <InlinePilotProfileField label="Phone" value={phone.value} />
                <InlinePilotProfileField
                  label="Flight experience"
                  value={flightExperience.value}
                />
                <InlinePilotProfileField
                  label="Pilot ID"
                  value={pilotId.value}
                  valueClass="font-mono text-xs"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
