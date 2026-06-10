"use client";

import {
  ClipboardList,
  Clock,
  Download,
  Eye,
  PackageCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProjectRequestDetailModal } from "@/components/dashboard/project-request-detail-modal";
import { UserRequestStatCard } from "@/components/dashboard/user-request-stat-card";
import { tableRequestId } from "@/components/dashboard/user-request-table";
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
  parsePostRequirementBackend,
  parsePostRequirementDesc,
} from "@/lib/post-requirement-parse";
import {
  buildPilotCommentLookupFromMissions,
  resolvePilotCommentForRequestRefs,
} from "@/lib/pilot-mission-comments-storage";
import {
  computeProjectRequestStats,
  fetchPilotProjectMissionRefs,
  filterPilotAssignedProjectRows,
} from "@/lib/pilot-project-request-scope";
import {
  isCompletedProjectRequest,
  isProjectRequirementRequest,
  projectRequestRefAliases,
  PROJECT_REQUESTS_UPDATED_EVENT,
} from "@/lib/project-requests";
import {
  MISSIONS_DB_UPDATED_EVENT,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

function projectTableCells(m: UserRequestAdminRow): {
  purpose: string;
  location: string;
  duration: string;
} {
  const p = m.projectRequirement;
  if (p) {
    return {
      purpose: p.purposeOfProject.trim() || "—",
      location: p.preferredLocation.trim() || "—",
      duration: p.expectedDuration.trim() || "—",
    };
  }
  return parsePostRequirementDesc(m.desc);
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

  const cells = projectTableCells(row);

  return {
    title:
      parsed?.projectTitle.trim() ||
      row.title?.trim() ||
      tableRequestId(row),
    phone: null as string | null,
    name: row.userName?.trim() || "—",
    email: row.userEmail?.trim() || "—",
    project: parsed,
    cells,
  };
}

function projectStatusLabel(row: UserRequestAdminRow): string {
  const raw =
    typeof row.missionStatus === "string" ? row.missionStatus.trim() : "";
  if (raw) {
    const s = raw.toLowerCase();
    if (s === "completed") return "Completed";
    return raw;
  }
  return "Completed";
}

export function CompletedProjectsView({
  showPageTitle = true,
  pilotScoped = false,
}: {
  showPageTitle?: boolean;
  /** Pilot dashboard: only show rows for the signed-in pilot. */
  pilotScoped?: boolean;
} = {}) {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const [allProjectRows, setAllProjectRows] = useState<UserRequestAdminRow[]>([]);
  const [pilotMissionRefs, setPilotMissionRefs] = useState<Set<string> | null>(
    null
  );
  const [pilotSub, setPilotSub] = useState<string | null>(null);
  const [backendRefresh, setBackendRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailRow, setDetailRow] = useState<UserRequestAdminRow | null>(null);
  const [pilotCommentByRef, setPilotCommentByRef] = useState<Map<string, string>>(
    () => new Map()
  );

  const pilotStatsRows = useMemo(() => {
    if (!pilotScoped) return allProjectRows;
    return filterPilotAssignedProjectRows(
      allProjectRows,
      pilotMissionRefs,
      pilotSub
    );
  }, [allProjectRows, pilotScoped, pilotMissionRefs, pilotSub]);

  const statsSourceRows = pilotScoped ? pilotStatsRows : allProjectRows;

  const rows = useMemo(
    () => statsSourceRows.filter(isCompletedProjectRequest),
    [statsSourceRows]
  );

  const stats = useMemo(
    () => computeProjectRequestStats(statsSourceRows),
    [statsSourceRows]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
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
          setAllProjectRows(
            data
              .filter((row) =>
                isProjectRequirementRequest(row.client_request_id)
              )
              .map(mapBackendRequestToAdminRow)
          );
        }
      } catch {
        if (!cancelled) setAllProjectRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [backendRefresh]);

  useEffect(() => {
    let cancelled = false;
    const loadMissionComments = async () => {
      try {
        const response = await fetch(apiUrl("/api/missions"), { cache: "no-store" });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const data = Array.isArray((payload as { data?: unknown[] })?.data)
          ? ((payload as { data?: unknown[] }).data as Array<{
              request_ref?: string;
              pilot_comment?: string;
            }>)
          : [];
        if (!cancelled) {
          setPilotCommentByRef(
            buildPilotCommentLookupFromMissions(
              data.filter((row) =>
                isProjectRequirementRequest(String(row.request_ref ?? ""))
              )
            )
          );
        }
      } catch {
        if (!cancelled) setPilotCommentByRef(new Map());
      }
    };
    void loadMissionComments();
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
    return () => {
      window.removeEventListener(PROJECT_REQUESTS_UPDATED_EVENT, bump);
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    };
  }, []);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (
      pathname !== "/dashboard/completed-projects" &&
      pathname !== "/pilot-dashboard/completed-projects"
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

  function handleExportCsv() {
    const header = [
      "Request ID",
      "Project Title",
      "User Name",
      "User Email Id",
      "Purpose",
      "Location",
      "Duration",
      "Status",
    ];
    const body = rows.map((row) => {
      const contact = projectRequestContact(row);
      const cells = contact.cells;
      return [
        tableRequestId(row),
        contact.title,
        contact.name,
        contact.email,
        cells.purpose,
        cells.location,
        cells.duration,
        projectStatusLabel(row),
      ];
    });
    const csv = [header, ...body]
      .map((line) =>
        line.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "completed-projects.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className={cn(
        "rounded-2xl bg-card px-4 pb-4 sm:px-6 sm:pb-6",
        showPageTitle && ADMIN_PAGE_TOP_PADDING_CLASS
      )}
      style={{
        backgroundImage: "radial-gradient(#e2e8f0 0.5px, transparent 0.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      <header className="mb-5">
        <div
          className={`flex flex-wrap items-end justify-between gap-3 ${showPageTitle ? "mb-6" : "mb-4"}`}
        >
          <div>
            {showPageTitle ? (
              <h1 className={ADMIN_PAGE_TITLE_CLASS}>Completed Project</h1>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </button>
        </div>

        <section
          className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3"
          aria-label="Project request summary: total, pending, and completed projects"
        >
          <UserRequestStatCard
            label="Total requests"
            value={stats.total}
            icon={ClipboardList}
            iconClassName="text-[#008B8B]"
            iconWrapClassName="bg-[#008B8B]/10"
          />
          <UserRequestStatCard
            label="Pending Request"
            value={stats.pending}
            icon={Clock}
            iconClassName="text-amber-700"
            iconWrapClassName="bg-amber-100"
          />
          <UserRequestStatCard
            label="Completed Projects"
            value={stats.completedDeliveries}
            icon={PackageCheck}
            iconClassName="text-sky-800"
            iconWrapClassName="bg-sky-100"
          />
        </section>
      </header>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
            Loading completed projects...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
            No completed projects yet.
          </div>
        ) : (
          rows.map((row) => {
            const pilotComment = resolvePilotCommentForRequestRefs(
              projectRequestRefAliases(row),
              pilotCommentByRef
            );

            return (
              <CompletedProjectDetailCard
                key={row.key}
                row={row}
                pilotComment={pilotComment}
                onView={() => setDetailRow(row)}
              />
            );
          })
        )}
      </section>

      {detailRow && detailContact ? (
        <ProjectRequestDetailModal
          row={detailRow}
          contact={detailContact}
          onClose={() => setDetailRow(null)}
          onAssigned={() => setBackendRefresh((n) => n + 1)}
          hideAssignPilot={pilotScoped}
        />
      ) : null}
    </section>
  );
}

function InlineProjectField({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0 text-xs leading-snug text-muted-foreground">
      <span className="font-semibold text-foreground">{label}</span>
      {" : "}
      <span className="text-foreground">{value}</span>
    </p>
  );
}

function CompletedProjectDetailCard({
  row,
  pilotComment,
  onView,
}: {
  row: UserRequestAdminRow;
  pilotComment: string;
  onView: () => void;
}) {
  const contact = projectRequestContact(row);
  const cells = contact.cells;
  const requestId = tableRequestId(row);
  const title =
    contact.title !== "—" ? contact.title : requestId !== "—" ? requestId : "Project";
  const hasUserLine = contact.name !== "—" || contact.email !== "—";
  const status = projectStatusLabel(row);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Completed project
          </p>
          <h2 className="mt-1 truncate text-sm font-semibold text-foreground">{title}</h2>
          {hasUserLine ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {contact.name !== "—" ? (
                <InlineProjectField label="User name" value={contact.name} />
              ) : null}
              {contact.email !== "—" ? (
                <InlineProjectField label="User email id" value={contact.email} />
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#008080] px-3 text-xs font-medium text-foreground transition hover:bg-[#008080]/10"
          >
            <Eye className="size-3.5 shrink-0" aria-hidden />
            View
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <InlineProjectField label="Request ID" value={requestId} />
          <InlineProjectField label="Purpose" value={cells.purpose} />
          <InlineProjectField label="Location" value={cells.location} />
          <InlineProjectField label="Duration" value={cells.duration} />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <InlineProjectField label="Status" value={status} />
          <InlineProjectField label="Project title" value={title} />
          <InlineProjectField label="Comment" value={pilotComment || "—"} />
        </div>
      </div>
    </section>
  );
}
