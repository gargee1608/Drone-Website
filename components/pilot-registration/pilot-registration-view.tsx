"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import {
  consumePilotRegistrationForceBlankNextOpen,
  markPilotRegistrationSubmittedNextOpenBlank,
  parsePilotRegistrationDraft,
  PILOT_REGISTRATION_DRAFT_KEY,
  savePilotRegistrationDraft,
  type PilotRegistrationDraft,
} from "@/lib/pilot-registration-draft";
import { appendPendingPilotRegistration } from "@/lib/admin-pilot-registration-storage";
import {
  normalizePilotSkillsForSnapshot,
  PILOT_PROFILE_STORAGE_KEY,
  PILOT_PROFILE_UPDATED_EVENT,
  replaceAbcPlaceholder,
  type PilotProfileDrone,
  type PilotProfileSnapshot,
} from "@/lib/pilot-profile-snapshot";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Personal" },
  { n: 2, label: "Skills" },
  { n: 3, label: "Drones" },
  { n: 4, label: "Review" },
] as const;

const SKILL_OPTIONS = [
  "FPV",
  "Mapping",
  "Inspection",
  "Cinematography",
  "Surveying",
  "Delivery",
] as const;

const FLIGHT_HOURS_SLIDER_MAX = 500;

const DRONE_TYPE_OPTIONS = [
  "FPV",
  "Autonomous",
  "Line of Sight",
] as const;

const DRONE_USE_CASE_OPTIONS = [
  "Survey",
  "Filming",
  "Inspection",
  "Delivery",
  "Security",
] as const;

const INDIAN_STATES_AND_UT = [
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
] as const;

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

const textareaClass =
  "min-h-[96px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

const selectClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

function emptyDrone(): PilotProfileDrone {
  return {
    id: `drone-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11)}`,
    modelName: "",
    type: "",
    camera: "",
    payloadKg: "",
    flightTimeMin: "",
    rangeKm: "",
    useCases: [],
  };
}

/** First token of model name for card title (e.g. "DJI Mavic 3" → "DJI"). */
function droneListTitle(modelName: string) {
  const t = modelName.trim();
  if (!t) return "Drone";
  return t.split(/\s+/)[0] ?? t;
}

function droneListSubtitle(d: PilotProfileDrone) {
  const parts = [d.type.trim(), d.camera.trim()].filter(Boolean);
  return parts.length ? parts.join(" • ") : "—";
}

