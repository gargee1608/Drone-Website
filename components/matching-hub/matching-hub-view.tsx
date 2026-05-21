"use client";

import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  Eye,
  MapPin,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import {
  assignHubMissionToPilot,
  getPilotById,
  getPilots,
} from "@/app/services/pilotServices";
import { apiUrl } from "@/lib/api-url";
import {
  experienceSubtitleFromPilotRow,
  missionsCompletedFromPilotRow,
  safetyRatingFromPilotRow,
} from "@/lib/pilot-db-metrics";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import {
  fetchMissionRequestsList,
  type MissionRequestRow,
} from "@/lib/mission-requests-api";
import { subscribeMissionRequestsUpdated } from "@/lib/mission-requests-updated";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";
import { notifyMissionsDbUpdated } from "@/lib/user-requests";

type HubTab = "missions" | "pilots";

const MATCHING_HUB_REGION_CITIES = [
  "Mumbai",
  "Delhi",
  "Kolkata",
  "Chennai",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Vadodara",
  "Surat",
  "Indore",
  "Jaipur",
  "Lucknow",
  "Coimbatore",
  "Bhubaneswar",
  "Kochi",
  "Nagpur",
  "Visakhapatnam",
] as const;

type HubMission = MissionRequestRow;

type HubPilotCard = {
  id: string;
  name: string;
  role: string;
  ratingLabel: string;
  imageSrc: string;
  safetyScore: number;
  missionCount: number;
  email: string;
  phone: string;
  location: string;
  licenseNumber: string;
  experience: string;
  certLevel: string;
  dutyStatus: string;
  droneSummary: string;
  useCases: string;
  flightHours: number;
};

function stringField(
  row: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function pilotDroneSummaryFromRow(row: Record<string, unknown>): string {
  const assignedDrone = [
    stringField(row, "drone_name", "droneName"),
    stringField(row, "payload"),
    stringField(row, "range_km", "rangeKm"),
  ]
    .filter(Boolean)
    .join(" · ");
  if (assignedDrone) return assignedDrone;

  const details = row.drone_details ?? row.droneDetails;
  if (Array.isArray(details) && details.length > 0) {
    const names = details
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const drone = item as Record<string, unknown>;
        return stringField(drone, "modelName", "name", "type");
      })
      .filter(Boolean)
      .slice(0, 3);
    if (names.length > 0) return names.join(", ");
  }

  return "Drone details not added";
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || "?").toUpperCase();
}

function hubPilotRoleFromRow(pilot: Record<string, unknown>): string {
  const rank = pilot.experience_rank ?? pilot.experienceRank;
  if (typeof rank === "string" && rank.trim()) {
    return rank.trim().slice(0, 48).toUpperCase();
  }
  const uc = pilot.use_cases ?? pilot.useCases;
  if (typeof uc === "string" && uc.trim()) {
    return uc.trim().slice(0, 48).toUpperCase();
  }
  const cert = Number(pilot.cert_level ?? pilot.certLevel);
  if (Number.isFinite(cert) && cert > 0) {
    return `LEVEL ${Math.floor(cert)} CERT`;
  }
  return experienceSubtitleFromPilotRow(pilot).toUpperCase();
}

function mapApiRowToHubPilotCard(
  pilot: Record<string, unknown>
): HubPilotCard | null {
  const rawStatus = String(
    pilot.duty_status ?? pilot.dutyStatus ?? "ACTIVE"
  ).toUpperCase();
  const isInactive =
    rawStatus === "INACTIVE" ||
    rawStatus === "OFFLINE" ||
    rawStatus === "ON_LEAVE";
  if (isInactive) return null;

  const id = pilot.id != null ? String(pilot.id) : "";
  const name = String(pilot.name ?? "Pilot").trim() || "Pilot";
  const safety = safetyRatingFromPilotRow(pilot);
  const star = Math.min(5, Math.max(0, safety / 20));
  const missionCount = missionsCompletedFromPilotRow(pilot);
  const ratingLabel = `${star.toFixed(1)} (${missionCount} missions)`;
  const role = hubPilotRoleFromRow(pilot);
  const initials = initialsFromName(name);
  const imageSrc = `https://placehold.co/96x96/e2e8f0/475569/png?text=${encodeURIComponent(initials)}`;
  const city = stringField(pilot, "city");
  const state = stringField(pilot, "state");
  const location = [city, state].filter(Boolean).join(", ");
  const certLevel = stringField(pilot, "cert_level", "certLevel");
  const flightHoursRaw = Number(pilot.flight_hours ?? pilot.flightHours ?? 0);

  return {
    id: id || `pilot-${name}`,
    name,
    role,
    ratingLabel,
    imageSrc,
    safetyScore: safety,
    missionCount,
    email: stringField(pilot, "email"),
    phone: stringField(pilot, "phone"),
    location: location || "Location not added",
    licenseNumber: stringField(pilot, "license_number", "licenseNumber") || "Not added",
    experience: experienceSubtitleFromPilotRow(pilot),
    certLevel: certLevel ? `Level ${certLevel}` : "Not added",
    dutyStatus: stringField(pilot, "duty_status", "dutyStatus") || "ACTIVE",
    droneSummary: pilotDroneSummaryFromRow(pilot),
    useCases: stringField(pilot, "use_cases", "useCases") || role,
    flightHours: Number.isFinite(flightHoursRaw) ? Math.max(0, flightHoursRaw) : 0,
  };
}

