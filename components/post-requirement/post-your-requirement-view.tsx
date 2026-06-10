"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { apiUrl } from "@/lib/api-url";
import {
  POST_REQUIREMENT_DESCRIPTION_MAX,
  POST_REQUIREMENT_DURATION_OPTIONS,
  POST_REQUIREMENT_PURPOSE_OPTIONS,
} from "@/lib/post-requirement-options";
import { mapPostRequirementToSubmitPayload } from "@/lib/post-requirement-submit";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import { notifyProjectRequestsUpdated } from "@/lib/project-requests";
import { readResponseJson } from "@/lib/read-response-json";
import { resolveRequestOwnerSnapshot } from "@/lib/user-requests";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#1a2027] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/20";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#43484e]";

const sectionLegendClass =
  "flex items-center gap-2 font-[family-name:var(--font-landing-headline)] text-lg font-bold text-[#191c1d]";

function SectionLegend({ number, title }: { number: number; title: string }) {
  return (
    <legend className={sectionLegendClass}>
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#008B8B] text-sm font-bold text-white"
        aria-hidden
      >
        {number}
      </span>
      {title}
    </legend>
  );
}

const initialForm = {
  contactName: "",
  contactEmail: "",
  projectTitle: "",
  preferredLocation: "",
  projectDescription: "",
  expectedStartDate: "",
  expectedDuration: "",
  purposeOfProject: "",
};

export function PostYourRequirementView() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update(key: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    const owner = resolveRequestOwnerSnapshot();
    if (!owner.ownerName && !owner.ownerEmail) return;
    setForm((prev) => ({
      ...prev,
      contactName: prev.contactName || owner.ownerName,
      contactEmail: prev.contactEmail || owner.ownerEmail,
    }));
  }, []);

  function resetForm() {
    setForm(initialForm);
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const email = form.contactEmail.trim();
    if (!email) {
      setSubmitError("Please enter your email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    if (
      !form.projectTitle.trim() ||
      !form.preferredLocation.trim() ||
      !form.projectDescription.trim() ||
      !form.expectedStartDate.trim() ||
      !form.expectedDuration.trim() ||
      !form.purposeOfProject.trim()
    ) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    if (form.preferredLocation.trim().length < 3) {
      setSubmitError("Location must be at least 3 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const owner = resolveRequestOwnerSnapshot();
      const clientRequestId = `#PR-${Date.now().toString(36).toUpperCase()}`;
      const payload = mapPostRequirementToSubmitPayload(form, {
        clientRequestId,
        userId: owner.ownerUserId || undefined,
        userName: owner.ownerName || undefined,
        userEmail: owner.ownerEmail || undefined,
      });

      const response = await fetch(apiUrl("/api/submit-request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readResponseJson(response);
      if (!body.okParse || !response.ok) {
        let message = "Could not submit your requirement. Please try again.";
        if (body.okParse && body.data && typeof body.data === "object") {
          const err = (body.data as { error?: string }).error;
          if (typeof err === "string" && err.trim()) message = err.trim();
        }
        setSubmitError(message);
        return;
      }

      notifyProjectRequestsUpdated();
      setSubmitSuccess(true);
      resetForm();
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
        "relative flex min-h-dvh flex-col bg-white pt-22 font-[family-name:var(--font-landing-body)] text-foreground antialiased sm:pt-24"
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-10 xl:px-12",
          ADMIN_PAGE_TOP_PADDING_CLASS
        )}
      >
        <header className="mb-8">
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>Post Your Requirement</h1>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
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
                <SectionLegend number={1} title="Project Information" />
                <label className="block">
                  <span className={labelClass}>Project title *</span>
                  <input
                    type="text"
                    required
                    value={form.projectTitle}
                    onChange={(e) => update("projectTitle", e.target.value)}
                    className={fieldClass}
                    placeholder="Enter a short title for your project"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Location *</span>
                  <input
                    type="text"
                    required
                    value={form.preferredLocation}
                    onChange={(e) =>
                      update("preferredLocation", e.target.value)
                    }
                    className={fieldClass}
                    placeholder="Enter city, state or area"
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Expected start date *</span>
                    <input
                      type="date"
                      required
                      value={form.expectedStartDate}
                      onChange={(e) =>
                        update("expectedStartDate", e.target.value)
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Expected duration *</span>
                    <select
                      required
                      value={form.expectedDuration}
                      onChange={(e) =>
                        update("expectedDuration", e.target.value)
                      }
                      className={cn(
                        fieldClass,
                        !form.expectedDuration && "text-slate-500"
                      )}
                    >
                      <option value="">Select duration</option>
                      {POST_REQUIREMENT_DURATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>Purpose of project *</span>
                  <select
                    required
                    value={form.purposeOfProject}
                    onChange={(e) =>
                      update("purposeOfProject", e.target.value)
                    }
                    className={cn(
                      fieldClass,
                      !form.purposeOfProject && "text-slate-500"
                    )}
                  >
                    <option value="">Select purpose</option>
                    {POST_REQUIREMENT_PURPOSE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Project description *</span>
                  <textarea
                    required
                    maxLength={POST_REQUIREMENT_DESCRIPTION_MAX}
                    value={form.projectDescription}
                    onChange={(e) =>
                      update("projectDescription", e.target.value)
                    }
                    className={cn(fieldClass, "min-h-[120px] resize-y")}
                    placeholder="Describe your project in detail..."
                  />
                  <p className="mt-1 text-right text-xs text-slate-500">
                    {form.projectDescription.length}/
                    {POST_REQUIREMENT_DESCRIPTION_MAX}
                  </p>
                </label>
              </fieldset>

              <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                <SectionLegend number={2} title="Contact details" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Name / Company (optional)</span>
                    <input
                      type="text"
                      value={form.contactName}
                      onChange={(e) => update("contactName", e.target.value)}
                      className={fieldClass}
                      placeholder="Your name or company"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Email id *</span>
                    <input
                      type="email"
                      required
                      value={form.contactEmail}
                      onChange={(e) => update("contactEmail", e.target.value)}
                      className={fieldClass}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </label>
                </div>
              </fieldset>

              {submitError ? (
                <p className="text-sm text-red-600" role="alert">
                  {submitError}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "rounded-xl border border-[#008B8B] bg-transparent px-6 py-3.5 font-[family-name:var(--font-landing-headline)] text-sm font-black text-[#008B8B] transition-all hover:bg-[#008B8B]/5",
                    submitting && "cursor-not-allowed opacity-70"
                  )}
                >
                  {submitting ? "Submitting…" : "Submit requirement"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
