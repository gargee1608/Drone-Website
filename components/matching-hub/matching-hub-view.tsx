"use client";

import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  Eye,
  MapPin,
  Search,
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
import {
  fetchPilotRegisteredHubDrones,
  hubDroneSummary,
  type HubDroneRow,
} from "@/lib/drones-api";
import { subscribeAdminFleetUpdated } from "@/lib/admin-fleet-updated";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notifyMissionsDbUpdated } from "@/lib/user-requests";

type HubTab = "missions" | "pilots";

type HubPayloadClass = "any" | "l1" | "l3" | "l5";

type HubAppliedFilters = {
  globalQuery: string;
  payloadClass: HubPayloadClass;
  region: string;
};

function payloadClassFromOption(option: string): HubPayloadClass {
  if (option.includes("L-1")) return "l1";
  if (option.includes("L-3")) return "l3";
  if (option.includes("L-5")) return "l5";
  return "any";
}

function extractKgFromText(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  return match ? Number.parseFloat(match[1]) : null;
}

function textMatchesPayloadClass(text: string, payloadClass: HubPayloadClass): boolean {
  if (payloadClass === "any") return true;
  const lower = text.toLowerCase();
  const kg = extractKgFromText(text);
  if (kg != null) {
    if (payloadClass === "l1") return kg < 5;
    if (payloadClass === "l3") return kg >= 5 && kg <= 20;
    return kg > 20;
  }
  if (payloadClass === "l1") {
    return lower.includes("l-1") || lower.includes("light") || lower.includes("< 5");
  }
  if (payloadClass === "l3") {
    return lower.includes("l-3") || lower.includes("5-20") || lower.includes("5–20");
  }
  return lower.includes("l-5") || lower.includes("heavy") || lower.includes("20kg+");
}

/** Text variants so global search can match values like `80`, `80km`, or `80 km`. */
function kmValuesForSearch(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return "";
  return `${km} ${km}km ${km} km`;
}

function matchesGlobalQuery(
  query: string,
  parts: (string | number | null | undefined)[]
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = parts
    .flatMap((part) => {
      if (part == null || part === "") return [];
      if (typeof part === "number") {
        return [String(part), kmValuesForSearch(part)];
      }
      return [String(part)];
    })
    .join(" ")
    .toLowerCase();

  if (haystack.includes(normalized)) return true;

  const kmNumMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k?m?/);
  if (kmNumMatch) {
    const qKm = Number.parseFloat(kmNumMatch[1]);
    if (Number.isFinite(qKm)) {
      for (const part of parts) {
        if (typeof part === "number" && Math.abs(part - qKm) < 0.01) {
          return true;
        }
      }
    }
  }

  return false;
}

function missionMatchesFilters(mission: HubMission, filters: HubAppliedFilters): boolean {
  const query = filters.globalQuery.trim().toLowerCase();
  if (query) {
    if (
      !matchesGlobalQuery(query, [
        mission.id,
        mission.title,
        mission.description,
        mission.payload,
        mission.aircraftClass,
        mission.distance,
        mission.requirements,
      ])
    ) {
      return false;
    }
  }

  const payloadText = `${mission.payload} ${mission.aircraftClass}`;
  if (!textMatchesPayloadClass(payloadText, filters.payloadClass)) return false;

  if (filters.region !== "India") {
    const regionHaystack = [
      mission.id,
      mission.title,
      mission.description,
      mission.requirements,
      mission.distance,
    ]
      .join(" ")
      .toLowerCase();
    if (!regionHaystack.includes(filters.region.toLowerCase())) return false;
  }

  return true;
}

