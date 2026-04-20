"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { appendUserRequest } from "@/lib/user-requests";
import { cn } from "@/lib/utils";

export function CreateMissionRequestForm() {
  const router = useRouter();
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

  function handleSubmitRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    appendUserRequest({
      reasonOrTitle: reasonOrTitle.trim(),
      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation.trim(),
      payloadWeightKg: payloadWeightKg.trim() || "0",
      requestType: requestType.trim(),
      requestPriority: requestPriority.trim(),
    });
    setReasonOrTitle("");
    setPickupLocation("");
    setDropLocation("");
    setPayloadWeightKg("0.0");
    setRequestType("");
    setRequestPriority("");
    router.push("/user-dashboard/my-requests");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmitRequest}>
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
