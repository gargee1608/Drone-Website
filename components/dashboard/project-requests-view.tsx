"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  PackageCheck,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProjectRequestDetailModal } from "@/components/dashboard/project-request-detail-modal";
import { AdminKpiCard } from "@/components/dashboard/admin-kpi-card";
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
  POST_REQUIREMENT_DESCRIPTION_MAX,
  POST_REQUIREMENT_DURATION_OPTIONS,
  POST_REQUIREMENT_PURPOSE_OPTIONS,
} from "@/lib/post-requirement-options";
import {
  parsePostRequirementBackend,
  type ParsedPostRequirement,
} from "@/lib/post-requirement-parse";
import { mapPostRequirementToSubmitPayload } from "@/lib/post-requirement-submit";
import {
  computeProjectRequestStats,
  fetchPilotProjectMissionRefs,
  filterPilotAssignedProjectRows,
} from "@/lib/pilot-project-request-scope";
import { PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT } from "@/lib/pilot-mission-notifications";
import {
  isCompletedProjectRequest,
  isProjectRequirementRequest,
  notifyProjectRequestsUpdated,
  PROJECT_REQUESTS_UPDATED_EVENT,
} from "@/lib/project-requests";
import {
  MISSIONS_DB_UPDATED_EVENT,
  normalizeUserMissionAdminStatus,
  type UserMissionAdminStatus,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

type ProjectEditForm = ParsedPostRequirement & {
  adminStatus: UserMissionAdminStatus;
};

const editFieldClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/35 dark:border-white/20 dark:bg-black dark:text-white";

const editLabelClass =
  "mb-1 block text-xs font-semibold text-muted-foreground";

function EditField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className={editLabelClass}>
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={editFieldClass}
      />
    </label>
  );
}

function projectRequestContact(row: UserRequestAdminRow) {
  const parsed =
    row.projectRequirement ??
    (row.backendRequest
      ? parsePostRequirementBackend({
          reason_or_title: row.backendRequest.reasonOrTitle,
          pickup_location: row.backendRequest.pickupLocation,
          drop_location: row.backendRequest.dropLocation,
          cargo_type: row.backendRequest.cargoType,
          user_name: row.userName,
          user_email: row.userEmail,
        })
      : null);

  return {
    title: parsed?.projectTitle.trim() || row.title,
    phone: null as string | null,
    name: row.userName?.trim() || "—",
    email: row.userEmail?.trim() || "—",
    project: parsed,
  };
}

function rowToEditForm(row: UserRequestAdminRow): ProjectEditForm {
  const parsed =
    row.projectRequirement ??
    parsePostRequirementBackend({
      reason_or_title: row.backendRequest?.reasonOrTitle,
      pickup_location: row.backendRequest?.pickupLocation,
      drop_location: row.backendRequest?.dropLocation,
      cargo_type: row.backendRequest?.cargoType,
      user_name: row.userName,
      user_email: row.userEmail,
    });

  return {
    ...parsed,
    adminStatus: row.backendRequest?.adminStatus ?? "pending",
  };
}

