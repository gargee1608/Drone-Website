"use client";

import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Maximize2,
  Rocket,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { AdminKpiCard } from "@/components/dashboard/admin-kpi-card";

import {
  getPilotAssignedMissionCount,
  getPilotCompletedDeliveriesCount,
  updatePilotStatus,
} from "@/app/services/pilotServices";
import { fetchPilotSessionRow } from "@/lib/fetch-pilot-session-row";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";
import {
  displayFlightHoursLikeProfilePage,
  snapshotFlightHoursFromStorage,
} from "@/lib/pilot-profile-flight-hours";
import { jwtPayloadRole, jwtPayloadSub } from "@/lib/pilot-display-name";
import { PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT } from "@/lib/pilot-mission-notifications";
import { PILOT_PROFILE_UPDATED_EVENT } from "@/lib/pilot-profile-snapshot";
import {
  MISSIONS_DB_BROADCAST_CHANNEL,
  MISSIONS_DB_UPDATED_EVENT,
} from "@/lib/user-requests";
import {
  ADMIN_DASH_STAT_CARD_SURFACE,
  DASH_STAT_CARD_SURFACE,
} from "@/lib/admin-dashboard-styles";
import { cn } from "@/lib/utils";

const flightDeck = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-flight-deck",
  weight: ["500", "600", "700"],
});

/** Flight Deck mock — primary blue */
const FD_PRIMARY = "#00418f";

const LIVE_FEED_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDZ0f9uXM7jzeoXxh2c5WuE8cSxxxdPN2Gs-7YcV39DYRuhcq7nb5pD5f6oYdf9b-Gs4sfyX-Xp-yvyzcp0T7XJ7fh1M03lZpLy9ODmqvdX9-Tb-C2_Y8vT-elTvruYtsixaIWB05aJt3XRt0kifxLVtKCocqAngquDMsBzEjmJ-DP26S33wmi7h-ruFGbfJwrkQ6YxbxKinBYuaPoXwJAvKXKIGZt9QCEoFxuyXHaJQCE6YohzPX_zRyQBQQgx_BnAPtxTW2p1hzbN";

type DutyStatus = "ACTIVE" | "INACTIVE";

function mapApiDutyStatus(pilot: Record<string, unknown>): DutyStatus {
  const rawStatus = String(
    pilot.duty_status ?? pilot.dutyStatus ?? pilot.status ?? "ACTIVE"
  ).toUpperCase();
  if (
    rawStatus === "INACTIVE" ||
    rawStatus === "OFFLINE" ||
    rawStatus === "ON_LEAVE"
  ) {
    return "INACTIVE";
  }
  return "ACTIVE";
}

