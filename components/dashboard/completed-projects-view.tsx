"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  PackageCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProjectRequestDetailModal } from "@/components/dashboard/project-request-detail-modal";
import { UserRequestStatCard } from "@/components/dashboard/user-request-stat-card";
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
import { parsePostRequirementBackend } from "@/lib/post-requirement-parse";
import {
  computeProjectRequestStats,
  fetchPilotProjectMissionRefs,
  filterPilotAssignedProjectRows,
} from "@/lib/pilot-project-request-scope";
import {
  isCompletedProjectRequest,
  isProjectRequirementRequest,
  PROJECT_REQUESTS_UPDATED_EVENT,
} from "@/lib/project-requests";
import {
  MISSIONS_DB_UPDATED_EVENT,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

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
  const [detailRow, setDetailRow] = useState<UserRequestAdminRow | null>(null);

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

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 sm:px-6",
        ADMIN_PAGE_TOP_PADDING_CLASS
      )}
    >
      {showPageTitle ? (
        <h1 className={ADMIN_PAGE_TITLE_CLASS}>Completed Project</h1>
      ) : null}

      <section
        className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
        aria-label="Project request summary: total, pending, active or assigned, and completed deliveries"
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
          label="Active / Assigned"
          value={stats.activeAssigned}
          icon={CheckCircle2}
          iconClassName="text-emerald-700"
          iconWrapClassName="bg-emerald-100"
        />
        <UserRequestStatCard
          label="Completed Projects"
          value={stats.completedDeliveries}
          icon={PackageCheck}
          iconClassName="text-sky-800"
          iconWrapClassName="bg-sky-100"
        />
      </section>

      <div className="mt-6 sm:mt-8">
        <UserRequestTable
          title="Completed projects"
          rows={rows}
          showTitle={false}
          showTotalSubtitle
          omitOuterBorder
          columnPreset="project"
          onViewDetails={setDetailRow}
        />
      </div>

      {detailRow && detailContact ? (
        <ProjectRequestDetailModal
          row={detailRow}
          contact={detailContact}
          onClose={() => setDetailRow(null)}
          onAssigned={() => setBackendRefresh((n) => n + 1)}
        />
      ) : null}
    </div>
  );
}
