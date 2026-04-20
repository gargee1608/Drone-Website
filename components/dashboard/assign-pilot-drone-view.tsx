"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Drone,
  Eye,
  MapPin,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { tableRequestId } from "@/components/dashboard/user-request-table";
import {
  loadCompletedAssignments,
  normalizeToLatestCompleted,
  saveCompletedAssignments,
  type CompletedAssignment,
} from "@/lib/completed-assignments";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import {
  assignQueueValidRefsForPrune,
  DEMO_ASSIGN_BRIDGE_STORAGE_KEY,
  DEMO_ASSIGN_BRIDGE_UPDATED_EVENT,
  mergeAssignPilotDisplayQueue,
} from "@/lib/assign-demo-bridge";
import {
  USER_REQUESTS_STORAGE_KEY,
  USER_REQUESTS_UPDATED_EVENT,
  userRequestQueueDisplayId,
  type AssignPilotRequestRow,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import {
  appendAssignPilotDoneRef,
  loadAssignPilotDoneRefs,
  pruneAssignPilotDoneRefs,
} from "@/lib/assign-pilot-done-refs";
import { cn } from "@/lib/utils";

const pilots = [
  {
    id: "sarah",
    name: "Capt. Sarah Chen",
    level: 5,
    tags: ["Certified", "Available"] as const,
    hours: "2.4k Flight Hours",
    pilotId: "PLT-4401",
    sector: "Bay Area North",
    clearance: "Class A · Night OK",
  },
  {
    id: "marcus",
    name: "Marcus Thorne",
    level: 4,
    tags: ["Tactical", "Available"] as const,
    hours: "1.8k Flight Hours",
    pilotId: "PLT-8821",
    sector: "Stratosphere-1 Hub",
    clearance: "Class B · Cargo",
  },
  {
    id: "elena",
    name: "Elena Vance",
    level: 5,
    tags: ["Medical", "Available"] as const,
    hours: "1,240 Flight Hours",
    pilotId: "PLT-1192",
    sector: "Medical Corridor",
    clearance: "Class A · MEDEVAC",
  },
  {
    id: "james",
    name: "James Okonkwo",
    level: 3,
    tags: ["Regional", "Available"] as const,
    hours: "980 Flight Hours",
    pilotId: "PLT-3308",
    sector: "Pacific Rim Route",
    clearance: "Class C · Regional",
  },
] as const;

const drones = [
  {
    id: "skyfreight",
    model: "SkyFreight M-1",
    sn: "4409-TX",
    battery: 85,
    cargo: "15kg",
    icon: "plane" as const,
    maxRange: "118 km",
    estFlight: "38 min",
    lastInspection: "Mar 28, 2026",
    firmware: "FW 4.1.0",
  },
  {
    id: "atlas",
    model: "Atlas Heavy-Lift",
    sn: "8821-HL",
    battery: 92,
    cargo: "50kg",
    icon: "heavy" as const,
    maxRange: "95 km",
    estFlight: "52 min",
    lastInspection: "Apr 1, 2026",
    firmware: "FW 3.9.2",
  },
  {
    id: "aeroscout",
    model: "AeroScout V2",
    sn: "2214-AS",
    battery: 78,
    cargo: "8kg",
    icon: "plane" as const,
    maxRange: "64 km",
    estFlight: "28 min",
    lastInspection: "Mar 15, 2026",
    firmware: "FW 4.0.8",
  },
  {
    id: "cargoline",
    model: "CargoLine XL",
    sn: "9932-CX",
    battery: 88,
    cargo: "35kg",
    icon: "heavy" as const,
    maxRange: "102 km",
    estFlight: "45 min",
    lastInspection: "Mar 22, 2026",
    firmware: "FW 3.8.2",
  },
] as const;

const optionScrollClass =
  "max-h-[min(32rem,58svh)] min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-2 [scrollbar-color:rgb(203_213_225)_rgb(241_245_249)] [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-200/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500";

const requestDetailsHeadingClass =
  "text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs";

/** Main modal title — above subsection headings. */
const assignedDetailsModalTitleClass =
  "text-sm font-bold uppercase tracking-wider text-muted-foreground sm:text-base";

/** Request Details / Pilot & Drone Details — slightly larger than row labels. */
const assignedDetailsGroupHeadingClass =
  "text-xs font-bold uppercase tracking-wider text-muted-foreground sm:text-sm";

/** Stable `id` for Request Details cards (for deep-link scroll from User Request accept). */
function assignRequestDetailDomId(requestRef: string): string {
  return `assign-req-${requestRef.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function DetailRow({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "lg" | "lgRequest";
}) {
  const valueClass =
    variant === "lgRequest"
      ? cn(
          "min-w-0 text-right font-bold tracking-wider text-muted-foreground",
          "text-[10px] sm:text-xs"
        )
      : "min-w-0 text-right font-medium text-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 leading-snug",
        variant === "lg" || variant === "lgRequest"
          ? "text-xs sm:text-sm"
          : "text-[10px] sm:text-[11px]"
      )}
    >
      <span
        className={cn(
          "shrink-0",
          variant === "lgRequest"
            ? requestDetailsHeadingClass
            : variant === "lg"
              ? "font-medium text-muted-foreground"
              : "font-medium text-muted-foreground/70"
        )}
      >
        {label}
      </span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

export function AssignPilotDroneView() {
  const [selectedPilotId, setSelectedPilotId] = useState<string>("marcus");
  const [selectedDroneId, setSelectedDroneId] = useState<string>("atlas");
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

  /** Latest completion card + prune; `doneRefs` tracks every assigned request ID for the list. */
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

  /** Scroll to the request opened via `/dashboard/assign?focus=…` (e.g. after User Request accept). */
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

  /** First mission not yet marked assigned in local tracking (FIFO). */
  const nextPendingRequest = pendingRequests[0] ?? null;
  /**
   * Pilot/drone assignment target: next pending, or the head of the queue so
   * Assign Mission stays usable even if done-refs were over-eager (e.g. stale storage).
   */
  const currentRequest =
    nextPendingRequest ?? (assignQueue.length > 0 ? assignQueue[0]! : null);
  const noUserRequests = assignQueue.length === 0;
  /** True when every queue item is already marked assigned (for the status chip only). */
  const queueFullyAssigned =
    assignQueue.length > 0 && pendingRequests.length === 0;

  const selectedPilot = useMemo(
    () => pilots.find((p) => p.id === selectedPilotId) ?? pilots[0],
    [selectedPilotId]
  );
  const selectedDrone = useMemo(
    () => drones.find((d) => d.id === selectedDroneId) ?? drones[0],
    [selectedDroneId]
  );
  const historyDetail =
    historyDetailIndex !== null
      ? completedAssignments[historyDetailIndex]
      : null;

  /** Only missions not yet marked assigned — hide e.g. #RQ-4029 after assignment. */
  const pendingForRequestDetails = useMemo(
    () =>
      assignQueue.filter((r) => !completedRequestRefs.has(r.requestRef)),
    [assignQueue, completedRequestRefs]
  );

  const requestDetailsRows = pendingForRequestDetails;

  const renderRequestCard = useCallback(
    (req: AssignPilotRequestRow) => {
      const isNext =
        nextPendingRequest !== null && req.id === nextPendingRequest.id;
      const isAssigned = completedRequestRefs.has(req.requestRef);
      const requestIdLabel = req.requestRef.startsWith("demo-")
        ? tableRequestId({
            key: req.requestRef,
            title: req.customer,
            badge: "NORMAL",
            badgeClass: "",
            barColor: "",
            desc: "",
          } as UserRequestAdminRow)
        : userRequestQueueDisplayId(req.requestRef);
      return (
        <li
          id={assignRequestDetailDomId(req.requestRef)}
          key={req.id}
          className={cn(
            "rounded-xl border bg-card/90 p-4 shadow-sm sm:p-5",
            isNext && "border-[#008B8B] ring-2 ring-[#008B8B]/15",
            !isNext && "border-border/90",
            isAssigned && !isNext && "opacity-[0.92]"
          )}
        >
          {!isAssigned && isNext ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#008B8B] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Next to assign
              </span>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <div className="rounded-xl bg-muted/50 px-4 py-3 lg:border-r lg:border-border lg:pr-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Request ID
              </span>
              <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                {requestIdLabel}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 px-4 py-3 lg:border-r lg:border-border lg:pr-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Title
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {req.customer}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 px-4 py-3 lg:border-r lg:border-border lg:pr-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Service
              </span>
              <p className="mt-1 text-sm font-semibold text-[#006195]">
                {req.service}
              </p>
            </div>
            <div className="flex gap-3 rounded-xl bg-muted/50 px-4 py-3 sm:col-span-2 lg:col-span-1">
              <MapPin
                className="mt-0.5 size-5 shrink-0 text-[#008B8B]"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground/70">
                  Drop-off Location
                </p>
                <p className="text-sm font-bold text-foreground">
                  {req.dropoff}
                </p>
                <p className="text-xs text-muted-foreground">{req.sectorLine}</p>
              </div>
            </div>
          </div>
        </li>
      );
    },
    [nextPendingRequest, completedRequestRefs]
  );

  /** At most one row; storage keeps only the latest User Request–backed completion. */
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-4">
      <section className="flex flex-col gap-4 border-b border-border/80 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className={ADMIN_PAGE_TITLE_CLASS}>
              Assign Pilot &amp; Drone
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              disabled={noUserRequests}
              className="inline-flex items-center justify-center rounded-full border-2 border-[#008B8B] bg-card px-8 py-2.5 text-sm font-bold text-[#008B8B] shadow-sm transition hover:bg-[#008B8B]/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (!noUserRequests) setAssignedDialogOpen(true);
              }}
            >
              Assign Mission
            </button>
          </div>
        </div>
      </section>

      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div
          className="absolute left-0 top-0 h-full w-1 bg-[#008B8B]"
          aria-hidden
        />
        <div className="p-6 pl-7 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Request Details
              </h2>
            </div>
            {noUserRequests ? (
              <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                No requests
              </span>
            ) : queueFullyAssigned ? null : (
              <span className="rounded-full bg-[#008B8B]/14 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0a3030] dark:text-primary">
                {pendingRequests.length} pending / {assignQueue.length}
              </span>
            )}
          </div>

          <ul className="space-y-4" aria-label="User mission requests">
            {requestDetailsRows.map((req) => renderRequestCard(req))}
          </ul>
          {assignQueue.length > 0 && requestDetailsRows.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              All missions in the queue are assigned. Accept another request
              from{" "}
              <Link
                href="/dashboard/user-requests"
                className="font-semibold text-[#008B8B] underline-offset-2 hover:underline"
              >
                User Request
              </Link>{" "}
              to add one here.
            </p>
          ) : null}
          {assignQueue.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No accepted requests yet. Review submissions on the{" "}
              <Link
                href="/dashboard/user-requests"
                className="font-semibold text-[#008B8B] underline-offset-2 hover:underline"
              >
                User Request
              </Link>{" "}
              page and accept one to assign it here.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-foreground">Mission</h2>
        {latestCompleted ? (
          <ul className="space-y-3">
            <li
              className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {userRequestQueueDisplayId(latestCompleted.requestRef)}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {latestCompleted.customer}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  <span className="font-medium text-foreground">
                    {latestCompleted.pilotName}
                  </span>
                  <span className="text-muted-foreground/70"> &amp; </span>
                  <span className="font-medium text-foreground">
                    {latestCompleted.droneModel}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-[#008B8B] bg-card px-4 py-2 text-sm font-bold text-[#008B8B] transition hover:bg-[#008B8B] hover:text-white"
                onClick={() => setHistoryDetailIndex(latestCompletedIndex)}
              >
                <Eye className="size-4" aria-hidden />
                View details
              </button>
            </li>
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            No mission yet. Complete using{" "}
            <span className="font-semibold text-foreground">Assign Mission</span>{" "}
            or the bar below after selecting a pilot and drone.
          </p>
        )}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-8">
        <section className="flex min-h-0 w-full min-w-0 flex-col rounded-2xl border-2 border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex shrink-0 items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]"
              aria-hidden
            >
              <User className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground">Select Pilot</h2>
              <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
                Click a row to select
              </p>
            </div>
          </div>

          <div
            className={optionScrollClass}
            role="listbox"
            aria-label="Available pilots"
            aria-multiselectable={false}
          >
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Pilot
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Level
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tags
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Pilot ID
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Sector
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Clearance
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Hours
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {pilots.map((pilot) => {
                    const selected = selectedPilotId === pilot.id;
                    return (
                      <tr
                        key={pilot.id}
                        role="option"
                        tabIndex={0}
                        aria-selected={selected}
                        onClick={() => setSelectedPilotId(pilot.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPilotId(pilot.id);
                          }
                        }}
                        className={cn(
                          "cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/35",
                          selected
                            ? "bg-[#008B8B]/10 ring-1 ring-inset ring-[#008B8B]/25"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <td className="px-3 py-3 font-semibold text-foreground">
                          {pilot.name}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-foreground">
                          {pilot.level}
                        </td>
                        <td className="max-w-[10rem] px-3 py-3 text-xs text-muted-foreground">
                          {pilot.tags.join(", ")}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-foreground">
                          {pilot.pilotId}
                        </td>
                        <td className="max-w-[9rem] px-3 py-3 text-xs text-muted-foreground">
                          {pilot.sector}
                        </td>
                        <td className="max-w-[11rem] px-3 py-3 text-xs text-muted-foreground">
                          {pilot.clearance}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                          {pilot.hours}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              selected ? "text-[#008B8B]" : "text-[#008B8B]/75"
                            )}
                          >
                            {selected ? "Selected" : "Select"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 w-full min-w-0 flex-col rounded-2xl border-2 border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex shrink-0 items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]"
              aria-hidden
            >
              <Drone className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground">Select Drone</h2>
              <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
                Click a row to select
              </p>
            </div>
          </div>

          <div
            className={optionScrollClass}
            role="listbox"
            aria-label="Available drones"
            aria-multiselectable={false}
          >
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Model
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      S/N
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Battery
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Cargo
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Range / flight
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Last inspection
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Firmware
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {drones.map((drone) => {
                    const selected = selectedDroneId === drone.id;
                    return (
                      <tr
                        key={drone.id}
                        role="option"
                        tabIndex={0}
                        aria-selected={selected}
                        onClick={() => setSelectedDroneId(drone.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedDroneId(drone.id);
                          }
                        }}
                        className={cn(
                          "cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/35",
                          selected
                            ? "bg-[#008B8B]/10 ring-1 ring-inset ring-[#008B8B]/25"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <td className="px-3 py-3 font-semibold text-foreground">
                          {drone.model}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-foreground">
                          {drone.sn}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-foreground">
                          {drone.battery}%
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                          {drone.cargo}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                          {drone.maxRange} · {drone.estFlight}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                          {drone.lastInspection}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-muted-foreground">
                          {drone.firmware}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              selected ? "text-[#008B8B]" : "text-[#008B8B]/75"
                            )}
                          >
                            {selected ? "Selected" : "Select"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

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
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 sm:size-14"
                  aria-hidden
                >
                  <CheckCircle2 className="size-7 sm:size-8" strokeWidth={2} />
                </span>
                <h2
                  id="assign-mission-dialog-title"
                  className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
                >
                  Assign Mission
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
                , pilot{" "}
                <span className="text-xs font-semibold text-foreground sm:text-sm">
                  {selectedPilot.name}
                </span>{" "}
                and drone{" "}
                <span className="text-xs font-semibold text-foreground sm:text-sm">
                  {selectedDrone.model}
                </span>{" "}
                are selected for this mission.
              </p>
              <div className="mt-5 grid gap-4 rounded-2xl border border-border/90 bg-gradient-to-b from-muted/40 to-muted/20 p-4 sm:grid-cols-2 sm:gap-0 sm:p-0 sm:py-5">
                <div className="min-w-0 sm:border-r sm:border-border/90 sm:px-6">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Pilot Name
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
              className={cn("block text-left", assignedDetailsModalTitleClass)}
            >
              Details
            </h2>
            <div className="mt-4 space-y-3.5 rounded-xl border border-border bg-muted/60 p-4 sm:p-5">
              <div className="space-y-2.5">
                <p className={cn(assignedDetailsGroupHeadingClass, "text-center")}>
                  Request Details
                </p>
                <DetailRow
                  variant="lgRequest"
                  label="Request ID"
                  value={userRequestQueueDisplayId(historyDetail.requestRef)}
                />
                <DetailRow
                  variant="lgRequest"
                  label="Title"
                  value={historyDetail.customer}
                />
                <DetailRow
                  variant="lgRequest"
                  label="Service"
                  value={historyDetail.service}
                />
                <DetailRow
                  variant="lgRequest"
                  label="Drop-off"
                  value={historyDetail.dropoff}
                />
                <DetailRow
                  variant="lgRequest"
                  label="Area"
                  value={historyDetail.sectorLine}
                />
              </div>
              <div className="space-y-2.5 border-t border-border pt-3">
                <p className={cn(assignedDetailsGroupHeadingClass, "text-center")}>
                  Pilot &amp; Drone Details
                </p>
                <DetailRow
                  variant="lgRequest"
                  label="Pilot Name"
                  value={historyDetail.pilotName}
                />
                <DetailRow
                  variant="lgRequest"
                  label="Pilot ID"
                  value={historyDetail.pilotBadgeId}
                />
                <DetailRow
                  variant="lgRequest"
                  label="Drone"
                  value={historyDetail.droneModel}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                className="inline-flex min-w-[7rem] items-center justify-center rounded-full border-2 border-[#008B8B] bg-card px-6 py-2.5 text-sm font-bold text-[#008B8B] transition hover:bg-[#008B8B]/5 sm:min-w-[7rem] sm:px-7 sm:text-base"
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
