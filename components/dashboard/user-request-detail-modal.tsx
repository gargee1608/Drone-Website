"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import {
  loadUserRequests,
  mapUserRequestToAdminRow,
  userMissionAdminStatusLabel,
  userRequestQueueDisplayId,
  type UserRequestAdminRow,
  type UserMissionRequest,
} from "@/lib/user-requests";
import {
  USER_REQUEST_DEMO_MISSIONS,
  type UserRequestDemoMission,
} from "@/components/dashboard/user-request-demos";

function formatRequestSubmitted(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const priorityDisplay: Record<string, string> = {
  urgent: "Urgent",
  express: "Express",
  standard: "Standard",
};

export type UserRequestDetailPayload =
  | { kind: "user"; request: UserMissionRequest }
  | { kind: "demo"; mission: UserRequestDemoMission };

export function resolveUserRequestDetail(
  m: UserRequestAdminRow
): UserRequestDetailPayload | null {
  if (m.key.startsWith("demo-")) {
    const titleFromKey = m.key.slice("demo-".length);
    const mission = USER_REQUEST_DEMO_MISSIONS.find(
      (x) => x.title === titleFromKey
    );
    if (!mission) return null;
    return { kind: "demo", mission };
  }
  const request = loadUserRequests().find((r) => r.id === m.key);
  if (!request) return null;
  return { kind: "user", request };
}

/** True when the open detail dialog is for this table row (e.g. to close on dismiss). */
export function detailPayloadMatchesRow(
  payload: UserRequestDetailPayload,
  row: UserRequestAdminRow
): boolean {
  if (payload.kind === "user") return payload.request.id === row.key;
  return `demo-${payload.mission.title}` === row.key;
}

export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-xs font-medium text-foreground">{children}</dd>
    </div>
  );
}

export function UserRequestDetailModal({
  payload,
  onClose,
}: {
  payload: UserRequestDetailPayload | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [payload, onClose]);

  if (!payload) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-request-detail-title"
        className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-foreground shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <h2
            id="user-request-detail-title"
            className="pr-4 text-base font-bold text-foreground sm:text-lg"
          >
            Request details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {payload.kind === "user" ? (
            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <DetailField label="Request ID">
                  {userRequestQueueDisplayId(payload.request.id)}
                </DetailField>
              </div>
              <div className="sm:col-span-2">
                <DetailField label="Submitted">
                  {formatRequestSubmitted(payload.request.createdAt)}
                </DetailField>
              </div>
              {payload.request.requestSource === "marketplace_inquiry" ? (
                <div className="sm:col-span-2">
                  <DetailField label="Request category">
                    Additional Inquire (Marketplace)
                  </DetailField>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <DetailField label="Reason or title">
                  {payload.request.reasonOrTitle.trim() || "—"}
                </DetailField>
              </div>
              <DetailField label="Pickup location">
                {payload.request.pickupLocation.trim() || "—"}
              </DetailField>
              <DetailField label="Drop location">
                {payload.request.dropLocation.trim() || "—"}
              </DetailField>
              <DetailField label="Payload weight">
                {payload.request.payloadWeightKg
                  ? `${payload.request.payloadWeightKg} kg`
                  : "—"}
              </DetailField>
              <DetailField label="Type">
                {payload.request.requestType.trim() || "—"}
              </DetailField>
              <div className="sm:col-span-2">
                <DetailField label="Priority">
                  {payload.request.requestPriority
                    ? priorityDisplay[payload.request.requestPriority] ??
                      payload.request.requestPriority
                    : "—"}
                </DetailField>
              </div>
              <div className="sm:col-span-2">
                <DetailField label="List summary">
                  {mapUserRequestToAdminRow(payload.request).desc}
                </DetailField>
              </div>
              <div className="sm:col-span-2">
                <DetailField label="Admin decision">
                  {userMissionAdminStatusLabel(payload.request.adminStatus)}
                </DetailField>
              </div>
            </dl>
          ) : (
            <dl className="grid gap-5">
              <DetailField label="Mission title">
                {payload.mission.title}
              </DetailField>
              <DetailField label="Priority tier">{payload.mission.badge}</DetailField>
              <div>
                <DetailField label="Routing & payload">{payload.mission.desc}</DetailField>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Illustrative sample mission for the admin dashboard preview.
              </p>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
