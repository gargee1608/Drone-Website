"use client";

import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  appendUserRequest,
  resolveRequestOwnerSnapshot,
} from "@/lib/user-requests";
import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import { USER_DASH_INPUT_BORDER } from "@/lib/user-dashboard-styles";
import { cn } from "@/lib/utils";

const userDashFieldClass = cn(
  "w-full rounded-lg bg-input px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B]/25",
  USER_DASH_INPUT_BORDER
);

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
    const owner = resolveRequestOwnerSnapshot();
    const localRequestId = `#UR-${Date.now().toString(36).toUpperCase()}`;
    const payload = {
      reason_or_title: reasonOrTitle.trim(),
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
        <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Reason or title
        </label>
        <input
          type="text"
          value={reasonOrTitle}
          onChange={(e) => setReasonOrTitle(e.target.value)}
          placeholder="Short title or reason for this request"
          className={userDashFieldClass}
        />
      </div>
      <div className="space-y-1.5">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Pickup location
        </label>
        <input
          type="text"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          placeholder="Enter hangar or coordinates"
          className={userDashFieldClass}
        />
      </div>
      <div className="space-y-1.5">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Drop location
        </label>
        <input
          type="text"
          value={dropLocation}
          onChange={(e) => setDropLocation(e.target.value)}
          placeholder="Enter destination"
          className={userDashFieldClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
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
              className={cn(userDashFieldClass, "pl-3 pr-12")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              kg
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Type
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className={cn(
              userDashFieldClass,
              "bg-transparent",
              requestType === ""
                ? "text-muted-foreground"
                : "text-foreground"
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
        <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Priority
        </label>
        <select
          value={requestPriority}
          onChange={(e) => setRequestPriority(e.target.value)}
          className={cn(
            userDashFieldClass,
            "bg-transparent",
            requestPriority === ""
              ? "text-muted-foreground"
              : "text-foreground"
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
