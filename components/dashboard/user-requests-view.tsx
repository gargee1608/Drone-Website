"use client";

import { cn } from "@/lib/utils";

type RequestTier = "critical" | "normal" | "routine";

type UserRequestRow = {
  id: string;
  title: string;
  tier: RequestTier;
  badgeLabel: string;
  payload: string;
  weight: string;
  target: string;
};

const REQUESTS: UserRequestRow[] = [
  {
    id: "1",
    title: "Medical Emergency",
    tier: "critical",
    badgeLabel: "CRITICAL",
    payload: "Medical cargo",
    weight: "0.2kg",
    target: "Downtown Medical",
  },
  {
    id: "2",
    title: "Medical Emergency Supply",
    tier: "critical",
    badgeLabel: "CRITICAL",
    payload: "Insulin Cool-Box",
    weight: "4.2kg",
    target: "Sector 7G Rural Clinic",
  },
  {
    id: "3",
    title: "Industrial Part Delivery",
    tier: "normal",
    badgeLabel: "NORMAL",
    payload: "Steel Coupling",
    weight: "12kg",
    target: "Port of Aerolia",
  },
  {
    id: "4",
    title: "Agricultural Mapping",
    tier: "routine",
    badgeLabel: "ROUTINE",
    payload: "Multispectral Camera",
    weight: "1.5kg",
    target: "Highland Farms",
  },
];

function badgeClass(tier: RequestTier) {
  if (tier === "critical") return "text-red-600";
  return "text-[#0058bc]";
}

export function UserRequestsView() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-xl font-bold tracking-tight text-[#191c1d] sm:text-2xl">
        User Request
      </h1>
      <p className="mt-1 text-xs text-[#4d5b7f] sm:text-[13px]">
        Payload and target for each request. Accept or reject below.
      </p>

      <ul className="mt-6 space-y-6" role="list">
        {REQUESTS.map((req) => (
          <li
            key={req.id}
            className="border-b border-[#e1e3e4] pb-6 last:border-b-0 last:pb-0"
          >
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-[#191c1d] sm:text-base">
                    {req.title}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wide sm:text-xs",
                      badgeClass(req.tier)
                    )}
                  >
                    {req.badgeLabel}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#4d5b7f] sm:text-[13px]">
                  Payload: {req.payload} ({req.weight}) · Target: {req.target}
                </p>
              </div>
              <div className="flex shrink-0 gap-2.5 sm:pt-0.5">
                <button
                  type="button"
                  className="text-xs font-semibold text-[#0058bc] underline-offset-2 hover:underline sm:text-sm"
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#4d5b7f] underline-offset-2 hover:text-[#191c1d] hover:underline sm:text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
