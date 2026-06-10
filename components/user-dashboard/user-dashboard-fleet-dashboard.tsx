"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BatteryCharging,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Factory,
  Filter,
  Layers,
  MapPin,
  Minus,
  MoreHorizontal,
  MoveVertical,
  Plus,
  Rocket,
  Send,
  Warehouse,
} from "lucide-react";

import { AdminKpiCard } from "@/components/dashboard/admin-kpi-card";

import {
  appendUserRequest,
  userRequestQueueDisplayId,
  type UserMissionAdminStatus,
  type UserMissionRequest,
} from "@/lib/user-requests";
import { apiUrl } from "@/lib/api-url";
import {
  USER_DASH_BORDER_COLOR,
  USER_DASH_CHIP,
  USER_DASH_CHIP_CHECKED,
  USER_DASH_DIVIDER_BORDER,
  USER_DASH_DIVIDER_SIDE_L,
  USER_DASH_DIVIDER_SIDE_R,
  USER_DASH_INPUT_BORDER,
  USER_DASH_PANEL_BORDER,
  USER_DASH_PRIMARY_BUTTON,
} from "@/lib/user-dashboard-styles";
import { cn } from "@/lib/utils";

const PRIMARY = "#0058bc";
const CYAN = "#00daf3";

const PICKUP_HUBS = [
  "Central Station",
  "North Depot",
  "East Wing Terminal",
] as const;

const DEST_HUBS = [
  "South-West Hub",
  "Tech Park North",
  "St. Mary's Helipad",
] as const;

const CARGO_OPTIONS = [
  { label: "Medical Supply", type: "Medical" },
  { label: "Industrial Parts", type: "Industrial" },
  { label: "Standard Freight", type: "Cargo" },
] as const;

/** Discrete steps for the up/down control under the payload slider. */
const PAYLOAD_DISCRETE_KG = [0.1, 0.5, 1, 2.5, 5, 10, 15, 20, 25] as const;

