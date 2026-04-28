"use client";

import Image from "next/image";
import Link from "next/link";
import { Inter, Manrope } from "next/font/google";
import {
  CheckCircle2,
  Eye,
  MapPin,
  Navigation,
  Package,
  Scale,
  Trash2,
  User,
  UserRound,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { tableRequestId } from "@/components/dashboard/user-request-table";
import {
  loadCompletedAssignments,
  normalizeToLatestCompleted,
  saveCompletedAssignments,
  type CompletedAssignment,
} from "@/lib/completed-assignments";
import {
  assignQueueValidRefsForPrune,
  ASSIGN_INSPECT_STORAGE_KEY,
  ASSIGN_INSPECT_UPDATED_EVENT,
  DEMO_ASSIGN_BRIDGE_STORAGE_KEY,
  DEMO_ASSIGN_BRIDGE_UPDATED_EVENT,
  mergeAssignPilotDisplayQueue,
} from "@/lib/assign-demo-bridge";
import { pushPilotMissionNotification } from "@/lib/pilot-mission-notifications";
import {
  appendAssignPilotDoneRef,
  loadAssignPilotDoneRefs,
  pruneAssignPilotDoneRefs,
} from "@/lib/assign-pilot-done-refs";
import {
  USER_REQUESTS_STORAGE_KEY,
  USER_REQUESTS_UPDATED_EVENT,
  userRequestQueueDisplayId,
  type AssignPilotRequestRow,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import { apiUrl } from "@/lib/api-url";
import {
  parsePilotProfileSnapshot,
  PILOT_PROFILE_STORAGE_KEY,
  PILOT_PROFILE_UPDATED_EVENT,
  type PilotProfileDrone,
} from "@/lib/pilot-profile-snapshot";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-assign-headline",
  weight: ["400", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-assign-body",
  weight: ["300", "400", "500", "600"],
});

type PilotCard = {
  id: string;
  name: string;
  level: number;
  tags: readonly string[];
  hours: string;
  hoursShort: string;
  yearsExp: number;
  pilotId: string;
  sector: string;
  clearance: string;
  certBadge: string;
};

type DroneCard = {
  id: string;
  model: string;
  sn: string;
  battery: number;
  cargo: string;
  cargoShort: string;
  maxRange: string;
  rangeShort: string;
  estFlight: string;
  lastInspection: string;
  firmware: string;
  subtitle: string;
  imageUrl: string;
  matchPercent: number;
  status?: "charging" | "ready";
  /** From DB — used to score fit vs mission payload */
  maxPayloadKg: number;
  pilotName: string;
  pilotBadgeId: string;
  sourceSnapshotKey: string;
  sourceDroneId: string;
  sourceIndex: number;
};

type ApiPilotRow = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  duty_status?: string | null;
  flight_hours?: number | string | null;
  experience_years?: number | string | null;
  experience_rank?: string | null;
};

function nx(v: unknown, fallback: number): number {
  if (v == null || v === "") return fallback;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapApiPilotToCard(row: ApiPilotRow): PilotCard {
  const id = String(row.id);
  const name = row.name?.trim() || "Pilot";
  const duty = (row.duty_status ?? "ACTIVE").toUpperCase();
  const lic = row.license_number?.trim() ?? "";
  const fh = Math.round(nx(row.flight_hours, 0));
  const years = Math.round(nx(row.experience_years, 0));
  const level = Math.min(
    5,
    Math.max(
      1,
      years > 0
        ? 1 + Math.floor(years / 3)
        : Math.min(5, 1 + Math.floor(fh / 400))
    )
  );
  const rank = row.experience_rank?.trim() || `L${level}`;
  return {
    id,
    name,
    level,
    tags: [duty, lic ? lic.slice(0, 24) : "Licensed"].filter(Boolean),
    hours: `${fh.toLocaleString("en-US")} flight hours`,
    hoursShort: `${fh.toLocaleString("en-US")} hrs`,
    yearsExp: years,
    pilotId: lic || `PLT-${id}`,
    sector: row.phone?.trim() ? `Tel ${row.phone}` : "—",
    clearance: rank,
    certBadge: lic ? lic.slice(0, 18) : rank,
  };
}


function toPositiveNumber(raw: string, fallback: number): number {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return fallback;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function profileDroneOwner(snapshotKey: string, fallbackName: string): string {
  const maybeSub = snapshotKey.split("::pilot::")[1];
  if (maybeSub && maybeSub.trim()) return `Pilot #${maybeSub.trim()}`;
  return fallbackName || "Pilot";
}

function profileSnapshotPilotSub(snapshotKey: string): string | null {
  const maybeSub = snapshotKey.split("::pilot::")[1];
  const sub = maybeSub?.trim();
  return sub ? sub : null;
}

function mapProfileDroneToCard(
  drone: PilotProfileDrone,
  owner: string,
  pilotBadgeId: string,
  idx: number,
  snapshotKey: string
): DroneCard {
  const payload = toPositiveNumber(drone.payloadKg, 10);
  const range = toPositiveNumber(drone.rangeKm, 60);
  const flightMin = Math.round(toPositiveNumber(drone.flightTimeMin, 30));
  const model = drone.modelName.trim() || "Profile Drone";
  const camera = drone.camera.trim();
  const serial = drone.id?.trim() || `profile-${owner}-${idx + 1}`;
  const useCase = drone.useCases?.[0]?.trim() || drone.type.trim();
  return {
    id: `profile-${serial}`,
    model,
    sn: serial,
    battery: 82,
    cargo: `${payload}kg`,
    cargoShort: `${payload}kg cap.`,
    maxRange: `${range} km`,
    rangeShort: `${range}km range`,
    estFlight: `${flightMin} min`,
    lastInspection: "Profile entry",
    firmware: camera || "—",
    subtitle: `${owner}${useCase ? ` · ${useCase}` : ""}`,
    imageUrl: "/hero-drone-platform.png",
    matchPercent: 70,
    status: "ready",
    maxPayloadKg: payload,
    pilotName: owner,
    pilotBadgeId,
    sourceSnapshotKey: snapshotKey,
    sourceDroneId: drone.id?.trim() || "",
    sourceIndex: idx,
  };
}

function dedupeDrones(items: DroneCard[]): DroneCard[] {
  const byKey = new Map<string, DroneCard>();
  for (const drone of items) {
    const key = `${drone.model.toLowerCase()}|${drone.sn.toLowerCase()}`;
    if (!byKey.has(key)) byKey.set(key, drone);
  }
  return [...byKey.values()];
}

function loadProfileDronesFromBrowser(
  pilotBySub: Record<string, { name: string; badgeId: string }> = {}
): DroneCard[] {
  if (typeof window === "undefined") return [];
  const keys = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k === PILOT_PROFILE_STORAGE_KEY || k.startsWith(`${PILOT_PROFILE_STORAGE_KEY}::`)) {
        keys.add(k);
      }
    }
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (!k) continue;
      if (k === PILOT_PROFILE_STORAGE_KEY || k.startsWith(`${PILOT_PROFILE_STORAGE_KEY}::`)) {
        keys.add(k);
      }
    }
  } catch {
    return [];
  }

  const out: DroneCard[] = [];
  for (const key of keys) {
    const raw =
      sessionStorage.getItem(key) ??
      localStorage.getItem(key) ??
      null;
    const snap = parsePilotProfileSnapshot(raw);
    if (!snap || !Array.isArray(snap.drones) || snap.drones.length === 0) continue;
    const sub = profileSnapshotPilotSub(key);
    const pilotFromApi = sub ? pilotBySub[sub] : undefined;
    const owner =
      pilotFromApi?.name || profileDroneOwner(key, snap.fullName.trim() || "Pilot");
    const badgeId = pilotFromApi?.badgeId || (sub ? `PLT-${sub}` : "—");
    for (let i = 0; i < snap.drones.length; i += 1) {
      const d = snap.drones[i];
      out.push(mapProfileDroneToCard(d, owner, badgeId, i, key));
    }
  }
  return dedupeDrones(out);
}

