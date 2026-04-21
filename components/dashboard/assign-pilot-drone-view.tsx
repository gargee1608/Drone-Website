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
  DEMO_ASSIGN_BRIDGE_STORAGE_KEY,
  DEMO_ASSIGN_BRIDGE_UPDATED_EVENT,
  mergeAssignPilotDisplayQueue,
} from "@/lib/assign-demo-bridge";
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
};

const PILOTS: readonly PilotCard[] = [
  {
    id: "elena",
    name: "Capt. Elena Vance",
    level: 5,
    tags: ["Medical", "Available"],
    hours: "1,240 Flight Hours",
    hoursShort: "1,240 hrs",
    yearsExp: 8,
    pilotId: "PLT-1192",
    sector: "Medical Corridor",
    clearance: "Class A · MEDEVAC",
    certBadge: "L5 Heavy Duty",
  },
  {
    id: "marcus",
    name: "Lt. Marcus Thorne",
    level: 4,
    tags: ["Tactical", "Available"],
    hours: "1.8k Flight Hours",
    hoursShort: "1.8k hrs",
    yearsExp: 5,
    pilotId: "PLT-8821",
    sector: "Stratosphere-1 Hub",
    clearance: "Class B · Cargo",
    certBadge: "L4 Standard",
  },
  {
    id: "sarah",
    name: "Cmdr. Sarah Chen",
    level: 5,
    tags: ["Certified", "Available"],
    hours: "2.4k Flight Hours",
    hoursShort: "2,100 hrs",
    yearsExp: 12,
    pilotId: "PLT-4401",
    sector: "Bay Area North",
    clearance: "Class A · Night OK",
    certBadge: "L5 Heavy Duty",
  },
  {
    id: "james",
    name: "James Okonkwo",
    level: 3,
    tags: ["Regional", "Available"],
    hours: "980 Flight Hours",
    hoursShort: "980 hrs",
    yearsExp: 4,
    pilotId: "PLT-3308",
    sector: "Pacific Rim Route",
    clearance: "Class C · Regional",
    certBadge: "L3 Regional",
  },
] as const;

const DRONES: readonly DroneCard[] = [
  {
    id: "skyfreight",
    model: "SkyFreight M-1",
    sn: "4409-TX",
    battery: 94,
    cargo: "15kg",
    cargoShort: "15kg Cap.",
    maxRange: "118 km",
    rangeShort: "118km Range",
    estFlight: "38 min",
    lastInspection: "Mar 28, 2026",
    firmware: "FW 4.1.0",
    subtitle: "Long-Range Specialist",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBUwp96u9ZV1ADoQbYT0czhoCurAizLfWAV5eEuSe-D6hxClmXwSzGbSo5Q8wGf0joYL2By0zmP0EnPjDDQsYLDBmD9EddwiCDKJkFOfyHGmDUR9s1kc0TnDnsz3kK81Bz0AJVi_qY6e9cE3yPcJDKoA1U0C0BZWWFSwsF9hRv2SBqWS6ix3iOCocopPC6gB40scij5nAguHYLQPA2jOC5Xf47fyNcn6gdO3zGZRqx5KpkS6GXvQJqSoBpzgesamI0Le4ZXnSH-MUUB",
    matchPercent: 94,
    status: "ready",
  },
  {
    id: "atlas",
    model: "Atlas Heavy-Lift",
    sn: "8821-HL",
    battery: 45,
    cargo: "50kg",
    cargoShort: "50kg Cap.",
    maxRange: "95 km",
    rangeShort: "95km Range",
    estFlight: "52 min",
    lastInspection: "Apr 1, 2026",
    firmware: "FW 3.9.2",
    subtitle: "Heavy Lift Platform",
    imageUrl: "/drones/atlas-heavy-lift.png",
    matchPercent: 45,
    status: "charging",
  },
  {
    id: "aeroscout",
    model: "AeroScout V2",
    sn: "2214-AS",
    battery: 78,
    cargo: "8kg",
    cargoShort: "8kg Cap.",
    maxRange: "64 km",
    rangeShort: "64km Range",
    estFlight: "28 min",
    lastInspection: "Mar 15, 2026",
    firmware: "FW 4.0.8",
    subtitle: "Survey & inspection",
    imageUrl:
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80",
    matchPercent: 72,
    status: "ready",
  },
  {
    id: "cargoline",
    model: "CargoLine XL",
    sn: "9932-CX",
    battery: 88,
    cargo: "35kg",
    cargoShort: "35kg Cap.",
    maxRange: "102 km",
    rangeShort: "102km Range",
    estFlight: "45 min",
    lastInspection: "Mar 22, 2026",
    firmware: "FW 3.8.2",
    subtitle: "Mid-weight logistics",
    imageUrl:
      "https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1200&q=80",
    matchPercent: 81,
    status: "ready",
  },
] as const;

