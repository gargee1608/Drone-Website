"use client";

import {
  BadgeCheck,
  ChevronDown,
  Eye,
  PackageCheck,
  Pencil,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  deletePilotById,
  getPilotById,
  getPilots,
  patchPilotProfile,
} from "@/app/services/pilotServices";
import { DetailField } from "@/components/dashboard/user-request-detail-modal";
import { UserRequestStatCard } from "@/components/dashboard/user-request-stat-card";
import { apiUrl } from "@/lib/api-url";
import {
  flightHoursFromPilotRow,
  missionsCompletedFromPilotRow,
} from "@/lib/pilot-db-metrics";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import {
  PROFILE_INFO_POPUP_INNER_PANEL_CLASS,
  PROFILE_INFO_POPUP_SHELL_CLASS,
} from "@/lib/profile-popup-styles";
import { cn } from "@/lib/utils";

type DutyStatus = "ACTIVE" | "INACTIVE";

type PilotRow = {
  id: string;
  name: string;
  certLevel: number;
  flightHours: number;
  flightCount: number;
  dutyStatus: DutyStatus;
};

type PilotEditForm = {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  city: string;
  state: string;
  certLevel: string;
  experienceRank: string;
  flightHours: string;
  dutyStatus: DutyStatus;
};

const thBase =
  "px-3 py-3 align-middle text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-4 sm:py-3.5 sm:text-[10px] sm:tracking-wider";

const tdBase =
  "min-w-0 px-3 py-3 align-middle text-[10px] leading-snug text-foreground sm:px-4 sm:py-3.5 sm:text-[11px]";

type FilterTab = "all" | "active" | "inactive";

function CertificationBadge({ level }: { level: number }) {
  const high = level >= 5;
  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase",
        high
          ? "border-[#006a6e]/20 bg-[#006a6e]/10 text-[#006a6e] dark:border-white/25 dark:bg-white/10 dark:text-white"
          : level === 4
            ? "border-border bg-muted text-muted-foreground dark:text-white"
            : "border-border bg-muted text-muted-foreground/90 dark:text-white"
      )}
    >
      LEVEL {level}
    </div>
  );
}

