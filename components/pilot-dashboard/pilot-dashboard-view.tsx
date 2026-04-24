"use client";

import Image from "next/image";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  History,
  Maximize2,
  Rocket,
  ShieldCheck,
  Star,
  Timer,
  TrendingUp,
} from "lucide-react";

import { updatePilotStatus } from "@/app/services/pilotServices";
import { fetchPilotSessionRow } from "@/lib/fetch-pilot-session-row";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";
import {
  assignedMissionCountFromPilotRow,
  missionsCompletedFromPilotRow,
} from "@/lib/pilot-db-metrics";
import {
  displayFlightHoursLikeProfilePage,
  snapshotFlightHoursFromStorage,
} from "@/lib/pilot-profile-flight-hours";
import { jwtPayloadRole, jwtPayloadSub } from "@/lib/pilot-display-name";
import { PILOT_PROFILE_UPDATED_EVENT } from "@/lib/pilot-profile-snapshot";
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

const cardShadow = "shadow-[0_4px_20px_rgba(0,0,0,0.04)]";

function DeckStatCard({
  label,
  value,
  unit,
  footer,
  footerClassName,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  unit?: string;
  footer: ReactNode;
  footerClassName?: string;
  icon: typeof Timer;
  iconClassName: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 sm:p-6",
        cardShadow,
        "dark:border-white/10 dark:bg-[#1a1f24]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            flightDeck.variable,
            "font-[family-name:var(--font-flight-deck)] text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-white/55"
          )}
        >
          {label}
        </span>
        <Icon className={cn("size-4 shrink-0 sm:size-[18px]", iconClassName)} aria-hidden />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            flightDeck.variable,
            "text-[1.65rem] font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl dark:text-white"
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="font-[family-name:var(--font-flight-deck)] text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-white/50">
            {unit}
          </span>
        ) : null}
      </div>
      <div className={cn("flex items-center gap-1.5 text-xs font-semibold", footerClassName)}>
        {footer}
      </div>
    </div>
  );
}

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
        "flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 sm:p-6",
        cardShadow,
        "dark:border-white/10 dark:bg-[#1a1f24]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            flightDeck.variable,
            "font-[family-name:var(--font-flight-deck)] text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-white/55"
          )}
        >
          Status
        </span>
        <CheckCircle2
          className={cn(
            "size-4 shrink-0 sm:size-[18px]",
            active
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          )}
          aria-hidden
        />
      </div>
      <div className="relative w-fit max-w-full min-h-0">
        <select
          id="pilot-deck-duty-status"
          aria-label="Duty status"
          value={status}
          disabled={loading || saving}
          onChange={(e) => onChange(e.target.value as DutyStatus)}
          className={cn(
            flightDeck.variable,
            "w-fit min-w-[5.5rem] cursor-pointer appearance-none rounded-md border border-slate-200 bg-white",
            "py-1 pl-2 pr-7 text-xs font-semibold uppercase tracking-wide text-slate-900 sm:min-w-[6rem] sm:py-1.5 sm:pl-2.5 sm:pr-8 sm:text-sm",
            "outline-none transition hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-[#00418f]/25",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "dark:border-white/15 dark:bg-[#1a1f24] dark:text-white dark:hover:border-white/25"
          )}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 sm:right-2 sm:size-4 dark:text-white/45"
          aria-hidden
        />
      </div>
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-semibold",
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
      </div>
    </div>
  );
}


