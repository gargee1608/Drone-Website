"use client";

import {
  BarChart3,
  Cog,
  Rocket,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import { appendUserRequest } from "@/lib/user-requests";
import { cn } from "@/lib/utils";

const recentMissions = [
  {
    id: "#AL-9421",
    dest: "Skyport Sector 7",
    status: "IN TRANSIT" as const,
    eta: "14 mins",
    action: "Track",
  },
  {
    id: "#AL-9418",
    dest: "Downtown Medical",
    status: "COMPLETED" as const,
    eta: "—",
    action: "Report",
  },
  {
    id: "#AL-9390",
    dest: "Logistics Hub B",
    status: "REVERTED" as const,
    eta: "—",
    action: "Review",
  },
];

export function UserDashboardView() {
  const router = useRouter();
  const [reasonOrTitle, setReasonOrTitle] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [payloadWeightKg, setPayloadWeightKg] = useState("0.0");
  const [requestType, setRequestType] = useState("");
  const [requestPriority, setRequestPriority] = useState("");

  const activeUnitsCount = recentMissions.filter(
    (m) => m.status === "IN TRANSIT"
  ).length;
  const pendingTasksCount = recentMissions.filter(
    (m) => m.status !== "COMPLETED"
  ).length;

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
    <UserDashboardShell pageTitle="User Dashboard">
      <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#d8e2ff] p-2 text-[#0058bc]">
                <Rocket className="size-6" />
              </span>
              <span className="rounded-full bg-[#d8e2ff] px-2 py-1 text-xs font-bold text-[#001a41]">
                +12%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755]">
                Total Missions
              </p>
              <p
                className={cn(
                  "text-3xl font-bold text-[#191c1d]"
                )}
              >
                1,284
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#cde5ff] p-2 text-[#006195]">
                <Cog className="size-6" />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-[#414755]">
                <span className="size-2 animate-pulse rounded-full bg-green-500" />
                Live
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755]">
                Active Units
              </p>
              <p
                className={cn(
                  "text-3xl font-bold text-[#191c1d]"
                )}
              >
                {activeUnitsCount}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c1c6d7]/15 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#dae2ff] p-2 text-[#505e83]">
                <BarChart3 className="size-6" />
              </span>
              <span className="text-xs font-medium text-[#414755]">
                Queue: {pendingTasksCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#414755]">
                Pending Tasks
              </p>
              <p
                className={cn(
                  "text-3xl font-bold text-[#191c1d]"
                )}
              >
                {pendingTasksCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8 sm:mt-10">
          <section className="rounded-xl border border-[#c1c6d7]/10 bg-[#f3f4f5] p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <Settings className="size-7 text-[#0058bc]" />
              <h2
                className={cn(
                  "text-xl font-bold text-[#191c1d] sm:text-2xl"
                )}
              >
                User Request
              </h2>
            </div>
            <form className="space-y-6" onSubmit={handleSubmitRequest}>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                  Reason or title
                </label>
                <input
                  type="text"
                  value={reasonOrTitle}
                  onChange={(e) => setReasonOrTitle(e.target.value)}
                  placeholder="Short title or reason for this request"
                  className="w-full rounded-xl border border-[#c1c6d7] bg-transparent px-4 py-3 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition focus:border-[#0058bc] focus:ring-2 focus:ring-[#0058bc]/25"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                  Pickup location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Enter hangar or coordinates"
                  className="w-full rounded-xl border border-[#c1c6d7] bg-transparent px-4 py-3 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition focus:border-[#0058bc] focus:ring-2 focus:ring-[#0058bc]/25"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                  Drop location
                </label>
                <input
                  type="text"
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  placeholder="Enter destination"
                  className="w-full rounded-xl border border-[#c1c6d7] bg-transparent px-4 py-3 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition focus:border-[#0058bc] focus:ring-2 focus:ring-[#0058bc]/25"
                />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
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
                      className="w-full rounded-xl border border-[#c1c6d7] bg-transparent py-3 pl-4 pr-14 text-sm text-[#191c1d] outline-none transition focus:border-[#0058bc] focus:ring-2 focus:ring-[#0058bc]/25"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#4d5b7f]">
                      kg
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                    Type
                  </label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className={cn(
                      "w-full appearance-none rounded-xl border border-[#c1c6d7] bg-transparent bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat py-3 pl-4 pr-10 text-sm outline-none transition focus:border-[#0058bc] focus:ring-2 focus:ring-[#0058bc]/25",
                      requestType === ""
                        ? "text-[#717786]"
                        : "text-[#191c1d]"
                    )}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23414755' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    }}
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
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-[#4d5b7f]">
                  Priority
                </label>
                <select
                  value={requestPriority}
                  onChange={(e) => setRequestPriority(e.target.value)}
                  className={cn(
                    "w-full appearance-none rounded-xl border border-[#c1c6d7] bg-transparent bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat py-3 pl-4 pr-10 text-sm outline-none transition focus:border-[#0058bc] focus:ring-2 focus:ring-[#0058bc]/25",
                    requestPriority === ""
                      ? "text-[#717786]"
                      : "text-[#191c1d]"
                  )}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23414755' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  }}
                  aria-label="Priority"
                >
                  <option value="">Select the priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="express">Express</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className={cn(
                    "w-full rounded-xl bg-gradient-to-r from-[#0058bc] to-[#0070eb] py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-[#0058bc]/25 transition hover:opacity-[0.98] active:scale-[0.99]"
                  )}
                >
                  Submit the Request
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#c1c6d7]/15 bg-white">
            <div className="border-b border-[#edeeef] px-6 py-5 sm:px-8">
              <h2
                className={cn(
                  "text-lg font-bold text-[#191c1d] sm:text-xl"
                )}
              >
                Recent Mission Completed
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="bg-[#f3f4f5] text-xs font-bold uppercase tracking-widest text-[#414755]">
                  <tr>
                    <th className="px-6 py-4 sm:px-8">ID</th>
                    <th className="px-6 py-4 sm:px-8">Destination</th>
                    <th className="px-6 py-4 sm:px-8">Status</th>
                    <th className="px-6 py-4 sm:px-8">ETA</th>
                    <th className="px-6 py-4 sm:px-8">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeeef]">
                  {recentMissions.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-[#f3f4f5]"
                    >
                      <td className="px-6 py-4 font-mono text-sm text-[#0058bc] sm:px-8">
                        {row.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium sm:px-8">
                        {row.dest}
                      </td>
                      <td className="px-6 py-4 sm:px-8">
                        {row.status === "IN TRANSIT" ? (
                          <span className="inline-flex items-center rounded-full bg-[#d8e2ff] px-2.5 py-0.5 text-xs font-bold text-[#001a41]">
                            IN TRANSIT
                          </span>
                        ) : row.status === "COMPLETED" ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#ffdad6] px-2.5 py-0.5 text-xs font-bold text-[#93000a]">
                            REVERTED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium sm:px-8">
                        {row.eta}
                      </td>
                      <td className="px-6 py-4 sm:px-8">
                        <button
                          type="button"
                          className="text-sm font-bold text-[#0058bc] hover:underline"
                        >
                          {row.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </>
    </UserDashboardShell>
  );
}