function draftFromState(args: {
  step: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  aadhaar: string;
  dgca: string;
  selectedSkills: string[];
  flightHours: number;
  bio: string;
  drones: PilotProfileDrone[];
}): PilotRegistrationDraft {
  return {
    step: args.step,
    fullName: args.fullName,
    email: args.email,
    phone: args.phone,
    city: args.city,
    state: args.state,
    aadhaar: args.aadhaar,
    dgca: args.dgca,
    selectedSkills: args.selectedSkills,
    flightHours: args.flightHours,
    bio: args.bio,
    droneModel: "",
    droneType: "",
    droneCamera: "",
    dronePayload: "",
    droneFlightMin: "",
    droneRangeKm: "",
    droneUseCases: [],
    drones: args.drones,
  };
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
  const [flightHours, setFlightHours] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [drones, setDrones] = useState<PilotProfileDrone[]>([]);
  const [draftModel, setDraftModel] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftCamera, setDraftCamera] = useState("");
  const [draftPayload, setDraftPayload] = useState("");
  const [draftFlightMin, setDraftFlightMin] = useState("");
  const [draftRangeKm, setDraftRangeKm] = useState("");
  const [draftUseCases, setDraftUseCases] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setStep(1);
    setFullName("");
    setEmail("");
    setPhone("");
    setCity("");
    setState("");
    setAadhaar("");
    setDgca("");
    setFlightHours(0);
    setSelectedSkills([]);
    setBio("");
    setDrones([]);
    setDraftModel("");
    setDraftType("");
    setDraftCamera("");
    setDraftPayload("");
    setDraftFlightMin("");
    setDraftRangeKm("");
    setDraftUseCases([]);
    setSubmitError(null);
    setStepError(null);
  }, []);

  useEffect(() => {
    if (consumePilotRegistrationForceBlankNextOpen()) {
      resetForm();
      return;
    }
    try {
      const raw = localStorage.getItem(PILOT_REGISTRATION_DRAFT_KEY);
      const d = parsePilotRegistrationDraft(raw);
      if (!d) return;
      setStep(d.step);
      setFullName(d.fullName);
      setEmail(d.email);
      setPhone(d.phone);
      setCity(d.city);
      setState(d.state);
      setAadhaar(d.aadhaar);
      setDgca(d.dgca);
      setFlightHours(d.flightHours);
      setSelectedSkills(
        d.selectedSkills.length ? [...d.selectedSkills] : []
      );
      setBio(d.bio);
      setDrones(d.drones.length ? d.drones : []);
    } catch {
      /* ignore */
    }
  }, [resetForm]);

  useEffect(() => {
    savePilotRegistrationDraft(
      draftFromState({
        step,
        fullName,
        email,
        phone,
        city,
        state,
        aadhaar,
        dgca,
        selectedSkills,
        flightHours,
        bio,
        drones,
      })
    );
  }, [
    step,
    fullName,
    email,
    phone,
    city,
    state,
    aadhaar,
    dgca,
    selectedSkills,
    flightHours,
    bio,
    drones,
  ]);

  const aadhaarDigits = aadhaar.replace(/\D/g, "");
  const aadhaarCount = aadhaarDigits.length;

  const setAadhaarDigitsOnly = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    setAadhaar(digits);
  };

  function validatePersonal(): boolean {
    setStepError(null);
    if (!fullName.trim()) {
      setStepError("Full name is required.");
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStepError("A valid email is required.");
      return false;
    }
    if (!phone.trim()) {
      setStepError("Phone is required.");
      return false;
    }
    if (!city.trim()) {
      setStepError("City is required.");
      return false;
    }
    if (!state.trim()) {
      setStepError("State is required.");
      return false;
    }
    if (aadhaarDigits.length !== 12) {
      setStepError("Aadhaar must be exactly 12 digits.");
      return false;
    }
    return true;
  }

  function goNext() {
    setStepError(null);
    if (step === 1) {
      if (!validatePersonal()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (selectedSkills.length === 0) {
        setStepError("Select at least one skill.");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
    }
  }

  function commitDraftDrone() {
    const model = draftModel.trim();
    const type = draftType.trim();
    if (!model) {
      setStepError("Model name is required.");
      return;
    }
    if (!type) {
      setStepError("Type is required.");
      return;
    }
    const row: PilotProfileDrone = {
      ...emptyDrone(),
      modelName: model,
      type,
      camera: draftCamera.trim(),
      payloadKg: draftPayload.trim(),
      flightTimeMin: draftFlightMin.trim(),
      rangeKm: draftRangeKm.trim(),
      useCases: [...draftUseCases],
    };
    setDrones((prev) => [...prev, row]);
    setDraftModel("");
    setDraftType("");
    setDraftCamera("");
    setDraftPayload("");
    setDraftFlightMin("");
    setDraftRangeKm("");
    setDraftUseCases([]);
    setStepError(null);
  }

  function toggleDraftUseCase(label: string) {
    setDraftUseCases((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label]
    );
  }

  function goBack() {
    setStepError(null);
    if (step > 1) setStep(step - 1);
  }

  /**
   * Submit from Review (step 4), or from Skills (step 2) via “Submit” (no drone section).
   * Does not run on Enter / implicit form submit.
   */
  function submitRegistration() {
    const skipFromSkills = step === 2;
    if (step !== 4 && !skipFromSkills) return;
    const name = fullName.trim();
    const c = city.trim();
    const st = state.trim();
    if (!name || !c || !st || aadhaarDigits.length !== 12) {
      setSubmitError("Complete all required fields before submitting.");
      return;
    }
    if (selectedSkills.length === 0) {
      setSubmitError("Select at least one skill on the Skills step.");
      return;
    }
    setSubmitError(null);

    const hrsRaw = Number(flightHours);
    const hrs = Number.isFinite(hrsRaw)
      ? Math.max(0, Math.min(50000, Math.floor(hrsRaw)))
      : 0;

    const skills = normalizePilotSkillsForSnapshot([...selectedSkills]);

    let bioOut = replaceAbcPlaceholder(bio.trim());

    const dronesForSnapshot = skipFromSkills ? [] : drones;

    const snapshot: PilotProfileSnapshot = {
      fullName: replaceAbcPlaceholder(name),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      city: c,
      state: st,
      aadhaar: aadhaarDigits,
      flightHours: hrs,
      bio: bioOut,
      skills,
      drones: dronesForSnapshot,
      dgca: dgca.trim(),
    };

    appendPendingPilotRegistration(snapshot);

    const json = JSON.stringify(snapshot);
    try {
      localStorage.setItem(PILOT_PROFILE_STORAGE_KEY, json);
    } catch {
      /* quota */
    }
    sessionStorage.setItem(PILOT_PROFILE_STORAGE_KEY, json);
    markPilotRegistrationSubmittedNextOpenBlank();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(PILOT_PROFILE_UPDATED_EVENT));
    }
    router.replace("/dashboard#pilot-registrations");
  }

  return (
    <div className="relative min-h-dvh bg-slate-100/80 pt-22 text-foreground sm:pt-24">
      <div className="mx-auto max-w-lg px-4 pb-14 pt-4 sm:px-5 sm:pt-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg ring-1 ring-slate-900/5">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6 sm:py-6">
            <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "text-[#008B8B]")}>
              Pilot &amp; Drone Registration
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Join India&apos;s drone pilot network
            </p>

            {/* Stepper */}
            <nav
              className="mt-6 flex items-start justify-between gap-1"
              aria-label="Registration progress"
            >
              {STEPS.map((s, i) => {
                const active = step === s.n;
                const done = step > s.n;
                return (
                  <div
                    key={s.n}
                    className="flex min-w-0 flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      {i > 0 ? (
                        <span
                          className={cn(
                            "h-px flex-1 rounded-full",
                            done || active ? "bg-[#008B8B]" : "bg-slate-200"
                          )}
                          aria-hidden
                        />
                      ) : (
                        <span className="flex-1" aria-hidden />
                      )}
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums sm:size-9 sm:text-sm",
                          step >= s.n
                            ? "border-[#008B8B] bg-[#008B8B] text-white"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                        )}
                        aria-current={active ? "step" : undefined}
                      >
                        {s.n}
                      </span>
                      {i < STEPS.length - 1 ? (
                        <span
                          className={cn(
                            "h-px flex-1 rounded-full",
                            step > s.n ? "bg-[#008B8B]" : "bg-slate-200"
                          )}
                          aria-hidden
                        />
                      ) : (
                        <span className="flex-1" aria-hidden />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 max-w-[4.5rem] text-center text-[10px] font-semibold leading-tight sm:max-w-none sm:text-xs",
                        active
                          ? "font-bold text-slate-900"
                          : step > s.n
                            ? "text-[#008B8B]"
                            : "text-slate-400"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </nav>
          </div>

          <form
            className="space-y-4 px-5 py-5 sm:space-y-5 sm:px-6 sm:py-6"
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="full-name"
                    className="text-sm font-medium text-slate-800"
                  >
                    Full Name <RequiredMark />
                  </label>
                  <Input
                    id="full-name"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Raj Kumar"
                    className="h-10 rounded-lg border-slate-200 bg-white px-3"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-800"
                  >
                    Email <RequiredMark />
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="raj@email.com"
                    className="h-10 rounded-lg border-slate-200 bg-white px-3"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-slate-800"
                  >
                    Phone <RequiredMark />
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 rounded-lg border-slate-200 bg-white px-3"
                    autoComplete="tel"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="city"
                      className="text-sm font-medium text-slate-800"
                    >
                      City <RequiredMark />
                    </label>
                    <Input
                      id="city"
                      name="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mumbai"
                      className="h-10 rounded-lg border-slate-200 bg-white px-3"
                      autoComplete="address-level2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="state"
                      className="text-sm font-medium text-slate-800"
                    >
                      State <RequiredMark />
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={selectClass}
                      autoComplete="address-level1"
                    >
                      <option value="">Select</option>
                      {INDIAN_STATES_AND_UT.map((stName) => (
                        <option key={stName} value={stName}>
                          {stName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="aadhaar"
                    className="text-sm font-medium text-slate-800"
                  >
                    Aadhaar Number <RequiredMark />
                  </label>
                  <Input
                    id="aadhaar"
                    name="aadhaar"
                    value={aadhaar}
                    onChange={(e) => setAadhaarDigitsOnly(e.target.value)}
                    placeholder="1234 5678 9012"
                    inputMode="numeric"
                    maxLength={12}
                    className="h-10 rounded-lg border-slate-200 bg-white px-3 tabular-nums tracking-wide"
                    autoComplete="off"
                  />
                  <p className="text-xs text-slate-500">
                    Only 12 numbers allowed. {aadhaarCount}/12
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="dgca"
                    className="text-sm font-medium text-slate-800"
                  >
                    DGCA License Number{" "}
                    <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <Input
                    id="dgca"
                    name="dgca"
                    value={dgca}
                    onChange={(e) => setDgca(e.target.value)}
                    placeholder="UA-XXXXXXXXXX"
                    className="h-10 rounded-lg border-slate-200 bg-white px-3"
                    autoComplete="off"
                  />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-800">
                    Skills <RequiredMark />
                  </p>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Select skills"
                  >
                    {SKILL_OPTIONS.map((label) => {
                      const on = selectedSkills.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            setSelectedSkills((prev) =>
                              prev.includes(label)
                                ? prev.filter((x) => x !== label)
                                : [...prev, label]
                            )
                          }
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                            on
                              ? "border-[#008B8B] bg-[#008B8B]/10 text-[#006060]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="flight-hours-slider"
                    className="text-sm font-medium text-slate-800"
                  >
                    Flight Hours:{" "}
                    <span className="tabular-nums text-slate-900">
                      {Math.min(
                        FLIGHT_HOURS_SLIDER_MAX,
                        Math.max(0, Math.floor(Number(flightHours) || 0))
                      )}
                      h
                    </span>
                  </label>
                  <input
                    id="flight-hours-slider"
                    name="flightHours"
                    type="range"
                    min={0}
                    max={FLIGHT_HOURS_SLIDER_MAX}
                    step={1}
                    value={Math.min(
                      FLIGHT_HOURS_SLIDER_MAX,
                      Math.max(0, Math.floor(Number(flightHours) || 0))
                    )}
                    onChange={(e) => setFlightHours(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer rounded-full bg-slate-200 accent-[#008B8B]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">
                    Certifications{" "}
                    <span className="font-normal text-slate-500">
                      (file upload placeholder)
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled
                      className="pointer-events-none border-slate-200 text-slate-500 opacity-80"
                    >
                      Browse…
                    </Button>
                    <span className="text-sm text-slate-500">No file selected.</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Upload will be enabled when backend is connected.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="bio"
                    className="text-sm font-medium text-slate-800"
                  >
                    Brief Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell clients about your experience..."
                    className={textareaClass}
                  />
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Your Drones
                  </h2>
                  {drones.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                      No drone to list yet? You can still register — add one with
                      the form and tap{" "}
                      <span className="font-medium text-slate-700">Add Drone</span>
                      , or tap{" "}
                      <span className="font-medium text-slate-700">Next</span>{" "}
                      below to continue to the final step.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {drones.map((d) => (
                        <li
                          key={d.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {droneListTitle(d.modelName)}
                            </p>
                            <p className="truncate text-sm text-slate-500">
                              {droneListSubtitle(d)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            aria-label={`Remove ${d.modelName || "drone"}`}
                            onClick={() =>
                              setDrones((prev) =>
                                prev.filter((x) => x.id !== d.id)
                              )
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                  <h2 className="mb-4 text-sm font-semibold text-slate-900">
                    Add Drone
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="draft-model"
                        className="text-sm font-medium text-slate-800"
                      >
                        Model Name <RequiredMark />
                      </label>
                      <Input
                        id="draft-model"
                        value={draftModel}
                        onChange={(e) => setDraftModel(e.target.value)}
                        placeholder="DJI Mavic 3"
                        className="h-10 rounded-lg border-slate-200 bg-white px-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="draft-type"
                        className="text-sm font-medium text-slate-800"
                      >
                        Type <RequiredMark />
                      </label>
                      <select
                        id="draft-type"
                        value={draftType}
                        onChange={(e) => setDraftType(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select type</option>
                        {DRONE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Technical specifications
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor="draft-camera"
                          className="text-sm font-medium text-slate-800"
                        >
                          Camera
                        </label>
                        <Input
                          id="draft-camera"
                          value={draftCamera}
                          onChange={(e) => setDraftCamera(e.target.value)}
                          placeholder="4K HDR"
                          className="h-10 rounded-lg border-slate-200 bg-white px-3"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="draft-payload"
                          className="text-sm font-medium text-slate-800"
                        >
                          Payload (kg)
                        </label>
                        <Input
                          id="draft-payload"
                          value={draftPayload}
                          onChange={(e) => setDraftPayload(e.target.value)}
                          placeholder="2.5"
                          className="h-10 rounded-lg border-slate-200 bg-white px-3"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="draft-flight"
                          className="text-sm font-medium text-slate-800"
                        >
                          Flight Time (min)
                        </label>
                        <Input
                          id="draft-flight"
                          value={draftFlightMin}
                          onChange={(e) => setDraftFlightMin(e.target.value)}
                          placeholder="45"
                          className="h-10 rounded-lg border-slate-200 bg-white px-3"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="draft-range"
                          className="text-sm font-medium text-slate-800"
                        >
                          Range (km)
                        </label>
                        <Input
                          id="draft-range"
                          value={draftRangeKm}
                          onChange={(e) => setDraftRangeKm(e.target.value)}
                          placeholder="15"
                          className="h-10 rounded-lg border-slate-200 bg-white px-3"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-800">Use Cases</p>
                      <div className="flex flex-wrap gap-2">
                        {DRONE_USE_CASE_OPTIONS.map((label) => {
                          const on = draftUseCases.includes(label);
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => toggleDraftUseCase(label)}
                              className={cn(
                                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                                on
                                  ? "border-[#008B8B] bg-[#008B8B]/10 text-[#006060]"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-[#008B8B] bg-white py-5 font-semibold text-[#008B8B] hover:bg-[#008B8B]/10"
                      onClick={commitDraftDrone}
                    >
                      <Plus className="mr-2 inline size-4" aria-hidden />
                      Add Drone
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5 text-sm text-slate-700">
                <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Personal info
                  </h2>
                  <dl className="space-y-2.5">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Name</dt>
                      <dd className="text-right font-medium text-slate-900">
                        {fullName.trim() || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Email</dt>
                      <dd className="text-right font-medium text-slate-900">
                        {email.trim() || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Phone</dt>
                      <dd className="text-right font-medium text-slate-900">
                        {phone.trim() || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Location</dt>
                      <dd className="text-right font-medium text-slate-900">
                        {[city, state].filter(Boolean).join(", ") || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Aadhaar</dt>
                      <dd className="text-right font-medium tabular-nums text-slate-900">
                        {aadhaarDigits.length === 12
                          ? `****${aadhaarDigits.slice(-4)}`
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">DGCA</dt>
                      <dd className="max-w-[60%] break-all text-right font-medium text-slate-900">
                        {dgca.trim() || "—"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Skills &amp; experience
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-slate-800">
                    {Math.min(
                      FLIGHT_HOURS_SLIDER_MAX,
                      Math.max(0, Math.floor(Number(flightHours) || 0))
                    )}{" "}
                    flight hours
                  </p>
                  {bio.trim() ? (
                    <p className="mt-1 whitespace-pre-wrap text-slate-700">
                      {bio.trim()}
                    </p>
                  ) : null}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Drones ({drones.length})
                  </h2>
                  {drones.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                      None listed — you registered without equipment. You can add
                      drones to your profile later.
                    </p>
                  ) : null}
                  <ul className="space-y-3">
                    {drones.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-lg border border-teal-200/80 bg-teal-50/50 px-4 py-3"
                      >
                        <p className="font-bold text-slate-900">
                          {d.modelName.trim() || "Drone"}
                          {d.type.trim() ? (
                            <span className="font-semibold text-slate-600">
                              {" "}
                              ({d.type.trim()})
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Camera: {d.camera.trim() || "—"} •{" "}
                          {d.flightTimeMin.trim() || "—"} min •{" "}
                          {d.rangeKm.trim() || "—"} km
                        </p>
                        {d.useCases.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {d.useCases.map((uc) => (
                              <span
                                key={uc}
                                className="rounded-full border border-teal-200/60 bg-white/90 px-2.5 py-0.5 text-xs font-medium text-slate-800"
                              >
                                {uc}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : null}

            {stepError ? (
              <p className="text-sm text-red-600" role="alert">
                {stepError}
              </p>
            ) : null}
            {submitError ? (
              <p className="text-sm text-red-600" role="alert">
                {submitError}
              </p>
            ) : null}

            <div className="pt-2">
              {step === 2 ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-lg border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50"
                    onClick={goBack}
                  >
                    <ArrowLeft className="mr-1.5 inline size-4" aria-hidden />
                    Back
                  </Button>
                  <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-lg border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50"
                      onClick={submitRegistration}
                    >
                      Submit
                    </Button>
                    <Button
                      type="button"
                      onClick={goNext}
                      className="h-10 rounded-lg bg-[#008B8B] px-6 font-semibold text-white shadow-sm hover:bg-[#006b6b]"
                    >
                      Next
                      <ArrowRight className="ml-1.5 inline size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-lg border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50"
                      onClick={goBack}
                    >
                      <ArrowLeft className="mr-1.5 inline size-4" aria-hidden />
                      Back
                    </Button>
                  ) : (
                    <span />
                  )}
                  {step < 4 ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                      <Button
                        type="button"
                        onClick={goNext}
                        className="h-10 rounded-lg bg-[#008B8B] px-6 font-semibold text-white shadow-sm hover:bg-[#006b6b]"
                      >
                        Next
                        <ArrowRight
                          className="ml-1.5 inline size-4"
                          aria-hidden
                        />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className="h-10 rounded-lg bg-[#008B8B] px-6 font-semibold text-white shadow-sm hover:bg-[#006b6b]"
                      onClick={submitRegistration}
                    >
                      Submit Registration
                      <ArrowRight className="ml-1.5 inline size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
