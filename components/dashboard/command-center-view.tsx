"use client";

import {
  ClipboardList,
  Plane,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useReducer, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  loadUserRequests,
  mapUserRequestToAdminRow,
  USER_REQUESTS_STORAGE_KEY,
  USER_REQUESTS_UPDATED_EVENT,
  type UserMissionRequest,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

const cc = {
  primary: "#0058bc",
  primaryContainer: "#0070eb",
  onSurface: "#191c1d",
  secondaryLabel: "#4d5b7f",
  surface: "#f8f9fa",
  sidebar: "#f3f4f5",
  outlineVariant: "#c1c6d7",
  surfaceContainerHighest: "#e1e3e4",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#e7e8e9",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  tertiary: "#006195",
  tertiaryContainer: "#147ab8",
  primaryFixed: "#d8e2ff",
  onPrimaryFixed: "#001a41",
  tertiaryFixed: "#cde5ff",
  onTertiaryFixed: "#001d32",
  onSecondaryContainer: "#4d5b7f",
  onErrorContainer: "#93000a",
} as const;

/** Pilots awaiting registration review (shown under Pending Pilots). */
const PENDING_PILOT_REGISTRATIONS = [
  {
    name: "Jonathan Reiss",
    badge: "Pilot Candidate",
    submitted: "2h ago",
    rows: [
      {
        k: "License Type",
        v: "Commercial Class B",
        vClass: "text-[#0058bc]",
      },
      { k: "Flight Experience", v: "524 Hours" },
      { k: "Region", v: "Sector 7G North" },
    ],
  },
  {
    name: "Sasha Greywell",
    badge: "Pilot Candidate",
    submitted: "5h ago",
    rows: [
      {
        k: "License Type",
        v: "Cargo Heavy Duty",
        vClass: "text-[#0058bc]",
      },
      { k: "Flight Experience", v: "1,210 Hours" },
      { k: "Region", v: "Global Logistics Hub" },
    ],
  },
  {
    name: "Priya Shah",
    badge: "Pilot Candidate",
    submitted: "1d ago",
    rows: [
      {
        k: "License Type",
        v: "Commercial Class A",
        vClass: "text-[#0058bc]",
      },
      { k: "Flight Experience", v: "890 Hours" },
      { k: "Region", v: "Eastern Corridor" },
    ],
  },
] as const;

/** Pilots who completed registration (shown under Approved Pilots). */
const APPROVED_PILOT_REGISTRATIONS = [
  {
    name: "Elena Lourd",
    badge: "Registered Pilot",
    submitted: "Feb 8, 2026",
    rows: [
      { k: "License ID", v: "AL-110943-XP", vClass: "font-mono text-xs" },
      {
        k: "Status",
        v: "Active",
        vClass: "font-semibold text-green-700",
      },
      { k: "Region", v: "Sector 7G North" },
    ],
  },
  {
    name: "Marcus Kael",
    badge: "Registered Pilot",
    submitted: "Jan 22, 2026",
    rows: [
      { k: "License ID", v: "AL-445129-L1", vClass: "font-mono text-xs" },
      {
        k: "Status",
        v: "Active",
        vClass: "font-semibold text-green-700",
      },
      { k: "Region", v: "Port of Aerolia" },
    ],
  },
  {
    name: "Nora Quinn",
    badge: "Registered Pilot",
    submitted: "Mar 1, 2026",
    rows: [
      { k: "License ID", v: "AL-882301-K9", vClass: "font-mono text-xs" },
      {
        k: "Status",
        v: "Active",
        vClass: "font-semibold text-green-700",
      },
      { k: "Region", v: "Eastern Corridor" },
    ],
  },
] as const;

/** Base count so initial approved list (3) displays as 1,282. */
const REGISTERED_PILOTS_COUNT_BASE = 1279;

type PilotRegCard = {
  name: string;
  badge: string;
  submitted: string;
  rows: { k: string; v: string; vClass?: string }[];
};

function clonePilotRegistrations(
  source: readonly {
    name: string;
    badge: string;
    submitted: string;
    rows: readonly { k: string; v: string; vClass?: string }[];
  }[]
): PilotRegCard[] {
  return source.map((p) => ({
    name: p.name,
    badge: p.badge,
    submitted: p.submitted,
    rows: p.rows.map((r) => ({ k: r.k, v: r.v, vClass: r.vClass })),
  }));
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
        vClass: "font-semibold text-green-700",
      },
      { k: "Region", v: region },
    ],
  };
}

