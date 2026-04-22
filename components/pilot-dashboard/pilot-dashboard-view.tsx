"use client";

import Image from "next/image";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ExternalLink,
  History,
  MapPin,
  Maximize2,
  Rocket,
  ShieldCheck,
  Star,
  Timer,
  TrendingUp,
} from "lucide-react";

import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";
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

function jwtPayloadRole(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad)) as { role?: string };
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

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

function AirspeedGauge({ value, label }: { value: string; label: string }) {
  const r = 45;
  const c = 2 * Math.PI * r;
  const pct = 0.72;
  const dashoffset = c * (1 - pct);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[200px]">
      <svg className="size-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className="stroke-slate-100 dark:stroke-white/10"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={FD_PRIMARY}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
          {value}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
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
            value="2,450"
            unit="HRS"
            icon={Timer}
            iconClassName="text-[#00418f] dark:text-sky-300"
            footerClassName="text-emerald-600 dark:text-emerald-400"
            footer={
              <>
                <TrendingUp className="size-3.5 shrink-0" aria-hidden />
                <span>+12.4% this month</span>
              </>
            }
          />
          <DeckStatCard
            label="Safety Rating"
            value="99.8"
            unit="%"
            icon={ShieldCheck}
            iconClassName="text-[#00418f] dark:text-sky-300"
            footerClassName="text-blue-600 dark:text-blue-400"
            footer={
              <>
                <Star className="size-3.5 shrink-0 fill-current" aria-hidden />
                <span>Elite Pilot Status</span>
              </>
            }
          />
          <DeckStatCard
            label="Status"
            value="Available"
            icon={CheckCircle2}
            iconClassName="text-emerald-600 dark:text-emerald-400"
            footerClassName="text-emerald-600 dark:text-emerald-400"
            footer={
              <>
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                <span>System Ready</span>
              </>
            }
          />
          <DeckStatCard
            label="Missions Completed"
            value="1,284"
            unit="Total"
            icon={Rocket}
            iconClassName="text-[#00418f] dark:text-sky-300"
            footerClassName="text-slate-500 dark:text-white/60"
            footer={
              <>
                <History className="size-3.5 shrink-0" aria-hidden />
                <span>Across 4 fleets</span>
              </>
            }
          />
        </section>

        {/* Main grid: mission + logs | telemetry */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-5 lg:col-span-8 lg:gap-6">
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
                      sizes="(max-width: 768px) 100vw, 50vw"
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
          </div>

          {/* Flight Telemetry */}
          <div className="flex flex-col gap-5 lg:col-span-4 lg:gap-6">
            <div
              className={cn(
                "flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5 sm:p-6",
                cardShadow,
                "dark:border-white/10 dark:bg-[#1a1f24]"
              )}
            >
              <h2
                className={cn(
                  flightDeck.variable,
                  "mb-5 text-lg font-semibold tracking-tight text-slate-900 sm:mb-6 sm:text-xl dark:text-white"
                )}
              >
                Flight Telemetry
              </h2>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/55">
                      Altitude
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[#00418f] dark:text-sky-300">
                      245m{" "}
                      <span className="text-xs font-normal text-slate-400 dark:text-white/45">
                        / 500m
                      </span>
                    </span>
                  </div>
                  <div className="flex h-20 items-end gap-2">
                    {[25, 33, 66, 50, 75, 50].map((h, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-full rounded-sm",
                          i >= 3 ? "bg-[#00418f] dark:bg-sky-400" : "bg-slate-100 dark:bg-white/10"
                        )}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/55">
                      Airspeed
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[#00418f] dark:text-sky-300">
                      42.8 kn
                    </span>
                  </div>
                  <AirspeedGauge value="42.8" label="Knots" />
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/55">
                    Signal Strength
                  </span>
                  <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.05]">
                    <div className="flex h-6 items-end gap-0.5">
                      {[2, 3, 4, 5, 6].map((h, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 rounded-full",
                            i < 4 ? "bg-[#00418f] dark:bg-sky-400" : "bg-slate-200 dark:bg-white/15"
                          )}
                          style={{ height: `${h * 3}px` }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Strong
                      </span>
                      <span className="text-xs text-slate-500 dark:text-white/55">
                        -54 dBm / 2.4 GHz
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t border-slate-100 pt-5 dark:border-white/10">
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-sky-50 p-3 dark:bg-sky-950/30">
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin
                        className="size-5 shrink-0 text-[#00418f] dark:text-sky-300"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">
                          Current Loc
                        </span>
                        <span className="block font-mono text-[10px] text-slate-500 dark:text-white/55">
                          42.3601° N, 71.0589° W
                        </span>
                      </div>
                    </div>
                    <ExternalLink
                      className="size-4 shrink-0 text-slate-400 dark:text-white/45"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </PilotDashboardShell>
  );
}