function parseKgFromAssignRow(req: AssignPilotRequestRow): string {
  const m = `${req.sectorLine} ${req.customer} ${req.dropoff}`.match(
    /([\d.]+)\s*kg\b/i
  );
  return m ? `${m[1]} kg` : "—";
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

function assignRequestDetailDomId(requestRef: string): string {
  return `assign-req-${requestRef.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

const glassCard =
  "bg-white/70 backdrop-blur-xl dark:bg-card/80 border border-white/50 shadow-[0px_12px_32px_rgba(25,28,29,0.06)]";

export function AssignPilotDroneView() {
  const [selectedPilotId, setSelectedPilotId] = useState<string>("elena");
  const [selectedDroneId, setSelectedDroneId] = useState<string>("skyfreight");
  const [assignQueue, setAssignQueue] = useState<AssignPilotRequestRow[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<
    CompletedAssignment[]
  >([]);
  const [assignedDialogOpen, setAssignedDialogOpen] = useState(false);
  const [historyDetailIndex, setHistoryDetailIndex] = useState<number | null>(
    null
  );
  const [doneRefs, setDoneRefs] = useState<string[]>([]);

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
    const onStorage = (e: StorageEvent) => {
      if (
        e.key !== USER_REQUESTS_STORAGE_KEY &&
        e.key !== DEMO_ASSIGN_BRIDGE_STORAGE_KEY
      ) {
        return;
      }
      syncAssignQueue();
      syncCompletedAssignments();
    };
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, onUserRequestsUpdated);
    window.addEventListener(DEMO_ASSIGN_BRIDGE_UPDATED_EVENT, onDemoBridgeUpdated);
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

  const selectedPilot = useMemo(
    () => PILOTS.find((p) => p.id === selectedPilotId) ?? PILOTS[0],
    [selectedPilotId]
  );
  const selectedDrone = useMemo(
    () => DRONES.find((d) => d.id === selectedDroneId) ?? DRONES[0],
    [selectedDroneId]
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

  const confirmAssignment = () => {
    if (!currentRequest) return;
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

  return (
    <div
      className={cn(
        fontWrap,
        "min-w-0 bg-[#f8f9fa] pb-12 pt-4 text-[#191c1d] dark:bg-background dark:text-foreground sm:pt-6"
      )}
    >
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
        {!queueFullyAssigned && !noUserRequests ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={noUserRequests}
              className="rounded-full border-2 border-[#008B8B] bg-white px-5 py-2 text-xs font-bold text-[#008B8B] shadow-sm transition hover:bg-[#008B8B]/5 disabled:opacity-50 dark:bg-card"
              onClick={() => {
                if (!noUserRequests) setAssignedDialogOpen(true);
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
                {DRONES.length} found
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
              {DRONES.map((drone) => {
                const selected = selectedDroneId === drone.id;
                const best = drone.matchPercent >= 90;
                return (
                  <button
                    key={drone.id}
                    type="button"
                    onClick={() => setSelectedDroneId(drone.id)}
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
                      <h3
                        className="mb-1 font-[family-name:var(--font-assign-headline)] text-lg font-bold dark:text-foreground"
                        style={{
                          fontFamily: "var(--font-assign-headline), sans-serif",
                        }}
                      >
                        {drone.model}
                      </h3>
                      <p className="mb-4 text-xs font-medium text-slate-600 dark:text-muted-foreground">
                        {drone.subtitle}
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
                  </button>
                );
              })}
            </div>
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
                Top candidates
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {PILOTS.map((pilot) => {
                const selected = selectedPilotId === pilot.id;
                const optimal = pilot.id === "elena";
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
              disabled={noUserRequests}
              className="rounded-lg bg-[#008B8B] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              onClick={() => {
                if (!noUserRequests) setAssignedDialogOpen(true);
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
                  {selectedPilot.name}
                </span>{" "}
                with{" "}
                <span className="font-semibold text-foreground">
                  {selectedDrone.model}
                </span>
                ?
              </p>
              <div className="mt-5 grid gap-4 rounded-2xl border border-border/90 bg-gradient-to-b from-muted/40 to-muted/20 p-4 sm:grid-cols-2 sm:gap-0 sm:p-0 sm:py-5">
                <div className="min-w-0 sm:border-r sm:border-border/90 sm:px-6">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Pilot
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-foreground sm:text-base">
                    {selectedPilot.name}
                  </p>
                </div>
                <div className="min-w-0 border-t border-border/90 pt-4 sm:border-t-0 sm:px-6 sm:pt-0">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Drone
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-foreground sm:text-base">
                    {selectedDrone.model}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border/80 bg-muted/40 px-6 py-4 sm:gap-4 sm:px-10 sm:py-5">
              <button
                type="button"
                className="inline-flex min-w-[6rem] items-center justify-center rounded-full border-2 border-[#008B8B] bg-card px-5 py-2 text-sm font-bold text-[#008B8B] transition hover:bg-[#008B8B]/5 active:scale-[0.98] sm:min-w-[6.5rem] sm:px-6"
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