const PILOT_REG_STATE_STORAGE_KEY =
  "aerolaminar_dashboard_pilot_registrations_v1";

function safeParsePilotCards(data: unknown): PilotRegCard[] | null {
  if (!Array.isArray(data)) return null;
  const out: PilotRegCard[] = [];
  for (const item of data) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as PilotRegCard).name !== "string" ||
      typeof (item as PilotRegCard).badge !== "string" ||
      typeof (item as PilotRegCard).submitted !== "string" ||
      !Array.isArray((item as PilotRegCard).rows)
    ) {
      return null;
    }
    const rows: PilotRegCard["rows"] = [];
    for (const row of (item as PilotRegCard).rows) {
      if (
        !row ||
        typeof row !== "object" ||
        typeof row.k !== "string" ||
        typeof row.v !== "string"
      ) {
        return null;
      }
      rows.push({
        k: row.k,
        v: row.v,
        vClass:
          typeof row.vClass === "string" ? row.vClass : undefined,
      });
    }
    out.push({
      name: (item as PilotRegCard).name,
      badge: (item as PilotRegCard).badge,
      submitted: (item as PilotRegCard).submitted,
      rows,
    });
  }
  return out;
}

function loadPilotRegStateFromStorage(): {
  pending: PilotRegCard[];
  approved: PilotRegCard[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PILOT_REG_STATE_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const rec = o as Record<string, unknown>;
    const pending = safeParsePilotCards(rec.pending);
    const approved = safeParsePilotCards(rec.approved);
    if (!pending || !approved) return null;
    return { pending, approved };
  } catch {
    return null;
  }
}

type PilotRegState = { pending: PilotRegCard[]; approved: PilotRegCard[] };

const initialPilotRegState: PilotRegState = {
  pending: clonePilotRegistrations(PENDING_PILOT_REGISTRATIONS),
  approved: clonePilotRegistrations(APPROVED_PILOT_REGISTRATIONS),
};

type PilotRegAction =
  | { type: "accept"; name: string }
  | { type: "reject"; name: string }
  | { type: "replace"; state: PilotRegState };

