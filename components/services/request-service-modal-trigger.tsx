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

type ServiceRequestFieldErrors = {
  pickupLocation?: string;
  dropLocation?: string;
  payloadWeightKg?: string;
  requestType?: string;
  requestPriority?: string;
};

const fieldErrorClass =
  "border-red-400 focus:border-red-500 focus:ring-red-500/25";

const inputClassName =
  "w-full rounded-lg border border-[#c1c6d7] bg-card px-3 py-2.5 text-xs text-[#191c1d] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25";

function validateServiceRequestForm(
  pickupLocation: string,
  dropLocation: string,
  payloadWeightKg: string,
  requestType: string,
  requestPriority: string
): ServiceRequestFieldErrors {
  const errors: ServiceRequestFieldErrors = {};
  const pickup = pickupLocation.trim();
  const drop = dropLocation.trim();

  if (!pickup) {
    errors.pickupLocation = "Pickup location is required.";
  } else if (pickup.length < 3) {
    errors.pickupLocation = "Enter at least 3 characters.";
  }

  if (!drop) {
    errors.dropLocation = "Drop location is required.";
  } else if (drop.length < 3) {
    errors.dropLocation = "Enter at least 3 characters.";
  } else if (
    pickup &&
    drop &&
    pickup.toLowerCase() === drop.toLowerCase()
  ) {
    errors.dropLocation = "Drop location must differ from pickup.";
  }

  const weightRaw = payloadWeightKg.trim();
  const weight = Number(weightRaw);
  if (!weightRaw) {
    errors.payloadWeightKg = "Payload weight is required.";
  } else if (!Number.isFinite(weight)) {
    errors.payloadWeightKg = "Enter a valid weight in kg.";
  } else if (weight <= 0) {
    errors.payloadWeightKg = "Weight must be greater than 0 kg.";
  } else if (weight > 500) {
    errors.payloadWeightKg = "Weight cannot exceed 500 kg.";
  }

  if (!requestType.trim()) {
    errors.requestType = "Select a request type.";
  }

  if (!requestPriority.trim()) {
    errors.requestPriority = "Select a priority.";
  }

  return errors;
}

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
  const [fieldErrors, setFieldErrors] = useState<ServiceRequestFieldErrors>({});

  const closeModal = () => {
    setOpen(false);
    setSubmitError(null);
    setSubmitSuccess(null);
    setFieldErrors({});
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validateServiceRequestForm(
      pickupLocation,
      dropLocation,
      payloadWeightKg,
      requestType,
      requestPriority
    );
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
    setFieldErrors({});
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-card p-5 shadow-2xl sm:p-6">
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

            <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
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
                <label
                  htmlFor="service-request-pickup"
                  className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]"
                >
                  Pickup location
                </label>
                <input
                  id="service-request-pickup"
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => {
                    setPickupLocation(e.target.value);
                    if (fieldErrors.pickupLocation) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        pickupLocation: undefined,
                      }));
                    }
                  }}
                  placeholder="Enter hangar or coordinates"
                  aria-invalid={fieldErrors.pickupLocation ? true : undefined}
                  aria-describedby={
                    fieldErrors.pickupLocation
                      ? "service-request-pickup-error"
                      : undefined
                  }
                  className={cn(
                    inputClassName,
                    fieldErrors.pickupLocation && fieldErrorClass
                  )}
                />
                {fieldErrors.pickupLocation ? (
                  <p
                    id="service-request-pickup-error"
                    className="text-xs text-red-600"
                    role="alert"
                  >
                    {fieldErrors.pickupLocation}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="service-request-drop"
                  className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]"
                >
                  Drop location
                </label>
                <input
                  id="service-request-drop"
                  type="text"
                  value={dropLocation}
                  onChange={(e) => {
                    setDropLocation(e.target.value);
                    if (fieldErrors.dropLocation) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        dropLocation: undefined,
                      }));
                    }
                  }}
                  placeholder="Enter destination"
                  aria-invalid={fieldErrors.dropLocation ? true : undefined}
                  aria-describedby={
                    fieldErrors.dropLocation
                      ? "service-request-drop-error"
                      : undefined
                  }
                  className={cn(
                    inputClassName,
                    fieldErrors.dropLocation && fieldErrorClass
                  )}
                />
                {fieldErrors.dropLocation ? (
                  <p
                    id="service-request-drop-error"
                    className="text-xs text-red-600"
                    role="alert"
                  >
                    {fieldErrors.dropLocation}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="service-request-payload"
                    className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]"
                  >
                    Payload weight
                  </label>
                  <input
                    id="service-request-payload"
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    step={0.1}
                    value={payloadWeightKg}
                    onChange={(e) => {
                      setPayloadWeightKg(e.target.value);
                      if (fieldErrors.payloadWeightKg) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          payloadWeightKg: undefined,
                        }));
                      }
                    }}
                    aria-invalid={fieldErrors.payloadWeightKg ? true : undefined}
                    aria-describedby={
                      fieldErrors.payloadWeightKg
                        ? "service-request-payload-error"
                        : undefined
                    }
                    className={cn(
                      inputClassName,
                      fieldErrors.payloadWeightKg && fieldErrorClass
                    )}
                  />
                  {fieldErrors.payloadWeightKg ? (
                    <p
                      id="service-request-payload-error"
                      className="text-xs text-red-600"
                      role="alert"
                    >
                      {fieldErrors.payloadWeightKg}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="service-request-type"
                    className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]"
                  >
                    Type
                  </label>
                  <select
                    id="service-request-type"
                    value={requestType}
                    onChange={(e) => {
                      setRequestType(e.target.value);
                      if (fieldErrors.requestType) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          requestType: undefined,
                        }));
                      }
                    }}
                    aria-invalid={fieldErrors.requestType ? true : undefined}
                    aria-describedby={
                      fieldErrors.requestType
                        ? "service-request-type-error"
                        : undefined
                    }
                    className={cn(
                      inputClassName,
                      fieldErrors.requestType && fieldErrorClass
                    )}
                  >
                    <option value="">Select the Type</option>
                    <option value="Medical">Medical</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Cargo">Cargo</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                  {fieldErrors.requestType ? (
                    <p
                      id="service-request-type-error"
                      className="text-xs text-red-600"
                      role="alert"
                    >
                      {fieldErrors.requestType}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="service-request-priority"
                  className="text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f]"
                >
                  Priority
                </label>
                <select
                  id="service-request-priority"
                  value={requestPriority}
                  onChange={(e) => {
                    setRequestPriority(e.target.value);
                    if (fieldErrors.requestPriority) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        requestPriority: undefined,
                      }));
                    }
                  }}
                  aria-invalid={fieldErrors.requestPriority ? true : undefined}
                  aria-describedby={
                    fieldErrors.requestPriority
                      ? "service-request-priority-error"
                      : undefined
                  }
                  className={cn(
                    inputClassName,
                    fieldErrors.requestPriority && fieldErrorClass
                  )}
                >
                  <option value="">Select the priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="express">Express</option>
                  <option value="standard">Standard</option>
                </select>
                {fieldErrors.requestPriority ? (
                  <p
                    id="service-request-priority-error"
                    className="text-xs text-red-600"
                    role="alert"
                  >
                    {fieldErrors.requestPriority}
                  </p>
                ) : null}
              </div>

              {submitError ? (
                <p className="text-xs text-red-600" role="alert">
                  {submitError}
                </p>
              ) : null}
              {submitSuccess ? (
                <p className="text-xs text-foreground" role="status">
                  {submitSuccess}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="border-slate-300 bg-card text-slate-700 hover:bg-slate-50"
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
