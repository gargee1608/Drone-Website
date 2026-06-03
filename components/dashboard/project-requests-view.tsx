"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProjectRequestDetailModal } from "@/components/dashboard/project-request-detail-modal";
import { UserRequestTable } from "@/components/dashboard/user-request-table";
import { apiUrl } from "@/lib/api-url";
import {
  type BackendDroneHireRequestRow,
  mapBackendRequestToAdminRow,
} from "@/lib/drone-hire-request-admin-map";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import {
  isProjectRequirementRequest,
  parseRequirementReasonWithPhone,
  PROJECT_REQUESTS_UPDATED_EVENT,
} from "@/lib/project-requests";
import {
  MISSIONS_DB_UPDATED_EVENT,
  normalizeUserMissionAdminStatus,
  type UserMissionAdminStatus,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

type RequestEditForm = {
  reasonOrTitle: string;
  pickupLocation: string;
  dropLocation: string;
  payloadWeight: string;
  cargoType: string;
  missionUrgency: string;
  adminStatus: UserMissionAdminStatus;
};

function RequestField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/35 dark:border-white/20 dark:bg-black dark:text-white"
      />
    </label>
  );
}

function projectRequestContact(row: UserRequestAdminRow) {
  const reason = row.backendRequest?.reasonOrTitle ?? row.title;
  const { title, phone } = parseRequirementReasonWithPhone(reason);
  return {
    title,
    phone,
    name: row.userName?.trim() || "—",
    email: row.userEmail?.trim() || "—",
  };
}