function pilotMatchesFilters(pilot: HubPilotCard, filters: HubAppliedFilters): boolean {
  const query = filters.globalQuery.trim().toLowerCase();
  if (query) {
    const haystack = [
      pilot.id,
      pilot.name,
      pilot.role,
      pilot.ratingLabel,
      pilot.location,
      pilot.droneSummary,
      pilot.useCases,
      pilot.certLevel,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (!textMatchesPayloadClass(pilot.droneSummary, filters.payloadClass)) return false;

  if (filters.region !== "India") {
    if (!pilot.location.toLowerCase().includes(filters.region.toLowerCase())) {
      return false;
    }
  }

  return true;
}

function droneMatchesFilters(
  drone: HubDroneRow,
  filters: HubAppliedFilters,
  pilotLocationById: Record<string, string>
): boolean {
  const query = filters.globalQuery.trim().toLowerCase();
  if (query) {
    if (
      !matchesGlobalQuery(query, [
        drone.id,
        drone.modelName,
        drone.type,
        drone.camera,
        drone.pilotName,
        drone.pilotId,
        drone.serialNumber,
        drone.status,
        drone.subtitle,
        drone.firmware,
        drone.maxRangeKm,
        kmValuesForSearch(drone.maxRangeKm),
        hubDroneSummary(drone),
        ...drone.useCases,
      ])
    ) {
      return false;
    }
  }

  if (filters.payloadClass !== "any") {
    const summary = hubDroneSummary(drone);
    if (drone.maxPayloadKg != null) {
      const kg = drone.maxPayloadKg;
      if (filters.payloadClass === "l1" && kg >= 5) return false;
      if (filters.payloadClass === "l3" && (kg < 5 || kg > 20)) return false;
      if (filters.payloadClass === "l5" && kg <= 20) return false;
    } else if (!textMatchesPayloadClass(summary, filters.payloadClass)) {
      return false;
    }
  }

  if (filters.region !== "India") {
    const location = (pilotLocationById[drone.pilotId] ?? "").toLowerCase();
    if (!location.includes(filters.region.toLowerCase())) return false;
  }

  return true;
}

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

function dronesForPilot(
  drones: HubDroneRow[],
  pilotId: string
): HubDroneRow[] {
  if (!pilotId) return drones;
  return drones.filter(
    (d) => !d.pilotId || d.pilotId === pilotId
  );
}

function MissionDetailDialog({
  mission,
  pilots,
  pilotsLoading,
  pilotsError,
  drones,
  dronesLoading,
  dronesError,
  onClose,
}: {
  mission: HubMission;
  pilots: HubPilotCard[];
  pilotsLoading: boolean;
  pilotsError: string | null;
  drones: HubDroneRow[];
  dronesLoading: boolean;
  dronesError: string | null;
  onClose: () => void;
}) {
  const [selectedPilotId, setSelectedPilotId] = useState("");
  const [selectedDroneId, setSelectedDroneId] = useState("");
  const [selectFeedback, setSelectFeedback] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  useEffect(() => {
    setSelectedPilotId("");
    setSelectedDroneId("");
    setSelectFeedback(null);
    setAssignError(null);
    setAssignSubmitting(false);
  }, [mission.id]);

  const dronesForAssign = useMemo(
    () => dronesForPilot(drones, selectedPilotId),
    [drones, selectedPilotId]
  );

  useEffect(() => {
    if (!selectedDroneId) return;
    if (!dronesForAssign.some((d) => d.id === selectedDroneId)) {
      setSelectedDroneId("");
    }
  }, [dronesForAssign, selectedDroneId]);

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
    const drone = dronesForAssign.find((d) => d.id === selectedDroneId);

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
        droneModel: drone ? hubDroneSummary(drone) : "—",
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
                  setSelectedDroneId("");
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
              <label
                htmlFor="mission-assign-drone"
                className="mt-3 block text-xs font-semibold text-slate-700 dark:text-white/85"
              >
                Drone (optional)
              </label>
              <select
                id="mission-assign-drone"
                value={selectedDroneId}
                onChange={(ev) => {
                  setSelectedDroneId(ev.target.value);
                  setSelectFeedback(null);
                  setAssignError(null);
                }}
                disabled={dronesLoading || dronesForAssign.length === 0}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#191c1d] outline-none ring-[#0D9488]/25 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#111315] dark:text-white"
              >
                <option value="">No drone selected</option>
                {dronesForAssign.map((d) => (
                  <option key={d.id} value={d.id}>
                    {hubDroneSummary(d)}
                    {d.pilotName ? ` — ${d.pilotName}` : ""}
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

function hubDroneField(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function HubDroneDetailGrid({ drone }: { drone: HubDroneRow }) {
  return (
    <dl className="mt-2.5 grid grid-cols-2 gap-x-2.5 gap-y-2 border-t border-slate-100 pt-2.5 text-xs sm:text-sm">
      <div className="col-span-2">
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Model
        </dt>
        <dd className="font-medium text-slate-800">{hubDroneField(drone.modelName)}</dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Drone ID
        </dt>
        <dd className="font-medium text-slate-800">{drone.id}</dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Serial
        </dt>
        <dd className="font-medium text-slate-800">{hubDroneField(drone.serialNumber)}</dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Type
        </dt>
        <dd className="font-medium text-slate-800">{hubDroneField(drone.type)}</dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Status
        </dt>
        <dd className="font-medium uppercase text-slate-800">{drone.status}</dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Payload
        </dt>
        <dd className="font-medium text-slate-800">
          {drone.maxPayloadKg != null ? `${drone.maxPayloadKg} kg` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Range
        </dt>
        <dd className="font-medium text-slate-800">
          {drone.maxRangeKm != null ? `${drone.maxRangeKm} km` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Flight time
        </dt>
        <dd className="font-medium text-slate-800">
          {drone.flightTimeMin != null ? `${drone.flightTimeMin} min` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Battery
        </dt>
        <dd className="font-medium text-slate-800">
          {drone.batteryPercent != null ? `${drone.batteryPercent}%` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Camera
        </dt>
        <dd className="font-medium text-slate-800">{hubDroneField(drone.camera)}</dd>
      </div>
      <div>
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Firmware
        </dt>
        <dd className="font-medium text-slate-800">{hubDroneField(drone.firmware)}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Pilot
        </dt>
        <dd className="font-medium text-slate-800">
          {drone.pilotName
            ? `${drone.pilotName}${drone.pilotId ? ` (#${drone.pilotId})` : ""}`
            : "—"}
        </dd>
      </div>
      <div className="col-span-2">
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Subtitle
        </dt>
        <dd className="font-medium text-slate-800">{hubDroneField(drone.subtitle)}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px]">
          Use cases
        </dt>
        <dd className="font-medium text-slate-800">
          {drone.useCases.length > 0 ? drone.useCases.join(", ") : "—"}
        </dd>
      </div>
    </dl>
  );
}

function FleetDroneCards({
  drones,
  loading,
  errorMessage,
  emptyMessage = "No pilots have registered drones yet.",
}: {
  drones: HubDroneRow[];
  loading: boolean;
  errorMessage: string | null;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <p className="text-sm text-slate-500" role="status">
        Loading drones registered by pilots…
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
  if (drones.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {drones.map((drone) => (
        <article
          key={drone.id}
          className="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:p-3.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#0058bc] sm:text-xs">
                {drone.type || "Drone"}
              </p>
              <h3 className="mt-0.5 text-base font-semibold leading-snug text-[#191c1d] sm:text-lg">
                {drone.modelName}
              </h3>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-slate-600 sm:text-xs">
              {drone.status}
            </span>
          </div>
          <HubDroneDetailGrid drone={drone} />
        </article>
      ))}
    </div>
  );
}

function PilotCards({
  pilots,
  loading,
  errorMessage,
  emptyMessage = "No active pilots are listed yet. Check back soon.",
  onPilotClick,
}: {
  pilots: HubPilotCard[];
  loading: boolean;
  errorMessage: string | null;
  emptyMessage?: string;
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
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
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
  const [hubDrones, setHubDrones] = useState<HubDroneRow[]>([]);
  const [dronesLoading, setDronesLoading] = useState(true);
  const [dronesError, setDronesError] = useState<string | null>(null);
  const [detailMission, setDetailMission] = useState<HubMission | null>(null);
  const [detailPilot, setDetailPilot] = useState<HubPilotCard | null>(null);
  const [detailPilotLoading, setDetailPilotLoading] = useState(false);
  const [detailPilotError, setDetailPilotError] = useState<string | null>(null);
  const [globalQueryDraft, setGlobalQueryDraft] = useState("");
  const [payloadClassDraft, setPayloadClassDraft] = useState("Any Weight");
  const [regionDraft, setRegionDraft] = useState("India");
  const [appliedFilters, setAppliedFilters] = useState<HubAppliedFilters>({
    globalQuery: "",
    payloadClass: "any",
    region: "India",
  });

  const syncAppliedFiltersFromDrafts = useCallback(
    (globalQuery: string) => {
      setAppliedFilters({
        globalQuery: globalQuery.trim(),
        payloadClass: payloadClassFromOption(payloadClassDraft),
        region: regionDraft,
      });
    },
    [payloadClassDraft, regionDraft]
  );

  const handleGlobalQueryChange = useCallback((value: string) => {
    setGlobalQueryDraft(value);
    if (value.trim() === "") {
      setAppliedFilters((prev) => ({
        ...prev,
        globalQuery: "",
      }));
    }
  }, []);

  const applyHubFilters = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      syncAppliedFiltersFromDrafts(globalQueryDraft);
    },
    [globalQueryDraft, syncAppliedFiltersFromDrafts]
  );

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

  const loadHubDrones = useCallback(async () => {
    setDronesLoading(true);
    setDronesError(null);
    const result = await fetchPilotRegisteredHubDrones();
    if (result.ok) {
      setHubDrones(result.data);
    } else {
      setDronesError(result.error ?? "Could not load pilot-registered drones.");
      setHubDrones([]);
    }
    setDronesLoading(false);
  }, []);

  const loadAvailableMissionsSection = useCallback(async () => {
    await Promise.all([loadMissionRows(), loadHubDrones()]);
  }, [loadMissionRows, loadHubDrones]);

  useEffect(() => {
    if (activeTab !== "missions") return;
    void loadAvailableMissionsSection();
    return subscribeAdminFleetUpdated(() => {
      void loadHubDrones();
    });
  }, [activeTab, loadAvailableMissionsSection, loadHubDrones]);

  useEffect(() => {
    return subscribeMissionRequestsUpdated(() => {
      if (activeTab === "missions") void loadAvailableMissionsSection();
    });
  }, [activeTab, loadAvailableMissionsSection]);

  useEffect(() => {
    if (pathname !== "/matching-hub") return;
    if (activeTab === "missions") void loadAvailableMissionsSection();
  }, [pathname, activeTab, loadAvailableMissionsSection]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && activeTab === "missions") {
        void loadAvailableMissionsSection();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [activeTab, loadAvailableMissionsSection]);

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

  const filteredMissionRows = useMemo(() => {
    return missionRows.filter((mission) =>
      missionMatchesFilters(mission, appliedFilters)
    );
  }, [missionRows, appliedFilters]);

  const topRatedPilots = useMemo(() => {
    return [...hubPilots]
      .filter((pilot) => pilotMatchesFilters(pilot, appliedFilters))
      .sort((a, b) => {
        if (b.safetyScore !== a.safetyScore) return b.safetyScore - a.safetyScore;
        return b.missionCount - a.missionCount;
      });
  }, [hubPilots, appliedFilters]);

  const pilotLocationById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const pilot of hubPilots) {
      if (pilot.id) map[pilot.id] = pilot.location;
    }
    return map;
  }, [hubPilots]);

  const filteredHubDrones = useMemo(() => {
    return hubDrones.filter((drone) =>
      droneMatchesFilters(drone, appliedFilters, pilotLocationById)
    );
  }, [hubDrones, appliedFilters, pilotLocationById]);

  const hasActiveHubFilters =
    appliedFilters.globalQuery !== "" ||
    appliedFilters.payloadClass !== "any" ||
    appliedFilters.region !== "India";

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
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={applyHubFilters}
          >
            <div className="min-w-[180px] max-w-md flex-1">
              <label
                htmlFor="matching-hub-global-filter"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
              >
                Global Filter
              </label>
              <div className="relative">
                <SlidersHorizontal className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="matching-hub-global-filter"
                  type="search"
                  value={globalQueryDraft}
                  onChange={(event) =>
                    handleGlobalQueryChange(event.target.value)
                  }
                  placeholder={
                    activeTab === "missions"
                      ? "Search by ID, region, class, or range (km)..."
                      : "Search pilot, rating, class, or region..."
                  }
                  className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs outline-none ring-[#0058bc]/25 focus:ring-2 sm:text-sm"
                />
              </div>
            </div>
            <div className="min-w-[130px] sm:min-w-[140px]">
              <label
                htmlFor="matching-hub-payload-class"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
              >
                Payload Class
              </label>
              <select
                id="matching-hub-payload-class"
                value={payloadClassDraft}
                onChange={(event) => setPayloadClassDraft(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none ring-[#0058bc]/25 focus:ring-2 sm:text-sm"
              >
                <option>Any Weight</option>
                <option>L-1 (&lt; 5kg)</option>
                <option>L-3 (5-20kg)</option>
                <option>L-5 Heavy (20kg+)</option>
              </select>
            </div>
            <div className="min-w-[130px] sm:min-w-[140px]">
              <label
                htmlFor="matching-hub-region"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
              >
                Region
              </label>
              <select
                id="matching-hub-region"
                value={regionDraft}
                onChange={(event) => setRegionDraft(event.target.value)}
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
            <div className="min-w-[100px]">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Search
              </span>
              <Button
                type="submit"
                variant="outline"
                className="h-[34px] w-full gap-1.5 rounded-md border border-slate-300 bg-transparent px-4 text-xs font-semibold text-[#0D9488] shadow-none hover:bg-slate-50 sm:text-sm"
              >
                <Search className="size-3.5" aria-hidden />
                Search
              </Button>
            </div>
          </form>
        </section>

        <div className="overflow-hidden">
          <div
            className={cn(
              "flex w-[200%] transition-transform duration-500 ease-out",
              activeTab === "missions" ? "translate-x-0" : "-translate-x-1/2"
            )}
          >
            <section className="w-1/2 pr-0 lg:pr-2">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-x-4 lg:gap-y-3">
                <h2 className="order-1 min-w-0 text-base font-semibold tracking-tight sm:text-lg lg:col-span-12">
                  Available Missions
                </h2>

                <div className="order-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:order-2 lg:col-span-12 xl:grid-cols-3">
                  {missionsLoading ? (
                    <p className="col-span-full text-sm text-slate-600">
                      Loading missions…
                    </p>
                  ) : missionsError ? (
                    <p className="col-span-full text-sm text-red-600">
                      {missionsError}
                    </p>
                  ) : filteredMissionRows.length === 0 ? (
                    <div className="col-span-full rounded-lg border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        {missionRows.length === 0
                          ? "No Available Mission"
                          : "No missions match your search."}
                      </p>
                    </div>
                  ) : null}
                  {!missionsLoading && !missionsError
                    ? filteredMissionRows.map((mission) => (
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
                  ))
                    : null}
                </div>

                <div className="order-3 lg:order-3 lg:col-span-12">
                  <div className="mt-3 border-t border-slate-200 pt-5">
                    <h3 className="text-base font-semibold tracking-tight text-[#191c1d] sm:text-lg">
                      Drone Details
                    </h3>
                    <div className="mt-4">
                      <FleetDroneCards
                        drones={filteredHubDrones}
                        loading={dronesLoading}
                        errorMessage={dronesError}
                        emptyMessage={
                          hasActiveHubFilters && hubDrones.length > 0
                            ? "No drones match your search."
                            : undefined
                        }
                      />
                    </div>
                  </div>
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
                    emptyMessage={
                      hasActiveHubFilters && hubPilots.length > 0
                        ? "No pilots match your search."
                        : undefined
                    }
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
            drones={filteredHubDrones}
            dronesLoading={dronesLoading}
            dronesError={dronesError}
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
