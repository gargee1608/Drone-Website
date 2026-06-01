"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { apiUrl } from "@/lib/api-url";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#1a2027] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/20";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#43484e]";

export function PostYourRequirementView() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reasonOrTitle, setReasonOrTitle] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [payloadWeightKg, setPayloadWeightKg] = useState("");
  const [requestType, setRequestType] = useState("");
  const [requestPriority, setRequestPriority] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const name = fullName.trim();
    const emailTrimmed = email.trim();
    const reason = reasonOrTitle.trim();
    const pickup = pickupLocation.trim();
    const drop = dropLocation.trim();

    if (!name || !emailTrimmed || !reason || !pickup || !drop) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    if (!requestType.trim() || !requestPriority.trim()) {
      setSubmitError("Please select type and priority.");
      return;
    }

    const weightRaw = payloadWeightKg.trim();
    const weight = Number(weightRaw);
    if (!weightRaw || !Number.isFinite(weight) || weight <= 0) {
      setSubmitError("Enter a valid payload weight in kg.");
      return;
    }

    setSubmitting(true);
    try {
      const clientRequestId = `#PR-${Date.now().toString(36).toUpperCase()}`;
      const reasonWithPhone = phone.trim()
        ? `${reason} — Phone: ${phone.trim()}`
        : reason;
      const response = await fetch(apiUrl("/api/submit-request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason_or_title: reasonWithPhone,
          pickup_location: pickup,
          drop_location: drop,
          payload_weight: weightRaw,
          cargo_type: requestType.trim(),
          mission_urgency: requestPriority.trim(),
          user_name: name,
          user_email: emailTrimmed,
          client_request_id: clientRequestId,
        }),
      });
      const body = await readResponseJson(response);
      if (!body.okParse || !response.ok) {
        setSubmitError("Could not submit your requirement. Please try again.");
        return;
      }

      setSubmitSuccess(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setReasonOrTitle("");
      setPickupLocation("");
      setDropLocation("");
      setPayloadWeightKg("");
      setRequestType("");
      setRequestPriority("");
    } catch {
      setSubmitError(
        "Could not connect to the server. Please try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        landingFontClassName,
        "relative flex min-h-dvh flex-col bg-gradient-to-br from-white via-[#f5fbfb] to-white pt-20 font-[family-name:var(--font-landing-body)] text-foreground antialiased sm:pt-24"
      )}
    >
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#008B8B] transition-colors hover:text-[#006b6b]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>

        <header className="mb-8">
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>Post Your Requirement</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Describe your drone mission needs and our operations team will
            review your request and connect you with verified pilots.
          </p>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-8">
          {submitSuccess ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950"
            >
              <CheckCircle2
                className="size-5 shrink-0 text-emerald-600"
                strokeWidth={2}
                aria-hidden
              />
              <div>
                <p className="font-semibold">Requirement submitted</p>
                <p className="mt-1 text-emerald-900/85">
                  Thank you. Our team will review your details and get in touch
                  shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-3 text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
                >
                  Submit another requirement
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <fieldset className="space-y-4">
                <legend className="font-[family-name:var(--font-landing-headline)] text-lg font-bold text-[#191c1d]">
                  Your details
                </legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={labelClass}>Full name *</span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={fieldClass}
                      placeholder="Jane Doe"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Email *</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldClass}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Phone (optional)</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={fieldClass}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                <legend className="font-[family-name:var(--font-landing-headline)] text-lg font-bold text-[#191c1d]">
                  Mission details
                </legend>
                <label className="block">
                  <span className={labelClass}>Requirement title *</span>
                  <input
                    type="text"
                    required
                    value={reasonOrTitle}
                    onChange={(e) => setReasonOrTitle(e.target.value)}
                    className={fieldClass}
                    placeholder="e.g. Agricultural survey in Pune"
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Pickup location *</span>
                    <input
                      type="text"
                      required
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className={fieldClass}
                      placeholder="Hangar or coordinates"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Drop location *</span>
                    <input
                      type="text"
                      required
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      className={fieldClass}
                      placeholder="Destination"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className={labelClass}>Payload weight (kg) *</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.1}
                      required
                      value={payloadWeightKg}
                      onChange={(e) => setPayloadWeightKg(e.target.value)}
                      className={fieldClass}
                      placeholder="0.0"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Type *</span>
                    <select
                      required
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className={cn(
                        fieldClass,
                        requestType === "" && "text-slate-500"
                      )}
                    >
                      <option value="">Select type</option>
                      <option value="Medical">Medical</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Cargo">Cargo</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Priority *</span>
                    <select
                      required
                      value={requestPriority}
                      onChange={(e) => setRequestPriority(e.target.value)}
                      className={cn(
                        fieldClass,
                        requestPriority === "" && "text-slate-500"
                      )}
                    >
                      <option value="">Select priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="express">Express</option>
                      <option value="standard">Standard</option>
                    </select>
                  </label>
                </div>
              </fieldset>

              {submitError ? (
                <p className="text-sm text-red-600" role="alert">
                  {submitError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "w-full rounded-xl bg-[#008B8B] px-6 py-3.5 font-[family-name:var(--font-landing-headline)] text-sm font-black text-white shadow-[0_14px_35px_rgba(0,139,139,0.25)] transition-all hover:bg-[#007474] sm:w-auto sm:min-w-[220px]",
                  submitting && "cursor-not-allowed opacity-70"
                )}
              >
                {submitting ? "Submitting…" : "Submit requirement"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