export function ProjectRequestsView() {
  const router = useRouter();
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const [rows, setRows] = useState<UserRequestAdminRow[]>([]);
  const [backendRefresh, setBackendRefresh] = useState(0);
  const [detailRow, setDetailRow] = useState<UserRequestAdminRow | null>(null);
  const [editingRequest, setEditingRequest] = useState<UserRequestAdminRow | null>(
    null
  );
  const [requestEditForm, setRequestEditForm] = useState<RequestEditForm>({
    reasonOrTitle: "",
    pickupLocation: "",
    dropLocation: "",
    payloadWeight: "",
    cargoType: "",
    missionUrgency: "normal",
    adminStatus: "pending",
  });
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestEditError, setRequestEditError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(apiUrl("/api/requests"), {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const data = Array.isArray((payload as { data?: unknown[] })?.data)
          ? ((payload as { data?: unknown[] }).data as BackendDroneHireRequestRow[])
          : [];
        if (!cancelled) {
          setRows(
            data
              .filter((row) =>
                isProjectRequirementRequest(row.client_request_id)
              )
              .map(mapBackendRequestToAdminRow)
          );
        }
      } catch {
        if (!cancelled) setRows([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [backendRefresh]);

  useEffect(() => {
    const bump = () => setBackendRefresh((n) => n + 1);
    window.addEventListener(PROJECT_REQUESTS_UPDATED_EVENT, bump);
    window.addEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    return () => {
      window.removeEventListener(PROJECT_REQUESTS_UPDATED_EVENT, bump);
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    };
  }, []);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (pathname !== "/dashboard/project-requests") return;
    if (prev !== null && prev !== pathname) {
      setBackendRefresh((n) => n + 1);
    }
  }, [pathname]);

  const detailContact = useMemo(
    () => (detailRow ? projectRequestContact(detailRow) : null),
    [detailRow]
  );

  const openRequestEdit = (row: UserRequestAdminRow) => {
    if (!row.backendRequest?.id) {
      alert("This request cannot be edited because it is not linked to a database row.");
      return;
    }
    setEditingRequest(row);
    const backend = row.backendRequest;
    setRequestEditForm({
      reasonOrTitle: backend.reasonOrTitle,
      pickupLocation: backend.pickupLocation,
      dropLocation: backend.dropLocation,
      payloadWeight: backend.payloadWeight,
      cargoType: backend.cargoType,
      missionUrgency: backend.missionUrgency,
      adminStatus: backend.adminStatus,
    });
    setRequestEditError(null);
  };

  const saveRequestEdit = async () => {
    const id = editingRequest?.backendRequest?.id;
    if (!id) return;
    if (!requestEditForm.reasonOrTitle.trim()) {
      setRequestEditError("Requirement title is required.");
      return;
    }
    setRequestSaving(true);
    setRequestEditError(null);
    try {
      const response = await fetch(apiUrl(`/api/requests/${encodeURIComponent(id)}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason_or_title: requestEditForm.reasonOrTitle.trim(),
          pickup_location: requestEditForm.pickupLocation.trim(),
          drop_location: requestEditForm.dropLocation.trim(),
          payload_weight: requestEditForm.payloadWeight.trim(),
          cargo_type: requestEditForm.cargoType.trim(),
          mission_urgency: requestEditForm.missionUrgency,
          admin_status: requestEditForm.adminStatus,
        }),
      });
      if (!response.ok) {
        throw new Error("Could not update request.");
      }
      setEditingRequest(null);
      setBackendRefresh((n) => n + 1);
    } catch (error) {
      setRequestEditError(
        error instanceof Error ? error.message : "Could not update request."
      );
    } finally {
      setRequestSaving(false);
    }
  };

  const deleteRequest = async (row: UserRequestAdminRow) => {
    const id = row.backendRequest?.id;
    if (!id) {
      alert("This request cannot be deleted because it is not linked to a database row.");
      return;
    }
    const ok = window.confirm(`Delete project request "${row.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      const response = await fetch(apiUrl(`/api/requests/${encodeURIComponent(id)}`), {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Could not delete request.");
      }
      setBackendRefresh((n) => n + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete request.");
    }
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 sm:px-6",
        ADMIN_PAGE_TOP_PADDING_CLASS
      )}
    >
      <h1 className={ADMIN_PAGE_TITLE_CLASS}>Project Requests</h1>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
        Requirements submitted from{" "}
        <button
          type="button"
          className="font-semibold text-[#008B8B] underline-offset-2 hover:underline"
          onClick={() => router.push("/post-your-requirement")}
        >
          Post Your Requirement
        </button>{" "}
        appear here for review.
      </p>

      <div className="mt-6 sm:mt-8">
        <UserRequestTable
          title="Project requests"
          rows={rows}
          showTitle
          showTotalSubtitle
          onViewDetails={setDetailRow}
          onEditRequest={openRequestEdit}
          onDeleteRequest={deleteRequest}
        />
      </div>

      {detailRow && detailContact ? (
        <ProjectRequestDetailModal
          row={detailRow}
          contact={detailContact}
          onClose={() => setDetailRow(null)}
        />
      ) : null}

      {editingRequest ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
            aria-label="Close edit project request dialog"
            onClick={() => setEditingRequest(null)}
          />
          <div className="relative z-10 max-h-[min(92dvh,44rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-white p-5 text-foreground shadow-2xl sm:rounded-2xl sm:p-6 dark:border-white/20 dark:bg-black dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Edit project request
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updates the requirement shown on this page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <RequestField
                label="Requirement title"
                value={requestEditForm.reasonOrTitle}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, reasonOrTitle: value }))
                }
              />
              <RequestField
                label="Cargo type"
                value={requestEditForm.cargoType}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, cargoType: value }))
                }
              />
              <RequestField
                label="Pickup location"
                value={requestEditForm.pickupLocation}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, pickupLocation: value }))
                }
              />
              <RequestField
                label="Drop location"
                value={requestEditForm.dropLocation}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, dropLocation: value }))
                }
              />
              <RequestField
                label="Payload weight (kg)"
                value={requestEditForm.payloadWeight}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, payloadWeight: value }))
                }
              />
              <RequestField
                label="Priority"
                value={requestEditForm.missionUrgency}
                onChange={(value) =>
                  setRequestEditForm((form) => ({ ...form, missionUrgency: value }))
                }
              />
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Admin status
                </span>
                <select
                  value={requestEditForm.adminStatus}
                  onChange={(e) =>
                    setRequestEditForm((form) => ({
                      ...form,
                      adminStatus: normalizeUserMissionAdminStatus(
                        e.target.value
                      ),
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground dark:border-white/20 dark:bg-black dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
            </div>

            {requestEditError ? (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {requestEditError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestSaving}
                onClick={() => void saveRequestEdit()}
                className="rounded-lg bg-[#008B8B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007474] disabled:opacity-60"
              >
                {requestSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
