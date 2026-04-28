"use client";

import { X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

type RequestServiceModalTriggerProps = {
  reasonTitle: string;
  className?: string;
  label?: string;
  children?: ReactNode;
};

export function RequestServiceModalTrigger({
  reasonTitle,
  className,
  label = "Request",
  children,
}: RequestServiceModalTriggerProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [payloadWeightKg, setPayloadWeightKg] = useState("0.0");
  const [requestType, setRequestType] = useState("");
  const [requestPriority, setRequestPriority] = useState("");

  const closeModal = () => {
    setOpen(false);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const response = await fetch(apiUrl("/api/submit-request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason_or_title: reasonTitle,
        pickup_location: pickupLocation.trim(),
        drop_location: dropLocation.trim(),
        payload_weight: payloadWeightKg.trim() || "0",
        cargo_type: requestType.trim(),
        mission_urgency: requestPriority.trim(),
      }),
    });
    const body = await readResponseJson(response);
    if (!body.okParse || !response.ok) {
      setSubmitting(false);
      setSubmitError("Could not submit request. Please try again.");
      return;
    }

    setSubmitting(false);
    setSubmitSuccess("Request submitted successfully.");
    setPickupLocation("");
    setDropLocation("");
    setPayloadWeightKg("0.0");
    setRequestType("");
    setRequestPriority("");
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Create New Request
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={closeModal}
                className="rounded-md p-1 text-slate-600 transition hover:bg-slate-100"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]">
                  Reason or title
                </label>
                <input
                  type="text"
                  value={reasonTitle}
                  readOnly
                  className="w-full rounded-lg border border-[#c1c6d7] bg-slate-50 px-3 py-2.5 text-xs text-[#191c1d] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]">
                  Pickup location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Enter hangar or coordinates"
                  className="w-full rounded-lg border border-[#c1c6d7] bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]">
                  Drop location
                </label>
                <input
                  type="text"
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  placeholder="Enter destination"
                  className="w-full rounded-lg border border-[#c1c6d7] bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]">
                    Payload weight
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.1}
                    value={payloadWeightKg}
                    onChange={(e) => setPayloadWeightKg(e.target.value)}
                    className="w-full rounded-lg border border-[#c1c6d7] bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]">
                    Type
                  </label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-full rounded-lg border border-[#c1c6d7] bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25"
                  >
                    <option value="">Select the Type</option>
                    <option value="Medical">Medical</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Cargo">Cargo</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]">
                  Priority
                </label>
                <select
                  value={requestPriority}
                  onChange={(e) => setRequestPriority(e.target.value)}
                  className="w-full rounded-lg border border-[#c1c6d7] bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25"
                >
                  <option value="">Select the priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="express">Express</option>
                  <option value="standard">Standard</option>
                </select>
              </div>

              {submitError ? (
                <p className="text-xs text-red-600" role="alert">
                  {submitError}
                </p>
              ) : null}
              {submitSuccess ? (
                <p className="text-xs text-emerald-700" role="status">
                  {submitSuccess}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "bg-[#008B8B] text-white hover:bg-[#007a7a]",
                    submitting && "opacity-80"
                  )}
                >
                  {submitting ? "Submitting..." : "Submit the Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
