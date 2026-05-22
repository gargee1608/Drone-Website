"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PilotSettingsAddDronePanel } from "@/components/settings/pilot-settings-add-drone-panel";
import { notifyAdminFleetUpdated } from "@/lib/admin-fleet-updated";
import { apiUrl } from "@/lib/api-url";
import { syncPilotDronesToProfile } from "@/lib/load-pilot-drones";
import { cn } from "@/lib/utils";

const OPEN_REQUEST_TH_CLASS =
  "px-2.5 py-2 align-middle text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-wider";
const OPEN_REQUEST_TD_CLASS =
  "min-w-0 px-2.5 py-2 align-middle text-[10px] leading-snug text-foreground sm:px-3 sm:py-2 sm:text-[11px]";
const OPEN_REQUEST_DRONE_FORM_LABEL_CLASS =
  "mb-1 block text-xs font-medium text-foreground";
const OPEN_REQUEST_DRONE_FORM_FIELD_CLASS =
  "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#008B8B]";
const OPEN_REQUEST_DRONE_FORM_BTN_CANCEL_CLASS =
  "h-8 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted";
const OPEN_REQUEST_DRONE_FORM_BTN_SAVE_CLASS =
  "h-8 rounded-lg border border-[#008B8B] bg-transparent px-3 text-xs font-medium text-[#008B8B] transition-colors hover:bg-[#008B8B]/10";

type OpenRequestTableColumn = {
  header: string;
  align?: "left" | "center";
  cell: ReactNode;
};