function pilotRegReducer(state: PilotRegState, action: PilotRegAction): PilotRegState {
  switch (action.type) {
    case "accept": {
      const pilot = state.pending.find((p) => p.name === action.name);
      if (!pilot) return state;
      return {
        pending: state.pending.filter((p) => p.name !== action.name),
        approved: [mapPendingToApproved(pilot), ...state.approved],
      };
    }
    case "reject":
      return {
        ...state,
        pending: state.pending.filter((p) => p.name !== action.name),
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

  useEffect(() => {
    const stored = loadPilotRegStateFromStorage();
    if (stored) {
      dispatchPilotReg({ type: "replace", state: stored });
    }
    setPilotRegStorageReady(true);
  }, []);

  useEffect(() => {
    if (!pilotRegStorageReady || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        PILOT_REG_STATE_STORAGE_KEY,
        JSON.stringify(pilotRegState)
      );
    } catch {
      /* ignore quota */
    }
  }, [pilotRegState, pilotRegStorageReady]);

  const pendingPilots = pilotRegState.pending;
  const approvedPilots = pilotRegState.approved;

  const registeredTotalDisplay = (
    REGISTERED_PILOTS_COUNT_BASE + approvedPilots.length
  ).toLocaleString();

  const handleAcceptPilot = (name: string) => {
    dispatchPilotReg({ type: "accept", name });
  };

  const handleRejectPilot = (name: string) => {
    dispatchPilotReg({ type: "reject", name });
  };

  return (
    <>
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Pilots"
          value="1,284"
          icon={Users}
          iconClassName="text-[#0058bc]"
          iconBg="bg-[#0058bc]/5"
        />
        <KpiCard
          title="Total Drones"
          value="4,512"
          icon={Plane}
          iconClassName="text-[#0058bc]"
          iconBg="bg-[#0058bc]/5"
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
          iconClassName="text-green-700"
          iconBg="bg-green-100"
        />
      </section>

      <PendingRegistrationsSection
        pendingPilots={pendingPilots}
        approvedPilots={approvedPilots}
        onAcceptPilot={handleAcceptPilot}
        onRejectPilot={handleRejectPilot}
      />

      <div className="grid grid-cols-12 gap-8">
        <FleetAvailabilityPanel />
      </div>
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
    <div className="cc-glass-card flex items-center justify-between rounded-2xl border border-[#c1c6d7]/15 p-6 shadow-sm">
      <div>
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: cc.onSecondaryContainer }}
        >
          {title}
        </p>
        <h2 className="mt-1 text-3xl font-bold">
          {value}
        </h2>
      </div>
      <div className={cn("rounded-xl p-3", iconBg)}>
        <Icon className={cn("size-8", iconClassName)} aria-hidden />
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
  onAcceptPilot: (name: string) => void;
  onRejectPilot: (name: string) => void;
}) {
  const [pilotRegView, setPilotRegView] = useState<"pending" | "approved">(
    "pending"
  );
  const [profilePilot, setProfilePilot] = useState<PilotRegCard | null>(null);

  const list = pilotRegView === "pending" ? pendingPilots : approvedPilots;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold">
            Pilot registrations
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: cc.onSecondaryContainer }}
          >
            {pilotRegView === "pending"
              ? "Pilots awaiting review — accept or reject each application."
              : "Pilots who have completed registration and are cleared to operate."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            aria-pressed={pilotRegView === "pending"}
            className={cn(
              "rounded-lg font-semibold",
              pilotRegView === "pending"
                ? "bg-[#0058bc] text-white shadow-lg shadow-[#0058bc]/20 hover:bg-[#0070eb]"
                : "bg-[#e7e8e9] hover:bg-[#c1c6d7]/30"
            )}
            style={
              pilotRegView === "pending"
                ? undefined
                : { color: cc.onSecondaryContainer }
            }
            onClick={() => setPilotRegView("pending")}
          >
            Pending Pilots
          </Button>
          <Button
            type="button"
            aria-pressed={pilotRegView === "approved"}
            className={cn(
              "rounded-lg font-semibold",
              pilotRegView === "approved"
                ? "bg-[#0058bc] text-white shadow-lg shadow-[#0058bc]/20 hover:bg-[#0070eb]"
                : "bg-[#e7e8e9] hover:bg-[#c1c6d7]/30"
            )}
            style={
              pilotRegView === "approved"
                ? undefined
                : { color: cc.onSecondaryContainer }
            }
            onClick={() => setPilotRegView("approved")}
          >
            Approved Pilots
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <PendingPilotCard
            key={p.name}
            variant={pilotRegView === "pending" ? "pending" : "approved"}
            name={p.name}
            badge={p.badge}
            submitted={p.submitted}
            rows={p.rows}
            onAccept={() => onAcceptPilot(p.name)}
            onReject={() => onRejectPilot(p.name)}
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
    <div className="rounded-xl border border-[#c1c6d7]/15 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#c1c6d7]/30 bg-[#e7e8e9]"
            aria-hidden
          >
            <User
              className="size-6"
              strokeWidth={2}
              style={{ color: cc.onSecondaryContainer }}
            />
          </div>
          <div>
            <h4 className="text-base font-bold">{name}</h4>
            <span
              className="mt-0.5 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase"
              style={
                isApproved
                  ? {
                      background: "#dcfce7",
                      color: "#166534",
                    }
                  : {
                      background: cc.primaryFixed,
                      color: cc.onPrimaryFixed,
                    }
              }
            >
              {badge}
            </span>
          </div>
        </div>
        <span
          className="max-w-[10rem] text-right text-[10px] font-bold opacity-60 sm:max-w-none"
          style={{ color: cc.onSecondaryContainer }}
        >
          {isApproved ? "Registered: " : "Submitted: "}
          {submitted}
        </span>
      </div>
      <div className="mb-6 space-y-3">
        {rows.map(({ k, v, vClass }) => (
          <div key={k} className="flex justify-between gap-2 text-sm">
            <span style={{ color: cc.onSecondaryContainer }}>{k}</span>
            <span className={cn("text-right font-semibold", vClass)}>{v}</span>
          </div>
        ))}
      </div>
      {isApproved ? (
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-lg border-[#0058bc] font-bold text-[#0058bc] hover:bg-[#0058bc] hover:text-white"
          onClick={onViewProfile}
        >
          View profile
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            className="bg-[#0058bc] font-bold text-white hover:bg-[#0070eb]"
            onClick={onAccept}
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="bg-[#e7e8e9] font-bold hover:bg-[#c1c6d7]/30"
            style={{ color: cc.onSecondaryContainer }}
            onClick={onReject}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

const missionItems = [
  {
    title: "Medical Emergency Supply",
    badge: "CRITICAL",
    badgeClass: "bg-[#ffdad6] text-[#93000a]",
    barColor: "#ba1a1a",
    desc: "Payload: Insulin Cool-Box (4.2kg) | Target: Sector 7G Rural Clinic",
  },
  {
    title: "Industrial Part Delivery",
    badge: "NORMAL",
    badgeClass: "bg-[#cde5ff] text-[#001d32]",
    barColor: "#006195",
    desc: "Payload: Steel Coupling (12kg) | Target: Port of Aerolia",
  },
  {
    title: "Agricultural Mapping",
    badge: "ROUTINE",
    badgeClass: "bg-[#d8e2ff] text-[#001a41]",
    barColor: "#0058bc",
    desc: "Payload: Multispectral Camera (1.5kg) | Target: Highland Farms",
  },
] as const;

type MissionDemo = (typeof missionItems)[number];

type UserRequestDetailPayload =
  | { kind: "user"; request: UserMissionRequest }
  | { kind: "demo"; mission: MissionDemo };

function formatRequestSubmitted(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const priorityDisplay: Record<string, string> = {
  urgent: "Urgent",
  express: "Express",
  standard: "Standard",
};

function resolveUserRequestDetail(
  m: UserRequestAdminRow
): UserRequestDetailPayload | null {
  if (m.key.startsWith("demo-")) {
    const titleFromKey = m.key.slice("demo-".length);
    const mission = missionItems.find((x) => x.title === titleFromKey);
    if (!mission) return null;
    return { kind: "demo", mission };
  }
  const request = loadUserRequests().find((r) => r.id === m.key);
  if (!request) return null;
  return { kind: "user", request };
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: cc.onSecondaryContainer }}
      >
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[#191c1d]">{children}</dd>
    </div>
  );
}

function UserRequestDetailModal({
  payload,
  onClose,
}: {
  payload: UserRequestDetailPayload | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!payload) return;
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
  }, [payload, onClose]);

  if (!payload) return null;

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
        aria-labelledby="user-request-detail-title"
        className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#c1c6d7]/20 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#edeeef] px-5 py-4 sm:px-6">
          <h2
            id="user-request-detail-title"
            className="pr-4 text-lg font-bold text-[#191c1d] sm:text-xl"
          >
            Request details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#414755] transition-colors hover:bg-[#f3f4f5]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {payload.kind === "user" ? (
            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <DetailField label="Request ID">{payload.request.id}</DetailField>
              </div>
              <div className="sm:col-span-2">
                <DetailField label="Submitted">
                  {formatRequestSubmitted(payload.request.createdAt)}
                </DetailField>
              </div>
              <div className="sm:col-span-2">
                <DetailField label="Reason or title">
                  {payload.request.reasonOrTitle.trim() || "—"}
                </DetailField>
              </div>
              <DetailField label="Pickup location">
                {payload.request.pickupLocation.trim() || "—"}
              </DetailField>
              <DetailField label="Drop location">
                {payload.request.dropLocation.trim() || "—"}
              </DetailField>
              <DetailField label="Payload weight">
                {payload.request.payloadWeightKg
                  ? `${payload.request.payloadWeightKg} kg`
                  : "—"}
              </DetailField>
              <DetailField label="Type">
                {payload.request.requestType.trim() || "—"}
              </DetailField>
              <div className="sm:col-span-2">
                <DetailField label="Priority">
                  {payload.request.requestPriority
                    ? priorityDisplay[payload.request.requestPriority] ??
                      payload.request.requestPriority
                    : "—"}
                </DetailField>
              </div>
              <div className="sm:col-span-2">
                <DetailField label="List summary">
                  {mapUserRequestToAdminRow(payload.request).desc}
                </DetailField>
              </div>
            </dl>
          ) : (
            <dl className="grid gap-5">
              <DetailField label="Mission title">
                {payload.mission.title}
              </DetailField>
              <DetailField label="Priority tier">{payload.mission.badge}</DetailField>
              <div>
                <DetailField label="Routing & payload">{payload.mission.desc}</DetailField>
              </div>
              <p className="text-xs leading-relaxed text-[#414755]">
                Illustrative sample mission for the admin dashboard preview.
              </p>
            </dl>
          )}
        </div>
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
        className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#c1c6d7]/20 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#edeeef] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#c1c6d7]/30 bg-[#e7e8e9]"
              aria-hidden
            >
              <User
                className="size-6"
                strokeWidth={2}
                style={{ color: cc.onSecondaryContainer }}
              />
            </div>
            <div className="min-w-0">
              <h2
                id="approved-pilot-profile-title"
                className="truncate text-lg font-bold text-[#191c1d] sm:text-xl"
              >
                {pilot.name}
              </h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#166534]">
                {pilot.badge}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#414755] transition-colors hover:bg-[#f3f4f5]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <p
            className="mb-5 text-xs font-medium"
            style={{ color: cc.onSecondaryContainer }}
          >
            Registered: {pilot.submitted}
          </p>
          <dl className="grid gap-5 sm:grid-cols-2">
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