const FLIGHT_LOG_ROWS = [
  {
    id: "MS-4089",
    ts: "Oct 24, 09:15 AM",
    type: "Surveillance",
    status: "success" as const,
    payout: "$450.00",
  },
  {
    id: "MS-4088",
    ts: "Oct 23, 04:30 PM",
    type: "Payload Delivery",
    status: "success" as const,
    payout: "$820.00",
  },
  {
    id: "MS-4085",
    ts: "Oct 23, 11:10 AM",
    type: "Topographic Scan",
    status: "aborted" as const,
    payout: "$120.00",
  },
];

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
      const rec = await fetchPilotSessionRow(sub);
      if (cancelled) return;

      if (rec) {
        setFlightHoursFromPilotRecord(true);
        setDutyStatus(mapApiDutyStatus(rec));
        setMissionsCompleted(missionsCompletedFromPilotRow(rec));
        setFlightHoursTotal(
          displayFlightHoursLikeProfilePage(rec, {
            preferApiRowWhenPresent: true,
            snapshotFallbackHours: snapshotFlightHoursFromStorage(),
          })
        );
        setAssignedMissionCount(assignedMissionCountFromPilotRow(rec));
      } else {
        setFlightHoursFromPilotRecord(false);
        setMissionsCompleted(0);
        setFlightHoursTotal(
          displayFlightHoursLikeProfilePage(null, {
            preferApiRowWhenPresent: false,
            snapshotFallbackHours: snapshotFlightHoursFromStorage(),
          })
        );
        setAssignedMissionCount(0);
      }
      setDutyLoading(false);
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
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    async function refreshFromPilotRecord() {
      const token = localStorage.getItem("token");
      if (!token) return;
      const sub = jwtPayloadSub(token);
      const row = await fetchPilotSessionRow(sub);
      if (row) {
        setFlightHoursFromPilotRecord(true);
        setDutyStatus(mapApiDutyStatus(row));
        setMissionsCompleted(missionsCompletedFromPilotRow(row));
        setFlightHoursTotal(
          displayFlightHoursLikeProfilePage(row, {
            preferApiRowWhenPresent: true,
            snapshotFallbackHours: snapshotFlightHoursFromStorage(),
          })
        );
        setAssignedMissionCount(assignedMissionCountFromPilotRow(row));
      } else {
        setFlightHoursFromPilotRecord(false);
        setFlightHoursTotal(
          displayFlightHoursLikeProfilePage(null, {
            preferApiRowWhenPresent: false,
            snapshotFallbackHours: snapshotFlightHoursFromStorage(),
          })
        );
      }
    }
    function onProfileUpdated() {
      void refreshFromPilotRecord();
    }
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () =>
      window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, [authorized]);

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
      setMissionsCompleted(missionsCompletedFromPilotRow(r));
      setAssignedMissionCount(assignedMissionCountFromPilotRow(r));
    }
  }

  if (!authorized) {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center pt-24 text-sm text-slate-600 dark:text-white/70">
        Checking session…
      </div>
    );
  }

  return (
    <PilotDashboardShell pageTitle="Flight deck" omitPageTitle>
      <div
        className={cn(
          flightDeck.variable,
          "flex flex-col gap-6 sm:gap-8",
          "text-slate-900 dark:text-white"
        )}
      >
        {/* Top stats — 4 columns */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <DeckStatCard
            label="Flight Hours"
            value={
              dutyLoading ? "…" : flightHoursTotal.toLocaleString("en-US")
            }
            unit="HRS"
            icon={Timer}
            iconClassName="text-[#00418f] dark:text-sky-300"
            footerClassName={
              dutyLoading
                ? "text-slate-500 dark:text-white/50"
                : flightHoursFromPilotRecord
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-white/55"
            }
            footer={
              dutyLoading ? (
                <>
                  <Timer className="size-3.5 shrink-0" aria-hidden />
                  <span>Loading pilot record…</span>
                </>
              ) : flightHoursFromPilotRecord ? (
                <>
                  <TrendingUp className="size-3.5 shrink-0" aria-hidden />
                  <span>Live total</span>
                </>
              ) : (
                <>
                  <History className="size-3.5 shrink-0" aria-hidden />
                  <span>
                    Saved profile hours — could not load your pilots row; check
                    backend
                  </span>
                </>
              )
            }
          />
          <DeckStatCard
            label="Assigned Mission Count"
            value={dutyLoading ? "…" : assignedMissionCount.toLocaleString("en-US")}
            icon={ShieldCheck}
            iconClassName="text-[#00418f] dark:text-sky-300"
            footerClassName="text-blue-600 dark:text-blue-400"
            footer={
              <>
                <Star className="size-3.5 shrink-0 fill-current" aria-hidden />
                <span>Total assigned to this pilot</span>
              </>
            }
          />
          <PilotDutyStatusCard
            status={dutyStatus}
            loading={dutyLoading}
            saving={dutySaving}
            onChange={onDutyChange}
          />
          <DeckStatCard
            label="Missions Completed"
            value={
              dutyLoading ? "…" : missionsCompleted.toLocaleString("en-US")
            }
            unit="Total"
            icon={Rocket}
            iconClassName="text-[#00418f] dark:text-sky-300"
            footerClassName="text-slate-500 dark:text-white/60"
            footer={
              <>
                <History className="size-3.5 shrink-0" aria-hidden />
                <span>Stored on your pilot record</span>
              </>
            }
          />
        </section>

        {/* Main stack: mission control + flight logs (full width) */}
        <section className="flex w-full flex-col gap-5 sm:gap-6 lg:gap-8">
            {/* Active Mission Control */}
            <div
              className={cn(
                "overflow-hidden rounded-xl border border-slate-200 bg-white",
                cardShadow,
                "dark:border-white/10 dark:bg-[#1a1f24]"
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                  <h2
                    className={cn(
                      flightDeck.variable,
                      "truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-white"
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
                  <div className="relative h-48 overflow-hidden rounded-lg border border-slate-200 sm:h-52 dark:border-white/10">
                    <Image
                      src={LIVE_FEED_IMAGE}
                      alt="Live aerial view"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, min(896px, 100vw)"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/10" aria-hidden />
                    <div className="absolute left-4 top-4 rounded border border-white/50 bg-white/70 px-3 py-1 font-mono text-xs font-bold text-slate-900 shadow-sm backdrop-blur-md dark:bg-black/50 dark:text-white">
                      LIVE FEED // HD-01
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <button
                        type="button"
                        className="rounded-lg border border-white/50 bg-white/70 p-2 text-[#00418f] shadow-sm backdrop-blur-md transition hover:bg-white/90 dark:bg-black/50 dark:text-sky-300"
                        aria-label="Fullscreen feed"
                      >
                        <Maximize2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 dark:text-white/55">
                      <span>Progress</span>
                      <span>68%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
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
                        className="rounded-lg bg-slate-100/90 p-3 dark:bg-white/[0.06]"
                      >
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                          {cell.k}
                        </span>
                        <span
                          className={cn(
                            "text-base font-semibold tabular-nums tracking-tight",
                            cell.vClass ?? "text-slate-900 dark:text-white"
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

            {/* Recent Flight Logs */}
            <div
              className={cn(
                "overflow-hidden rounded-xl border border-slate-200 bg-white",
                cardShadow,
                "dark:border-white/10 dark:bg-[#1a1f24]"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-white/10">
                <h2
                  className={cn(
                    flightDeck.variable,
                    "text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-white"
                  )}
                >
                  Recent Flight Logs
                </h2>
                <Link
                  href="/pilot-dashboard/completed-deliveries"
                  className="text-sm font-semibold text-[#00418f] hover:underline dark:text-sky-300"
                >
                  View Full Archive
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
                    <tr>
                      {["Mission ID", "Timestamp", "Type", "Status", "Payout"].map(
                        (h) => (
                          <th
                            key={h}
                            className={cn(
                              flightDeck.variable,
                              "px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-white/55"
                            )}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {FLIGHT_LOG_ROWS.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.04]"
                      >
                        <td className="px-5 py-4 font-mono text-sm font-semibold sm:px-6">
                          {row.id}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6 dark:text-white/65">
                          {row.ts}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6 dark:text-white/65">
                          {row.type}
                        </td>
                        <td className="px-5 py-4">
                          {row.status === "success" ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              SUCCESS
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-white/70">
                              ABORTED
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-900 sm:px-6 dark:text-white">
                          {row.payout}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </section>

      </div>
    </PilotDashboardShell>
  );
}
