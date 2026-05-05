"use client";

import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { appendUserRequest } from "@/lib/user-requests";
import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

export function CreateMissionRequestForm() {
  const searchParams = useSearchParams();
  const reasonPrefilled = useRef(false);
  const [reasonOrTitle, setReasonOrTitle] = useState("");

  useEffect(() => {
    if (reasonPrefilled.current) return;
    const raw = searchParams.get("reason");
    if (raw?.trim()) {
      try {
        setReasonOrTitle(decodeURIComponent(raw.trim()));
      } catch {
        setReasonOrTitle(raw.trim());
      }
      reasonPrefilled.current = true;
    }
  }, [searchParams]);
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [payloadWeightKg, setPayloadWeightKg] = useState("0.0");
  const [requestType, setRequestType] = useState("");
  const [requestPriority, setRequestPriority] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function handleSubmitRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitSuccess(false);
    const payload = {
      reason_or_title: reasonOrTitle.trim(),
      pickup_location: pickupLocation.trim(),
      drop_location: dropLocation.trim(),
      payload_weight: payloadWeightKg.trim() || "0",
      cargo_type: requestType.trim(),
      mission_urgency: requestPriority.trim(),
    };

    const response = await fetch(apiUrl("/api/submit-request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await readResponseJson(response);
    if (!body.okParse || !response.ok) {
      window.alert("Could not submit request to backend. Please try again.");
      return;
    }

    let backendRequestId: string | undefined;
    if (body.data && typeof body.data === "object" && body.data !== null) {
      const inner = (body.data as { data?: unknown }).data;
      if (inner && typeof inner === "object" && inner !== null && "id" in inner) {
        const rawId = (inner as { id: unknown }).id;
        if (rawId != null && rawId !== "") {
          backendRequestId = String(rawId);
        }
      }
    }

    appendUserRequest({
      reasonOrTitle: payload.reason_or_title,
      pickupLocation: payload.pickup_location,
      dropLocation: payload.drop_location,
      payloadWeightKg: payload.payload_weight,
      requestType: payload.cargo_type,
      requestPriority: payload.mission_urgency,
      ...(backendRequestId ? { backendRequestId } : {}),
    });
    setReasonOrTitle("");
    setPickupLocation("");
    setDropLocation("");
    setPayloadWeightKg("0.0");
    setRequestType("");
    setRequestPriority("");
    setSubmitSuccess(true);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmitRequest}>
      {submitSuccess ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-100"
        >
          <CheckCircle2
            className="size-5 shrink-0 text-emerald-600 dark:text-emerald-300"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Request submitted</p>
            <p className="mt-1 text-xs text-emerald-900/85 dark:text-emerald-100/80">
              Your request was saved. View it anytime under{" "}
              <span className="font-medium">My Request</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccess(false)}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="space-y-1.5">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f] dark:text-white/65">
          Reason or title
        </label>
        <input
          type="text"
          value={reasonOrTitle}
          onChange={(e) => setReasonOrTitle(e.target.value)}
          placeholder="Short title or reason for this request"
          className="w-full rounded-lg border border-[#c1c6d7] bg-transparent px-3 py-2.5 text-xs text-[#191c1d] placeholder:text-[#717786] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25 dark:border-white/20 dark:text-white dark:placeholder:text-white/45"
        />
      </div>
      <div className="space-y-1.5">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f] dark:text-white/65">
          Pickup location
        </label>
        <input
          type="text"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          placeholder="Enter hangar or coordinates"
          className="w-full rounded-lg border border-[#c1c6d7] bg-transparent px-3 py-2.5 text-xs text-[#191c1d] placeholder:text-[#717786] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25 dark:border-white/20 dark:text-white dark:placeholder:text-white/45"
        />
      </div>
      <div className="space-y-1.5">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f] dark:text-white/65">
          Drop location
        </label>
        <input
          type="text"
          value={dropLocation}
          onChange={(e) => setDropLocation(e.target.value)}
          placeholder="Enter destination"
          className="w-full rounded-lg border border-[#c1c6d7] bg-transparent px-3 py-2.5 text-xs text-[#191c1d] placeholder:text-[#717786] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25 dark:border-white/20 dark:text-white dark:placeholder:text-white/45"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f] dark:text-white/65">
            Payload weight
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={payloadWeightKg}
              onChange={(e) => setPayloadWeightKg(e.target.value)}
              placeholder="0.0"
              className="w-full rounded-lg border border-[#c1c6d7] bg-transparent py-2.5 pl-3 pr-12 text-xs text-[#191c1d] outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25 dark:border-white/20 dark:text-white"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#4d5b7f] dark:text-white/65">
              kg
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f] dark:text-white/65">
            Type
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-[#c1c6d7] bg-transparent py-2.5 pl-3 pr-3 text-xs outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25",
              requestType === ""
                ? "text-[#717786] dark:text-white/45"
                : "text-[#191c1d] dark:text-white",
              "dark:border-white/20"
            )}
            aria-label="Type"
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
        <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-[#4d5b7f] dark:text-white/65">
          Priority
        </label>
        <select
          value={requestPriority}
          onChange={(e) => setRequestPriority(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-[#c1c6d7] bg-transparent py-2.5 pl-3 pr-3 text-xs outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25",
            requestPriority === ""
              ? "text-[#717786] dark:text-white/45"
              : "text-[#191c1d] dark:text-white",
            "dark:border-white/20"
          )}
          aria-label="Priority"
        >
          <option value="">Select the priority</option>
          <option value="urgent">Urgent</option>
          <option value="express">Express</option>
          <option value="standard">Standard</option>
        </select>
      </div>
      <div className="pt-1">
        <button
          type="submit"
          className={cn(
            "w-full rounded-lg bg-gradient-to-r from-[#008B8B] to-[#006b6b] py-3 text-sm font-bold tracking-wide text-white shadow-md shadow-[#008B8B]/20 transition hover:opacity-[0.98] active:scale-[0.99]"
          )}
        >
          Submit the Request
        </button>
      </div>
    </form>
  );
}
