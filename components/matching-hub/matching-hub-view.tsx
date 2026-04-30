"use client";

import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  MapPin,
  SlidersHorizontal,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { assignHubMissionToPilot, getPilots } from "@/app/services/pilotServices";
import { apiUrl } from "@/lib/api-url";
import {
  experienceSubtitleFromPilotRow,
  missionsCompletedFromPilotRow,
  safetyRatingFromPilotRow,
} from "@/lib/pilot-db-metrics";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

type HubTab = "missions" | "pilots";

type HubMission = {
  id: string;
  title: string;
  payout: string;
  description: string;
  payload: string;
  distance: string;
  posted: string;
  duration: string;
  aircraftClass: string;
  clearance: string;
  requirements: string;
};

type HubPilotCard = {
  id: string;
  name: string;
  role: string;
  ratingLabel: string;
  imageSrc: string;
  safetyScore: number;
  missionCount: number;
};

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

  return {
    id: id || `pilot-${name}`,
    name,
    role,
    ratingLabel,
    imageSrc,
    safetyScore: safety,
    missionCount,
  };
}

/** Default rows (also used if `/api/missions-requests` is unavailable). Same payload seeded into `mission_requests`. */
const FALLBACK_MATCHING_HUB_MISSIONS: HubMission[] = [
  {
    id: "ML-9021",
    title: "Arctic Supply Drop",
    payout: "$4,200",
    description:
      "Urgent medical supply delivery to Northern Research Outpost. Requires high-altitude stability.",
    payload: "18.5 KG",
    distance: "340 KM",
    posted: "Posted 3 days ago · Priority tier",
    duration: "Est. flight legs 2h 15m · On-site 5–7 hours",
    aircraftClass: "L-3 heavy multi-rotor, cold-weather rated",
    clearance: "Controlled airspace coordination + arctic NOTAM",
    requirements:
      "Medical payload chain-of-custody logging, redundant GNSS, and documented high-altitude hover stability. Client requires pre-flight brief 24h before departure window.",
  },
  {
    id: "TX-4402",
    title: "Urban LiDAR Scan",
    payout: "$1,850",
    description:
      "High-resolution 3D mapping of downtown infrastructure for city planning. Requires Grade-A stealth props.",
    payload: "2.2 KG",
    distance: "12 KM",
    posted: "Posted 1 week ago · Standard",
    duration: "Est. grid coverage 3–4 hours (multiple batteries)",
    aircraftClass: "L-1 compact quad, low-noise props",
    clearance: "Municipal low-altitude corridor permit (provided)",
    requirements:
      "Stealth-rated propellers, 5cm vertical accuracy spec, and delivery of raw point cloud + classified tiles within 48h of capture.",
  },
  {
    id: "FF-1190",
    title: "Forest Fire Monitor",
    payout: "$2,900",
    description:
      "Night-ops thermal monitoring for active containment zones. Multi-spectrum gimbal required.",
    payload: "4.5 KG",
    distance: "88 KM",
    posted: "Posted 12 hours ago · Urgent",
    duration: "Night window only · 6h continuous monitoring blocks",
    aircraftClass: "L-3 with dual-sensor gimbal (thermal + RGB)",
    clearance: "Wildfire TFR coordination with incident command",
    requirements:
      "Night waiver on file, radiometric thermal calibration card, and ability to stream low-latency feed to ops channel during sorties.",
  },
  {
    id: "OC-8821",
    title: "Offshore Rig Cargo",
    payout: "$6,100",
    description:
      "Heavy lift logistics for oil platform repair parts. Salt-spray protection and L-5 heavy lift cert essential.",
    payload: "42.0 KG",
    distance: "115 KM",
    posted: "Posted 5 days ago · Contract",
    duration: "Deck cycle 45m · Total op window 2 days",
    aircraftClass: "L-5 heavy lift, corrosion-resistant airframe",
    clearance: "Offshore helideck + maritime radio net",
    requirements:
      "L-5 certification proof, salt-spray IP rating documentation, and marine insurance rider naming the operator. Deck supervisor sign-off required before release.",
  },
];

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

function PilotCards({
  pilots,
  loading,
  errorMessage,
}: {
  pilots: HubPilotCard[];
  loading: boolean;
  errorMessage: string | null;
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
        <article
          key={pilot.id}
          className="flex items-center gap-2.5 rounded-lg border border-transparent bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-all hover:border-[#0058bc]"
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
          <button
            type="button"
            className="rounded-md bg-slate-100 p-1.5 transition-colors hover:bg-[#0058bc] hover:text-white"
            aria-label={`Connect with ${pilot.name}`}
          >
            <UserPlus className="size-3.5" />
          </button>
        </article>
      ))}
    </div>
  );
}