function OpenRequestDetailTable({
  title,
  subtitle,
  columns,
  minWidth = "min-w-[720px]",
}: {
  title: string;
  subtitle: string;
  columns: OpenRequestTableColumn[];
  minWidth?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-3 sm:p-4">
      <h2 className="mb-1 text-base font-bold text-foreground sm:text-lg">{title}</h2>
      <p className="mb-2 text-xs font-semibold text-foreground sm:mb-3 sm:text-[13px]">
        {subtitle}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border/90">
        <table
          className={cn(
            "w-full table-fixed border-collapse text-left leading-snug",
            minWidth
          )}
        >
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {columns.map((col) => (
                <th
                  key={col.header}
                  scope="col"
                  className={cn(
                    OPEN_REQUEST_TH_CLASS,
                    col.align === "center" ? "text-center" : "text-left"
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={cn(
                    OPEN_REQUEST_TD_CLASS,
                    col.align === "center" ? "text-center" : "text-left"
                  )}
                >
                  {col.cell}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function openRequestDisplayId(id: number): string {
  return `#RQ-${id}`;
}

function openRequestStatusBadge(status: string) {
  const normalized = status.trim().toLowerCase();
  const className =
    normalized === "pending"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
      : normalized === "completed"
        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center justify-center rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide sm:text-[9px]",
        className
      )}
    >
      {status}
    </span>
  );
}

interface UserRequest {
  id: number;
  pilot_id: number;
  pilot_name: string;
  request_type: string;
  description: string;
  pilot_details?: {
    fullName?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    flightHours?: string;
    dgca?: string;
    bio?: string;
    skills?: string[];
  };
  status: string;
  created_at: string;
}

type PilotBackendRow = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  drone_details?: unknown;
  drone_id?: unknown;
  drone_name?: unknown;
  camera?: unknown;
  use_cases?: unknown;
  payload?: unknown;
  flight_time?: unknown;
  range_km?: unknown;
};

type DroneBackendRow = {
  id?: unknown;
  pilot_id?: unknown;
  pilot_name?: unknown;
  model_name?: unknown;
  type?: unknown;
  camera?: unknown;
  max_payload_kg?: unknown;
  flight_time_min?: unknown;
  max_range_km?: unknown;
  use_cases?: unknown;
};

type PilotProfileDroneRow = {
  id?: unknown;
  modelName?: unknown;
  model_name?: unknown;
  type?: unknown;
  camera?: unknown;
  payloadKg?: unknown;
  payload_kg?: unknown;
  flightTimeMin?: unknown;
  flight_time_min?: unknown;
  rangeKm?: unknown;
  range_km?: unknown;
  useCases?: unknown;
  use_cases?: unknown;
};

type AdminPilotDroneTableRow = {
  key: string;
  sourceKind: "fleet" | "profile" | "assigned";
  profileIndex?: number;
  pilotId: string;
  pilotName: string;
  pilotEmail: string;
  droneId: string;
  modelName: string;
  type: string;
  camera: string;
  payloadKg: string;
  flightTimeMin: string;
  rangeKm: string;
  useCases: string;
};

type DroneEditForm = {
  modelName: string;
  type: string;
  camera: string;
  payloadKg: string;
  flightTimeMin: string;
  rangeKm: string;
  useCases: string;
};

function textValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function emptyIfDash(value: string): string {
  return value === "—" ? "" : value;
}

function displayValue(value: unknown): string {
  return textValue(value) || "—";
}

function formatDroneMetric(
  value: string,
  unit: "kg" | "min" | "km"
): string {
  if (value === "—") return value;
  const suffix =
    unit === "kg" ? " kg" : unit === "min" ? " min" : " km";
  if (value.toLowerCase().includes(unit)) return value;
  return `${value}${suffix}`;
}

function InlineDroneField({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0 text-xs leading-snug text-muted-foreground">
      <span className="font-semibold text-foreground">{label}</span>
      {" : "}
      <span className="text-foreground">{value}</span>
    </p>
  );
}

function AdminDroneDetailCard({
  row,
  deleting,
  onEdit,
  onDelete,
}: {
  row: AdminPilotDroneTableRow;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Drone details
          </p>
          <h2 className="mt-1 truncate text-sm font-semibold text-foreground">
            {row.modelName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{row.pilotName}</span>
            {row.pilotEmail !== "—" ? (
              <>
                <span className="mx-1.5 text-border">·</span>
                <span className="break-all">{row.pilotEmail}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-8 rounded-lg border border-[#008080] px-3 text-xs font-medium text-foreground transition hover:bg-[#008080]/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="h-8 rounded-lg border border-red-300 bg-transparent px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <InlineDroneField label="Pilot ID" value={row.pilotId} />
          <InlineDroneField label="Drone ID" value={row.droneId} />
          <InlineDroneField label="Type" value={row.type} />
          <InlineDroneField label="Camera" value={row.camera} />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <InlineDroneField
            label="Payload"
            value={formatDroneMetric(row.payloadKg, "kg")}
          />
          <InlineDroneField
            label="Flight time"
            value={formatDroneMetric(row.flightTimeMin, "min")}
          />
          <InlineDroneField
            label="Range"
            value={formatDroneMetric(row.rangeKm, "km")}
          />
          <InlineDroneField label="Use cases" value={row.useCases} />
        </div>
      </div>
    </section>
  );
}

function arrayPayload<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const data = (value as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
    const rows = (value as { rows?: unknown }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

function numericId(value: unknown): number | null {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

function useCasesText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(textValue).filter(Boolean).join(", ") || "—";
  }
  return displayValue(value);
}

function parsePilotDroneDetails(value: unknown): PilotProfileDroneRow[] {
  let rows = value;
  if (typeof rows === "string") {
    try {
      rows = JSON.parse(rows);
    } catch {
      rows = [];
    }
  }
  if (!Array.isArray(rows)) return [];
  return rows.filter(
    (row): row is PilotProfileDroneRow =>
      typeof row === "object" && row !== null && !Array.isArray(row)
  );
}

function pendingRequestDedupeKey(req: UserRequest): string {
  const pilotId = textValue(req.pilot_id);
  if (pilotId) return `pilot-id:${pilotId}`;
  const email = textValue(req.pilot_details?.email).toLowerCase();
  if (email) return `email:${email}`;
  return `name:${textValue(req.pilot_name).toLowerCase()}`;
}

function newestPendingRequest(a: UserRequest, b: UserRequest): UserRequest {
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
    return aTime > bTime ? a : b;
  }
  return Number(a.id) >= Number(b.id) ? a : b;
}

function dedupePendingPilotRequests(requests: UserRequest[]): UserRequest[] {
  const byPilot = new Map<string, UserRequest>();
  for (const req of requests) {
    const key = pendingRequestDedupeKey(req);
    const existing = byPilot.get(key);
    byPilot.set(key, existing ? newestPendingRequest(existing, req) : req);
  }
  return [...byPilot.values()].sort((a, b) => {
    const bTime = new Date(b.created_at).getTime();
    const aTime = new Date(a.created_at).getTime();
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }
    return Number(b.id) - Number(a.id);
  });
}

function isPendingPilotDetailsRequest(req: UserRequest): boolean {
  return (
    req.request_type === "add_pilot_details" &&
    (req.status || "").trim().toLowerCase() === "pending"
  );
}

function pendingRequestMatchesDroneRow(
  req: UserRequest,
  row: AdminPilotDroneTableRow
): boolean {
  if (!isPendingPilotDetailsRequest(req)) return false;
  const rowPilotId = emptyIfDash(row.pilotId);
  const reqPilotId = textValue(req.pilot_id);
  if (rowPilotId && reqPilotId && rowPilotId === reqPilotId) return true;
  const rowEmail = emptyIfDash(row.pilotEmail).toLowerCase();
  const reqEmail = textValue(req.pilot_details?.email).toLowerCase();
  if (rowEmail && reqEmail && rowEmail === reqEmail) return true;
  const rowName = row.pilotName.trim().toLowerCase();
  const reqName = textValue(req.pilot_name).trim().toLowerCase();
  return rowName !== "" && rowName !== "—" && rowName === reqName;
}

function findPendingRequestForDroneRow(
  row: AdminPilotDroneTableRow,
  pending: UserRequest[]
): UserRequest | null {
  const match = pending.find((req) => pendingRequestMatchesDroneRow(req, row));
  return match ?? null;
}

function profileDroneFleetKey(drone: PilotProfileDroneRow): string {
  const id = textValue(drone.id);
  if (id) return `id:${id}`;
  const useCases = Array.isArray(drone.useCases)
    ? drone.useCases.map((v) => textValue(v).toLowerCase()).join("|")
    : Array.isArray(drone.use_cases)
      ? drone.use_cases.map((v) => textValue(v).toLowerCase()).join("|")
      : "";
  return [
    "f",
    textValue(drone.modelName ?? drone.model_name).toLowerCase(),
    textValue(drone.type).toLowerCase(),
    textValue(drone.camera).toLowerCase(),
    textValue(drone.payloadKg ?? drone.payload_kg).toLowerCase(),
    textValue(drone.flightTimeMin ?? drone.flight_time_min).toLowerCase(),
    textValue(drone.rangeKm ?? drone.range_km).toLowerCase(),
    useCases,
  ].join("::");
}

function buildPilotDroneRows(
  pilots: PilotBackendRow[],
  fleetDrones: DroneBackendRow[]
): AdminPilotDroneTableRow[] {
  const pilotById = new Map<string, PilotBackendRow>();
  for (const pilot of pilots) {
    const id = textValue(pilot.id);
    if (id) pilotById.set(id, pilot);
  }

  const fleetKeysByPilot = new Map<string, Set<string>>();
  for (const drone of fleetDrones) {
    const pilotId = textValue(drone.pilot_id);
    if (!pilotId) continue;
    const id = textValue(drone.id);
    if (!id) continue;
    let keys = fleetKeysByPilot.get(pilotId);
    if (!keys) {
      keys = new Set();
      fleetKeysByPilot.set(pilotId, keys);
    }
    keys.add(`id:${id}`);
  }

  const rows: AdminPilotDroneTableRow[] = [];

  fleetDrones.forEach((drone, index) => {
    const pilotId = textValue(drone.pilot_id);
    const pilot = pilotById.get(pilotId);
    const droneId = textValue(drone.id);
    rows.push({
      key: `fleet-${droneId || index}`,
      sourceKind: "fleet",
      pilotId: displayValue(pilotId),
      pilotName: displayValue(drone.pilot_name || pilot?.name || "Unassigned"),
      pilotEmail: displayValue(pilot?.email),
      droneId: displayValue(droneId),
      modelName: displayValue(drone.model_name),
      type: displayValue(drone.type),
      camera: displayValue(drone.camera),
      payloadKg: displayValue(drone.max_payload_kg),
      flightTimeMin: displayValue(drone.flight_time_min),
      rangeKm: displayValue(drone.max_range_km),
      useCases: useCasesText(drone.use_cases),
    });
  });

  pilots.forEach((pilot, pilotIndex) => {
    const pilotId = textValue(pilot.id);
    const pilotName = displayValue(pilot.name);
    const pilotEmail = displayValue(pilot.email);
    const profileDrones = parsePilotDroneDetails(pilot.drone_details);

    profileDrones.forEach((drone, droneIndex) => {
      const droneId = textValue(drone.id);
      const fleetKeys = fleetKeysByPilot.get(pilotId);
      if (droneId && fleetKeys?.has(`id:${droneId}`)) {
        return;
      }
      if (!droneId && fleetKeys?.has(profileDroneFleetKey(drone))) {
        return;
      }
      rows.push({
        key: `profile-${pilotId || pilotIndex}-${droneId || droneIndex}`,
        sourceKind: "profile",
        profileIndex: droneIndex,
        pilotId: displayValue(pilotId),
        pilotName,
        pilotEmail,
        droneId: displayValue(droneId),
        modelName: displayValue(drone.modelName ?? drone.model_name),
        type: displayValue(drone.type),
        camera: displayValue(drone.camera),
        payloadKg: displayValue(drone.payloadKg ?? drone.payload_kg),
        flightTimeMin: displayValue(drone.flightTimeMin ?? drone.flight_time_min),
        rangeKm: displayValue(drone.rangeKm ?? drone.range_km),
        useCases: useCasesText(drone.useCases ?? drone.use_cases),
      });
    });

    if (textValue(pilot.drone_name)) {
      rows.push({
        key: `assigned-${pilotId || pilotIndex}`,
        sourceKind: "assigned",
        pilotId: displayValue(pilotId),
        pilotName,
        pilotEmail,
        droneId: displayValue(pilot.drone_id),
        modelName: displayValue(pilot.drone_name),
        type: "—",
        camera: displayValue(pilot.camera),
        payloadKg: displayValue(pilot.payload),
        flightTimeMin: displayValue(pilot.flight_time),
        rangeKm: displayValue(pilot.range_km),
        useCases: useCasesText(pilot.use_cases),
      });
    }
  });

  return rows.sort((a, b) => {
    const pilotCompare = a.pilotName.localeCompare(b.pilotName);
    if (pilotCompare !== 0) return pilotCompare;
    return a.modelName.localeCompare(b.modelName);
  });
}

const ADD_DRONE_DETAILS_PATH = "/dashboard/drone";

/** Admin dashboard version of drone management - without admin request option */
export function AdminDroneView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request");
  const [request, setRequest] = useState<UserRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<UserRequest[]>([]);
  /** Pending pilot request being resolved via edit or add-drone flow. */
  const [resolvingPendingRequest, setResolvingPendingRequest] =
    useState<UserRequest | null>(null);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [pilotDroneRows, setPilotDroneRows] = useState<AdminPilotDroneTableRow[]>([]);
  const [pilotDroneRowsLoading, setPilotDroneRowsLoading] = useState(true);
  const [pilotDroneRowsError, setPilotDroneRowsError] = useState<string | null>(null);
  const [editingDroneRow, setEditingDroneRow] = useState<AdminPilotDroneTableRow | null>(null);
  const [editingDroneForm, setEditingDroneForm] = useState<DroneEditForm>({
    modelName: "",
    type: "",
    camera: "",
    payloadKg: "",
    flightTimeMin: "",
    rangeKm: "",
    useCases: "",
  });
  const [savingDroneEdit, setSavingDroneEdit] = useState(false);
  const [deletingDroneKey, setDeletingDroneKey] = useState<string | null>(null);
  const addDronePanelRef = useRef<HTMLDivElement>(null);
  const resolvingPendingRequestRef = useRef<UserRequest | null>(null);
  const [dronePanelKey, setDronePanelKey] = useState(0);
  const [openAddDronePanel, setOpenAddDronePanel] = useState(false);
  const [addDronePilotId, setAddDronePilotId] = useState("");
  const [pilotPickerOptions, setPilotPickerOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showDroneForm, setShowDroneForm] = useState(false);
  const [droneFormData, setDroneFormData] = useState({
    modelName: '',
    type: '',
    camera: '',
    payloadKg: '',
    flightTimeMin: '',
    rangeKm: ''
  });

  const backToAddDroneDetailsPage = () => {
    setRequest(null);
    setResolvingPendingRequest(null);
    resolvingPendingRequestRef.current = null;
    setShowDroneForm(false);
    setLoading(false);
    router.push(ADD_DRONE_DETAILS_PATH);
  };

  const closeDroneEdit = () => {
    setEditingDroneRow(null);
    setResolvingPendingRequest(null);
    resolvingPendingRequestRef.current = null;
  };

  /** Mark pending pilot request(s) completed and remove from the pending list. */
  const resolvePendingPilotRequest = async (
    req: UserRequest,
    options?: { descriptionSuffix?: string }
  ): Promise<boolean> => {
    const dedupeKey = pendingRequestDedupeKey(req);
    const suffix = options?.descriptionSuffix?.trim() ?? "";
    const baseDesc = (req.description || "").trim();
    const description = suffix
      ? baseDesc
        ? `${baseDesc}${suffix}`
        : suffix.replace(/^\s*-\s*/, "")
      : baseDesc || undefined;

    setPendingRequests((prev) =>
      prev.filter((r) => pendingRequestDedupeKey(r) !== dedupeKey)
    );
    setResolvingPendingRequest(null);
    resolvingPendingRequestRef.current = null;

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      const listResponse = await fetch(apiUrl("/api/user-requests"), {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        cache: "no-store",
      });

      let idsToComplete = [req.id];
      if (listResponse.ok) {
        const data = (await listResponse.json()) as { data?: UserRequest[] };
        const rows = Array.isArray(data?.data) ? data.data : [];
        const relatedIds = rows
          .filter(
            (r) =>
              isPendingPilotDetailsRequest(r) &&
              pendingRequestDedupeKey(r) === dedupeKey
          )
          .map((r) => r.id);
        if (relatedIds.length > 0) idsToComplete = relatedIds;
      }

      let allOk = true;
      for (const id of idsToComplete) {
        const response = await fetch(apiUrl(`/api/user-requests/${id}`), {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status: "completed",
            ...(description ? { description } : {}),
          }),
        });
        if (!response.ok) allOk = false;
      }

      if (!allOk) {
        await fetchPendingRequests();
        return false;
      }

      setRequest((prev) =>
        prev && idsToComplete.includes(prev.id)
          ? {
              ...prev,
              status: "completed",
              description: description ?? prev.description,
            }
          : prev
      );
      return true;
    } catch (error) {
      console.error("Error resolving pending pilot request:", error);
      await fetchPendingRequests();
      return false;
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails(requestId);
    } else {
      setRequest(null);
      setShowDroneForm(false);
    }
    fetchPendingRequests();
    fetchPilotDroneRows();
  }, [requestId]);

  const fetchPilotDroneRows = async () => {
    setPilotDroneRowsLoading(true);
    setPilotDroneRowsError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Accept": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      };
      const [pilotsResponse, dronesResponse] = await Promise.all([
        fetch(apiUrl("/api/pilots"), { headers, cache: "no-store" }),
        fetch(apiUrl("/api/drones"), { headers, cache: "no-store" }),
      ]);

      if (!pilotsResponse.ok) {
        throw new Error("Failed to fetch pilots");
      }
      if (!dronesResponse.ok) {
        throw new Error("Failed to fetch drones");
      }

      const pilotsData = (await pilotsResponse.json()) as unknown;
      const dronesData = (await dronesResponse.json()) as unknown;
      const pilots = arrayPayload<PilotBackendRow>(pilotsData);
      const drones = arrayPayload<DroneBackendRow>(dronesData);
      setPilotDroneRows(buildPilotDroneRows(pilots, drones));
      setPilotPickerOptions(
        pilots
          .map((p) => {
            const id = Number(p.id);
            if (!Number.isFinite(id)) return null;
            const name = String(p.name ?? "").trim() || `Pilot #${id}`;
            return { id, name };
          })
          .filter((row): row is { id: number; name: string } => row != null)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (error) {
      console.error("Error fetching pilot drone rows:", error);
      setPilotDroneRows([]);
      setPilotDroneRowsError(
        error instanceof Error ? error.message : "Failed to fetch drone details"
      );
    } finally {
      setPilotDroneRowsLoading(false);
    }
  };

  const openDroneEdit = (row: AdminPilotDroneTableRow) => {
    setEditingDroneRow(row);
    setEditingDroneForm({
      modelName: emptyIfDash(row.modelName),
      type: emptyIfDash(row.type),
      camera: emptyIfDash(row.camera),
      payloadKg: emptyIfDash(row.payloadKg),
      flightTimeMin: emptyIfDash(row.flightTimeMin),
      rangeKm: emptyIfDash(row.rangeKm),
      useCases: emptyIfDash(row.useCases),
    });
  };

  const droneRowForRequest = (req: UserRequest) => {
    const pilotId = textValue(req.pilot_id);
    const pilotEmail = textValue(req.pilot_details?.email).toLowerCase();
    const pilotName = textValue(req.pilot_name).toLowerCase();
    const matches = pilotDroneRows.filter((row) => {
      const rowPilotId = emptyIfDash(row.pilotId);
      if (pilotId && rowPilotId === pilotId) return true;
      if (pilotEmail && emptyIfDash(row.pilotEmail).toLowerCase() === pilotEmail) {
        return true;
      }
      return pilotName !== "" && row.pilotName.toLowerCase() === pilotName;
    });
    return (
      matches.find((row) => row.sourceKind === "profile") ??
      matches.find((row) => row.sourceKind === "fleet") ??
      matches[0] ??
      null
    );
  };

  const openPendingRequest = (req: UserRequest) => {
    setResolvingPendingRequest(req);
    resolvingPendingRequestRef.current = req;
    const existingDrone = droneRowForRequest(req);
    setShowPendingRequests(false);
    if (existingDrone) {
      openDroneEdit(existingDrone);
      return;
    }
    setRequest(req);
    setShowDroneForm(false);
    setDroneFormData({
      modelName: "",
      type: "",
      camera: "",
      payloadKg: "",
      flightTimeMin: "",
      rangeKm: "",
    });
  };

  const saveDroneEdit = async () => {
    const rowBeingEdited = editingDroneRow;
    if (!rowBeingEdited) return;
    if (!editingDroneForm.modelName.trim()) {
      alert("Please fill in Model Name.");
      return;
    }
    if (
      rowBeingEdited.sourceKind !== "assigned" &&
      !editingDroneForm.type.trim()
    ) {
      alert("Please fill in Type.");
      return;
    }

    setSavingDroneEdit(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      };
      const useCases = editingDroneForm.useCases
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      let response: Response;
      if (rowBeingEdited.sourceKind === "fleet") {
        response = await fetch(apiUrl(`/api/drones/${rowBeingEdited.droneId}`), {
          method: "PUT",
          headers,
          body: JSON.stringify({
            model_name: editingDroneForm.modelName,
            type: editingDroneForm.type,
            camera: editingDroneForm.camera,
            payload_kg: editingDroneForm.payloadKg,
            flight_time_min: editingDroneForm.flightTimeMin,
            range_km: editingDroneForm.rangeKm,
            use_cases: useCases,
          }),
        });
      } else if (rowBeingEdited.sourceKind === "profile") {
        response = await fetch(
          apiUrl(`/api/pilots/${rowBeingEdited.pilotId}/drones/${rowBeingEdited.profileIndex ?? 0}`),
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              drone: {
                id: emptyIfDash(rowBeingEdited.droneId),
                modelName: editingDroneForm.modelName,
                type: editingDroneForm.type,
                camera: editingDroneForm.camera,
                payloadKg: editingDroneForm.payloadKg,
                flightTimeMin: editingDroneForm.flightTimeMin,
                rangeKm: editingDroneForm.rangeKm,
                useCases,
              },
            }),
          }
        );
      } else {
        response = await fetch(apiUrl(`/api/pilots/${rowBeingEdited.pilotId}/assign-drone`), {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            drone_id: emptyIfDash(rowBeingEdited.droneId),
            drone_name: editingDroneForm.modelName,
            camera: editingDroneForm.camera,
            use_cases: editingDroneForm.useCases,
            payload: editingDroneForm.payloadKg,
            flight_time: editingDroneForm.flightTimeMin,
            range_km: editingDroneForm.rangeKm,
          }),
        });
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to update drone details");
      }

      const pilotIdNum = numericId(emptyIfDash(rowBeingEdited.pilotId));
      setEditingDroneRow(null);

      const pendingToResolve =
        resolvingPendingRequestRef.current ??
        (await findPendingRequestForRow(rowBeingEdited));

      if (pendingToResolve) {
        const resolved = await resolvePendingPilotRequest(pendingToResolve, {
          descriptionSuffix: " - drone details updated",
        });
        if (!resolved) {
          alert(
            "Drone details saved, but the pending pilot request could not be marked completed. Refresh and try again."
          );
          return;
        }
      }

      if (pilotIdNum != null) {
        await syncPilotDronesToProfile(pilotIdNum);
      } else {
        notifyAdminFleetUpdated();
      }
      await fetchPilotDroneRows();

      alert("Drone details updated successfully.");
    } catch (error) {
      console.error("Error updating drone details:", error);
      alert(error instanceof Error ? error.message : "Failed to update drone details.");
    } finally {
      setSavingDroneEdit(false);
    }
  };

  const deleteDroneRow = async (row: AdminPilotDroneTableRow) => {
    if (!confirm(`Delete drone details for ${row.modelName}?`)) return;

    setDeletingDroneKey(row.key);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      };

      const pilotIdNum = numericId(emptyIfDash(row.pilotId));
      const fleetIdNum = numericId(emptyIfDash(row.droneId));

      let response: Response | null = null;

      if (fleetIdNum != null) {
        response = await fetch(apiUrl(`/api/drones/${fleetIdNum}`), {
          method: "DELETE",
          headers,
        });
        if (
          !response.ok &&
          response.status === 404 &&
          row.sourceKind === "profile" &&
          pilotIdNum != null
        ) {
          response = await fetch(
            apiUrl(`/api/pilots/${pilotIdNum}/drones/${row.profileIndex ?? 0}`),
            { method: "DELETE", headers }
          );
        }
      } else if (row.sourceKind === "profile" && pilotIdNum != null) {
        response = await fetch(
          apiUrl(`/api/pilots/${pilotIdNum}/drones/${row.profileIndex ?? 0}`),
          { method: "DELETE", headers }
        );
      } else if (row.sourceKind === "assigned" && pilotIdNum != null) {
        response = await fetch(apiUrl(`/api/pilots/${pilotIdNum}/assign-drone`), {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            drone_id: "",
            drone_name: "",
            camera: "",
            use_cases: "",
            payload: "",
            flight_time: "",
            range_km: "",
          }),
        });
      } else {
        throw new Error(
          "Cannot delete this drone: missing a valid pilot or drone identifier."
        );
      }

      if (!response?.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to delete drone details");
      }

      const deletedPilotId = emptyIfDash(row.pilotId);
      setPilotDroneRows((prev) =>
        prev.filter((r) => {
          if (r.key === row.key) return false;
          if (
            fleetIdNum != null &&
            numericId(emptyIfDash(r.droneId)) === fleetIdNum &&
            emptyIfDash(r.pilotId) === deletedPilotId
          ) {
            return false;
          }
          return true;
        })
      );

      if (pilotIdNum != null) {
        await syncPilotDronesToProfile(pilotIdNum);
      } else {
        notifyAdminFleetUpdated();
      }
      await fetchPilotDroneRows();
    } catch (error) {
      console.error("Error deleting drone details:", error);
      alert(error instanceof Error ? error.message : "Failed to delete drone details.");
    } finally {
      setDeletingDroneKey(null);
    }
  };

  const openAddDroneDetails = () => {
    setOpenAddDronePanel(true);
    setDronePanelKey((key) => key + 1);
    window.setTimeout(() => {
      addDronePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const closeAddDronePanel = () => {
    setOpenAddDronePanel(false);
  };

  const fetchRequestDetails = async (id: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/user-requests"), {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const foundRequest = data.data.find((req: UserRequest) => req.id === parseInt(id));
        if (foundRequest) {
          setRequest(foundRequest);
          setShowDroneForm(false);
          if (
            foundRequest.status === "pending" &&
            foundRequest.request_type === "add_pilot_details"
          ) {
            setResolvingPendingRequest(foundRequest);
            resolvingPendingRequestRef.current = foundRequest;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async (): Promise<UserRequest[]> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/user-requests"), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const requestRows = Array.isArray(data?.data)
          ? (data.data as UserRequest[])
          : [];
        const pending = requestRows.filter((req) => isPendingPilotDetailsRequest(req));
        const deduped = dedupePendingPilotRequests(pending);
        setPendingRequests(deduped);
        return deduped;
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
    return [];
  };

  const findPendingRequestForRow = async (
    row: AdminPilotDroneTableRow
  ): Promise<UserRequest | null> => {
    const fromState = findPendingRequestForDroneRow(row, pendingRequests);
    if (fromState) return fromState;
    const fresh = await fetchPendingRequests();
    return findPendingRequestForDroneRow(row, fresh);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (request) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-3">
        <OpenRequestDetailTable
          title="Pilot Request for Admin Review"
          subtitle="Total 1 request"
          columns={[
            {
              header: "Request ID",
              cell: (
                <span
                  className="inline-block max-w-full font-mono text-[10px] font-medium tracking-tight text-muted-foreground [overflow-wrap:anywhere] sm:text-[11px]"
                  title={openRequestDisplayId(request.id)}
                >
                  {openRequestDisplayId(request.id)}
                </span>
              ),
            },
            {
              header: "Pilot Name",
              cell: (
                <span className="break-words font-semibold text-[#006767] dark:text-primary">
                  {request.pilot_name}
                </span>
              ),
            },
            {
              header: "Request Type",
              cell: (
                <span className="break-words font-medium">{request.request_type}</span>
              ),
            },
            {
              header: "Description",
              cell: (
                <span className="line-clamp-3 break-words text-muted-foreground">
                  {request.description || "—"}
                </span>
              ),
            },
            {
              header: "Created",
              cell: (
                <span className="tabular-nums">
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
              ),
            },
            {
              header: "Status",
              align: "center",
              cell: openRequestStatusBadge(request.status),
            },
          ]}
        />

        {request.pilot_details ? (
          <OpenRequestDetailTable
            title="Pilot Details Submitted"
            subtitle="Total 1 pilot profile"
            minWidth="min-w-[960px]"
            columns={[
              {
                header: "Full Name",
                cell: (
                  <span className="break-words font-semibold">
                    {request.pilot_details.fullName || "—"}
                  </span>
                ),
              },
              {
                header: "Email",
                cell: (
                  <span className="break-all text-muted-foreground">
                    {request.pilot_details.email || "—"}
                  </span>
                ),
              },
              {
                header: "City",
                cell: <span className="break-words">{request.pilot_details.city || "—"}</span>,
              },
              {
                header: "State",
                cell: <span className="break-words">{request.pilot_details.state || "—"}</span>,
              },
              {
                header: "Flight Hours",
                align: "center",
                cell: (
                  <span className="tabular-nums">
                    {request.pilot_details.flightHours || "—"}
                  </span>
                ),
              },
              {
                header: "DGCA License",
                cell: (
                  <span className="break-words">{request.pilot_details.dgca || "—"}</span>
                ),
              },
              {
                header: "Skills",
                cell:
                  request.pilot_details.skills &&
                  request.pilot_details.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {request.pilot_details.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium sm:text-[10px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowDroneForm(true)}
            className="h-8 rounded-lg border border-[#008B8B] bg-transparent px-3 text-xs font-medium text-[#008B8B] transition-colors hover:bg-[#008B8B]/10"
          >
            Add New Drone Details
          </button>
          <button
            type="button"
            onClick={backToAddDroneDetailsPage}
            className="h-8 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
          >
            Back to Request
          </button>
        </div>

        {/* Drone Form */}
        {showDroneForm && (
          <div className="rounded-xl border border-border bg-muted/25 p-3 sm:p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Add New Drone Details for {request?.pilot_name}
            </h3>
            <div className="mb-3 text-xs text-muted-foreground">
              This form will add drone details to the pilot&apos;s profile based on their request.
            </div>
            
            {/* Simple drone form - you can expand this as needed */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={OPEN_REQUEST_DRONE_FORM_LABEL_CLASS}>
                    Model Name
                  </label>
                  <input
                    type="text"
                    className={OPEN_REQUEST_DRONE_FORM_FIELD_CLASS}
                    placeholder="e.g., DJI Mavic 3"
                    value={droneFormData.modelName}
                    onChange={(e) => setDroneFormData({...droneFormData, modelName: e.target.value})}
                  />
                </div>
                <div>
                  <label className={OPEN_REQUEST_DRONE_FORM_LABEL_CLASS}>
                    Type
                  </label>
                  <select
                    className={OPEN_REQUEST_DRONE_FORM_FIELD_CLASS}
                    value={droneFormData.type}
                    onChange={(e) => setDroneFormData({...droneFormData, type: e.target.value})}
                  >
                    <option value="">Select type</option>
                    <option value="FPV">FPV</option>
                    <option value="Autonomous">Autonomous</option>
                    <option value="Line of Sight">Line of Sight</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={OPEN_REQUEST_DRONE_FORM_LABEL_CLASS}>
                    Camera
                  </label>
                  <input
                    type="text"
                    className={OPEN_REQUEST_DRONE_FORM_FIELD_CLASS}
                    placeholder="e.g., 4K HDR"
                    value={droneFormData.camera}
                    onChange={(e) => setDroneFormData({...droneFormData, camera: e.target.value})}
                  />
                </div>
                <div>
                  <label className={OPEN_REQUEST_DRONE_FORM_LABEL_CLASS}>
                    Payload (kg)
                  </label>
                  <input
                    type="text"
                    className={OPEN_REQUEST_DRONE_FORM_FIELD_CLASS}
                    placeholder="e.g., 2.5"
                    value={droneFormData.payloadKg}
                    onChange={(e) => setDroneFormData({...droneFormData, payloadKg: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={OPEN_REQUEST_DRONE_FORM_LABEL_CLASS}>
                    Flight Time (min)
                  </label>
                  <input
                    type="text"
                    className={OPEN_REQUEST_DRONE_FORM_FIELD_CLASS}
                    placeholder="e.g., 45"
                    value={droneFormData.flightTimeMin}
                    onChange={(e) => setDroneFormData({...droneFormData, flightTimeMin: e.target.value})}
                  />
                </div>
                <div>
                  <label className={OPEN_REQUEST_DRONE_FORM_LABEL_CLASS}>
                    Range (km)
                  </label>
                  <input
                    type="text"
                    className={OPEN_REQUEST_DRONE_FORM_FIELD_CLASS}
                    placeholder="e.g., 15"
                    value={droneFormData.rangeKm}
                    onChange={(e) => setDroneFormData({...droneFormData, rangeKm: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDroneForm(false)}
                  className={OPEN_REQUEST_DRONE_FORM_BTN_CANCEL_CLASS}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Validate form data
                    if (!droneFormData.modelName || !droneFormData.type) {
                      alert('Please fill in at least Model Name and Type fields.');
                      return;
                    }

                    // Debug: Check pilot_id
                    console.log('Adding drone details for pilot_id:', request.pilot_id);
                    console.log('Request data:', request);
                    console.log('Type of pilot_id:', typeof request.pilot_id);
                    
                    if (!request.pilot_id) {
                      alert('No pilot_id found in request. Cannot add drone details.');
                      return;
                    }

                    try {
                      const token = localStorage.getItem("token");
                      
                      // First check if pilot exists by ID
                      console.log('Checking if pilot exists with ID:', request.pilot_id);
                      const pilotCheckResponse = await fetch(apiUrl(`/api/pilots/${request.pilot_id}`), {
                        headers: {
                          "Authorization": token ? `Bearer ${token}` : "",
                        },
                      });

                      console.log('Pilot check response status:', pilotCheckResponse.status);
                      
                      let pilotData = null;
                      let actualPilotId = request.pilot_id;

                      if (!pilotCheckResponse.ok) {
                        // If pilot not found by ID, try to find by name
                        console.log('Pilot not found by ID, searching by name:', request.pilot_name);
                        
                        const allPilotsResponse = await fetch(apiUrl("/api/pilots"), {
                          headers: {
                            "Authorization": token ? `Bearer ${token}` : "",
                          },
                        });
                        
                        if (allPilotsResponse.ok) {
                          const allPilotsData = (await allPilotsResponse.json()) as unknown;
                          const allPilots = Array.isArray(allPilotsData)
                            ? (allPilotsData as PilotBackendRow[])
                            : [];
                          console.log('Available pilots:', allPilots.map((p) => ({ id: p.id, name: p.name })));
                          
                          // Find pilot by name (case-insensitive)
                          const foundPilot = allPilots.find((p) =>
                            textValue(p.name).toLowerCase() === request.pilot_name.toLowerCase()
                          );
                          
                          if (foundPilot) {
                            console.log('Found pilot by name:', foundPilot);
                            const foundPilotId = numericId(foundPilot.id);
                            if (foundPilotId === null) {
                              alert(`Found pilot ${request.pilot_name}, but the pilot ID is invalid. Please check the pilot management system.`);
                              return;
                            }
                            pilotData = foundPilot;
                            actualPilotId = foundPilotId;
                          } else {
                            // Create new pilot if not found
                            console.log('Pilot not found, creating new pilot:', request.pilot_name);
                            const createPilotResponse = await fetch(apiUrl("/api/pilots"), {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                "Authorization": token ? `Bearer ${token}` : "",
                              },
                              body: JSON.stringify({
                                name: request.pilot_name,
                                email: request.pilot_details?.email || '',
                                phone: request.pilot_details?.phone || '',
                                city: request.pilot_details?.city || '',
                                state: request.pilot_details?.state || '',
                                flight_hours: parseInt(request.pilot_details?.flightHours || '0'),
                                duty_status: 'ACTIVE',
                                cert_level: 3,
                              }),
                            });
                            
                            if (createPilotResponse.ok) {
                              const newPilot = await createPilotResponse.json();
                              console.log('Created new pilot:', newPilot);
                              pilotData = newPilot.data || newPilot;
                              actualPilotId = pilotData.id;
                            } else {
                              const errorText = await createPilotResponse.text();
                              console.error('Failed to create pilot:', errorText);
                              alert(`Could not find or create pilot ${request.pilot_name}. Please check the pilot management system.`);
                              return;
                            }
                          }
                        }
                      } else {
                        pilotData = await pilotCheckResponse.json();
                        console.log('Pilot found by ID:', pilotData);
                      }

                      const profileDrone = {
                        id: `drone-${Date.now()}`,
                        modelName: droneFormData.modelName.trim(),
                        type: droneFormData.type.trim(),
                        camera: droneFormData.camera.trim(),
                        payloadKg: droneFormData.payloadKg.trim(),
                        flightTimeMin: droneFormData.flightTimeMin.trim(),
                        rangeKm: droneFormData.rangeKm.trim(),
                        useCases: [] as string[],
                      };

                      const fleetResponse = await fetch(apiUrl("/api/drones"), {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({
                          pilot_id: actualPilotId,
                          model_name: profileDrone.modelName,
                          type: profileDrone.type,
                          camera: profileDrone.camera || null,
                          payload_kg: profileDrone.payloadKg || null,
                          flight_time_min: profileDrone.flightTimeMin || null,
                          range_km: profileDrone.rangeKm || null,
                          use_cases: profileDrone.useCases,
                        }),
                      });

                      if (!fleetResponse.ok) {
                        const fleetErr = await fleetResponse.json().catch(() => ({}));
                        throw new Error(
                          (fleetErr as { error?: string }).error ||
                            "Failed to register drone on server"
                        );
                      }

                      const fleetCreated = (await fleetResponse.json()) as {
                        id?: number | string;
                      };
                      if (fleetCreated?.id != null) {
                        profileDrone.id = String(fleetCreated.id);
                      }

                      const droneResponse = await fetch(apiUrl(`/api/pilots/${actualPilotId}/drones`), {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({ drones: [profileDrone] }),
                      });

                      if (droneResponse.ok) {
                        const resolved = await resolvePendingPilotRequest(request, {
                          descriptionSuffix: " - added the drone details",
                        });

                        if (resolved) {
                          alert("Drone details successfully added to pilot profile!");
                          setShowDroneForm(false);
                          setDroneFormData({
                            modelName: "",
                            type: "",
                            camera: "",
                            payloadKg: "",
                            flightTimeMin: "",
                            rangeKm: "",
                          });
                          const pilotIdNum = numericId(actualPilotId);
                          if (pilotIdNum != null) {
                            await syncPilotDronesToProfile(pilotIdNum);
                          } else {
                            notifyAdminFleetUpdated();
                          }
                          if (requestId) {
                            fetchRequestDetails(requestId);
                          } else {
                            setRequest(null);
                          }
                          await fetchPendingRequests();
                          await fetchPilotDroneRows();
                        } else {
                          throw new Error("Failed to update request status");
                        }
                      } else {
                        const errorData = await droneResponse.json().catch(() => ({}));
                        console.error('Drone API Error:', errorData);
                        throw new Error(errorData.error || 'Failed to add drone details');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      alert(`Failed to add drone details: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  className={OPEN_REQUEST_DRONE_FORM_BTN_SAVE_CLASS}
                >
                  Save Drone Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default view - show pending requests or normal drone management
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground sm:px-5">
        Total drones:{" "}
        <span className="font-semibold tabular-nums">
          {pilotDroneRows.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Pilot Drone Details
          </h2>
          <p className="text-sm text-muted-foreground">
            Backend drone records grouped by pilot.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPendingRequests((value) => !value)}
            className="w-fit rounded-lg border border-[#008080] bg-transparent px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-[#008080]/10"
          >
            Pending Pilot Requests
            {pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}
          </button>
          <button
            type="button"
            onClick={openAddDroneDetails}
            className="w-fit rounded-lg border border-[#008080] bg-transparent px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-[#008080]/10"
          >
            Add New Drone Details
          </button>
        </div>
      </div>

      {showPendingRequests ? (
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-foreground">
              Pending Pilot Requests
            </h3>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No pending pilot requests found.
            </p>
          ) : (
            <div className="space-y-3 p-4 sm:p-5">
              {pendingRequests.map((req) => (
                <article
                  key={req.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">
                        Request from {req.pilot_name}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {req.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Created: {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openPendingRequest(req)}
                      className="w-fit rounded-lg border border-[#008080] px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-[#008080]/10"
                    >
                      Open Request
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <div ref={addDronePanelRef}>
        {openAddDronePanel ? (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Add New Drone Details
              </h3>
              <button
                type="button"
                onClick={closeAddDronePanel}
                aria-label="Close add drone form"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="max-w-md">
              <label
                htmlFor="admin-add-drone-pilot"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Pilot <span className="text-red-500">*</span>
              </label>
              <select
                id="admin-add-drone-pilot"
                value={addDronePilotId}
                onChange={(e) => setAddDronePilotId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                required
              >
                <option value="">Choose a pilot…</option>
                {pilotPickerOptions.map((pilot) => (
                  <option key={pilot.id} value={String(pilot.id)}>
                    {pilot.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Drone details are saved to this pilot&apos;s profile and appear on
                their My Drones page.
              </p>
            </div>
            <PilotSettingsAddDronePanel
              key={`${dronePanelKey}-${addDronePilotId}`}
              withDroneList={false}
              showAdminRequest={false}
              targetPilotId={
                addDronePilotId ? Number.parseInt(addDronePilotId, 10) : null
              }
              onDroneAdded={() => {
                const pilotId = addDronePilotId
                  ? Number.parseInt(addDronePilotId, 10)
                  : NaN;
                void (async () => {
                  if (Number.isFinite(pilotId)) {
                    await syncPilotDronesToProfile(pilotId);
                  } else {
                    notifyAdminFleetUpdated();
                  }
                  await fetchPilotDroneRows();
                  closeAddDronePanel();
                })();
              }}
            />
          </div>
        ) : null}
      </div>

      {pilotDroneRowsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Loading drone details...
        </div>
      ) : pilotDroneRowsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
          {pilotDroneRowsError}
        </div>
      ) : pilotDroneRows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          No drone details found in the backend yet.
        </div>
      ) : (
        <div className="space-y-4">
          {pilotDroneRows.map((row) => (
            <AdminDroneDetailCard
              key={row.key}
              row={row}
              deleting={deletingDroneKey === row.key}
              onEdit={() => openDroneEdit(row)}
              onDelete={() => void deleteDroneRow(row)}
            />
          ))}
        </div>
      )}

      {editingDroneRow ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close edit drone dialog"
            onClick={closeDroneEdit}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-xl dark:bg-black"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold">Edit drone details</h2>
              <button
                type="button"
                onClick={closeDroneEdit}
                className="rounded-lg px-2 py-1 text-sm hover:bg-muted"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveDroneEdit();
              }}
            >
            <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
              {[
                ["modelName", "Model Name"],
                ["type", "Type"],
                ["camera", "Camera"],
                ["payloadKg", "Payload (kg)"],
                ["flightTimeMin", "Flight Time (min)"],
                ["rangeKm", "Range (km)"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground">{label}</span>
                  <input
                    value={editingDroneForm[key as keyof DroneEditForm]}
                    onChange={(e) =>
                      setEditingDroneForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  />
                </label>
              ))}
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-foreground">
                  Use cases (comma separated)
                </span>
                <input
                  value={editingDroneForm.useCases}
                  onChange={(e) =>
                    setEditingDroneForm((prev) => ({
                      ...prev,
                      useCases: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={closeDroneEdit}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                disabled={savingDroneEdit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg border border-[#008080] px-4 py-2 text-sm font-semibold text-foreground hover:bg-[#008080]/10 disabled:opacity-60"
                disabled={savingDroneEdit}
              >
                {savingDroneEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
}