function isPilotProfileStorageKey(key: string | null): boolean {
  if (!key) return false;
  return key === PILOT_PROFILE_STORAGE_KEY || key.startsWith(`${PILOT_PROFILE_STORAGE_KEY}::`);
}

function parseKgFromAssignRow(req: AssignPilotRequestRow): string {
  const m = `${req.sectorLine} ${req.customer} ${req.dropoff}`.match(
    /([\d.]+)\s*kg\b/i
  );
  return m ? `${m[1]} kg` : "—";
}

function missionPayloadKg(req: AssignPilotRequestRow | null): number | null {
  if (!req) return null;
  const s = parseKgFromAssignRow(req);
  const m = s.match(/([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

function matchPercentForMission(
  droneMaxKg: number,
  missionKg: number | null
): number {
  if (!missionKg || missionKg <= 0 || !droneMaxKg || droneMaxKg <= 0) {
    return 72;
  }
  if (missionKg > droneMaxKg) {
    return Math.max(18, Math.round((droneMaxKg / missionKg) * 100));
  }
  return Math.min(99, 72 + Math.round((1 - missionKg / droneMaxKg) * 27));
}

function parseKmHint(req: AssignPilotRequestRow): string {
  const m = req.sectorLine.match(/([\d.]+)\s*km\b/i);
  if (m) return `${m[1]} km`;
  const medical = /medical|supply|urgent/i.test(req.customer + req.service);
  return medical ? "65 km" : "48 km";
}

function urgencyLabel(req: AssignPilotRequestRow): string {
  const t = req.sectorLine.toLowerCase();
  if (t.includes("urgent")) return "Express (High)";
  if (t.includes("standard")) return "Standard";
  return "Routine";
}

function missionRangeKm(req: AssignPilotRequestRow | null): number | null {
  if (!req) return null;
  const m = req.sectorLine.match(/([\d.]+)\s*km\b/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

function missionUrgencyWeight(req: AssignPilotRequestRow | null): number {
  if (!req) return 1;
  const t = req.sectorLine.toLowerCase();
  if (t.includes("urgent") || t.includes("critical")) return 3;
  if (t.includes("priority") || t.includes("express")) return 2;
  return 1;
}

function parseKmFromLabel(text: string): number | null {
  const m = text.match(/([\d.]+)\s*km/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

function scoreDroneForMission(
  drone: DroneCard,
  payloadKg: number | null,
  rangeKm: number | null,
  urgencyWeight: number
): { score: number; note: string } {
  let score = 35;
  const reasons: string[] = [];

  if (payloadKg && payloadKg > 0) {
    if (drone.maxPayloadKg >= payloadKg) {
      score += 30 + Math.min(10, Math.round(((drone.maxPayloadKg - payloadKg) / payloadKg) * 10));
      reasons.push("payload-fit");
    } else {
      score -= Math.min(35, Math.round(((payloadKg - drone.maxPayloadKg) / payloadKg) * 50));
      reasons.push("payload-limited");
    }
  }

  const droneRange = parseKmFromLabel(drone.maxRange);
  if (rangeKm && rangeKm > 0 && droneRange && droneRange > 0) {
    if (droneRange >= rangeKm) {
      score += 20;
      reasons.push("range-fit");
    } else {
      score -= Math.min(25, Math.round(((rangeKm - droneRange) / rangeKm) * 40));
      reasons.push("range-limited");
    }
  }

  if (drone.status === "charging") {
    score -= urgencyWeight >= 3 ? 20 : 10;
    reasons.push("charging");
  } else {
    const batteryBoost = Math.round((drone.battery / 100) * (urgencyWeight >= 3 ? 20 : 12));
    score += batteryBoost;
    reasons.push(`battery-${drone.battery}%`);
  }

  score = Math.max(1, Math.min(99, score));
  return { score, note: reasons.join(" · ") };
}

function scorePilotForMission(
  pilot: PilotCard,
  payloadKg: number | null,
  rangeKm: number | null,
  urgencyWeight: number
): { score: number; note: string } {
  let score = 30;
  const reasons: string[] = [];
  const active = pilot.tags.some((t) => t.toUpperCase().includes("ACTIVE"));

  score += pilot.level * 8 + Math.min(20, pilot.yearsExp * 2);
  reasons.push(`L${pilot.level}`);

  if (active) {
    score += 12;
    reasons.push("active");
  } else {
    score -= 8;
    reasons.push("inactive");
  }

  if (payloadKg && payloadKg >= 20 && pilot.level < 3) {
    score -= 18;
    reasons.push("heavy-payload-risk");
  } else if (payloadKg && payloadKg >= 10 && pilot.level < 2) {
    score -= 10;
    reasons.push("payload-risk");
  }

  if (rangeKm && rangeKm > 90 && pilot.yearsExp < 3) {
    score -= 12;
    reasons.push("long-range-risk");
  } else if (rangeKm && rangeKm > 60) {
    score += 6;
    reasons.push("range-capable");
  }

  score += urgencyWeight * (pilot.level >= 4 ? 6 : 2);
  if (urgencyWeight >= 3) reasons.push("urgent-ready");

  score = Math.max(1, Math.min(99, score));
  return { score, note: reasons.join(" · ") };
}

function assignRequestDetailDomId(requestRef: string): string {
  return `assign-req-${requestRef.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

const glassCard =
  "bg-white/70 backdrop-blur-xl dark:bg-card/80 border border-white/50 shadow-[0px_12px_32px_rgba(25,28,29,0.06)]";

export function AssignPilotDroneView() {
  const [selectedPilotId, setSelectedPilotId] = useState("");
  const [selectedDroneId, setSelectedDroneId] = useState("");
  const [fleetPilots, setFleetPilots] = useState<PilotCard[]>([]);
  const [fleetDrones, setFleetDrones] = useState<DroneCard[]>([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [deletingDroneId, setDeletingDroneId] = useState<string | null>(null);
  const [assignQueue, setAssignQueue] = useState<AssignPilotRequestRow[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<
    CompletedAssignment[]
  >([]);
  const [assignedDialogOpen, setAssignedDialogOpen] = useState(false);
  const [historyDetailIndex, setHistoryDetailIndex] = useState<number | null>(
    null
  );
  const [doneRefs, setDoneRefs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadFleet() {
      setFleetLoading(true);
      setFleetError(null);
      try {
        const pr = await fetch(apiUrl("/api/pilots"));
        if (!pr.ok) {
          throw new Error(`Pilots HTTP ${pr.status}`);
        }
        const pilotsRaw: unknown = await pr.json();
        if (cancelled) return;
        const pilotsArr = Array.isArray(pilotsRaw) ? pilotsRaw : [];
        const pilotCards = pilotsArr.map((row) => mapApiPilotToCard(row as ApiPilotRow));
        const pilotBySub = pilotCards.reduce<
          Record<string, { name: string; badgeId: string }>
        >((acc, row) => {
          acc[row.id] = { name: row.name, badgeId: row.pilotId };
          return acc;
        }, {});
        const profileDrones = loadProfileDronesFromBrowser(pilotBySub);
        setFleetPilots(pilotCards);
        setFleetDrones(profileDrones);
      } catch (e) {
        if (!cancelled) {
          setFleetError(
            e instanceof Error ? e.message : "Could not load pilots."
          );
          setFleetPilots([]);
          setFleetDrones(loadProfileDronesFromBrowser());
        }
      } finally {
        if (!cancelled) setFleetLoading(false);
      }
    }
    void loadFleet();
    const onProfileUpdate = () => {
      void loadFleet();
    };
    const onStorage = (event: StorageEvent) => {
      if (isPilotProfileStorageKey(event.key)) {
        void loadFleet();
      }
    };
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, onProfileUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, onProfileUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!fleetPilots.length) return;
    setSelectedPilotId((prev) =>
      fleetPilots.some((p) => p.id === prev)
        ? prev
        : fleetPilots[0]!.id
    );
  }, [fleetPilots]);

  useEffect(() => {
    if (!fleetDrones.length) return;
    setSelectedDroneId((prev) =>
      fleetDrones.some((d) => d.id === prev)
        ? prev
        : fleetDrones[0]!.id
    );
  }, [fleetDrones]);

  const syncAssignQueue = useCallback(() => {
    setAssignQueue(mergeAssignPilotDisplayQueue());
  }, []);

  const syncCompletedAssignments = useCallback(() => {
    const ids = assignQueueValidRefsForPrune();
    pruneAssignPilotDoneRefs(ids);

    const raw = loadCompletedAssignments();
    const latest = normalizeToLatestCompleted(raw);
    const kept = latest.filter((c) => ids.has(c.requestRef));
    saveCompletedAssignments(kept);
    setCompletedAssignments(kept);
    if (kept[0] && !loadAssignPilotDoneRefs().includes(kept[0].requestRef)) {
      appendAssignPilotDoneRef(kept[0].requestRef);
    }
    setDoneRefs(loadAssignPilotDoneRefs());
  }, []);

  useEffect(() => {
    syncAssignQueue();
    syncCompletedAssignments();
    const onUserRequestsUpdated = () => {
      syncAssignQueue();
      syncCompletedAssignments();
    };
    const onDemoBridgeUpdated = () => {
      syncAssignQueue();
      syncCompletedAssignments();
    };
    const onInspectUpdated = () => {
      syncAssignQueue();
      syncCompletedAssignments();
    };
    const onStorage = (e: StorageEvent) => {
      if (
        e.key !== USER_REQUESTS_STORAGE_KEY &&
        e.key !== DEMO_ASSIGN_BRIDGE_STORAGE_KEY &&
        e.key !== ASSIGN_INSPECT_STORAGE_KEY
      ) {
        return;
      }
      syncAssignQueue();
      syncCompletedAssignments();
    };
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, onUserRequestsUpdated);
    window.addEventListener(DEMO_ASSIGN_BRIDGE_UPDATED_EVENT, onDemoBridgeUpdated);
    window.addEventListener(ASSIGN_INSPECT_UPDATED_EVENT, onInspectUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(
        USER_REQUESTS_UPDATED_EVENT,
        onUserRequestsUpdated
      );
      window.removeEventListener(
        DEMO_ASSIGN_BRIDGE_UPDATED_EVENT,
        onDemoBridgeUpdated
      );
      window.removeEventListener(ASSIGN_INSPECT_UPDATED_EVENT, onInspectUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncAssignQueue, syncCompletedAssignments]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    if (!focus) return;
    const el = document.getElementById(assignRequestDetailDomId(focus));
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const url = new URL(window.location.href);
    url.searchParams.delete("focus");
    window.history.replaceState(
      null,
      "",
      url.pathname + (url.search ? url.search : "")
    );
  }, [assignQueue]);

  const completedRequestRefs = useMemo(
    () => new Set(doneRefs),
    [doneRefs]
  );

  const pendingRequests = useMemo(
    () => assignQueue.filter((r) => !completedRequestRefs.has(r.requestRef)),
    [assignQueue, completedRequestRefs]
  );

  const nextPendingRequest = pendingRequests[0] ?? null;
  const currentRequest =
    nextPendingRequest ?? (assignQueue.length > 0 ? assignQueue[0]! : null);
  const noUserRequests = assignQueue.length === 0;
  const queueFullyAssigned =
    assignQueue.length > 0 && pendingRequests.length === 0;
  const missionPayloadNum = missionPayloadKg(currentRequest);
  const missionRangeNum = missionRangeKm(currentRequest);
  const missionUrgencyNum = missionUrgencyWeight(currentRequest);

  const dronesForUi = useMemo(() => {
    return fleetDrones
      .map((d) => {
        const fit = scoreDroneForMission(
          d,
          missionPayloadNum,
          missionRangeNum,
          missionUrgencyNum
        );
        return {
          ...d,
          matchPercent: fit.score,
          matchNote: fit.note,
        };
      })
      .sort((a, b) => b.matchPercent - a.matchPercent);
  }, [fleetDrones, missionPayloadNum, missionRangeNum, missionUrgencyNum]);

  const pilotsForUi = useMemo(() => {
    return fleetPilots
      .map((p) => {
        const fit = scorePilotForMission(
          p,
          missionPayloadNum,
          missionRangeNum,
          missionUrgencyNum
        );
        return {
          ...p,
          matchScore: fit.score,
          matchNote: fit.note,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [fleetPilots, missionPayloadNum, missionRangeNum, missionUrgencyNum]);

  const optimalPilotId = pilotsForUi[0]?.id ?? "";

  const selectedPilot = useMemo(
    () => pilotsForUi.find((p) => p.id === selectedPilotId) ?? null,
    [pilotsForUi, selectedPilotId]
  );
  const selectedDrone = useMemo(
    () => dronesForUi.find((d) => d.id === selectedDroneId) ?? null,
    [dronesForUi, selectedDroneId]
  );

  const historyDetail =
    historyDetailIndex !== null
      ? completedAssignments[historyDetailIndex]
      : null;

  const pendingForRequestDetails = useMemo(
    () =>
      assignQueue.filter((r) => !completedRequestRefs.has(r.requestRef)),
    [assignQueue, completedRequestRefs]
  );

  const missionTitle = currentRequest?.customer ?? "No active mission";
  const missionPayload = currentRequest
    ? parseKgFromAssignRow(currentRequest)
    : "—";
  const missionRange = currentRequest
    ? parseKmHint(currentRequest)
    : "—";
  const missionUrgency = currentRequest
    ? urgencyLabel(currentRequest)
    : "—";
  const missionDropoff = currentRequest?.dropoff ?? "—";

  const latestCompleted =
    completedAssignments[0] !== undefined ? completedAssignments[0] : null;
  const latestCompletedIndex = latestCompleted ? 0 : -1;

  const assignActionDisabled =
    noUserRequests ||
    fleetLoading ||
    !selectedPilot ||
    !selectedDrone;

  const confirmAssignment = () => {
    if (!currentRequest || !selectedPilot || !selectedDrone) return;
    const row: CompletedAssignment = {
      requestRef: currentRequest.requestRef,
      customer: currentRequest.customer,
      service: currentRequest.service,
      dropoff: currentRequest.dropoff,
      sectorLine: currentRequest.sectorLine,
      pilotName: selectedPilot.name,
      pilotBadgeId: selectedPilot.pilotId,
      droneModel: selectedDrone.model,
    };
    const next = [row];
    appendAssignPilotDoneRef(row.requestRef);
    saveCompletedAssignments(next);
    setCompletedAssignments(next);
    setDoneRefs(loadAssignPilotDoneRefs());
    pushPilotMissionNotification({
      requestRef: row.requestRef,
      customer: row.customer,
      service: row.service,
      dropoff: row.dropoff,
      pilotName: row.pilotName,
      pilotBadgeId: row.pilotBadgeId,
      pilotSub: selectedPilot.id,
      droneModel: row.droneModel,
    });
    setAssignedDialogOpen(false);
  };

  useEffect(() => {
    const dialogOpen = assignedDialogOpen || historyDetailIndex !== null;
    if (!dialogOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (historyDetailIndex !== null) setHistoryDetailIndex(null);
      else setAssignedDialogOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [assignedDialogOpen, historyDetailIndex]);

  const fontWrap = cn(
    manrope.variable,
    inter.variable,
    "font-[family-name:var(--font-assign-body)] text-[#191c1d] antialiased"
  );

  async function handleDeleteDrone(drone: DroneCard) {
    if (typeof window === "undefined") return;
    const snapshotKey = drone.sourceSnapshotKey;
    if (!snapshotKey) return;
    const raw =
      sessionStorage.getItem(snapshotKey) ??
      localStorage.getItem(snapshotKey) ??
      null;
    const snap = parsePilotProfileSnapshot(raw);
    if (!snap || !Array.isArray(snap.drones)) return;

    const nextDrones = snap.drones.filter((d, index) => {
      if (drone.sourceDroneId) {
        return (d.id?.trim() || "") !== drone.sourceDroneId;
      }
      return index !== drone.sourceIndex;
    });
    if (nextDrones.length === snap.drones.length) return;

    setDeletingDroneId(drone.id);
    try {
      const nextSnap = { ...snap, drones: nextDrones };
      const encoded = JSON.stringify(nextSnap);
      try {
        localStorage.setItem(snapshotKey, encoded);
      } catch {
        /* ignore localStorage quota/write */
      }
      sessionStorage.setItem(snapshotKey, encoded);

      const sub = snapshotKey.split("::pilot::")[1]?.trim();
      if (sub && /^[0-9]+$/.test(sub)) {
        await fetch(apiUrl(`/api/pilots/${sub}/drones`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drones: nextDrones }),
        });
      }

      window.dispatchEvent(new Event(PILOT_PROFILE_UPDATED_EVENT));
    } finally {
      setDeletingDroneId(null);
    }
  }

  return (
    <div
      className={cn(
        fontWrap,
        "min-w-0 bg-[#f8f9fa] pb-12 pt-4 text-[#191c1d] dark:bg-background dark:text-foreground sm:pt-6"
      )}
    >
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
        {fleetError ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100"
            role="alert"
          >
            Could not load pilots from the API ({fleetError}). Ensure the backend
            is running on port 4000 and PostgreSQL is available.
          </p>
        ) : null}
        {!queueFullyAssigned && !noUserRequests ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={assignActionDisabled}
              className="rounded-full border-2 border-[#008B8B] bg-white px-5 py-2 text-xs font-bold text-[#008B8B] shadow-sm transition hover:bg-[#008B8B]/5 disabled:opacity-50 dark:bg-card"
              onClick={() => {
                if (!assignActionDisabled) setAssignedDialogOpen(true);
              }}
            >
              Assign mission
            </button>
            <span className="inline-flex items-center justify-center rounded-full border-2 border-[#008B8B] bg-white px-5 py-2 text-xs font-bold uppercase tracking-wide text-[#008B8B] shadow-sm dark:border-primary dark:bg-card dark:text-primary">
              {pendingRequests.length} pending / {assignQueue.length}
            </span>
          </div>
        ) : null}

        {/* Queue strip — compact */}
        {pendingForRequestDetails.length > 1 ? (
          <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white/60 p-3 text-xs dark:border-border dark:bg-card/60">
            <span className="font-bold text-muted-foreground">Queue:</span>
            {pendingForRequestDetails.map((r) => (
              <span
                key={r.id}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono font-semibold",
                  currentRequest?.id === r.id
                    ? "bg-[#008B8B]/15 text-[#006767] dark:text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {r.requestRef.startsWith("demo-")
                  ? tableRequestId({
                      key: r.requestRef,
                      title: r.customer,
                      badge: "NORMAL",
                      badgeClass: "",
                      barColor: "",
                      desc: "",
                    } as UserRequestAdminRow)
                  : userRequestQueueDisplayId(r.requestRef)}
              </span>
            ))}
          </div>
        ) : null}

        {assignQueue.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-muted-foreground dark:border-border dark:bg-card/50">
            No accepted requests yet. Open{" "}
            <Link
              href="/dashboard/user-requests"
              className="font-semibold text-[#008B8B] underline-offset-2 hover:underline"
            >
              User Request
            </Link>{" "}
            and accept a mission to assign resources here.
          </p>
        ) : queueFullyAssigned ? (
          <div className="space-y-6">
            <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              All queued missions are marked assigned. Accept another request from{" "}
              <Link
                href="/dashboard/user-requests"
                className="font-semibold text-[#008B8B] underline-offset-2 hover:underline dark:text-teal-300"
              >
                User Request
              </Link>{" "}
              to add a new one.
            </p>
            {latestCompleted ? (
              <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-border dark:bg-card/80">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Last Assigned
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {userRequestQueueDisplayId(latestCompleted.requestRef)} ·{" "}
                  {latestCompleted.customer}
                </p>
                <p className="text-sm text-muted-foreground">
                  {latestCompleted.pilotName} · {latestCompleted.droneModel}
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-[#008B8B] px-4 py-2 text-sm font-bold text-[#008B8B]"
                  onClick={() => setHistoryDetailIndex(latestCompletedIndex)}
                >
                  <Eye className="size-4" aria-hidden />
                  View details
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
        {/* Active mission hero — id supports ?focus= scroll from User Request */}
        <section
          id={
            currentRequest
              ? assignRequestDetailDomId(currentRequest.requestRef)
              : undefined
          }
          className={cn("relative overflow-hidden rounded-xl p-6 sm:p-8", glassCard)}
        >
          <div
            className="pointer-events-none absolute -right-32 -top-32 size-64 rounded-full bg-[#008B8B]/5"
            aria-hidden
          />
          <div className="relative z-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="min-w-0">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#006767] dark:text-primary">
                  Active mission request
                </span>
                <h1
                  className="mb-4 font-[family-name:var(--font-assign-headline)] text-3xl font-extrabold tracking-tight text-[#191c1d] sm:text-4xl dark:text-foreground"
                  style={{ fontFamily: "var(--font-assign-headline), sans-serif" }}
                >
                  {missionTitle}
                </h1>
                <div className="flex flex-wrap gap-6 sm:gap-8">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#008B8B]/15 text-[#006767] dark:text-primary">
                      <Scale className="size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-muted-foreground">
                        Payload weight
                      </p>
                      <p className="font-[family-name:var(--font-assign-headline)] text-lg font-bold dark:text-foreground">
                        {missionPayload}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#008B8B]/15 text-[#006767] dark:text-primary">
                      <Navigation className="size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-muted-foreground">
                        Target range
                      </p>
                      <p className="font-[family-name:var(--font-assign-headline)] text-lg font-bold dark:text-foreground">
                        {missionRange}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-800 dark:text-orange-200">
                      <Zap className="size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-muted-foreground">
                        Urgency level
                      </p>
                      <p className="font-[family-name:var(--font-assign-headline)] text-lg font-bold text-orange-900 dark:text-orange-100">
                        {missionUrgency}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-muted-foreground">
                  Destination
                </span>
                <div className="flex items-center gap-2 text-[#006767] dark:text-primary">
                  <MapPin className="size-5 shrink-0" aria-hidden />
                  <span className="font-semibold">{missionDropoff}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compatible drones + Available pilots — equal columns, sticky pilots on wide viewports */}
        <div className="grid grid-cols-1 items-start gap-x-0 gap-y-10 border-t border-slate-200/80 pt-10 lg:grid-cols-2 lg:gap-x-10 lg:border-t-0 lg:pt-0 xl:gap-x-12 dark:border-border">
          <section
            aria-labelledby="compatible-drones-heading"
            className="min-w-0"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <h2
                id="compatible-drones-heading"
                className="font-[family-name:var(--font-assign-headline)] text-xl font-bold tracking-tight dark:text-foreground"
                style={{ fontFamily: "var(--font-assign-headline), sans-serif" }}
              >
                Compatible drones
              </h2>
              <span className="shrink-0 rounded-full bg-[#e1e3e4] px-3 py-1 text-xs font-medium text-slate-600 dark:bg-muted dark:text-muted-foreground">
                {fleetLoading ? "…" : `${dronesForUi.length} found`}
              </span>
            </div>
            {fleetLoading ? (
              <p className="text-sm text-muted-foreground">Loading drones…</p>
            ) : dronesForUi.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-muted-foreground dark:border-border dark:bg-card/50">
                No drones found in Pilot Profile yet. Add drone details on the
                pilot profile page and they will appear here.
              </p>
            ) : (
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
              {dronesForUi.map((drone) => {
                const selected = selectedDroneId === drone.id;
                const best = drone.matchPercent >= 90;
                return (
                  <div
                    key={drone.id}
                    onClick={() => setSelectedDroneId(drone.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedDroneId(drone.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select drone ${drone.model}`}
                    className={cn(
                      "group relative overflow-hidden rounded-xl text-left shadow-sm transition-all hover:shadow-md",
                      selected
                        ? "border-2 border-[#008B8B] ring-2 ring-[#008B8B]/15"
                        : "border border-slate-200/80 dark:border-border",
                      "bg-white dark:bg-card"
                    )}
                  >
                    {best ? (
                      <div className="absolute left-3 top-3 z-10">
                        <span className="rounded bg-[#008B8B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-white">
                          Best match
                        </span>
                      </div>
                    ) : null}
                    <div className="relative h-40 overflow-hidden bg-[#e7e8e9] dark:bg-muted">
                      <Image
                        src={drone.imageUrl}
                        alt=""
                        fill
                        className={cn(
                          "object-cover transition-transform duration-500 group-hover:scale-105",
                          drone.status === "charging" && "opacity-80"
                        )}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 360px"
                      />
                    </div>
                    <div className="p-4">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3
                          className="font-[family-name:var(--font-assign-headline)] text-lg font-bold dark:text-foreground"
                          style={{
                            fontFamily: "var(--font-assign-headline), sans-serif",
                          }}
                        >
                          {drone.model}
                        </h3>
                        <button
                          type="button"
                          aria-label={`Delete ${drone.model}`}
                          disabled={deletingDroneId === drone.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteDrone(drone);
                          }}
                          className="inline-flex items-center gap-1 rounded border border-red-400 px-2 py-1 text-[10px] font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/70 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          {deletingDroneId === drone.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                      <p className="mb-4 text-xs font-medium text-slate-600 dark:text-muted-foreground">
                        {drone.subtitle}
                      </p>
                      <p className="mb-3 text-[11px] text-slate-500 dark:text-muted-foreground">
                        Pilot:{" "}
                        <span className="font-semibold text-slate-700 dark:text-foreground">
                          {drone.pilotName}
                        </span>{" "}
                        · ID:{" "}
                        <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-foreground">
                          {drone.pilotBadgeId}
                        </span>
                      </p>
                      <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-[#006767] dark:text-primary">
                        Mission fit: {drone.matchNote}
                      </p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        <div className="flex items-center gap-2">
                          <Package
                            className={cn(
                              "size-[18px] shrink-0",
                              best ? "text-[#006767]" : "text-slate-400"
                            )}
                          />
                          <span className="text-xs font-semibold">
                            {drone.cargoShort}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation
                            className={cn(
                              "size-[18px] shrink-0",
                              best ? "text-[#006767]" : "text-slate-400"
                            )}
                          />
                          <span className="text-xs font-semibold">
                            {drone.rangeShort}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-border">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e7e8e9] dark:bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                drone.status === "charging"
                                  ? "bg-orange-600"
                                  : "bg-[#008B8B]"
                              )}
                              style={{ width: `${drone.matchPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums">
                            {drone.matchPercent}%
                          </span>
                        </div>
                        {drone.status === "charging" ? (
                          <span className="text-[10px] font-bold uppercase text-orange-800 dark:text-orange-200">
                            Charging
                          </span>
                        ) : (
                          <CheckCircle2
                            className="size-5 shrink-0 text-[#008B8B]"
                            aria-hidden
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>

          <section
            aria-labelledby="available-pilots-heading"
            className="min-w-0 border-t border-slate-200/80 pt-10 lg:sticky lg:top-24 lg:z-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0 xl:pl-12 dark:border-border"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <h2
                id="available-pilots-heading"
                className="font-[family-name:var(--font-assign-headline)] text-xl font-bold tracking-tight dark:text-foreground"
                style={{ fontFamily: "var(--font-assign-headline), sans-serif" }}
              >
                Available pilots
              </h2>
              <span className="shrink-0 rounded-full bg-[#e1e3e4] px-3 py-1 text-xs font-medium text-slate-600 dark:bg-muted dark:text-muted-foreground">
                {fleetLoading ? "…" : `${pilotsForUi.length} in directory`}
              </span>
            </div>
            {fleetLoading ? (
              <p className="text-sm text-muted-foreground">Loading pilots…</p>
            ) : pilotsForUi.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-muted-foreground dark:border-border dark:bg-card/50">
                No pilots in the database. Register pilots via{" "}
                <span className="font-semibold">Pilot registration</span> or
                insert rows into the <span className="font-mono text-xs">pilots</span>{" "}
                table.
              </p>
            ) : (
            <div className="flex flex-col gap-4">
              {pilotsForUi.map((pilot) => {
                const selected = selectedPilotId === pilot.id;
                const optimal = pilot.id === optimalPilotId;
                return (
                  <button
                    key={pilot.id}
                    type="button"
                    onClick={() => setSelectedPilotId(pilot.id)}
                    className={cn(
                      "relative flex w-full items-center gap-4 rounded-xl p-4 text-left shadow-sm transition-colors",
                      selected
                        ? cn(glassCard, "border-2 border-[#008B8B]")
                        : "border border-slate-200/80 bg-white hover:border-[#008B8B]/50 hover:shadow-md dark:border-border dark:bg-card dark:hover:border-primary/50"
                    )}
                  >
                    {optimal && selected ? (
                      <span className="absolute -right-1 -top-1 rounded-full bg-[#008B8B] px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                        Optimal
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        "flex size-16 shrink-0 items-center justify-center rounded-lg",
                        selected
                          ? "bg-[#008B8B]/15 text-[#006767] dark:bg-primary/20 dark:text-primary"
                          : "bg-slate-200/90 text-slate-500 dark:bg-muted dark:text-muted-foreground"
                      )}
                      aria-hidden
                    >
                      <User
                        className="size-9 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3
                          className="font-[family-name:var(--font-assign-headline)] text-base font-bold dark:text-foreground"
                          style={{
                            fontFamily: "var(--font-assign-headline), sans-serif",
                          }}
                        >
                          {pilot.name}
                        </h3>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-bold",
                            optimal
                              ? "bg-[#008B8B]/10 text-[#006767] dark:text-primary"
                              : "bg-[#e7e8e9] text-slate-700 dark:bg-muted dark:text-foreground"
                          )}
                        >
                          {pilot.certBadge}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#006767] dark:text-primary">
                        Match {pilot.matchScore}% · {pilot.matchNote}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <User
                            className="size-4 shrink-0 text-slate-400"
                            aria-hidden
                          />
                          <span className="text-xs text-slate-600 dark:text-muted-foreground">
                            {pilot.hoursShort}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserRound
                            className="size-4 shrink-0 text-slate-400"
                            aria-hidden
                          />
                          <span className="text-xs text-slate-600 dark:text-muted-foreground">
                            {pilot.yearsExp} yrs exp.
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            )}
          </section>
        </div>

        {/* Last completed + details */}
        {latestCompleted ? (
          <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-border dark:bg-card/80">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Last Assigned
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {userRequestQueueDisplayId(latestCompleted.requestRef)} ·{" "}
                  {latestCompleted.customer}
                </p>
                <p className="text-sm text-muted-foreground">
                  {latestCompleted.pilotName} · {latestCompleted.droneModel}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#008B8B] px-4 py-2 text-sm font-bold text-[#008B8B] transition hover:bg-[#008B8B] hover:text-white"
                onClick={() => setHistoryDetailIndex(latestCompletedIndex)}
              >
                <Eye className="size-4" aria-hidden />
                View details
              </button>
            </div>
          </div>
        ) : null}

        {/* Mobile sticky CTA */}
        <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#2e3132] p-4 text-white shadow-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 shrink-0 text-teal-300" />
              <span className="text-sm font-medium">Assignment ready</span>
            </div>
            <button
              type="button"
              disabled={assignActionDisabled}
              className="rounded-lg bg-[#008B8B] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              onClick={() => {
                if (!assignActionDisabled) setAssignedDialogOpen(true);
              }}
            >
              Launch
            </button>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Confirm dialog */}
      {assignedDialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-mission-dialog-title"
          aria-describedby="assign-mission-dialog-desc"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/35 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={() => setAssignedDialogOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-border bg-card shadow-xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-6 sm:px-10 sm:py-8">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 sm:size-14">
                  <CheckCircle2 className="size-7 sm:size-8" strokeWidth={2} />
                </span>
                <h2
                  id="assign-mission-dialog-title"
                  className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
                >
                  Confirm assignment
                </h2>
              </div>
              <p
                id="assign-mission-dialog-desc"
                className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base"
              >
                For request{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {currentRequest
                    ? userRequestQueueDisplayId(currentRequest.requestRef)
                    : ""}
                </span>
                , assign{" "}
                <span className="font-semibold text-foreground">
                  {selectedPilot?.name ?? "—"}
                </span>{" "}
                with{" "}
                <span className="font-semibold text-foreground">
                  {selectedDrone?.model ?? "—"}
                </span>
                ?
              </p>
              <div className="mt-5 grid gap-4 rounded-2xl border border-border/90 bg-gradient-to-b from-muted/40 to-muted/20 p-4 sm:grid-cols-2 sm:gap-0 sm:p-0 sm:py-5">
                <div className="min-w-0 sm:border-r sm:border-border/90 sm:px-6">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Pilot
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-foreground sm:text-base">
                    {selectedPilot?.name ?? "—"}
                  </p>
                </div>
                <div className="min-w-0 border-t border-border/90 pt-4 sm:border-t-0 sm:px-6 sm:pt-0">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Drone
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-foreground sm:text-base">
                    {selectedDrone?.model ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border/80 bg-muted/40 px-6 py-4 sm:gap-4 sm:px-10 sm:py-5">
              <button
                type="button"
                disabled={!selectedPilot || !selectedDrone}
                className="inline-flex min-w-[6rem] items-center justify-center rounded-full border-2 border-[#008B8B] bg-card px-5 py-2 text-sm font-bold text-[#008B8B] transition hover:bg-[#008B8B]/5 active:scale-[0.98] disabled:opacity-50 sm:min-w-[6.5rem] sm:px-6"
                onClick={confirmAssignment}
              >
                OK
              </button>
              <button
                type="button"
                className="inline-flex min-w-[6rem] items-center justify-center rounded-full border-2 border-border bg-card px-5 py-2 text-sm font-bold text-foreground transition hover:border-muted-foreground/50 hover:bg-muted/50 active:scale-[0.98] sm:min-w-[6.5rem] sm:px-6"
                onClick={() => setAssignedDialogOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {historyDetail ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assignment-history-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/35 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={() => setHistoryDetailIndex(null)}
          />
          <div
            className="relative z-10 w-full max-w-2xl rounded-2xl border-2 border-border bg-card px-6 py-5 shadow-xl ring-1 ring-black/5 sm:px-12 sm:py-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="assignment-history-title"
              className="text-sm font-bold uppercase tracking-wider text-muted-foreground sm:text-base"
            >
              Details
            </h2>
            <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/60 p-4 sm:p-5">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Request ID</span>
                  <span className="font-mono font-semibold">
                    {userRequestQueueDisplayId(historyDetail.requestRef)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Title</span>
                  <span className="text-right font-medium">
                    {historyDetail.customer}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Pilot</span>
                  <span className="font-medium">{historyDetail.pilotName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Drone</span>
                  <span className="font-medium">{historyDetail.droneModel}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                className="inline-flex min-w-[7rem] items-center justify-center rounded-full border-2 border-[#008B8B] bg-card px-6 py-2.5 text-sm font-bold text-[#008B8B] transition hover:bg-[#008B8B]/5"
                onClick={() => setHistoryDetailIndex(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
