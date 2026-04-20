"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { clearPilotRegistrationDraft } from "@/lib/pilot-registration-draft";
import {
  normalizePilotSkillsForSnapshot,
  PILOT_PROFILE_STORAGE_KEY,
  PILOT_PROFILE_UPDATED_EVENT,
  replaceAbcPlaceholder,
  type PilotProfileSnapshot,
} from "@/lib/pilot-profile-snapshot";

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

/** Split manual skills text into a list (commas, semicolons, or new lines). */
function parseSkillsManual(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const textareaClass =
  "min-h-[96px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function PilotRegistrationView() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [dgca, setDgca] = useState("");
  const [flightHours, setFlightHours] = useState(0);
  const [skillsManual, setSkillsManual] = useState("");
  const [bio, setBio] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFullName("");
    setEmail("");
    setPhone("");
    setCity("");
    setState("");
    setAadhaar("");
    setDgca("");
    setFlightHours(0);
    setSkillsManual("");
    setBio("");
    setSubmitError(null);
  }, []);

  useEffect(() => {
    clearPilotRegistrationDraft();
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      clearPilotRegistrationDraft();
      resetForm();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [resetForm]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = fullName.trim();
    const c = city.trim();
    const st = state.trim();
    if (!name || !c || !st) {
      setSubmitError("Full name, city, and state are required.");
      return;
    }
    setSubmitError(null);

    const hrsRaw = Number(flightHours);
    const hrs = Number.isFinite(hrsRaw)
      ? Math.max(0, Math.min(50000, Math.floor(hrsRaw)))
      : 0;

    const skills = normalizePilotSkillsForSnapshot(
      parseSkillsManual(skillsManual)
    );

    const aadhaarDigits = aadhaar.replace(/\D/g, "");
    let bioOut = replaceAbcPlaceholder(bio.trim());
    if (aadhaar.trim() && aadhaarDigits.length !== 12) {
      bioOut = [bioOut, `ID / reference: ${aadhaar.trim()}`]
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }

    const snapshot: PilotProfileSnapshot = {
      fullName: replaceAbcPlaceholder(name),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      city: c,
      state: st,
      aadhaar: aadhaarDigits.length === 12 ? aadhaarDigits : undefined,
      flightHours: hrs,
      bio: bioOut,
      skills,
      drones: [],
      dgca: dgca.trim(),
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

  return (
    <div className="relative min-h-dvh bg-background pt-22 text-foreground sm:pt-24">
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-4 sm:px-5 sm:pb-14 sm:pt-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back to home
        </Link>

        <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-md ring-1 ring-slate-900/5">
          <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-4 sm:px-6 sm:py-5">
            <h1 className={ADMIN_PAGE_TITLE_CLASS}>Pilot registration</h1>
            <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
              Fill in your details manually. Everything below stays editable until
              you save.
            </p>
          </div>

          <form
            className="space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-6"
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-medium text-slate-800">
                Full name <RequiredMark />
              </label>
              <Input
                id="full-name"
                name="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="h-10 rounded-lg border-slate-200 bg-white px-3"
                autoComplete="name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-800">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 rounded-lg border-slate-200 bg-white px-3"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-800">
                  Phone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 …"
                  className="h-10 rounded-lg border-slate-200 bg-white px-3"
                  autoComplete="tel"
                />
              </div>
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
                  placeholder="City"
                  className="h-10 rounded-lg border-slate-200 bg-white px-3"
                  autoComplete="address-level2"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium text-slate-800">
                  State / region <RequiredMark />
                </label>
                <Input
                  id="state"
                  name="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State or region"
                  className="h-10 rounded-lg border-slate-200 bg-white px-3"
                  autoComplete="address-level1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="flight-hours" className="text-sm font-medium text-slate-800">
                  Flight hours (total)
                </label>
                <Input
                  id="flight-hours"
                  name="flightHours"
                  type="number"
                  min={0}
                  max={50000}
                  step={1}
                  value={Number.isFinite(flightHours) ? flightHours : 0}
                  onChange={(e) => setFlightHours(Number(e.target.value))}
                  className="h-10 rounded-lg border-slate-200 bg-white px-3 tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dgca" className="text-sm font-medium text-slate-800">
                  DGCA license (optional)
                </label>
                <Input
                  id="dgca"
                  name="dgca"
                  value={dgca}
                  onChange={(e) => setDgca(e.target.value)}
                  placeholder="License number"
                  className="h-10 rounded-lg border-slate-200 bg-white px-3"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="aadhaar" className="text-sm font-medium text-slate-800">
                Aadhaar (optional — 12 digits for masked display on profile)
              </label>
              <Input
                id="aadhaar"
                name="aadhaar"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                placeholder="12 digits, or leave blank"
                inputMode="numeric"
                className="h-10 rounded-lg border-slate-200 bg-white px-3 tabular-nums"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500">
                If you enter something other than 12 digits, it is appended to your
                notes below instead of the ID field.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="skills-manual" className="text-sm font-medium text-slate-800">
                Skills (manual)
              </label>
              <textarea
                id="skills-manual"
                name="skillsManual"
                rows={4}
                value={skillsManual}
                onChange={(e) => setSkillsManual(e.target.value)}
                placeholder="Type each skill on its own line, or separate with commas."
                className={textareaClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium text-slate-800">
                Notes / bio (optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Anything else you want on your profile…"
                className={textareaClass}
              />
            </div>

            {submitError ? (
              <p className="text-sm text-red-600" role="alert">
                {submitError}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button
                type="submit"
                className="h-11 rounded-lg bg-[#008B8B] px-8 font-semibold text-white shadow-sm hover:bg-[#006b6b]"
              >
                Save profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