function nearestDiscreteStepIndex(kg: number) {
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < PAYLOAD_DISCRETE_KG.length; i++) {
    const d = Math.abs(PAYLOAD_DISCRETE_KG[i] - kg);
    if (d < bestDiff) {
      bestDiff = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function stepDiscretePayloadKg(kg: number, direction: 1 | -1) {
  const i = nearestDiscreteStepIndex(kg);
  const next = Math.max(
    0,
    Math.min(PAYLOAD_DISCRETE_KG.length - 1, i + direction)
  );
  return PAYLOAD_DISCRETE_KG[next];
}

const PAYLOAD_SLIDER_MIN = 0.1;
const PAYLOAD_SLIDER_MAX = 25;

function clampTypedPayloadKg(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Math.min(PAYLOAD_SLIDER_MAX, Math.max(PAYLOAD_SLIDER_MIN, rounded));
}

type Urgency = "express" | "priority" | "critical";
type UrgencyOption = {
  key: Urgency;
  label: string;
  danger?: boolean;
};

const URGENCY_OPTIONS: readonly UrgencyOption[] = [
  { key: "express", label: "EXPRESS" },
  { key: "priority", label: "PRIORITY" },
  { key: "critical", label: "CRITICAL", danger: true },
] as const;

function urgencyToPriority(u: Urgency): string {
  switch (u) {
    case "express":
      return "express";
    case "priority":
      return "standard";
    case "critical":
      return "urgent";
    default:
      return "express";
  }
}

function typeBadgeClass(requestType: string): string {
  const t = requestType.toLowerCase();
  if (t.includes("medical"))
    return "bg-blue-50 text-[#0058bc] dark:bg-blue-500/15 dark:text-blue-200";
  return "bg-muted text-muted-foreground";
}

function typeLabel(requestType: string): string {
  const t = requestType.toLowerCase();
  if (t.includes("medical")) return "MEDICAL";
  if (t.includes("industrial")) return "INDUSTRIAL";
  if (t.includes("cargo")) return "STANDARD";
  return (requestType || "STANDARD").toUpperCase().slice(0, 12);
}

function statusCell(status: UserMissionAdminStatus) {
  const rowClass =
    "flex w-full min-w-0 items-center justify-end gap-1.5 text-[11px] font-bold";
  if (status === "accepted") {
    return (
      <span className={cn(rowClass, "text-emerald-600 dark:text-emerald-400")}>
        <CheckCircle2 className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
        SUCCESS
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className={cn(rowClass, "text-sky-700 dark:text-sky-300")}>
        <CheckCircle2 className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
        COMPLETED
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className={cn(rowClass, "text-amber-600 dark:text-amber-400")}>
        PENDING
      </span>
    );
  }
  return (
    <span className={cn(rowClass, "text-rose-600 dark:text-rose-400")}>
      DECLINED
    </span>
  );
}

const RADAR_MAP_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB6tOov19c__q6_wOS9jWyJ_TWs3jMw96TRqrkVFrUg0UFw7TNQE-1hzD2RJ1azI-kcyt4qynmBOp_oSUlKM1J6AqqnrtN5kE3v_NSgfdVJElzj-zvEbyfRI1KriDPa2fINnJAaot_SuRhytj1AW0Jb6X8w4SqO3lwvCA2uZuRFZ8pafrZTc0GWgzZR0qYD7hTelMCXKPtU0YD9LbsllZ53JQkbJKpahlJQ9pUWVSz-GTIfmXRloO1LvmLxdHoQsy-OEvrLP2aIG_iL";

export function UserDashboardFleetDashboard({
  allRequests,
  tableRequests,
}: {
  allRequests: UserMissionRequest[];
  tableRequests: UserMissionRequest[];
}) {
  const headingFont = { fontFamily: "var(--font-user-fleet-heading), sans-serif" };

  const [missionTitle, setMissionTitle] = useState("");
  const [pickupHub, setPickupHub] = useState<string>(PICKUP_HUBS[0]);
  const [destHub, setDestHub] = useState<string>(DEST_HUBS[0]);
  const [payloadKg, setPayloadKg] = useState(2.4);
  const [payloadKgText, setPayloadKgText] = useState("2.4");
  const payloadKgInputDirtyRef = useRef(false);
  const [cargoKey, setCargoKey] = useState<(typeof CARGO_OPTIONS)[number]["label"]>(
    CARGO_OPTIONS[0].label
  );
  const [urgency, setUrgency] = useState<Urgency>("express");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalMissions = allRequests.length;

  const activeMissions = useMemo(
    () => allRequests.filter((r) => r.adminStatus === "pending").length,
    [allRequests]
  );

  const completedMissions = useMemo(
    () =>
      allRequests.filter(
        (r) =>
          r.adminStatus === "accepted" || r.adminStatus === "completed"
      ).length,
    [allRequests]
  );

  useEffect(() => {
    if (!payloadKgInputDirtyRef.current) {
      setPayloadKgText(payloadKg.toFixed(1));
    }
  }, [payloadKg]);

  function commitTypedPayloadKg() {
    const raw = payloadKgText.replace(/,/g, ".").trim();
    if (raw === "") {
      setPayloadKgText(payloadKg.toFixed(1));
      return;
    }
    const v = parseFloat(raw);
    if (!Number.isFinite(v)) {
      setPayloadKgText(payloadKg.toFixed(1));
      return;
    }
    const clamped = clampTypedPayloadKg(v);
    setPayloadKg(clamped);
    setPayloadKgText(clamped.toFixed(1));
  }

  async function onDeployMission(e: FormEvent) {
    e.preventDefault();
    if (submittingRequest) return;
    const cargo = CARGO_OPTIONS.find((c) => c.label === cargoKey);
    const reasonOrTitle = missionTitle.trim() || "Mission request";
    const payloadWeight = String(payloadKg);
    const missionUrgency = urgencyToPriority(urgency);

    setSubmittingRequest(true);
    setSubmitSuccess(false);
    try {
      const res = await fetch(apiUrl("/api/submit-request"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason_or_title: reasonOrTitle,
          pickup_location: pickupHub,
          drop_location: destHub,
          payload_weight: payloadWeight,
          cargo_type: cargo?.type ?? "Cargo",
          mission_urgency: missionUrgency,
        }),
      });

      let payload: {
        message?: string;
        error?: string;
        data?: { id?: unknown };
      } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        // Ignore non-JSON response and use generic fallback below.
      }

      if (!res.ok) {
        alert(payload.error || payload.message || "Could not save request to database.");
        return;
      }

      const backendRequestId =
        payload.data != null &&
        typeof payload.data === "object" &&
        "id" in payload.data &&
        payload.data.id != null &&
        payload.data.id !== ""
          ? String(payload.data.id)
          : undefined;

      // Keep local cache in sync for existing dashboard components that still read localStorage.
      appendUserRequest({
        reasonOrTitle,
        pickupLocation: pickupHub,
        dropLocation: destHub,
        payloadWeightKg: payloadWeight,
        requestType: cargo?.type ?? "Cargo",
        requestPriority: missionUrgency,
        ...(backendRequestId ? { backendRequestId } : {}),
      });

      setMissionTitle("");
      setSubmitSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend. Please ensure API is running on port 4000.");
    } finally {
      setSubmittingRequest(false);
    }
  }

  return (
    <div className="w-full max-w-[1400px] pb-8">
      <section
        className="mb-8 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Mission summary: total, active, and completed missions"
      >
        <AdminKpiCard
          title="Total Missions"
          value={totalMissions}
          icon={Rocket}
          iconClassName="text-[#008B8B]"
          iconBg="bg-gradient-to-br from-[#008B8B]/15 to-[#008B8B]/5"
          accentClass="bg-gradient-to-r from-[#008B8B] to-[#00b4b4]"
        />
        <AdminKpiCard
          title="Active Missions"
          value={activeMissions}
          icon={Clock}
          iconClassName="text-[#ba1a1a]"
          iconBg="bg-gradient-to-br from-[#ffdad6] to-[#ffdad6]/40 dark:from-red-950/60 dark:to-red-950/30"
          accentClass="bg-gradient-to-r from-[#ba1a1a] to-[#e53935]"
        />
        <AdminKpiCard
          title="Completed Missions"
          value={completedMissions}
          icon={CheckCircle2}
          iconClassName="text-green-700 dark:text-green-400"
          iconBg="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/50 dark:to-green-950/20"
          accentClass="bg-gradient-to-r from-green-600 to-emerald-400"
        />
      </section>

      {/* Mission form + radar */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-5">
          <section
            className={cn(
              "flex h-full flex-col overflow-hidden rounded-xl bg-card",
              USER_DASH_BORDER_COLOR,
              "shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:shadow-none"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between bg-neutral-50/80 px-6 py-5 dark:bg-white/[0.04]",
                USER_DASH_DIVIDER_BORDER
              )}
            >
              <h3
                className="flex items-center gap-3 text-lg font-bold text-foreground"
                style={headingFont}
              >
                <span
                  className="rounded-lg p-1.5"
                  style={{ color: PRIMARY, backgroundColor: "rgba(0,88,188,0.1)" }}
                >
                  <Send className="size-5" strokeWidth={2} aria-hidden />
                </span>
                Send Mission Request
              </h3>
              <button
                type="button"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="More options"
              >
                <MoreHorizontal className="size-5" aria-hidden />
              </button>
            </div>
            <form className="flex flex-grow flex-col space-y-5 p-6" onSubmit={onDeployMission}>
              {submitSuccess ? (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-100"
                >
                  <CheckCircle2
                    className="size-5 shrink-0 text-emerald-600 dark:text-emerald-300"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Request submitted</p>
                    <p className="mt-1 text-xs text-emerald-900/85 dark:text-emerald-100/80">
                      Your mission request was saved. You can track it under{" "}
                      <span className="font-medium">My Request</span> in the sidebar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(false)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Mission title / reason
                </label>
                <input
                  type="text"
                  value={missionTitle}
                  onChange={(e) => setMissionTitle(e.target.value)}
                  placeholder="e.g. Urgent Medical Supply Delivery"
                  className={cn(
                    "w-full rounded-lg py-2.5 text-sm text-foreground transition-all focus:ring-4 focus:ring-[#0058bc]/10 focus:outline-none",
                    USER_DASH_INPUT_BORDER
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Pickup hub
                  </label>
                  <div className="relative">
                    <Warehouse className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={pickupHub}
                      onChange={(e) => setPickupHub(e.target.value)}
                      className={cn(
                        "w-full appearance-none rounded-lg bg-white py-2.5 pl-9 pr-8 text-xs text-foreground focus:outline-none focus:ring-4 focus:ring-[#0058bc]/10 dark:bg-black",
                        USER_DASH_INPUT_BORDER
                      )}
                    >
                      {PICKUP_HUBS.map((h) => (
                        <option key={h} value={h} className="bg-white text-slate-950 dark:bg-black dark:text-white">
                          {h}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Destination hub
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={destHub}
                      onChange={(e) => setDestHub(e.target.value)}
                      className={cn(
                        "w-full appearance-none rounded-lg bg-white py-2.5 pl-9 pr-8 text-xs text-foreground focus:outline-none focus:ring-4 focus:ring-[#0058bc]/10 dark:bg-black",
                        USER_DASH_INPUT_BORDER
                      )}
                    >
                      {DEST_HUBS.map((h) => (
                        <option key={h} value={h} className="bg-white text-slate-950 dark:bg-black dark:text-white">
                          {h}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Payload weight (kg)
                  </label>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-bold"
                    style={{ color: PRIMARY, backgroundColor: "rgba(0,88,188,0.08)" }}
                  >
                    {payloadKg.toFixed(1)} kg
                  </span>
                </div>
                <input
                  type="range"
                  min={PAYLOAD_SLIDER_MIN}
                  max={PAYLOAD_SLIDER_MAX}
                  step={0.1}
                  value={payloadKg}
                  onChange={(e) => setPayloadKg(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-[#0058bc]"
                />
                <div className="mt-4">
                  <p className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Preset steps (kg)
                  </p>
                  <div
                    className={cn(
                      "inline-flex h-9 w-full max-w-xs flex-row items-stretch overflow-hidden rounded-lg sm:w-auto sm:max-w-none",
                      USER_DASH_INPUT_BORDER
                    )}
                    role="group"
                    aria-label="Step payload weight through presets"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setPayloadKg((kg) => stepDiscretePayloadKg(kg, -1))
                      }
                      disabled={nearestDiscreteStepIndex(payloadKg) <= 0}
                      className={cn(
                        "flex w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-[#0058bc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0058bc] disabled:pointer-events-none disabled:opacity-35",
                        USER_DASH_DIVIDER_SIDE_R
                      )}
                      aria-label="Next lighter preset"
                    >
                      <ChevronDown
                        className="size-4"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </button>
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-1 bg-muted/60 px-2">
                      <input
                        id="payload-kg-typein"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        aria-label="Type payload weight in kilograms"
                        value={payloadKgText}
                        onFocus={() => {
                          payloadKgInputDirtyRef.current = true;
                        }}
                        onChange={(e) => setPayloadKgText(e.target.value)}
                        onBlur={() => {
                          commitTypedPayloadKg();
                          payloadKgInputDirtyRef.current = false;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="min-w-0 max-w-[4.75rem] border-0 bg-transparent py-0.5 text-center text-sm font-bold tabular-nums text-foreground outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#0058bc]/50"
                      />
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        kg
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPayloadKg((kg) => stepDiscretePayloadKg(kg, 1))
                      }
                      disabled={
                        nearestDiscreteStepIndex(payloadKg) >=
                        PAYLOAD_DISCRETE_KG.length - 1
                      }
                      className={cn(
                        "flex w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-[#0058bc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0058bc] disabled:pointer-events-none disabled:opacity-35",
                        USER_DASH_DIVIDER_SIDE_L
                      )}
                      aria-label="Next heavier preset"
                    >
                      <ChevronUp className="size-4" strokeWidth={2.25} aria-hidden />
                    </button>
                  </div>
                  <p className="mt-2 max-w-xs text-[10px] leading-snug text-slate-400 dark:text-white/45">
                    Type a weight (0.1–25 kg) or use arrows / slider. Press
                    Enter or click away to apply.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Cargo type
                </label>
                <select
                  value={cargoKey}
                  onChange={(e) =>
                    setCargoKey(e.target.value as (typeof CARGO_OPTIONS)[number]["label"])
                  }
                  className={cn(
                    "w-full rounded-lg bg-white py-2.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-[#0058bc]/10 dark:bg-black",
                    USER_DASH_INPUT_BORDER
                  )}
                >
                  {CARGO_OPTIONS.map((c) => (
                    <option key={c.label} value={c.label} className="bg-white text-slate-950 dark:bg-black dark:text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Mission urgency
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {URGENCY_OPTIONS.map(({ key, label, danger }) => (
                    <label key={key} className="cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        className="peer sr-only"
                        checked={urgency === key}
                        onChange={() => setUrgency(key)}
                      />
                      <div
                        className={cn(
                          "rounded-lg py-2.5 text-center text-[10px] font-bold uppercase tracking-wide transition-colors",
                          danger
                            ? "bg-rose-50 text-rose-600 peer-checked:bg-rose-100 peer-checked:text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:peer-checked:bg-rose-500/20"
                            : cn(USER_DASH_CHIP, USER_DASH_CHIP_CHECKED)
                        )}
                      >
                        {label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingRequest}
                className={cn(
                  "mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                  USER_DASH_PRIMARY_BUTTON
                )}
              >
                {submittingRequest ? "Submitting..." : "Submit the Request"}
                <Rocket className="size-4" aria-hidden />
              </button>
            </form>
          </section>
        </div>

        <div className="col-span-12 flex flex-col lg:col-span-7">
          <section
            className={cn(
              "relative flex min-h-[500px] flex-col overflow-hidden rounded-xl bg-slate-900",
              USER_DASH_PANEL_BORDER
            )}
          >
            <div className="pointer-events-none absolute left-5 right-5 top-5 z-20 flex items-center justify-between">
              <div
                className="pointer-events-auto flex items-center gap-3 rounded-lg border border-white/10 px-4 py-2 backdrop-blur-md"
                style={{ background: "rgba(15, 23, 42, 0.85)" }}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: CYAN }}
                  />
                  <span
                    className="relative inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CYAN }}
                  />
                </span>
                <span
                  className="text-[11px] font-bold tracking-[0.2em] text-white"
                  style={headingFont}
                >
                  LIVE RADAR: SECTOR 7G
                </span>
                <div className="ml-2 h-4 w-px bg-white/20" />
                <span className="text-[10px] font-medium text-slate-400">
                  8 NODES DETECTED
                </span>
              </div>
              <div className="pointer-events-auto flex gap-2">
                {[
                  { Icon: Plus, label: "Zoom in" },
                  { Icon: Minus, label: "Zoom out" },
                  { Icon: Layers, label: "Layers" },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:bg-white/10"
                    style={{ background: "rgba(15, 23, 42, 0.85)" }}
                  >
                    <Icon className="size-5" aria-hidden />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-[420px] w-full flex-1 overflow-hidden lg:min-h-[380px]">
              <Image
                src={RADAR_MAP_SRC}
                alt=""
                fill
                className="object-cover opacity-60 grayscale brightness-75 contrast-125"
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle_at_50%_50%,transparent_0%,rgba(15,23,42,0.4)_100%)",
                }}
              />
              <div className="group absolute left-[35%] top-[40%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex size-12 items-center justify-center rounded-full border border-cyan-400/40 animate-pulse">
                  <div
                    className="size-2 rounded-full shadow-[0_0_10px_#00daf3]"
                    style={{ backgroundColor: CYAN }}
                  />
                </div>
                <div className="absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-white/10 px-2 py-1 text-[10px] font-mono text-white backdrop-blur-md group-hover:block" style={{ background: "rgba(15, 23, 42, 0.85)" }}>
                  AL-9021-X | 124m
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 overflow-x-auto border-t border-white/10 bg-slate-950/90 p-4">
              <div className="flex shrink-0 items-center gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <Factory className="size-5" style={{ color: CYAN }} aria-hidden />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                    Drone_id
                  </p>
                  <p className="text-xs font-bold text-white" style={headingFont}>
                    AL-9021-X
                  </p>
                </div>
              </div>
              <div className="h-8 w-px shrink-0 bg-white/10" />
              <div className="flex shrink-0 items-center gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <MoveVertical className="size-5" style={{ color: CYAN }} aria-hidden />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                    Altitude
                  </p>
                  <p className="text-xs font-bold text-white" style={headingFont}>
                    124
                    <span className="ml-0.5 text-[10px] font-normal text-slate-400">
                      m MSL
                    </span>
                  </p>
                </div>
              </div>
              <div className="h-8 w-px shrink-0 bg-white/10" />
              <div className="flex min-w-[150px] shrink-0 flex-grow items-center gap-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <BatteryCharging className="size-5" style={{ color: CYAN }} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-end justify-between">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                      Battery level
                    </p>
                    <span className="text-xs font-bold text-white" style={headingFont}>
                      88%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full w-[88%] rounded-full"
                      style={{
                        backgroundColor: CYAN,
                        boxShadow: "0 0 8px rgba(0,218,243,0.4)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