function MissionDetailDialog({
  mission,
  pilots,
  pilotsLoading,
  pilotsError,
  onClose,
}: {
  mission: HubMission;
  pilots: HubPilotCard[];
  pilotsLoading: boolean;
  pilotsError: string | null;
  onClose: () => void;
}) {
  const [selectedPilotId, setSelectedPilotId] = useState("");
  const [selectFeedback, setSelectFeedback] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  useEffect(() => {
    setSelectedPilotId("");
    setSelectFeedback(null);
    setAssignError(null);
    setAssignSubmitting(false);
  }, [mission.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const sortedPilots = useMemo(
    () =>
      [...pilots].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [pilots]
  );

  const onSubmitSelection = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPilotId || assignSubmitting) return;
    const p = pilots.find((x) => x.id === selectedPilotId);
    if (!p) return;

    setAssignError(null);
    setSelectFeedback(null);
    setAssignSubmitting(true);

    void (async () => {
      const service = [mission.payout, mission.aircraftClass]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 240);
      const res = await assignHubMissionToPilot({
        requestRef: mission.id,
        customer: mission.title,
        service: service || mission.payout,
        dropoff: mission.clearance || mission.distance || "—",
        pilotName: p.name,
        pilotBadgeId: p.id,
        pilotSub: p.id,
        droneModel: "—",
        assignedAt: new Date().toISOString(),
      });
      setAssignSubmitting(false);
      if (!res?.ok) {
        setAssignError(
          typeof res?.detail === "string" && res.detail
            ? res.detail
            : "Could not assign mission. Is the backend running?"
        );
        return;
      }
      setSelectFeedback(
        res.alreadyAssigned
          ? `${p.name} already has this mission assigned.`
          : `${mission.title} is assigned to ${p.name}. They will see it on the pilot dashboard.`
      );
      notifyMissionsDbUpdated();
    })();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close mission details"
        onClick={onClose}
      />
      <div className="relative z-[1] max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6 dark:border-white/15 dark:bg-[#161a1d]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0058bc]">
              {mission.id}
            </p>
            <h2
              id="mission-detail-title"
              className="mt-1 text-xl font-semibold leading-snug tracking-tight text-[#191c1d] sm:text-2xl dark:text-white"
            >
              {mission.title}
            </h2>
            <p className="mt-2 inline-flex rounded-full bg-[#0D9488] px-2.5 py-1 text-sm font-semibold text-white">
              {mission.payout}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#191c1d] dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-white/75">
          {mission.description}
        </p>

        <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm dark:border-white/10 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Payload
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d] dark:text-white">
              {mission.payload}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Distance
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d] dark:text-white">
              {mission.distance}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Listing
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d] dark:text-white">
              {mission.posted}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Time & scope
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d] dark:text-white">
              {mission.duration}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Aircraft class
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d] dark:text-white">
              {mission.aircraftClass}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Airspace & clearance
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d] dark:text-white">
              {mission.clearance}
            </dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Operator requirements
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/75">
            {mission.requirements}
          </p>
        </div>

        <form
          className="mt-6 border-t border-slate-100 pt-5 dark:border-white/10"
          onSubmit={onSubmitSelection}
        >
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Select this mission
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/70">
            Pick a pilot from your roster to pair with this listing.
          </p>
          {pilotsLoading ? (
            <p className="mt-3 text-sm text-slate-500" role="status">
              Loading pilots…
            </p>
          ) : pilotsError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {pilotsError}
            </p>
          ) : sortedPilots.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No pilots are available to assign yet.
            </p>
          ) : (
            <>
              <label
                htmlFor="mission-assign-pilot"
                className="mt-3 block text-xs font-semibold text-slate-700 dark:text-white/85"
              >
                Pilot
              </label>
              <select
                id="mission-assign-pilot"
                value={selectedPilotId}
                onChange={(ev) => {
                  setSelectedPilotId(ev.target.value);
                  setSelectFeedback(null);
                  setAssignError(null);
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#191c1d] outline-none ring-[#0D9488]/25 focus:ring-2 dark:border-white/15 dark:bg-[#111315] dark:text-white"
              >
                <option value="">Choose a pilot…</option>
                {sortedPilots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedPilotId || assignSubmitting}
                className="mt-3 w-full rounded-lg bg-[#0D9488] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f7669] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignSubmitting ? "Saving…" : "Select this mission"}
              </button>
            </>
          )}
          {assignError ? (
            <p
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
              role="alert"
            >
              {assignError}
            </p>
          ) : null}
          {selectFeedback ? (
            <p
              className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100"
              role="status"
            >
              {selectFeedback}
            </p>
          ) : null}
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-[#0D9488] bg-transparent py-2.5 text-sm font-semibold text-[#0D9488] transition hover:border-[#0f7669] hover:text-[#0f7669] dark:border-[#0D9488] dark:text-[#5eead4] dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function PilotDetailDialog({
  pilot,
  loading,
  errorMessage,
  onClose,
}: {
  pilot: HubPilotCard;
  loading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pilot-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close pilot details"
        onClick={onClose}
      />
      <div className="relative z-[1] max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src={pilot.imageSrc}
              alt={pilot.name}
              width={64}
              height={64}
              className="size-16 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0058bc]">
                {pilot.role}
              </p>
              <h2
                id="pilot-detail-title"
                className="mt-1 text-xl font-semibold leading-snug tracking-tight text-[#191c1d] sm:text-2xl"
              >
                {pilot.name}
              </h2>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                {pilot.ratingLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#191c1d]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500" role="status">
            Loading pilot details…
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-amber-700" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Location
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">{pilot.location}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Status
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">
              {pilot.dutyStatus}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Email
            </dt>
            <dd className="mt-0.5 break-all font-medium text-[#191c1d]">
              {pilot.email || "Not added"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Phone
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">
              {pilot.phone || "Not added"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              License
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">
              {pilot.licenseNumber}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Certification
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">
              {pilot.certLevel}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Experience
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">
              {pilot.experience}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Flight hours
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">
              {pilot.flightHours.toLocaleString("en-US")}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Drone
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">
              {pilot.droneSummary}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Use cases
            </dt>
            <dd className="mt-0.5 font-medium text-[#191c1d]">
              {pilot.useCases}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-[#0D9488] bg-transparent py-2.5 text-sm font-semibold text-[#0D9488] transition hover:border-[#0f7669] hover:text-[#0f7669]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function PilotCards({
  pilots,
  loading,
  errorMessage,
  onPilotClick,
}: {
  pilots: HubPilotCard[];
  loading: boolean;
  errorMessage: string | null;
  onPilotClick?: (pilot: HubPilotCard) => void;
}) {
  if (loading) {
    return (
      <p className="text-sm text-slate-500" role="status">
        Loading pilots…
      </p>
    );
  }
  if (errorMessage) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {errorMessage}
      </p>
    );
  }
  if (pilots.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No active pilots are listed yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {pilots.map((pilot) => (
        <button
          key={pilot.id}
          type="button"
          onClick={() => onPilotClick?.(pilot)}
          aria-label={`View details for ${pilot.name}`}
          className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-transparent bg-white/80 p-2 text-left shadow-sm backdrop-blur-sm transition-all hover:border-[#0058bc] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]/40"
        >
          <Image
            src={pilot.imageSrc}
            alt={pilot.name}
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-tight">{pilot.name}</h3>
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#0058bc]">
              {pilot.role}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-700">
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              {pilot.ratingLabel}
            </p>
          </div>
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[#0058bc] transition-colors group-hover:bg-[#0058bc]/10 group-hover:text-[#0D9488]"
            aria-hidden
          >
            <Eye className="size-4" strokeWidth={2} />
          </span>
        </button>
      ))}
    </div>
  );
}

export function MatchingHubView() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<HubTab>("missions");
  const [hubPilots, setHubPilots] = useState<HubPilotCard[]>([]);
  const [pilotsLoading, setPilotsLoading] = useState(true);
  const [pilotsError, setPilotsError] = useState<string | null>(null);
  const [missionRows, setMissionRows] = useState<HubMission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [detailMission, setDetailMission] = useState<HubMission | null>(null);
  const [detailPilot, setDetailPilot] = useState<HubPilotCard | null>(null);
  const [detailPilotLoading, setDetailPilotLoading] = useState(false);
  const [detailPilotError, setDetailPilotError] = useState<string | null>(null);

  const closeMissionDetail = useCallback(() => setDetailMission(null), []);
  const closePilotDetail = useCallback(() => {
    setDetailPilot(null);
    setDetailPilotLoading(false);
    setDetailPilotError(null);
  }, []);

  const openPilotDetail = useCallback(async (pilot: HubPilotCard) => {
    setDetailPilot(pilot);
    setDetailPilotLoading(true);
    setDetailPilotError(null);

    if (!/^\d+$/.test(String(pilot.id))) {
      setDetailPilotLoading(false);
      return;
    }

    try {
      const data = await getPilotById(pilot.id);
      if (data == null || (typeof data === "object" && "error" in data)) {
        setDetailPilotError("Could not refresh pilot details from the server.");
        return;
      }
      if (typeof data === "object" && !Array.isArray(data)) {
        const enriched = mapApiRowToHubPilotCard(data as Record<string, unknown>);
        if (enriched) setDetailPilot(enriched);
      }
    } catch {
      setDetailPilotError("Could not refresh pilot details from the server.");
    } finally {
      setDetailPilotLoading(false);
    }
  }, []);

  const loadMissionRows = useCallback(async () => {
    setMissionsLoading(true);
    setMissionsError(null);
    const result = await fetchMissionRequestsList();
    if (result.ok) {
      setMissionRows(result.data);
    } else {
      setMissionsError(result.error ?? "Could not load missions.");
      setMissionRows([]);
    }
    setMissionsLoading(false);
  }, []);

  useEffect(() => {
    void loadMissionRows();
    return subscribeMissionRequestsUpdated(() => {
      void loadMissionRows();
    });
  }, [loadMissionRows]);

  useEffect(() => {
    if (pathname !== "/matching-hub") return;
    void loadMissionRows();
  }, [pathname, loadMissionRows]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadMissionRows();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadMissionRows]);

  useEffect(() => {
    if (!detailMission) return;
    if (missionRows.some((m) => m.id === detailMission.id)) return;
    setDetailMission(null);
  }, [detailMission, missionRows]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPilotsLoading(true);
      setPilotsError(null);
      try {
        const data = await getPilots();
        if (cancelled) return;
        if (data === null) {
          setPilotsError(
            "Could not reach the API server (often HTTP 502: Express is not running). Start the backend with npm run dev in the backend folder (default port 4000), or set BACKEND_URL if it runs elsewhere."
          );
          setHubPilots([]);
          return;
        }
        const rows = Array.isArray(data) ? data : [];
        const cards = rows
          .map((row) => mapApiRowToHubPilotCard(row as Record<string, unknown>))
          .filter((c): c is HubPilotCard => c != null);
        setHubPilots(cards);
      } catch {
        if (!cancelled) {
          setPilotsError("Could not load pilots. Please try again later.");
          setHubPilots([]);
        }
      } finally {
        if (!cancelled) setPilotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const topRatedPilots = useMemo(() => {
    return [...hubPilots].sort((a, b) => {
      if (b.safetyScore !== a.safetyScore) return b.safetyScore - a.safetyScore;
      return b.missionCount - a.missionCount;
    });
  }, [hubPilots]);

  return (
    <div className="min-h-dvh bg-white text-[#191c1d]">
      <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-28 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className={ADMIN_PAGE_TITLE_CLASS}>Matching Hub</h1>
            <p className="mt-2 text-lg text-slate-600">
              Connect assets with high-precision flight opportunities.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-1 sm:inline-grid sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("missions")}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[11px] font-semibold transition-colors sm:px-4 sm:text-sm",
                activeTab === "missions"
                  ? "bg-white text-[#0D9488] shadow-sm"
                  : "text-[#0D9488]"
              )}
            >
              <MapPin className="size-3.5 shrink-0 sm:size-4" />
              <span className="truncate">Find Missions</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pilots")}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[11px] font-semibold transition-colors sm:px-4 sm:text-sm",
                activeTab === "pilots"
                  ? "bg-white text-[#0D9488] shadow-sm"
                  : "text-[#0D9488]"
              )}
            >
              <Briefcase className="size-3.5 shrink-0 sm:size-4" />
              <span className="truncate">Available Pilot</span>
            </button>
          </div>
        </header>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] max-w-md flex-1">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Global Filter
              </label>
              <div className="relative">
                <SlidersHorizontal className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "missions"
                      ? "Search by ID, Region, or Drone Class..."
                      : "Search pilot, rating, class, or region..."
                  }
                  className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs outline-none ring-[#0058bc]/25 focus:ring-2 sm:text-sm"
                />
              </div>
            </div>
            <div className="min-w-[130px] sm:min-w-[140px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Payload Class
              </label>
              <select className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none ring-[#0058bc]/25 focus:ring-2 sm:text-sm">
                <option>Any Weight</option>
                <option>L-1 (&lt; 5kg)</option>
                <option>L-3 (5-20kg)</option>
                <option>L-5 Heavy (20kg+)</option>
              </select>
            </div>
            <div className="min-w-[130px] sm:min-w-[140px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Region
              </label>
              <select
                defaultValue="India"
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none ring-[#0058bc]/25 focus:ring-2 sm:text-sm"
              >
                <option value="India">India</option>
                {MATCHING_HUB_REGION_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="overflow-hidden">
          <div
            className={cn(
              "flex w-[200%] transition-transform duration-500 ease-out",
              activeTab === "missions" ? "translate-x-0" : "-translate-x-1/2"
            )}
          >
            <section className="w-1/2 pr-0 lg:pr-2">
              {/*
                Missions are shown full width; pilots live in their own Top Rated Pilots tab.
              */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-x-4 lg:gap-y-3">
                <h2 className="order-1 min-w-0 text-base font-semibold tracking-tight sm:text-lg lg:col-span-12">
                  Available Missions
                </h2>
                <div className="order-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:order-3 lg:col-span-12 xl:grid-cols-3">
                  {missionsLoading ? (
                    <p className="col-span-full text-sm text-slate-600">
                      Loading missions…
                    </p>
                  ) : missionsError ? (
                    <p className="col-span-full text-sm text-red-600">
                      {missionsError}
                    </p>
                  ) : missionRows.length === 0 ? (
                    <p className="col-span-full text-sm text-slate-600">
                      No available missions right now.
                    </p>
                  ) : null}
                  {missionRows.map((mission) => (
                    <button
                      key={mission.id}
                      type="button"
                      onClick={() => setDetailMission(mission)}
                      className="rounded-md border border-slate-200 bg-white/80 p-2 text-left shadow-sm backdrop-blur-sm transition-all hover:border-[#0D9488] sm:p-2.5"
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#0058bc]">
                            {mission.id}
                          </p>
                          <h3 className="mt-0.5 text-base font-semibold leading-snug tracking-tight sm:text-lg">
                            {mission.title}
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#0D9488] px-1.5 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
                          {mission.payout}
                        </span>
                      </div>
                      <p className="mb-1.5 line-clamp-2 text-[11px] text-slate-600 sm:text-xs">
                        {mission.description}
                      </p>

                      <div className="mb-1.5 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-1.5">
                        <div>
                          <p className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
                            Payload
                          </p>
                          <p className="text-xs font-medium sm:text-sm">{mission.payload}</p>
                        </div>
                        <div>
                          <p className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
                            Distance
                          </p>
                          <p className="text-xs font-medium sm:text-sm">{mission.distance}</p>
                        </div>
                      </div>

                      <span className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-slate-100 py-1 text-[11px] font-medium text-[#191c1d] sm:py-1.5 sm:text-xs">
                        Open mission & assign pilot
                        <ArrowRight className="size-3 sm:size-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="w-1/2 pl-0 lg:pl-2">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-x-4 lg:gap-y-3">
                <h2 className="order-1 min-w-0 text-xl font-semibold tracking-tight sm:text-2xl lg:col-span-12">
                  Available Pilots
                </h2>
                <div className="order-2 min-w-0 lg:order-3 lg:col-span-12">
                  <PilotCards
                    pilots={topRatedPilots}
                    loading={pilotsLoading}
                    errorMessage={pilotsError}
                    onPilotClick={openPilotDetail}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        {detailMission ? (
          <MissionDetailDialog
            mission={detailMission}
            pilots={hubPilots}
            pilotsLoading={pilotsLoading}
            pilotsError={pilotsError}
            onClose={closeMissionDetail}
          />
        ) : null}
        {detailPilot ? (
          <PilotDetailDialog
            pilot={detailPilot}
            loading={detailPilotLoading}
            errorMessage={detailPilotError}
            onClose={closePilotDetail}
          />
        ) : null}
      </main>
    </div>
  );
}