function FleetAvailabilityPanel() {
  const [userRows, setUserRows] = useState<UserRequestAdminRow[]>([]);
  const [detailModal, setDetailModal] = useState<UserRequestDetailPayload | null>(
    null
  );

  useEffect(() => {
    const refresh = () => {
      setUserRows(loadUserRequests().map(mapUserRequestToAdminRow));
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_REQUESTS_STORAGE_KEY || e.key === null) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const demoRows: UserRequestAdminRow[] = missionItems.map((m) => ({
    key: `demo-${m.title}`,
    title: m.title,
    badge: m.badge as UserRequestAdminRow["badge"],
    badgeClass: m.badgeClass,
    barColor: m.barColor,
    desc: m.desc,
  }));

  const rows = [...userRows, ...demoRows];

  return (
    <>
      <div className="col-span-12 rounded-2xl border border-[#c1c6d7]/15 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="mb-8 text-2xl font-bold">
          User Request
        </h3>
        <div className="space-y-4">
          {rows.map((m) => (
            <div key={m.key} className="relative pl-8">
              <div
                className="absolute bottom-0 left-0 top-0 w-1 rounded-full"
                style={{ backgroundColor: m.barColor }}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  className="min-w-0 flex-1 cursor-pointer rounded-r-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-[#f8f9fa]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/40"
                  onClick={() => {
                    const p = resolveUserRequestDetail(m);
                    if (p) setDetailModal(p);
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-bold">{m.title}</span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                        m.badgeClass
                      )}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: cc.onSecondaryContainer }}
                  >
                    {m.desc}
                  </p>
                </button>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#0058bc] text-xs font-bold text-[#0058bc] hover:bg-[#0058bc] hover:text-white"
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#0058bc] text-xs font-bold text-[#0058bc] hover:bg-[#0058bc] hover:text-white"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <UserRequestDetailModal
        payload={detailModal}
        onClose={() => setDetailModal(null)}
      />
    </>
  );
}