export function ProjectRequestsView({
  showPageTitle = true,
  pilotScoped = false,
}: {
  showPageTitle?: boolean;
  /** Pilot dashboard: only show project requests assigned to the signed-in pilot. */
  pilotScoped?: boolean;
} = {}) {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const [rows, setRows] = useState<UserRequestAdminRow[]>([]);
  const [pilotMissionRefs, setPilotMissionRefs] = useState<Set<string> | null>(
    null
  );
  const [pilotSub, setPilotSub] = useState<string | null>(null);
  const [backendRefresh, setBackendRefresh] = useState(0);
  const [detailRow, setDetailRow] = useState<UserRequestAdminRow | null>(null);
  const [editingRequest, setEditingRequest] = useState<UserRequestAdminRow | null>(
    null
  );
  const [requestEditForm, setRequestEditForm] = useState<ProjectEditForm | null>(
    null
  );
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
    if (!pilotScoped) {
      setPilotMissionRefs(null);
      setPilotSub(null);
      return;
    }

    let cancelled = false;
    async function loadPilotMissions() {
      try {
        const { pilotSub: currentPilotSub, refs } =
          await fetchPilotProjectMissionRefs();
        if (!cancelled) {
          setPilotSub(currentPilotSub);
          setPilotMissionRefs(refs);
        }
      } catch {
        if (!cancelled) {
          setPilotSub(null);
          setPilotMissionRefs(new Set());
        }
      }
    }

    void loadPilotMissions();
    return () => {
      cancelled = true;
    };
  }, [pilotScoped, backendRefresh]);

  useEffect(() => {
    const bump = () => setBackendRefresh((n) => n + 1);
    window.addEventListener(PROJECT_REQUESTS_UPDATED_EVENT, bump);
    window.addEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    if (pilotScoped) {
      window.addEventListener(PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT, bump);
    }
    return () => {
      window.removeEventListener(PROJECT_REQUESTS_UPDATED_EVENT, bump);
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
      if (pilotScoped) {
        window.removeEventListener(
          PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT,
          bump
        );
      }
    };
  }, [pilotScoped]);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (
      pathname !== "/dashboard/project-requests" &&
      pathname !== "/pilot-dashboard/project-requests"
    ) {
      return;
    }
    if (prev !== null && prev !== pathname) {
      setBackendRefresh((n) => n + 1);
    }
  }, [pathname]);

  const detailContact = useMemo(
    () => (detailRow ? projectRequestContact(detailRow) : null),
    [detailRow]
  );

  const scopedRows = useMemo(() => {
    if (!pilotScoped) return rows;
    return filterPilotAssignedProjectRows(rows, pilotMissionRefs, pilotSub);
  }, [rows, pilotScoped, pilotMissionRefs, pilotSub]);

  const openProjectRows = useMemo(
    () => scopedRows.filter((row) => !isCompletedProjectRequest(row)),
    [scopedRows]
  );

  const stats = useMemo(
    () => computeProjectRequestStats(scopedRows),
    [scopedRows]
  );

  const openRequestEdit = (row: UserRequestAdminRow) => {
    if (!row.backendRequest?.id) {
      alert("This request cannot be edited because it is not linked to a database row.");
      return;
    }
    setEditingRequest(row);
    setRequestEditForm(rowToEditForm(row));
    setRequestEditError(null);
  };

  const updateEditForm = <K extends keyof ProjectEditForm>(
    key: K,
    value: ProjectEditForm[K]
  ) => {
    setRequestEditForm((form) => (form ? { ...form, [key]: value } : form));
  };

  const saveRequestEdit = async () => {
    const id = editingRequest?.backendRequest?.id;
    const form = requestEditForm;
    if (!id || !form) return;

    if (!form.contactEmail.trim()) {
      setRequestEditError("Email is required.");
      return;
    }

    if (
      !form.projectTitle.trim() ||
      !form.preferredLocation.trim() ||
      !form.projectDescription.trim() ||
      !form.expectedStartDate.trim() ||
      !form.expectedDuration.trim() ||
      !form.purposeOfProject.trim()
    ) {
      setRequestEditError("Please fill in all required project fields.");
      return;
    }

    setRequestSaving(true);
    setRequestEditError(null);
    try {
      const payload = mapPostRequirementToSubmitPayload(form, {
        clientRequestId:
          editingRequest.queueDisplayId ??
          `#PR-${Date.now().toString(36).toUpperCase()}`,
      });

      const response = await fetch(apiUrl(`/api/requests/${encodeURIComponent(id)}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          admin_status: form.adminStatus,
        }),
      });
      if (!response.ok) {
        throw new Error("Could not update request.");
      }
      setEditingRequest(null);
      setRequestEditForm(null);
      setBackendRefresh((n) => n + 1);
      notifyProjectRequestsUpdated();
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
      notifyProjectRequestsUpdated();
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
      {showPageTitle ? (
        <h1 className={ADMIN_PAGE_TITLE_CLASS}>Project Requests</h1>
      ) : null}

      <section
        className="mt-6 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4"
        aria-label="Project request summary: total, pending, active or assigned, and completed deliveries"
      >
        <AdminKpiCard
          title="Total requests"
          value={stats.total}
          icon={ClipboardList}
          iconClassName="text-[#008B8B]"
          iconBg="bg-gradient-to-br from-[#008B8B]/15 to-[#008B8B]/5"
          accentClass="bg-gradient-to-r from-[#008B8B] to-[#00b4b4]"
        />
        <AdminKpiCard
          title="Pending Request"
          value={stats.pending}
          icon={Clock}
          iconClassName="text-[#ba1a1a]"
          iconBg="bg-gradient-to-br from-[#ffdad6] to-[#ffdad6]/40 dark:from-red-950/60 dark:to-red-950/30"
          accentClass="bg-gradient-to-r from-[#ba1a1a] to-[#e53935]"
        />
        <AdminKpiCard
          title="Active / Assigned"
          value={stats.activeAssigned}
          icon={CheckCircle2}
          iconClassName="text-green-700 dark:text-green-400"
          iconBg="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/50 dark:to-green-950/20"
          accentClass="bg-gradient-to-r from-green-600 to-emerald-400"
        />
        <AdminKpiCard
          title="Completed Projects"
          value={stats.completedDeliveries}
          icon={PackageCheck}
          iconClassName="text-sky-800 dark:text-sky-300"
          iconBg="bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-950/50 dark:to-sky-950/20"
          accentClass="bg-gradient-to-r from-sky-600 to-sky-400"
        />
      </section>

      <div className="mt-6 sm:mt-8">
        <UserRequestTable
          title="Project requests"
          rows={openProjectRows}
          showTitle={false}
          showTotalSubtitle
          omitOuterBorder
          columnPreset="project"
          onViewDetails={setDetailRow}
          onEditRequest={pilotScoped ? undefined : openRequestEdit}
          onDeleteRequest={pilotScoped ? undefined : deleteRequest}
        />
      </div>

      {detailRow && detailContact ? (
        <ProjectRequestDetailModal
          row={detailRow}
          contact={detailContact}
          onClose={() => setDetailRow(null)}
          onAssigned={() => setBackendRefresh((n) => n + 1)}
          hideAssignPilot={pilotScoped}
        />
      ) : null}

      {!pilotScoped && editingRequest && requestEditForm ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
            aria-label="Close edit project request dialog"
            onClick={() => {
              setEditingRequest(null);
              setRequestEditForm(null);
            }}
          />
          <div className="relative z-10 max-h-[min(92dvh,44rem)] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-border bg-white p-5 text-foreground shadow-2xl sm:rounded-2xl sm:p-6 dark:border-white/20 dark:bg-black dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Edit project request
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Same fields as Post Your Requirement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRequest(null);
                  setRequestEditForm(null);
                }}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-bold text-foreground">
                  1. Project Information
                </legend>
                <EditField
                  label="Project title"
                  required
                  value={requestEditForm.projectTitle}
                  onChange={(v) => updateEditForm("projectTitle", v)}
                />
                <EditField
                  label="Location"
                  required
                  value={requestEditForm.preferredLocation}
                  onChange={(v) => updateEditForm("preferredLocation", v)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className={editLabelClass}>Expected start date *</span>
                    <input
                      type="date"
                      value={requestEditForm.expectedStartDate}
                      onChange={(e) =>
                        updateEditForm("expectedStartDate", e.target.value)
                      }
                      className={editFieldClass}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className={editLabelClass}>Expected duration *</span>
                    <select
                      value={requestEditForm.expectedDuration}
                      onChange={(e) =>
                        updateEditForm("expectedDuration", e.target.value)
                      }
                      className={editFieldClass}
                    >
                      <option value="">Select duration</option>
                      {POST_REQUIREMENT_DURATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-sm">
                  <span className={editLabelClass}>Purpose of project *</span>
                  <select
                    value={requestEditForm.purposeOfProject}
                    onChange={(e) =>
                      updateEditForm("purposeOfProject", e.target.value)
                    }
                    className={editFieldClass}
                  >
                    <option value="">Select purpose</option>
                    {POST_REQUIREMENT_PURPOSE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className={editLabelClass}>Project description *</span>
                  <textarea
                    value={requestEditForm.projectDescription}
                    maxLength={POST_REQUIREMENT_DESCRIPTION_MAX}
                    onChange={(e) =>
                      updateEditForm("projectDescription", e.target.value)
                    }
                    className={cn(editFieldClass, "min-h-[88px] resize-y")}
                  />
                </label>
                <label className="block text-sm">
                  <span className={editLabelClass}>Admin status</span>
                  <select
                    value={requestEditForm.adminStatus}
                    onChange={(e) =>
                      updateEditForm(
                        "adminStatus",
                        normalizeUserMissionAdminStatus(e.target.value)
                      )
                    }
                    className={editFieldClass}
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              </fieldset>

              <fieldset className="space-y-3 border-t border-border pt-5">
                <legend className="text-sm font-bold text-foreground">
                  2. Contact details
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditField
                    label="Name / Company (optional)"
                    value={requestEditForm.contactName}
                    onChange={(v) => updateEditForm("contactName", v)}
                  />
                  <EditField
                    label="Email id"
                    required
                    value={requestEditForm.contactEmail}
                    onChange={(v) => updateEditForm("contactEmail", v)}
                  />
                </div>
              </fieldset>
            </div>

            {requestEditError ? (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {requestEditError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingRequest(null);
                  setRequestEditForm(null);
                }}
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
