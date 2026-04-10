"use client";

import Link from "next/link";
import { MapPin, Package, Plane, Search, User } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Priority = "standard" | "express" | "emergency";

const pilots = [
  {
    id: "sarah",
    name: "Capt. Sarah Chen",
    level: 5,
    tags: ["Certified", "Available"] as const,
    hours: "2.4k Flight Hours",
  },
  {
    id: "marcus",
    name: "Marcus Thorne",
    level: 4,
    tags: ["Tactical", "Available"] as const,
    hours: "1.8k Flight Hours",
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
  },
  {
    id: "atlas",
    model: "Atlas Heavy-Lift",
    sn: "8821-HL",
    battery: 92,
    cargo: "50kg",
    icon: "heavy" as const,
  },
] as const;

export function AssignPilotDroneView() {
  const [selectedPilotId, setSelectedPilotId] = useState<string>("marcus");
  const [selectedDroneId, setSelectedDroneId] = useState<string>("atlas");
  const [priority, setPriority] = useState<Priority>("express");
  const [pilotFilter, setPilotFilter] = useState("");
  const [missionNotes, setMissionNotes] = useState("");
  const [deployment, setDeployment] = useState("");

  const filteredPilots = useMemo(() => {
    const q = pilotFilter.trim().toLowerCase();
    if (!q) return pilots;
    return pilots.filter((p) => p.name.toLowerCase().includes(q));
  }, [pilotFilter]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-blue-900 sm:text-3xl">
              Assign Pilot &amp; Drone
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-[#e7e8e9] px-6 py-2.5 text-sm font-bold text-[#0058bc] transition hover:bg-[#e1e3e4]"
            >
              Cancel
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0058bc] to-[#0070eb] px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition active:scale-[0.98]"
            >
              Assign Mission
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-4">
          {/* Request details */}
          <div className="rounded-2xl border border-[#c1c6d7]/20 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-blue-900">Request Details</h2>
              <span className="rounded-full bg-[#d8e2ff] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#001a41]">
                Pending
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 py-2">
                <span className="text-xs uppercase tracking-wider text-slate-500">
                  Request ID
                </span>
                <span className="text-sm font-bold tabular-nums text-[#191c1d]">
                  #RQ-8821
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 py-2">
                <span className="text-xs uppercase tracking-wider text-slate-500">
                  Customer
                </span>
                <span className="text-sm font-semibold text-[#191c1d]">
                  Skybound Corp
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 py-2">
                <span className="text-xs uppercase tracking-wider text-slate-500">
                  Service
                </span>
                <span className="text-sm font-semibold text-[#006195]">
                  Emergency Logistics
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <MapPin
                  className="mt-0.5 size-5 shrink-0 text-[#0058bc]"
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Drop-off Location
                  </p>
                  <p className="text-sm font-bold text-[#191c1d]">
                    North Bay Medical Center
                  </p>
                  <p className="text-xs text-slate-500">Bay Area, Sector 7G</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission parameters */}
          <div className="rounded-2xl border border-[#c1c6d7]/20 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-blue-900">
              Mission Parameters
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="deploy-schedule"
                  className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Schedule Deployment
                </label>
                <input
                  id="deploy-schedule"
                  type="datetime-local"
                  value={deployment}
                  onChange={(e) => setDeployment(e.target.value)}
                  className="w-full rounded-xl border-0 bg-[#e1e3e4] px-4 py-3 text-sm text-[#191c1d] outline-none ring-0 transition focus:ring-2 focus:ring-[#0058bc]/20"
                />
              </div>
              <div className="space-y-2">
                <p className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Priority Level
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "standard" as const, label: "Standard" },
                      { id: "express" as const, label: "Express" },
                      { id: "emergency" as const, label: "Emergency" },
                    ] as const
                  ).map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPriority(id)}
                      className={cn(
                        "rounded-lg border-2 py-2 text-xs font-bold transition",
                        priority === id
                          ? id === "emergency"
                            ? "border-red-600 bg-red-50 text-red-700"
                            : "border-[#0058bc] bg-[#0058bc]/5 text-[#0058bc]"
                          : "border-slate-100 text-slate-500 hover:border-[#0058bc]/40 hover:text-[#0058bc]",
                        id === "emergency" &&
                          priority !== id &&
                          "hover:border-red-400 hover:text-red-600"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="mission-notes"
                  className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Mission Notes
                </label>
                <textarea
                  id="mission-notes"
                  rows={3}
                  value={missionNotes}
                  onChange={(e) => setMissionNotes(e.target.value)}
                  placeholder="Add specific instructions for the pilot..."
                  className="w-full resize-none rounded-xl border-0 bg-[#e1e3e4] px-4 py-3 text-sm text-[#191c1d] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#0058bc]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-8 lg:col-span-8">
          {/* Pilots */}
          <div className="rounded-2xl bg-[#f3f4f5] p-6 sm:p-8">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0058bc]/10 text-[#0058bc]"
                  aria-hidden
                >
                  <User className="size-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-blue-900">Select Pilot</h2>
                  <p className="text-sm text-slate-500">
                    {filteredPilots.length} elite pilot
                    {filteredPilots.length !== 1 ? "s" : ""} available for this
                    sector
                  </p>
                </div>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Filter pilots..."
                  value={pilotFilter}
                  onChange={(e) => setPilotFilter(e.target.value)}
                  className="w-full rounded-xl border-0 bg-white py-2 pl-10 pr-4 text-sm shadow-sm outline-none ring-0 focus:ring-2 focus:ring-[#0058bc]/20"
                  aria-label="Filter pilots"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {filteredPilots.map((pilot) => {
                const selected = selectedPilotId === pilot.id;
                return (
                  <button
                    key={pilot.id}
                    type="button"
                    onClick={() => setSelectedPilotId(pilot.id)}
                    className={cn(
                      "relative w-full cursor-pointer overflow-hidden rounded-2xl border-2 bg-white p-6 text-left shadow-sm transition hover:shadow-md",
                      selected
                        ? "border-[#0058bc] ring-4 ring-[#0058bc]/5"
                        : "border-transparent hover:border-[#0058bc]/25"
                    )}
                  >
                    <div className="flex gap-4">
                      <span
                        className={cn(
                          "flex size-16 shrink-0 items-center justify-center rounded-xl ring-4",
                          selected
                            ? "bg-sky-50 text-[#0058bc] ring-sky-100"
                            : "bg-slate-100 text-[#0058bc] ring-slate-50"
                        )}
                        aria-hidden
                      >
                        <User className="size-8" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-blue-900">{pilot.name}</h3>
                          <span className="shrink-0 text-xs font-bold text-[#0058bc]">
                            Lvl {pilot.level}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pilot.tags.map((t) => (
                            <span
                              key={t}
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-bold",
                                t === "Available"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4 text-xs text-slate-400">
                      <span>{pilot.hours}</span>
                      <span className="font-bold text-[#0058bc]">
                        {selected ? "Selected" : "Select"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drones */}
          <div className="rounded-2xl bg-[#f3f4f5] p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-blue-900">Select Drone</h2>
              <p className="text-sm text-slate-500">
                Fleet operational readiness: 94%
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {drones.map((drone) => {
                const selected = selectedDroneId === drone.id;
                return (
                  <button
                    key={drone.id}
                    type="button"
                    onClick={() => setSelectedDroneId(drone.id)}
                    className={cn(
                      "group w-full cursor-pointer rounded-2xl border-2 bg-white p-6 text-left shadow-sm transition hover:shadow-md",
                      selected
                        ? "border-[#0058bc] ring-4 ring-[#0058bc]/5"
                        : "border-transparent hover:border-[#0058bc]/25"
                    )}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "rounded-xl p-3",
                          selected ? "bg-sky-50" : "bg-slate-50"
                        )}
                      >
                        {drone.icon === "plane" ? (
                          <Plane
                            className="size-8 text-[#0058bc]"
                            aria-hidden
                          />
                        ) : (
                          <Package
                            className="size-8 text-[#0058bc]"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {drone.model}
                        </p>
                        <p className="text-sm font-bold text-blue-900">
                          SN: {drone.sn}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Battery Status</span>
                        <span className="text-[#0058bc]">{drone.battery}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#0058bc]"
                          style={{ width: `${drone.battery}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
                          Ready
                        </span>
                        <span className="rounded bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          Cargo: {drone.cargo}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