function pickStr(
  row: Record<string, unknown>,
  keys: readonly string[]
): string {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

/** Duty status in pilot detail modal: Active / Inactive (not ALL CAPS). */
function formatPilotDutyStatusLabel(raw: string): string {
  const u = raw.trim().toUpperCase().replace(/\s+/g, "_");
  if (u === "ACTIVE") return "Active";
  if (
    u === "INACTIVE" ||
    u === "OFFLINE" ||
    u === "ON_LEAVE" ||
    u === "ONLEAVE"
  ) {
    return "Inactive";
  }
  const t = raw.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function parseDroneDetailsArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (x): x is Record<string, unknown> =>
        x != null && typeof x === "object" && !Array.isArray(x)
    );
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const p: unknown = JSON.parse(raw);
      if (Array.isArray(p)) {
        return p.filter(
          (x): x is Record<string, unknown> =>
            x != null && typeof x === "object" && !Array.isArray(x)
        );
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

function formatUseCases(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .join(", ");
  }
  return String(value ?? "").trim();
}

function DroneDetailCard({ drone }: { drone: Record<string, unknown> }) {
  const fields: { label: string; value: string }[] = [];
  const add = (label: string, value: string) => {
    if (value) fields.push({ label, value });
  };
  add("Model", pickStr(drone, ["modelName", "model_name"]));
  add("Type", pickStr(drone, ["type"]));
  add("Camera", pickStr(drone, ["camera"]));
  const payload = pickStr(drone, ["payloadKg", "payload_kg"]);
  if (payload) add("Payload", `${payload} kg`);
  const ft = pickStr(drone, ["flightTimeMin", "flight_time_min"]);
  if (ft) add("Flight time", `${ft} min`);
  const rng = pickStr(drone, ["rangeKm", "range_km"]);
  if (rng) add("Range", `${rng} km`);
  const uc = formatUseCases(drone.useCases ?? drone.use_cases);
  if (uc) add("Use cases", uc);

  if (fields.length === 0) {
    return (
      <div
        className={cn(
          PROFILE_INFO_POPUP_INNER_PANEL_CLASS,
          "border-dashed px-3 py-3 text-sm text-muted-foreground sm:px-4 sm:py-4"
        )}
      >
        No fields recorded.
      </div>
    );
  }

  return (
    <div className={cn(PROFILE_INFO_POPUP_INNER_PANEL_CLASS, "px-3 py-3 sm:px-4 sm:py-4")}>
      <dl className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {fields.map(({ label, value }, i) => (
          <DetailField key={`${label}-${i}`} label={label}>
            {value}
          </DetailField>
        ))}
      </dl>
    </div>
  );
}

function PilotDetailModal({
  open,
  loading,
  error,
  record,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  error: string | null;
  record: Record<string, unknown> | null;
  onClose: () => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const contentId = useId();

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  useEffect(() => {
    if (!open || loading) return;
    const t = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(t);
  }, [open, loading]);

  if (!open) return null;

  const rows: { label: string; value: string }[] = [];
  let droneRowsFromJson: Record<string, unknown>[] = [];
  const legacyDroneFields: { label: string; value: string }[] = [];

  if (record) {
    const push = (label: string, value: string) => {
      if (value) rows.push({ label, value });
    };
    push(
      "Name",
      pickStr(record, ["name", "full_name", "fullName"]) || "—"
    );
    push("Email", pickStr(record, ["email"]));
    push("Phone", pickStr(record, ["phone"]));
    const flightHrs = pickStr(record, ["flight_hours", "flightHours"]);
    if (flightHrs !== "") push("Flight hours", `${flightHrs} hrs`);
    push(
      "Missions completed",
      pickStr(record, [
        "missions_completed",
        "missionsCompleted",
        "flight_count",
        "flightCount",
      ])
    );
    push(
      "Experience rank",
      pickStr(record, ["experience_rank", "experienceRank"])
    );
    const dutyRaw = pickStr(record, ["duty_status", "dutyStatus", "status"]);
    if (dutyRaw !== "") {
      push("Duty status", formatPilotDutyStatusLabel(dutyRaw));
    }
    push("Certification level", pickStr(record, ["cert_level", "certLevel"]));

    droneRowsFromJson = parseDroneDetailsArray(record.drone_details);

    if (droneRowsFromJson.length === 0) {
      const leg = (label: string, value: string) => {
        if (value) legacyDroneFields.push({ label, value });
      };
      leg("Drone name", pickStr(record, ["drone_name", "droneName"]));
      leg("Camera", pickStr(record, ["camera"]));
      leg("Payload", pickStr(record, ["payload"]));
      leg("Flight time", pickStr(record, ["flight_time", "flightTime"]));
      leg("Range", pickStr(record, ["range_km", "rangeKm"]));
      const uc = formatUseCases(record.use_cases ?? record.useCases);
      if (uc) leg("Use cases", uc);
    }
  }

  const hasAnyContent = !loading && !error && record != null;

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
        aria-labelledby="pilots-detail-modal-title"
        aria-describedby={contentId}
        className={cn(
          "relative z-10 flex max-h-[min(92dvh,48rem)] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-t-2xl border-2 border-border shadow-2xl sm:my-auto sm:rounded-2xl dark:border-white/20",
          PROFILE_INFO_POPUP_SHELL_CLASS
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3 dark:border-white/20 sm:px-6">
          <h2
            id="pilots-detail-modal-title"
            className="min-w-0 pr-2 text-base font-bold leading-snug text-foreground sm:text-lg"
          >
            Pilots Details
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div id={contentId} className="px-5 py-4 sm:px-6 sm:py-5">
          {loading ? (
            <div className="flex min-h-[6rem] items-center justify-center py-2">
              <p className="text-sm text-muted-foreground">Loading pilot…</p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : !hasAnyContent ? (
            <p className="text-sm text-muted-foreground">No details available.</p>
          ) : (
            <>
              {rows.length > 0 ? (
                <section aria-label="Pilot information">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
                    Pilot information
                  </h3>
                  <div className={cn(PROFILE_INFO_POPUP_INNER_PANEL_CLASS, "mt-3 px-3 py-3 sm:px-4 sm:py-4")}>
                    <dl className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      {rows.map(({ label, value }, i) => (
                        <DetailField key={`${label}-${i}`} label={label}>
                          {value}
                        </DetailField>
                      ))}
                    </dl>
                  </div>
                </section>
              ) : null}

              <section
                aria-label="Drone details"
                className={cn(
                  rows.length > 0 && "mt-5 border-t border-border pt-5 dark:border-white/20"
                )}
              >
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
                  Drone details
                </h3>
                {droneRowsFromJson.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {droneRowsFromJson.map((d, i) => (
                      <DroneDetailCard key={i} drone={d} />
                    ))}
                  </div>
                ) : legacyDroneFields.length > 0 ? (
                  <div className={cn(PROFILE_INFO_POPUP_INNER_PANEL_CLASS, "mt-3 px-3 py-3 sm:px-4 sm:py-4")}>
                    <dl className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      {legacyDroneFields.map(({ label, value }, i) => (
                        <DetailField key={`${label}-${i}`} label={label}>
                          {value}
                        </DetailField>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    No drone details on file. The pilot can add drones in their
                    profile.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DutyBadge({ status }: { status: DutyStatus }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        active
          ? "bg-green-50 text-green-600 dark:bg-white/10 dark:text-white"
          : "bg-muted/40 text-muted-foreground/70 dark:bg-white/10 dark:text-white"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-green-500 dark:bg-white" : "bg-muted-foreground/40 dark:bg-white/70"
        )}
      />
      {status}
    </span>
  );
}

export function PilotStatusView({
  showPageTitle = true,
}: {
  showPageTitle?: boolean;
} = {}) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [apiPilots, setApiPilots] = useState<PilotRow[]>([]);
  /** `SELECT COUNT(*) FROM pilots` — preferred over `apiPilots.length` for the KPI. */
  const [totalPilotsFromDb, setTotalPilotsFromDb] = useState<number | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editPilotId, setEditPilotId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PilotEditForm>({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    city: "",
    state: "",
    certLevel: "3",
    experienceRank: "",
    flightHours: "0",
    dutyStatus: "ACTIVE",
  });

  const loadPilots = useCallback(async () => {
    const data = await getPilots();
    const rows: Record<string, unknown>[] = data != null && Array.isArray(data) ? (data as Record<string, unknown>[]) : [];

    // map backend data -> UI format and derive status counts from available fields
    const formatted = rows.map((pilot) => {
      const rawStatus = String(
        pilot.duty_status ?? pilot.dutyStatus ?? pilot.status ?? "ACTIVE"
      ).toUpperCase();
      const dutyStatus: DutyStatus =
        rawStatus === "INACTIVE" ||
        rawStatus === "OFFLINE" ||
        rawStatus === "ON_LEAVE"
          ? "INACTIVE"
          : "ACTIVE";
      return {
        id: pilot.id?.toString() || "",
        name: String(pilot.name ?? "Unknown pilot"),
        certLevel: Number(pilot.cert_level ?? 3),
        flightHours: flightHoursFromPilotRow(pilot),
        flightCount: missionsCompletedFromPilotRow(pilot),
        dutyStatus,
      };
    });

    setApiPilots(formatted);
  }, []);

  const closePilotDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailLoading(false);
    setDetailError(null);
    setDetailRecord(null);
  }, []);

  const openPilotDetail = useCallback(async (pilotId: string) => {
    if (!pilotId.trim()) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailRecord(null);
    try {
      const data = await getPilotById(pilotId);
      if (data == null || (typeof data === "object" && "error" in data)) {
        setDetailError("Could not load pilot details.");
        return;
      }
      if (typeof data === "object" && !Array.isArray(data)) {
        setDetailRecord(data as Record<string, unknown>);
      } else {
        setDetailError("Unexpected response from server.");
      }
    } catch {
      setDetailError("Could not load pilot details.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openPilotEdit = useCallback(async (pilotId: string) => {
    if (!pilotId.trim()) return;
    setEditOpen(true);
    setEditPilotId(pilotId);
    setEditLoading(true);
    setEditSaving(false);
    setEditError(null);
    try {
      const data = await getPilotById(pilotId);
      if (data == null || typeof data !== "object" || Array.isArray(data)) {
        setEditError("Could not load pilot details.");
        return;
      }
      const record = data as Record<string, unknown>;
      const rawStatus = pickStr(record, ["duty_status", "dutyStatus", "status"])
        .toUpperCase()
        .trim();
      setEditForm({
        name: pickStr(record, ["name", "full_name", "fullName"]),
        email: pickStr(record, ["email"]),
        phone: pickStr(record, ["phone"]),
        licenseNumber: pickStr(record, ["license_number", "licenseNumber"]),
        city: pickStr(record, ["city"]),
        state: pickStr(record, ["state"]),
        certLevel: pickStr(record, ["cert_level", "certLevel"]) || "3",
        experienceRank: pickStr(record, ["experience_rank", "experienceRank"]),
        flightHours: pickStr(record, ["flight_hours", "flightHours", "experience"]) || "0",
        dutyStatus: rawStatus === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      });
    } catch {
      setEditError("Could not load pilot details.");
    } finally {
      setEditLoading(false);
    }
  }, []);

  const closePilotEdit = useCallback(() => {
    setEditOpen(false);
    setEditPilotId(null);
    setEditLoading(false);
    setEditSaving(false);
    setEditError(null);
  }, []);

  const savePilotEdit = useCallback(async () => {
    if (!editPilotId) return;
    if (!editForm.name.trim()) {
      setEditError("Pilot name is required.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const result = await patchPilotProfile(editPilotId, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        licenseNumber: editForm.licenseNumber.trim(),
        city: editForm.city.trim(),
        state: editForm.state.trim(),
        certLevel: editForm.certLevel,
        experienceRank: editForm.experienceRank.trim(),
        flightHours: editForm.flightHours,
        dutyStatus: editForm.dutyStatus,
      });
      if (!result) {
        throw new Error("Could not update pilot.");
      }
      await loadPilots();
      closePilotEdit();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Could not update pilot.");
    } finally {
      setEditSaving(false);
    }
  }, [closePilotEdit, editForm, editPilotId, loadPilots]);

  const deletePilot = useCallback(async (row: PilotRow) => {
    const ok = window.confirm(`Delete pilot "${row.name}"? This cannot be undone.`);
    if (!ok) return;
    const result = await deletePilotById(row.id);
    if (!result) {
      alert("Could not delete pilot.");
      return;
    }
    setApiPilots((current) => current.filter((pilot) => pilot.id !== row.id));
    setTotalPilotsFromDb((count) =>
      typeof count === "number" ? Math.max(0, count - 1) : count
    );
  }, []);

  const filteredRows = useMemo(() => {
    return apiPilots.filter((row) => {
      if (filter === "active" && row.dutyStatus !== "ACTIVE") return false;
      if (filter === "inactive" && row.dutyStatus !== "INACTIVE")
        return false;
      return true;
    });
  }, [apiPilots, filter]);

  const kpi = useMemo(() => {
    const totalRegistered = totalPilotsFromDb ?? apiPilots.length;
    const currentlyActive = apiPilots.filter(
      (p) => p.dutyStatus === "ACTIVE"
    ).length;
    const inactiveOnLeave = Math.max(0, totalRegistered - currentlyActive);
    const totalMissions = apiPilots.reduce(
      (sum, pilot) => sum + pilot.flightCount,
      0
    );
    return {
      totalRegistered,
      currentlyActive,
      inactiveOnLeave,
      totalMissions,
    };
  }, [apiPilots, totalPilotsFromDb]);

  useEffect(() => {
    void loadPilots();
  }, [loadPilots]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/pilots/total-count"), {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data: unknown = await res.json();
        if (
          data &&
          typeof data === "object" &&
          "count" in data &&
          typeof (data as { count: unknown }).count === "number"
        ) {
          const n = Number((data as { count: number }).count);
          if (!cancelled && Number.isFinite(n)) setTotalPilotsFromDb(n);
        }
      } catch {
        /* keep null; KPI falls back to apiPilots.length */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 sm:px-6",
        showPageTitle && ADMIN_PAGE_TOP_PADDING_CLASS
      )}
    >
      {showPageTitle ? (
        <h1 className={ADMIN_PAGE_TITLE_CLASS}>Pilot Status</h1>
      ) : null}

      <section
        className={cn(
          "grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4",
          showPageTitle ? "mt-6" : "mt-4"
        )}
        aria-label="Pilot status summary: total registered, currently active, inactive or on leave, and total missions"
      >
        <UserRequestStatCard
          label="Total registered"
          value={kpi.totalRegistered}
          icon={Users}
          iconClassName="text-[#008B8B]"
          iconWrapClassName="bg-[#008B8B]/10"
        />
        <UserRequestStatCard
          label="Currently active"
          value={kpi.currentlyActive}
          icon={BadgeCheck}
          iconClassName="text-emerald-700"
          iconWrapClassName="bg-emerald-100"
        />
        <UserRequestStatCard
          label="Inactive / On-leave"
          value={kpi.inactiveOnLeave}
          icon={UserRound}
          iconClassName="text-amber-700"
          iconWrapClassName="bg-amber-100"
        />
        <UserRequestStatCard
          label="Total missions"
          value={kpi.totalMissions}
          icon={PackageCheck}
          iconClassName="text-sky-800"
          iconWrapClassName="bg-sky-100"
        />
      </section>

      <div className="mt-6 sm:mt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <p className="text-[13px] font-semibold text-foreground">
            Total {filteredRows.length} pilot
            {filteredRows.length === 1 ? "" : "s"}
          </p>
          <label className="relative w-full max-w-[9.5rem] sm:w-auto">
            <span className="sr-only" htmlFor="pilot-status-filter">
              Duty status
            </span>
            <select
              id="pilot-status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterTab)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-xs font-medium text-foreground outline-none transition hover:border-muted-foreground/40 focus-visible:border-[#008B8B] focus-visible:ring-2 focus-visible:ring-[#008B8B]/25"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/90">
          <table className="w-full min-w-[52rem] table-fixed border-collapse text-left text-[10px] leading-snug sm:text-[11px]">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                <th scope="col" className={cn(thBase, "text-left")}>
                  Pilot personnel
                </th>
                <th scope="col" className={cn(thBase, "text-left")}>
                  Certification
                </th>
                <th scope="col" className={cn(thBase, "text-left")}>
                  Flight hours
                </th>
                <th scope="col" className={cn(thBase, "text-left")}>
                  Missions
                </th>
                <th scope="col" className={cn(thBase, "text-left")}>
                  Duty status
                </th>
                <th scope="col" className={cn(thBase, "text-right pr-4 sm:pr-5")}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    No pilots match your filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className={cn(tdBase, "text-left")}>
                      <button
                        type="button"
                        onClick={() => void openPilotDetail(row.id)}
                        className="group block w-full max-w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/40"
                      >
                        <span className="block break-words font-semibold text-[#006767] underline decoration-[#008B8B]/35 underline-offset-2 transition-colors group-hover:text-[#005a5a] group-hover:decoration-[#008B8B]/70 dark:text-primary">
                          {row.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] tracking-tight text-muted-foreground sm:text-[11px]">
                          ID: {row.id}
                        </span>
                      </button>
                    </td>
                    <td className={cn(tdBase, "text-left")}>
                      <CertificationBadge level={row.certLevel} />
                    </td>
                    <td className={cn(tdBase, "text-left tabular-nums")}>
                      {row.flightHours.toLocaleString("en-US")} hrs
                    </td>
                    <td className={cn(tdBase, "text-left tabular-nums")}>
                      {row.flightCount.toLocaleString("en-US")} completed
                    </td>
                    <td className={cn(tdBase, "text-left")}>
                      <DutyBadge status={row.dutyStatus} />
                    </td>
                    <td className={cn(tdBase, "text-right")}>
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void openPilotDetail(row.id)}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#008B8B]/35 bg-[#008B8B]/8 text-[#006767] transition-colors hover:bg-[#008B8B]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/40"
                          title="View"
                          aria-label={`View pilot ${row.name}`}
                        >
                          <Eye className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => void openPilotEdit(row.id)}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/8 text-blue-700 transition-colors hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                          title="Edit"
                          aria-label={`Edit pilot ${row.name}`}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletePilot(row)}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/8 text-red-700 transition-colors hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                          title="Delete"
                          aria-label={`Delete pilot ${row.name}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PilotDetailModal
        open={detailOpen}
        loading={detailLoading}
        error={detailError}
        record={detailRecord}
        onClose={closePilotDetail}
      />

      {editOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
            aria-label="Close edit pilot dialog"
            onClick={closePilotEdit}
          />
          <div className="relative z-10 max-h-[min(92dvh,46rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-white p-5 text-foreground shadow-2xl sm:rounded-2xl sm:p-6 dark:border-white/20 dark:bg-black dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">
                  Edit Pilot
                </h2>
                <p className="mt-1 text-xs text-muted-foreground dark:text-white/70">
                  Update the pilot profile fields used by the dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={closePilotEdit}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted dark:text-white/80 dark:hover:bg-white/10"
                aria-label="Close edit pilot dialog"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            {editLoading ? (
              <p className="mt-6 text-sm text-muted-foreground dark:text-white/70">
                Loading pilot...
              </p>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <PilotField
                    label="Name"
                    value={editForm.name}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, name: value }))
                    }
                  />
                  <PilotField
                    label="Email"
                    value={editForm.email}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, email: value }))
                    }
                  />
                  <PilotField
                    label="Phone"
                    value={editForm.phone}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, phone: value }))
                    }
                  />
                  <PilotField
                    label="License number"
                    value={editForm.licenseNumber}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, licenseNumber: value }))
                    }
                  />
                  <PilotField
                    label="City"
                    value={editForm.city}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, city: value }))
                    }
                  />
                  <PilotField
                    label="State"
                    value={editForm.state}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, state: value }))
                    }
                  />
                  <PilotField
                    label="Certification level"
                    value={editForm.certLevel}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, certLevel: value }))
                    }
                  />
                  <PilotField
                    label="Flight hours"
                    value={editForm.flightHours}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, flightHours: value }))
                    }
                  />
                  <PilotField
                    label="Experience rank"
                    value={editForm.experienceRank}
                    onChange={(value) =>
                      setEditForm((form) => ({ ...form, experienceRank: value }))
                    }
                  />
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground dark:text-white/70">
                      Duty status
                    </span>
                    <select
                      value={editForm.dutyStatus}
                      onChange={(event) =>
                        setEditForm((form) => ({
                          ...form,
                          dutyStatus: event.target.value as DutyStatus,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/30 dark:border-white/20 dark:bg-black dark:text-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </label>
                </div>

                {editError ? (
                  <p className="mt-4 text-sm font-medium text-red-600">{editError}</p>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={editSaving}
                    onClick={() => void savePilotEdit()}
                    className="rounded-lg border-2 border-[#008B8B] bg-transparent px-4 py-2 text-sm font-bold text-[#008B8B] transition hover:bg-[#008B8B]/10 hover:text-[#007a7a] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/40 dark:text-white dark:hover:border-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {editSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PilotField({
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
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground dark:text-white/70">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/30 dark:border-white/20 dark:bg-black dark:text-white"
      />
    </label>
  );
}