export function MatchingHubView() {
  const [activeTab, setActiveTab] = useState<HubTab>("missions");
  const [hubPilots, setHubPilots] = useState<HubPilotCard[]>([]);
  const [pilotsLoading, setPilotsLoading] = useState(true);
  const [pilotsError, setPilotsError] = useState<string | null>(null);
  const [missionRows, setMissionRows] = useState<HubMission[]>(
    FALLBACK_MATCHING_HUB_MISSIONS
  );
  const [detailMission, setDetailMission] = useState<HubMission | null>(null);

  const closeMissionDetail = useCallback(() => setDetailMission(null), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/missions-requests"));
        const body = await readResponseJson(res);
        if (cancelled) return;
        if (!body.okParse || body.data == null || typeof body.data !== "object") {
          return;
        }
        const envelope = body.data as {
          success?: boolean;
          data?: unknown;
        };
        if (!res.ok || envelope.success === false) return;
        const list = Array.isArray(envelope.data) ? envelope.data : [];
        if (list.length > 0) {
          setMissionRows(list as HubMission[]);
        }
      } catch {
        /* keep FALLBACK_MATCHING_HUB_MISSIONS */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const sidebarPilots = useMemo(() => topRatedPilots.slice(0, 6), [topRatedPilots]);

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
          <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("missions")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
                activeTab === "missions"
                  ? "bg-white text-[#0D9488] shadow-sm"
                  : "text-[#0D9488]"
              )}
            >
              <MapPin className="size-3.5 sm:size-4" />
              Find Missions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pilots")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
                activeTab === "pilots"
                  ? "bg-white text-[#0D9488] shadow-sm"
                  : "text-[#0D9488]"
              )}
            >
              <Briefcase className="size-3.5 sm:size-4" />
              Find Pilots
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
              <select className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none ring-[#0058bc]/25 focus:ring-2 sm:text-sm">
                <option>Global</option>
                <option>North America</option>
                <option>Europe</option>
                <option>Asia Pacific</option>
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
                lg: row 1 = both section titles (8+4 cols), row 2 = mission grid + pilot list.
                Mobile: order puts missions title → cards → pilots title → cards.
              */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-x-4 lg:gap-y-3">
                <h2 className="order-1 min-w-0 text-base font-semibold tracking-tight sm:text-lg lg:col-span-8">
                  Available Missions
                </h2>
                <h2 className="order-3 min-w-0 text-base font-semibold tracking-tight sm:text-lg lg:order-2 lg:col-span-4 lg:pl-5 xl:pl-6">
                  Top Rated Pilots
                </h2>
                <div className="order-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:order-3 lg:col-span-8">
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
                <aside className="order-4 min-w-0 lg:col-span-4">
                  <PilotCards
                    pilots={sidebarPilots}
                    loading={pilotsLoading}
                    errorMessage={pilotsError}
                  />
                </aside>
              </div>
            </section>

            <section className="w-1/2 pl-0 lg:pl-2">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-x-4 lg:gap-y-3">
                <h2 className="order-1 min-w-0 text-xl font-semibold tracking-tight sm:text-2xl lg:col-span-8">
                  Available Pilots
                </h2>
                <h2 className="order-3 min-w-0 text-xl font-semibold tracking-tight sm:text-2xl lg:order-2 lg:col-span-4">
                  Priority Missions
                </h2>
                <div className="order-2 min-w-0 lg:order-3 lg:col-span-8">
                  <PilotCards
                    pilots={topRatedPilots}
                    loading={pilotsLoading}
                    errorMessage={pilotsError}
                  />
                </div>
                <aside className="order-4 min-w-0 space-y-2 lg:col-span-4">
                  {missionRows.slice(0, 3).map((mission) => (
                    <button
                      key={`${mission.id}-priority`}
                      type="button"
                      onClick={() => setDetailMission(mission)}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 p-2 text-left shadow-sm backdrop-blur-sm transition-all hover:border-[#0D9488] hover:shadow-md"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#0058bc]">
                        {mission.id}
                      </p>
                      <h3 className="mt-0.5 text-sm font-semibold leading-snug sm:text-base">
                        {mission.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-600">{mission.distance}</p>
                    </button>
                  ))}
                </aside>
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
      </main>
    </div>
  );
}
