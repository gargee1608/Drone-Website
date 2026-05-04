import type { PilotProfileSnapshot } from "@/lib/pilot-profile-snapshot";

export const ADMIN_PILOT_REG_STATE_STORAGE_KEY =
  "aerolaminar_dashboard_pilot_registrations_v1";

export type PilotRegCardRow = { k: string; v: string; vClass?: string };

export type PilotRegCard = {
  /** Stable key for list + accept/reject (seed rows use `seed-*`). */
  id: string;
  name: string;
  badge: string;
  submitted: string;
  rows: PilotRegCardRow[];
};

const PENDING_SEED = [
  {
    name: "Jonathan Reiss",
    badge: "Pilot Candidate",
    submitted: "2h ago",
    rows: [
      {
        k: "License Type",
        v: "Commercial Class B",
        vClass: "text-[#008B8B]",
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
        vClass: "text-[#008B8B]",
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
        vClass: "text-[#008B8B]",
      },
      { k: "Flight Experience", v: "890 Hours" },
      { k: "Region", v: "Eastern Corridor" },
    ],
  },
] as const;

const APPROVED_SEED: readonly {
  name: string;
  badge: string;
  submitted: string;
  rows: readonly { k: string; v: string; vClass?: string }[];
}[] = [];

function newSubmissionId() {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getDefaultPilotRegState(): {
  pending: PilotRegCard[];
  approved: PilotRegCard[];
} {
  return {
    pending: PENDING_SEED.map((p, i) => ({
      id: `seed-pending-${i}`,
      name: p.name,
      badge: p.badge,
      submitted: p.submitted,
      rows: p.rows.map((r) => ({ ...r })),
    })),
    approved: APPROVED_SEED.map((p, i) => ({
      id: `seed-approved-${i}`,
      name: p.name,
      badge: p.badge,
      submitted: p.submitted,
      rows: p.rows.map((r) => ({ ...r })),
    })),
  };
}

export function safeParsePilotCards(data: unknown): PilotRegCard[] | null {
  if (!Array.isArray(data)) return null;
  const out: PilotRegCard[] = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
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
        vClass: typeof row.vClass === "string" ? row.vClass : undefined,
      });
    }
    const rawId = (item as PilotRegCard).id;
    const id =
      typeof rawId === "string" && rawId.length > 0
        ? rawId
        : `legacy-${(item as PilotRegCard).name}-${i}`;
    out.push({
      id,
      name: (item as PilotRegCard).name,
      badge: (item as PilotRegCard).badge,
      submitted: (item as PilotRegCard).submitted,
      rows,
    });
  }
  return out;
}

export function loadPilotRegStateFromStorage(): {
  pending: PilotRegCard[];
  approved: PilotRegCard[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_PILOT_REG_STATE_STORAGE_KEY);
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

function snapshotToPendingCard(snapshot: PilotProfileSnapshot): PilotRegCard {
  const region = [snapshot.city, snapshot.state].filter(Boolean).join(", ");
  const skills =
    snapshot.skills.length > 0 ? snapshot.skills.join(", ") : "—";
  let submitted: string;
  try {
    submitted = new Date().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    submitted = new Date().toISOString().slice(0, 16);
  }
  const dgca = snapshot.dgca?.trim();
  const certs = snapshot.certifications;
  const certSummary =
    certs && certs.length > 0
      ? `${certs.length} file(s): ${certs.map((c) => c.name).join(", ")}`.slice(
          0,
          220
        )
      : "—";
  return {
    id: newSubmissionId(),
    name: snapshot.fullName.trim() || "Unnamed pilot",
    badge: "Pilot Candidate",
    submitted,
    rows: [
      { k: "Email", v: snapshot.email?.trim() || "—" },
      { k: "Phone", v: snapshot.phone?.trim() || "—" },
      {
        k: "DGCA License",
        v: dgca || "—",
        vClass: dgca ? "text-[#008B8B]" : undefined,
      },
      { k: "Flight Experience", v: `${snapshot.flightHours} Hours` },
      { k: "Skills", v: skills },
      { k: "Certifications upload", v: certSummary },
      { k: "Region", v: region || "—" },
      { k: "Drones registered", v: String(snapshot.drones?.length ?? 0) },
    ],
  };
}

/**
 * After pilot registration submit: prepend a new card to **Pending Pilots**
 * on the admin dashboard (same `localStorage` bucket as the dashboard).
 */
export function appendPendingPilotRegistration(
  snapshot: PilotProfileSnapshot
): void {
  if (typeof window === "undefined") return;
  try {
    const card = snapshotToPendingCard(snapshot);
    const stored = loadPilotRegStateFromStorage();
    const base = stored ?? getDefaultPilotRegState();
    const next = {
      pending: [card, ...base.pending],
      approved: base.approved,
    };
    localStorage.setItem(
      ADMIN_PILOT_REG_STATE_STORAGE_KEY,
      JSON.stringify(next)
    );
    window.dispatchEvent(new Event("aerolaminar-pending-pilots-updated"));
  } catch {
    /* quota / private mode */
  }
}
