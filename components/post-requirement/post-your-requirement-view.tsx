"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { apiUrl } from "@/lib/api-url";
import {
  POST_REQUIREMENT_BUDGET_OPTIONS,
  POST_REQUIREMENT_DESCRIPTION_MAX,
  POST_REQUIREMENT_DURATION_OPTIONS,
  POST_REQUIREMENT_MAX_FILE_BYTES,
  POST_REQUIREMENT_NOTES_MAX,
  POST_REQUIREMENT_PROJECT_TYPE_OPTIONS,
  POST_REQUIREMENT_PURPOSE_OPTIONS,
  POST_REQUIREMENT_SERVICE_OPTIONS,
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
  serviceCategory: "",
  projectType: "",
  preferredLocation: "",
  projectDescription: "",
  expectedStartDate: "",
  expectedDuration: "",
  budgetRange: "",
  areaOfCoverage: "",
  purposeOfProject: "",
  additionalNotes: "",
};

export function PostYourRequirementView() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
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
    setReferenceFiles([]);
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const email = form.contactEmail.trim();
    if (!form.contactName.trim() || !email) {
      setSubmitError("Please enter your name and email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    if (
      !form.projectTitle.trim() ||
      !form.serviceCategory.trim() ||
      !form.projectType.trim() ||
      !form.preferredLocation.trim() ||
      !form.projectDescription.trim() ||
      !form.expectedStartDate.trim() ||
      !form.budgetRange.trim() ||
      !form.purposeOfProject.trim()
    ) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    if (form.preferredLocation.trim().length < 3) {
      setSubmitError("Preferred location must be at least 3 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const owner = resolveRequestOwnerSnapshot();
      const clientRequestId = `#PR-${Date.now().toString(36).toUpperCase()}`;
      const payload = mapPostRequirementToSubmitPayload(
        {
          ...form,
          referenceFileNames: referenceFiles.map((f) => f.name),
        },
        {
          clientRequestId,
          userId: owner.ownerUserId || undefined,
          userName: owner.ownerName || undefined,
          userEmail: owner.ownerEmail || undefined,
        }
      );

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
                <SectionLegend number={1} title="Project information" />
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Service category *</span>
                    <select
                      required
                      value={form.serviceCategory}
                      onChange={(e) =>
                        update("serviceCategory", e.target.value)
                      }
                      className={cn(
                        fieldClass,
                        !form.serviceCategory && "text-slate-500"
                      )}
                    >
                      <option value="">Select a service</option>
                      {POST_REQUIREMENT_SERVICE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Project type *</span>
                    <select
                      required
                      value={form.projectType}
                      onChange={(e) => update("projectType", e.target.value)}
                      className={cn(
                        fieldClass,
                        !form.projectType && "text-slate-500"
                      )}
                    >
                      <option value="">Select project type</option>
                      {POST_REQUIREMENT_PROJECT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>Preferred location *</span>
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
                <label className="block">
                  <span className={labelClass}>Project description *</span>
                  <p className="mb-1.5 text-xs text-slate-500">
                    Please provide details about your requirement, objectives,
                    and expected deliverables.
                  </p>
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
                <SectionLegend number={2} title="Project details" />
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
                    <span className={labelClass}>Expected duration</span>
                    <select
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
                  <label className="block">
                    <span className={labelClass}>Budget range (INR) *</span>
                    <select
                      required
                      value={form.budgetRange}
                      onChange={(e) => update("budgetRange", e.target.value)}
                      className={cn(
                        fieldClass,
                        !form.budgetRange && "text-slate-500"
                      )}
                    >
                      <option value="">Select your budget range</option>
                      {POST_REQUIREMENT_BUDGET_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Area of coverage</span>
                    <input
                      type="text"
                      value={form.areaOfCoverage}
                      onChange={(e) =>
                        update("areaOfCoverage", e.target.value)
                      }
                      className={fieldClass}
                      placeholder="e.g. 10 Acres, 5 sq. km, 1 km Route etc."
                    />
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
              </fieldset>

              <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                <SectionLegend number={3} title="Additional information" />
                <label className="block">
                  <span className={labelClass}>
                    Upload reference files (optional)
                  </span>
                  <p className="mb-1.5 text-xs text-slate-500">
                    PDF, JPG, PNG, DOC (max. 10MB each)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className={fieldClass}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []).filter(
                        (f) => f.size <= POST_REQUIREMENT_MAX_FILE_BYTES
                      );
                      setReferenceFiles(files);
                    }}
                  />
                  {referenceFiles.length > 0 ? (
                    <p className="mt-1 text-xs text-slate-600">
                      {referenceFiles.map((f) => f.name).join(", ")}
                    </p>
                  ) : null}
                </label>
                <label className="block">
                  <span className={labelClass}>Additional notes (optional)</span>
                  <textarea
                    maxLength={POST_REQUIREMENT_NOTES_MAX}
                    value={form.additionalNotes}
                    onChange={(e) =>
                      update("additionalNotes", e.target.value)
                    }
                    className={cn(fieldClass, "min-h-[96px] resize-y")}
                    placeholder="Any additional information you would like to share..."
                  />
                  <p className="mt-1 text-right text-xs text-slate-500">
                    {form.additionalNotes.length}/{POST_REQUIREMENT_NOTES_MAX}
                  </p>
                </label>
              </fieldset>

              <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                <SectionLegend number={4} title="Contact details" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Name *</span>
                    <input
                      type="text"
                      required
                      value={form.contactName}
                      onChange={(e) => update("contactName", e.target.value)}
                      className={fieldClass}
                      placeholder="Your full name"
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
                    "rounded-xl bg-[#008B8B] px-6 py-3.5 font-[family-name:var(--font-landing-headline)] text-sm font-black text-white shadow-[0_14px_35px_rgba(0,139,139,0.25)] transition-all hover:bg-[#007474]",
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
