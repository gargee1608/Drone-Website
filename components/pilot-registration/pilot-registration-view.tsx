"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearPilotRegistrationDraft,
} from "@/lib/pilot-registration-draft";
import {
  PILOT_PROFILE_STORAGE_KEY,
  PILOT_PROFILE_UPDATED_EVENT,
  type PilotProfileSnapshot,
} from "@/lib/pilot-profile-snapshot";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Skills" },
  { id: 3, label: "Drones" },
  { id: 4, label: "Review" },
] as const;

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

const SKILL_OPTIONS = [
  "FPV",
  "Mapping",
  "Inspection",
  "Cinematography",
  "Surveying",
  "Delivery",
] as const;

const DRONE_TYPES = [
  "Quadcopter",
  "Hexacopter",
  "Fixed wing",
  "VTOL",
  "Other",
] as const;

const DRONE_USE_CASES = [
  "Survey",
  "Filming",
  "Inspection",
  "Delivery",
  "Security",
] as const;

type DroneEntry = {
  id: string;
  modelName: string;
  type: string;
  camera: string;
  payloadKg: string;
  flightTimeMin: string;
  rangeKm: string;
  useCases: string[];
};

function newDroneId() {
  return globalThis.crypto?.randomUUID?.() ?? `drone-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function droneCardSubtitle(d: DroneEntry) {
  const first = d.useCases[0] ?? d.type;
  const second = d.camera.trim() || "—";
  return `${first} • ${second}`;
}

function maskAadhaar(digits: string) {
  const clean = digits.replace(/\D/g, "");
  if (clean.length < 4) return "—";
  return `****${clean.slice(-4)}`;
}

/** Display Aadhaar as 4-4-4 groups; state remains 12 digits only. */
function formatAadhaarInputDisplay(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 12);
  if (!d) return "";
  const a = d.slice(0, 4);
  const b = d.slice(4, 8);
  const c = d.slice(8, 12);
  return [a, b, c].filter(Boolean).join(" ");
}

export function PilotRegistrationView() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [dgca, setDgca] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [flightHours, setFlightHours] = useState(0);
  const [bio, setBio] = useState("");
  const [skillsError, setSkillsError] = useState(false);

  const [droneModel, setDroneModel] = useState("");
  const [droneType, setDroneType] = useState("");
  const [droneCamera, setDroneCamera] = useState("");
  const [dronePayload, setDronePayload] = useState("");
  const [droneFlightMin, setDroneFlightMin] = useState("");
  const [droneRangeKm, setDroneRangeKm] = useState("");
  const [droneUseCases, setDroneUseCases] = useState<string[]>([]);
  const [drones, setDrones] = useState<DroneEntry[]>([]);
  const [droneFormError, setDroneFormError] = useState(false);
  const [aadhaarStepError, setAadhaarStepError] = useState(false);

  function resetDroneDraft() {
    setDroneModel("");
    setDroneType("");
    setDroneCamera("");
    setDronePayload("");
    setDroneFlightMin("");
    setDroneRangeKm("");
    setDroneUseCases([]);
  }

  const resetEntireRegistrationForm = useCallback(() => {
    setStep(1);
    setFullName("");
    setEmail("");
    setPhone("");
    setCity("");
    setState("");
    setAadhaar("");
    setDgca("");
    setSelectedSkills([]);
    setFlightHours(0);
    setBio("");
    setSkillsError(false);
    setDroneModel("");
    setDroneType("");
    setDroneCamera("");
    setDronePayload("");
    setDroneFlightMin("");
    setDroneRangeKm("");
    setDroneUseCases([]);
    setDrones([]);
    setDroneFormError(false);
    setAadhaarStepError(false);
  }, []);

  function toggleDroneUseCase(uc: string) {
    setDroneUseCases((prev) =>
      prev.includes(uc) ? prev.filter((x) => x !== uc) : [...prev, uc]
    );
  }

  function handleAddDrone() {
    if (!droneModel.trim() || !droneType) {
      setDroneFormError(true);
      return;
    }
    setDroneFormError(false);
    setDrones((prev) => [
      ...prev,
      {
        id: newDroneId(),
        modelName: droneModel.trim(),
        type: droneType,
        camera: droneCamera,
        payloadKg: dronePayload,
        flightTimeMin: droneFlightMin,
        rangeKm: droneRangeKm,
        useCases: [...droneUseCases],
      },
    ]);
    resetDroneDraft();
  }

  function handleGoToReview() {
    const draftComplete = Boolean(droneModel.trim() && droneType);
    if (drones.length === 0 && !draftComplete) {
      setDroneFormError(true);
      return;
    }
    setDroneFormError(false);
    if (drones.length === 0 && draftComplete) {
      setDrones([
        {
          id: newDroneId(),
          modelName: droneModel.trim(),
          type: droneType,
          camera: droneCamera,
          payloadKg: dronePayload,
          flightTimeMin: droneFlightMin,
          rangeKm: droneRangeKm,
          useCases: [...droneUseCases],
        },
      ]);
      resetDroneDraft();
    }
    setStep(4);
  }

  function handleRemoveDrone(id: string) {
    setDrones((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmitRegistration() {
    const snapshot: PilotProfileSnapshot = {
      fullName,
      email,
      phone,
      city,
      state,
      aadhaar,
      flightHours,
      bio,
      skills: selectedSkills,
      drones,
      dgca,
    };
    const json = JSON.stringify(snapshot);
    try {
      localStorage.setItem(PILOT_PROFILE_STORAGE_KEY, json);
    } catch {
      /* quota / private mode */
    }
    sessionStorage.setItem(PILOT_PROFILE_STORAGE_KEY, json);
    clearPilotRegistrationDraft();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(PILOT_PROFILE_UPDATED_EVENT));
    }
    router.replace("/pilot-profile");
  }

  useEffect(() => {
    clearPilotRegistrationDraft();
    resetEntireRegistrationForm();
  }, [resetEntireRegistrationForm]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      clearPilotRegistrationDraft();
      resetEntireRegistrationForm();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [resetEntireRegistrationForm]);

  return (
    <div className="relative min-h-dvh bg-background pt-22 text-foreground sm:pt-24">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-md ring-1 ring-slate-900/5">
          <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-6 text-center sm:px-8 sm:py-7">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
              Pilot Registration
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Join India&apos;s drone pilot network
            </p>
          </div>

          <nav
            className="flex items-center justify-between gap-0 border-b border-slate-200 bg-white px-3 py-5 sm:gap-1 sm:px-6 sm:py-6"
            aria-label="Registration progress"
          >
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex w-full min-w-0 flex-col items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white sm:size-9 sm:text-sm",
                    step >= s.id ? "bg-blue-500" : "bg-slate-300"
                  )}
                  aria-current={step === s.id ? "step" : undefined}
                >
                  {s.id}
                </span>
                <span
                  className={cn(
                    "text-center text-[10px] sm:text-xs",
                    step === s.id
                      ? "font-semibold text-blue-900"
                      : s.id < step
                        ? "font-medium text-slate-500"
                        : "font-medium text-slate-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mb-6 h-px min-w-[12px] flex-1 sm:mb-7",
                    step > s.id ? "bg-blue-500" : "bg-slate-200"
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
          ))}
          </nav>

          <div className="bg-white px-5 py-6 sm:px-8 sm:py-8">
        {step === 1 ? (
          <form
            className="space-y-5"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              const aadhaarDigits = aadhaar.replace(/\D/g, "");
              if (aadhaarDigits.length !== 12) {
                setAadhaarStepError(true);
                return;
              }
              setAadhaarStepError(false);
              setStep(2);
            }}
          >
            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-medium text-slate-800">
                Full Name <RequiredMark />
              </label>
              <Input
                id="full-name"
                name="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Raj Kumar"
                className="h-11 rounded-lg border-slate-200 bg-white px-3"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-800">
                Email <RequiredMark />
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="raj@email.com"
                className="h-11 rounded-lg border-slate-200 bg-white px-3"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-800">
                Phone <RequiredMark />
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-11 rounded-lg border-slate-200 bg-white px-3"
                autoComplete="tel"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium text-slate-800">
                  City <RequiredMark />
                </label>
                <Input
                  id="city"
                  name="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="h-11 rounded-lg border-slate-200 bg-white px-3"
                  autoComplete="address-level2"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium text-slate-800">
                  State <RequiredMark />
                </label>
                <select
                  id="state"
                  name="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={cn(
                    "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    state === "" ? "text-muted-foreground" : "text-slate-900"
                  )}
                >
                  <option value="">Select</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="aadhaar" className="text-sm font-medium text-slate-800">
                Aadhaar Number <RequiredMark />
              </label>
              <Input
                id="aadhaar"
                name="aadhaar"
                required
                value={formatAadhaarInputDisplay(aadhaar)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                  setAadhaar(digits);
                  if (digits.length === 12) setAadhaarStepError(false);
                }}
                placeholder="1234 5678 9012"
                inputMode="numeric"
                title="Enter exactly 12 digits"
                aria-describedby="aadhaar-hint"
                aria-invalid={aadhaarStepError}
                className="h-11 rounded-lg border-slate-200 bg-white px-3 tabular-nums"
                autoComplete="off"
              />
              <p id="aadhaar-hint" className="text-xs text-muted-foreground">
                Only 12 numbers allowed.{" "}
                <span className="tabular-nums font-medium text-slate-600">
                  {aadhaar.length}/12
                </span>
              </p>
              {aadhaarStepError ? (
                <p className="text-xs text-red-500" role="alert">
                  Enter all 12 digits of your Aadhaar number.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="dgca" className="text-sm font-medium text-slate-800">
                DGCA License Number{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <Input
                id="dgca"
                name="dgca"
                value={dgca}
                onChange={(e) => setDgca(e.target.value)}
                placeholder="UA-XXXXXXXXXX"
                className="h-11 rounded-lg border-slate-200 bg-white px-3"
                autoComplete="off"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="h-11 gap-2 rounded-lg bg-blue-500 px-6 font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                Next
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </form>
        ) : step === 2 ? (
          <form
            className="space-y-6"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedSkills.length === 0) {
                setSkillsError(true);
                return;
              }
              setSkillsError(false);
              setStep(3);
            }}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">
                Skills <RequiredMark />
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
                  const on = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        setSelectedSkills((prev) =>
                          prev.includes(skill)
                            ? prev.filter((x) => x !== skill)
                            : [...prev, skill]
                        );
                        setSkillsError(false);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        on
                          ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              {skillsError ? (
                <p className="text-xs text-red-500" role="alert">
                  Select at least one skill.
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <label
                htmlFor="flight-hours"
                className="block text-sm font-medium text-slate-800"
              >
                Flight Hours:{" "}
                <span className="tabular-nums font-normal text-slate-600">
                  {flightHours}h
                </span>
              </label>
              <input
                id="flight-hours"
                type="range"
                min={0}
                max={2000}
                step={1}
                value={flightHours}
                onChange={(e) => setFlightHours(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="certifications"
                className="text-sm font-medium text-slate-800"
              >
                Certifications (file upload placeholder)
              </label>
              <input
                id="certifications"
                name="certifications"
                type="file"
                disabled
                className="w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="text-xs text-slate-400">
                Upload will be enabled when backend is connected.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium text-slate-800">
                Brief Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about your experience..."
                className="min-h-[100px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 gap-2 rounded-lg border-blue-500 bg-white px-6 font-semibold text-blue-600 hover:bg-blue-50"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
              <Button
                type="submit"
                className="h-11 gap-2 rounded-lg bg-blue-500 px-6 font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                Next
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </form>
        ) : step === 3 ? (
          <div className="space-y-6">
            {drones.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">Your Drones</h3>
                <ul className="space-y-2">
                  {drones.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {d.modelName}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {droneCardSubtitle(d)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDrone(d.id)}
                        className="shrink-0 rounded-md p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${d.modelName}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-4 text-base font-bold text-slate-900 sm:text-lg">
                Add Drone
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="drone-model"
                    className="text-sm font-medium text-slate-800"
                  >
                    Model Name <RequiredMark />
                  </label>
                  <Input
                    id="drone-model"
                    name="droneModel"
                    value={droneModel}
                    onChange={(e) => {
                      setDroneModel(e.target.value);
                      setDroneFormError(false);
                    }}
                    placeholder="DJI Mavic 3"
                    className="h-11 rounded-lg border-slate-200 bg-white px-3"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="drone-type"
                    className="text-sm font-medium text-slate-800"
                  >
                    Type <RequiredMark />
                  </label>
                  <select
                    id="drone-type"
                    name="droneType"
                    value={droneType}
                    onChange={(e) => {
                      setDroneType(e.target.value);
                      setDroneFormError(false);
                    }}
                    className={cn(
                      "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      droneType === "" ? "text-muted-foreground" : "text-slate-900"
                    )}
                  >
                    <option value="">Select type</option>
                    {DRONE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="drone-camera"
                      className="text-sm font-medium text-slate-800"
                    >
                      Camera
                    </label>
                    <Input
                      id="drone-camera"
                      name="droneCamera"
                      value={droneCamera}
                      onChange={(e) => setDroneCamera(e.target.value)}
                      placeholder="4K HDR"
                      className="h-11 rounded-lg border-slate-200 bg-white px-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="drone-payload"
                      className="text-sm font-medium text-slate-800"
                    >
                      Payload (kg)
                    </label>
                    <Input
                      id="drone-payload"
                      name="dronePayload"
                      value={dronePayload}
                      onChange={(e) => setDronePayload(e.target.value)}
                      placeholder="2.5"
                      className="h-11 rounded-lg border-slate-200 bg-white px-3"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="drone-flight"
                      className="text-sm font-medium text-slate-800"
                    >
                      Flight Time (min)
                    </label>
                    <Input
                      id="drone-flight"
                      name="droneFlightMin"
                      value={droneFlightMin}
                      onChange={(e) => setDroneFlightMin(e.target.value)}
                      placeholder="45"
                      className="h-11 rounded-lg border-slate-200 bg-white px-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="drone-range"
                      className="text-sm font-medium text-slate-800"
                    >
                      Range (km)
                    </label>
                    <Input
                      id="drone-range"
                      name="droneRangeKm"
                      value={droneRangeKm}
                      onChange={(e) => setDroneRangeKm(e.target.value)}
                      placeholder="15"
                      className="h-11 rounded-lg border-slate-200 bg-white px-3"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-800">Use Cases</p>
                  <div className="flex flex-wrap gap-2">
                    {DRONE_USE_CASES.map((uc) => {
                      const on = droneUseCases.includes(uc);
                      return (
                        <button
                          key={uc}
                          type="button"
                          onClick={() => toggleDroneUseCase(uc)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                            on
                              ? "border-blue-500 bg-blue-50 text-blue-800"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          )}
                        >
                          {uc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {droneFormError ? (
                  <p className="text-xs text-red-500" role="alert">
                    Enter model name and type before adding a drone, or add at
                    least one drone before review.
                  </p>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddDrone}
                  className="h-11 w-full gap-2 rounded-lg border-slate-200 bg-white font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Plus className="size-4" aria-hidden />
                  Add Drone
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="h-11 gap-2 rounded-lg border-slate-300 bg-white px-6 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleGoToReview}
                className="h-11 gap-2 rounded-lg bg-blue-500 px-6 font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                Review
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-base font-bold text-slate-900">
                Personal Info
              </h2>
              <dl className="divide-y divide-slate-100">
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm first:pt-0">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="max-w-[65%] text-right font-medium text-slate-900">
                    {fullName.trim() || "—"}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="max-w-[65%] break-all text-right font-medium text-slate-900">
                    {email.trim() || "—"}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {phone.trim() || "—"}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {[city.trim(), state].filter(Boolean).join(", ") || "—"}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                  <dt className="text-slate-500">Aadhaar</dt>
                  <dd className="font-mono text-right font-medium text-slate-900">
                    {maskAadhaar(aadhaar)}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm last:pb-0">
                  <dt className="text-slate-500">DGCA</dt>
                  <dd className="max-w-[65%] break-all text-right font-medium text-slate-900">
                    {dgca.trim() || "—"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-base font-bold text-slate-900">
                Skills &amp; Experience
              </h2>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.length > 0 ? (
                  selectedSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                )}
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">
                {flightHours} flight hours
              </p>
              {bio.trim() ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {bio.trim()}
                </p>
              ) : null}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-base font-bold text-slate-900">
                Drones ({drones.length})
              </h2>
              {drones.length === 0 ? (
                <p className="text-sm text-slate-500">No drones added.</p>
              ) : (
                <ul className="space-y-3">
                  {drones.map((d) => (
                    <li
                      key={d.id}
                      className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3"
                    >
                      <p className="font-bold text-slate-900">
                        {d.modelName}{" "}
                        <span className="font-semibold text-slate-700">
                          ({d.useCases[0] ?? d.type})
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Camera: {d.camera.trim() || "—"} •{" "}
                        {d.flightTimeMin.trim() || "—"} min •{" "}
                        {d.rangeKm.trim() || "—"} km
                      </p>
                      {d.useCases.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {d.useCases.map((uc) => (
                            <span
                              key={uc}
                              className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600"
                            >
                              {uc}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="h-11 gap-2 rounded-lg border-slate-300 bg-white px-6 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmitRegistration}
                className="h-11 gap-2 rounded-lg bg-blue-500 px-6 font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                Submit Registration
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