function PilotDutyStatusCard({
  status,
  loading,
  saving,
  onChange,
}: {
  status: DutyStatus;
  loading: boolean;
  saving: boolean;
  onChange: (next: DutyStatus) => void;
}) {
  const active = status === "ACTIVE";
  return (
    <div
      className={cn(
        "admin-kpi-card group relative overflow-hidden cc-glass-card flex items-center justify-between rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5",
        ADMIN_DASH_STAT_CARD_SURFACE
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 opacity-90",
          active
            ? "bg-gradient-to-r from-green-600 to-emerald-400"
            : "bg-gradient-to-r from-amber-500 to-amber-300"
        )}
        aria-hidden
      />
      <div className="min-w-0 pr-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Status
        </p>
        <div className="relative mt-1.5 w-fit max-w-full">
          <select
            id="pilot-deck-duty-status"
            aria-label="Duty status"
            value={status}
            disabled={loading || saving}
            onChange={(e) => onChange(e.target.value as DutyStatus)}
            className={cn(
              "w-fit min-w-[5.5rem] cursor-pointer appearance-none rounded-md border border-border bg-background",
              "py-1 pl-2 pr-7 text-xs font-bold uppercase tracking-wide text-foreground sm:min-w-[6rem] sm:py-1.5 sm:pl-2.5 sm:pr-8 sm:text-sm",
              "outline-none transition hover:border-muted-foreground/25 focus-visible:ring-2 focus-visible:ring-[#008B8B]/25",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground sm:right-2 sm:size-4"
            aria-hidden
          />
        </div>
        <p
          className={cn(
            "mt-1.5 flex items-center gap-1.5 text-xs font-semibold",
            active
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-700 dark:text-amber-400"
          )}
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              active ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
          <span>{saving ? "Saving…" : active ? "On duty" : "Off duty"}</span>
        </p>
      </div>
      <div
        className={cn(
          "shrink-0 rounded-xl p-3 ring-1 ring-black/[0.04] transition-transform duration-300 group-hover:scale-105 dark:ring-white/[0.06]",
          active
            ? "bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/50 dark:to-green-950/20"
            : "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/50 dark:to-amber-950/20"
        )}
      >
        <CheckCircle2
          className={cn(
            "size-6 sm:size-7",
            active
              ? "text-green-700 dark:text-green-400"
              : "text-amber-700 dark:text-amber-300"
          )}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function PilotDashboardView() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>("ACTIVE");
  const [dutyLoading, setDutyLoading] = useState(true);
  const [dutySaving, setDutySaving] = useState(false);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [flightHoursTotal, setFlightHoursTotal] = useState(0);
  /** When true, flight hours came from a resolved `pilots` row (same source as profile API path). */
  const [flightHoursFromPilotRecord, setFlightHoursFromPilotRecord] =
    useState(false);
  const [assignedMissionCount, setAssignedMissionCount] = useState(0);
  const pilotDbIdRef = useRef<string | null>(null);

  const refreshPilotMetrics = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const sub = jwtPayloadSub(token);
    if (!sub) return;
    pilotDbIdRef.current = sub;
    const [row, assignedCount, completedCount] = await Promise.all([
      fetchPilotSessionRow(sub),
      getPilotAssignedMissionCount(sub),
      getPilotCompletedDeliveriesCount(sub),
    ]);
    if (row) {
      setFlightHoursFromPilotRecord(true);
      setDutyStatus(mapApiDutyStatus(row));
      setFlightHoursTotal(
        displayFlightHoursLikeProfilePage(row, {
          preferApiRowWhenPresent: true,
          snapshotFallbackHours: snapshotFlightHoursFromStorage(),
        })
      );
    } else {
      setFlightHoursFromPilotRecord(false);
      setFlightHoursTotal(
        displayFlightHoursLikeProfilePage(null, {
          preferApiRowWhenPresent: false,
          snapshotFallbackHours: snapshotFlightHoursFromStorage(),
        })
      );
    }
    setAssignedMissionCount(assignedCount ?? 0);
    setMissionsCompleted(completedCount ?? 0);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/pilot-login");
      return;
    }
    const role = jwtPayloadRole(token);
    if (role !== "pilot") {
      localStorage.removeItem("token");
      router.replace("/pilot-login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const sub = jwtPayloadSub(token);
    pilotDbIdRef.current = sub;
    let cancelled = false;

    async function loadPilotMetrics() {
      setDutyLoading(true);
      await refreshPilotMetrics();
      if (!cancelled) setDutyLoading(false);
    }

    void loadPilotMetrics();

    function onVisible() {
      if (document.visibilityState !== "visible" || cancelled) return;
      void loadPilotMetrics();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [authorized, refreshPilotMetrics]);

  useEffect(() => {
    if (!authorized) return;
    const onRefresh = () => {
      void refreshPilotMetrics();
    };
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, onRefresh);
    window.addEventListener(MISSIONS_DB_UPDATED_EVENT, onRefresh);
    window.addEventListener(PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT, onRefresh);
    const bc = new BroadcastChannel(MISSIONS_DB_BROADCAST_CHANNEL);
    bc.onmessage = onRefresh;
    return () => {
      window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, onRefresh);
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, onRefresh);
      window.removeEventListener(
        PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT,
        onRefresh
      );
      bc.close();
    };
  }, [authorized, refreshPilotMetrics]);

  async function onDutyChange(next: DutyStatus) {
    const id = pilotDbIdRef.current;
    if (!id) return;
    const prev = dutyStatus;
    setDutyStatus(next);
    setDutySaving(true);
    const result = await updatePilotStatus(id, next);
    setDutySaving(false);
    if (!result?.success) {
      setDutyStatus(prev);
      alert("Could not update duty status. Check that the backend is running and try again.");
      return;
    }
    const updated = result.data;
    if (updated && typeof updated === "object" && !Array.isArray(updated)) {
      const r = updated as Record<string, unknown>;
      setFlightHoursFromPilotRecord(true);
      setFlightHoursTotal(
        displayFlightHoursLikeProfilePage(r, {
          preferApiRowWhenPresent: true,
          snapshotFallbackHours: snapshotFlightHoursFromStorage(),
        })
      );
    }
    await refreshPilotMetrics();
  }

  if (!authorized) {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center pt-24 text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  return (
    <PilotDashboardShell pageTitle="Pilot Dashboard" omitPageTitle>
      <div
        className={cn(
          flightDeck.variable,
          "flex flex-col gap-6 sm:gap-8",
          "text-foreground"
        )}
      >
        <section
          className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4"
          aria-label="Pilot summary: flight hours, assigned missions, duty status, and completed missions"
        >
          <AdminKpiCard
            title="Flight Hours"
            value={
              dutyLoading ? "…" : flightHoursTotal.toLocaleString("en-US")
            }
            icon={Timer}
            iconClassName="text-[#008B8B]"
            iconBg="bg-gradient-to-br from-[#008B8B]/15 to-[#008B8B]/5"
            accentClass="bg-gradient-to-r from-[#008B8B] to-[#00b4b4]"
          />
          <AdminKpiCard
            title="Assigned Mission Count"
            value={
              dutyLoading ? "…" : assignedMissionCount.toLocaleString("en-US")
            }
            icon={ShieldCheck}
            iconClassName="text-[#008B8B]"
            iconBg="bg-gradient-to-br from-[#008B8B]/15 to-[#008B8B]/5"
            accentClass="bg-gradient-to-r from-[#008B8B] to-[#00b4b4]"
          />
          <PilotDutyStatusCard
            status={dutyStatus}
            loading={dutyLoading}
            saving={dutySaving}
            onChange={onDutyChange}
          />
          <AdminKpiCard
            title="Missions Completed"
            value={
              dutyLoading ? "…" : missionsCompleted.toLocaleString("en-US")
            }
            icon={Rocket}
            iconClassName="text-sky-800 dark:text-sky-300"
            iconBg="bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-950/50 dark:to-sky-950/20"
            accentClass="bg-gradient-to-r from-sky-600 to-sky-400"
          />
        </section>

        {/* Main stack: mission control */}
        <section className="flex w-full flex-col gap-5 sm:gap-6 lg:gap-8">
            {/* Active Mission Control */}
            <div
              className={cn(
                "overflow-hidden rounded-xl bg-card",
                DASH_STAT_CARD_SURFACE
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                  <h2
                    className={cn(
                      flightDeck.variable,
                      "truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
                    )}
                  >
                    Active Mission Control
                  </h2>
                </div>
                <span
                  className={cn(
                    flightDeck.variable,
                    "shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00418f]",
                    "bg-[#00418f]/10 dark:bg-sky-400/15 dark:text-sky-300"
                  )}
                >
                  MS-4092: Logistics Relay
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 p-5 sm:gap-8 sm:p-6 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div className="relative h-48 overflow-hidden rounded-lg border border-border sm:h-52">
                    <Image
                      src={LIVE_FEED_IMAGE}
                      alt="Live aerial view"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, min(896px, 100vw)"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/10" aria-hidden />
                    <div className="absolute left-4 top-4 rounded border border-border/60 bg-background/85 px-3 py-1 font-mono text-xs font-bold text-foreground shadow-sm backdrop-blur-md">
                      LIVE FEED // HD-01
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <button
                        type="button"
                        className="rounded-lg border border-border/60 bg-background/85 p-2 text-[#00418f] shadow-sm backdrop-blur-md transition hover:bg-background dark:text-sky-300"
                        aria-label="Fullscreen feed"
                      >
                        <Maximize2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
                      <span>Progress</span>
                      <span>68%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: "68%",
                          backgroundColor: FD_PRIMARY,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: "Estimated Arrival", v: "14:22:08" },
                      { k: "Distance Rem.", v: "4.2 KM" },
                      {
                        k: "Battery Level",
                        v: "84%",
                        vClass: "text-emerald-600 dark:text-emerald-400",
                      },
                      { k: "Payload Weight", v: "1.8 KG" },
                    ].map((cell) => (
                      <div
                        key={cell.k}
                        className="rounded-lg bg-muted/80 p-3"
                      >
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {cell.k}
                        </span>
                        <span
                          className={cn(
                            "text-base font-semibold tabular-nums tracking-tight",
                            cell.vClass ?? "text-foreground"
                          )}
                        >
                          {cell.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
        </section>

      </div>
    </PilotDashboardShell>
  );
}
