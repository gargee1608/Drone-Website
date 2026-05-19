"use client";

import { ClipboardList } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import {
  loadUserRequestsForCurrentUser,
  USER_REQUESTS_UPDATED_EVENT,
  userRequestQueueDisplayIdInList,
} from "@/lib/user-requests";
import {
  USER_DASH_DIVIDER_BORDER,
  USER_DASH_PANEL_BORDER,
  USER_DASH_TABLE,
  USER_DASH_TABLE_HEAD,
  USER_DASH_TABLE_TD,
  USER_DASH_TABLE_TH,
} from "@/lib/user-dashboard-styles";
import { cn } from "@/lib/utils";

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  express: "Express",
  standard: "Standard",
};

function formatPriority(value: string): string {
  if (!value) return "—";
  return priorityLabels[value] ?? value;
}

export function MyRequestsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<UserMissionRequest[]>([]);
  /** Ascending by `createdAt` — same ordering as `#RQ-…` display ids. */
  const [requestsChrono, setRequestsChrono] = useState<UserMissionRequest[]>(
    []
  );

  useEffect(() => {
    const refresh = () => {
      const mine = loadUserRequestsForCurrentUser();
      setRequestsChrono(
        [...mine].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
      setRequests(
        [...mine].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    };
    queueMicrotask(() => {
      refresh();
    });
    window.addEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(USER_REQUESTS_UPDATED_EVENT, refresh);
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || requests.length === 0) return;
    if (!requests.some((r) => r.id === id)) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(`user-my-request-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const url = new URL(window.location.href);
      if (url.searchParams.get("id") === id) {
        url.searchParams.delete("id");
        router.replace(url.pathname + (url.search ? url.search : ""), {
          scroll: false,
        });
      }
    });
  }, [searchParams, requests, router]);

  return (
    <UserDashboardShell
      pageTitle="My Request"
      pageTitleClassName="text-xl sm:text-2xl"
      pageTitleBarClassName="text-xs"
    >
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl bg-neutral-50/80 px-6 py-16 text-center dark:bg-white/[0.04]"
            )}
          >
            <ClipboardList
              className="mb-4 size-12 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-base font-semibold text-foreground">
              No requests yet
            </p>
            <p className="mt-2 max-w-sm text-xs text-muted-foreground">
              Submit a request while signed in. Only your account&apos;s
              inquiries appear here.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "overflow-hidden rounded-xl bg-card",
              USER_DASH_PANEL_BORDER
            )}
          >
            <div className="overflow-x-auto">
              <table className={USER_DASH_TABLE}>
                <colgroup>
                  <col className="w-[7rem]" />
                  <col className="w-[20%]" />
                  <col className="w-[17%]" />
                  <col className="w-[17%]" />
                  <col className="w-[10%]" />
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className={USER_DASH_TABLE_HEAD}>
                  <tr className={USER_DASH_DIVIDER_BORDER}>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Request ID
                    </th>
                    <th scope="col" className={USER_DASH_TABLE_TH}>
                      Title
                    </th>
                    <th scope="col" className={USER_DASH_TABLE_TH}>
                      Pickup
                    </th>
                    <th scope="col" className={USER_DASH_TABLE_TH}>
                      Drop
                    </th>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Payload
                    </th>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Type
                    </th>
                    <th scope="col" className={cn(USER_DASH_TABLE_TH, "whitespace-nowrap")}>
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      id={`user-my-request-${req.id}`}
                      className={cn(
                        USER_DASH_DIVIDER_BORDER,
                        "transition-colors last:border-b-0 hover:bg-neutral-50/80 dark:hover:bg-white/[0.03]"
                      )}
                    >
                      <td className={cn(USER_DASH_TABLE_TD, "whitespace-nowrap")}>
                        <span className="font-mono tabular-nums">
                          {userRequestQueueDisplayIdInList(
                            req.id,
                            requestsChrono
                          )}
                        </span>
                      </td>
                      <td className={cn(USER_DASH_TABLE_TD, "break-words font-medium")}>
                        {req.reasonOrTitle || "(No title)"}
                      </td>
                      <td className={cn(USER_DASH_TABLE_TD, "break-words")}>
                        {req.pickupLocation || "—"}
                      </td>
                      <td className={cn(USER_DASH_TABLE_TD, "break-words")}>
                        {req.dropLocation || "—"}
                      </td>
                      <td className={cn(USER_DASH_TABLE_TD, "whitespace-nowrap tabular-nums")}>
                        {req.payloadWeightKg ? `${req.payloadWeightKg} kg` : "—"}
                      </td>
                      <td className={cn(USER_DASH_TABLE_TD, "break-words")}>
                        {req.requestType || "—"}
                      </td>
                      <td className={cn(USER_DASH_TABLE_TD, "whitespace-nowrap")}>
                        {formatPriority(req.requestPriority)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </UserDashboardShell>
  );
}
