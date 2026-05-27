"use client";

import { X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useServiceRequestModalOverlay } from "@/components/services/service-request-modal-overlay-context";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import {
  appendUserRequest,
  resolveRequestOwnerSnapshot,
} from "@/lib/user-requests";
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

function submitRequestErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail.trim();
    }
    if (typeof record.hint === "string" && record.hint.trim()) {
      return record.hint.trim();
    }
  }
  return fallback;
}

function extractBackendRequestId(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const inner = record.data;
  if (inner && typeof inner === "object" && inner !== null && "id" in inner) {
    const rawId = (inner as { id: unknown }).id;
    if (rawId != null && rawId !== "") return String(rawId);
  }
  return undefined;
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
  const { setServiceRequestModalOpen } = useServiceRequestModalOverlay();

  const closeModal = () => {
    setOpen(false);
    setSubmitError(null);
    setSubmitSuccess(null);
    setFieldErrors({});
  };

  useEffect(() => {
    if (!open) return;
    setServiceRequestModalOpen(true);
    return () => setServiceRequestModalOpen(false);
  }, [open, setServiceRequestModalOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

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

    const owner = resolveRequestOwnerSnapshot();
    const localRequestId = `#UR-${Date.now().toString(36).toUpperCase()}`;
    const payload = {
      reason_or_title: reasonTitle,
      pickup_location: pickupLocation.trim(),
      drop_location: dropLocation.trim(),
      payload_weight: payloadWeightKg.trim() || "0",
      cargo_type: requestType.trim(),
      mission_urgency: requestPriority.trim(),
      client_request_id: localRequestId,
      user_id: owner.ownerUserId || undefined,
      user_name: owner.ownerName || undefined,
      user_email: owner.ownerEmail || undefined,
    };

    let response: Response;
    try {
      response = await fetch(apiUrl("/api/submit-request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setSubmitting(false);
      setSubmitError(
        "Network error while submitting. Check your connection and try again."
      );
      return;
    }

    const body = await readResponseJson(response);
    if (!body.okParse || !response.ok) {
      setSubmitting(false);
      setSubmitError(
        submitRequestErrorMessage(
          body.okParse ? body.data : null,
          body.okParse
            ? "Could not submit request. Please try again."
            : "Invalid server response. Please try again."
        )
      );
      return;
    }

    const backendRequestId = extractBackendRequestId(body.data);
    appendUserRequest(
      {
        reasonOrTitle: payload.reason_or_title,
        pickupLocation: payload.pickup_location,
        dropLocation: payload.drop_location,
        payloadWeightKg: payload.payload_weight,
        requestType: payload.cargo_type,
        requestPriority: payload.mission_urgency,
        ownerUserId: owner.ownerUserId || undefined,
        ownerEmail: owner.ownerEmail || undefined,
        ownerName: owner.ownerName || undefined,
        ...(backendRequestId ? { backendRequestId } : {}),
      },
      { id: localRequestId }
    );

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

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-[calc(5.5rem+1rem)] sm:items-center sm:px-6 sm:pb-10 sm:pt-[calc(6rem+1.25rem)]">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close dialog"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-request-modal-title"
            className="relative z-10 flex max-h-[min(calc(100dvh-5.5rem-2.5rem),720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-card text-foreground shadow-2xl sm:max-h-[min(calc(100dvh-6rem-3.5rem),720px)] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2
                id="service-request-modal-title"
                className="pr-4 text-lg font-semibold text-slate-900"
              >
                Create New Request
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={closeModal}
                className="shrink-0 rounded-md p-1 text-slate-600 transition hover:bg-slate-100"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
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
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-card px-5 py-4 sm:px-6">
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
                  variant="outline"
                  disabled={submitting}
                  className={cn(
                    "border-[#008B8B] bg-transparent text-[#008B8B] hover:bg-[#008B8B]/10 hover:text-[#007a7a] dark:border-[#4ddbd9] dark:text-[#4ddbd9] dark:hover:bg-[#008B8B]/20",
                    submitting && "opacity-80"
                  )}
                >
                  {submitting ? "Submitting..." : "Submit the Request"}
                </Button>
              </div>
            </form>
          </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
