"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PilotSettingsAddDronePanel } from "@/components/settings/pilot-settings-add-drone-panel";
import { notifyAdminFleetUpdated } from "@/lib/admin-fleet-updated";
import { apiUrl } from "@/lib/api-url";

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
  type?: unknown;
  camera?: unknown;
  payloadKg?: unknown;
  flightTimeMin?: unknown;
  rangeKm?: unknown;
  useCases?: unknown;
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

function displayValue(value: unknown): string {
  return textValue(value) || "—";
}

function useCasesText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(textValue).filter(Boolean).join(", ") || "—";
  }
  return displayValue(value);
}

function parsePilotDroneDetails(value: unknown): PilotProfileDroneRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
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

function buildPilotDroneRows(
  pilots: PilotBackendRow[],
  fleetDrones: DroneBackendRow[]
): AdminPilotDroneTableRow[] {
  const pilotById = new Map<string, PilotBackendRow>();
  for (const pilot of pilots) {
    const id = textValue(pilot.id);
    if (id) pilotById.set(id, pilot);
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
      rows.push({
        key: `profile-${pilotId || pilotIndex}-${droneId || droneIndex}`,
        sourceKind: "profile",
        profileIndex: droneIndex,
        pilotId: displayValue(pilotId),
        pilotName,
        pilotEmail,
        droneId: displayValue(droneId),
        modelName: displayValue(drone.modelName),
        type: displayValue(drone.type),
        camera: displayValue(drone.camera),
        payloadKg: displayValue(drone.payloadKg),
        flightTimeMin: displayValue(drone.flightTimeMin),
        rangeKm: displayValue(drone.rangeKm),
        useCases: useCasesText(drone.useCases),
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

/** Admin dashboard version of drone management - without admin request option */
export function AdminDroneView() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request");
  const [request, setRequest] = useState<UserRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<UserRequest[]>([]);
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
  const [dronePanelKey, setDronePanelKey] = useState(0);
  const [openAddDronePanel, setOpenAddDronePanel] = useState(false);
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

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails(requestId);
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
        "Authorization": token ? `Bearer ${token}` : "",
      };
      const [pilotsResponse, dronesResponse] = await Promise.all([
        fetch(apiUrl("/api/pilots"), { headers }),
        fetch(apiUrl("/api/drones"), { headers }),
      ]);

      if (!pilotsResponse.ok) {
        throw new Error("Failed to fetch pilots");
      }
      if (!dronesResponse.ok) {
        throw new Error("Failed to fetch drones");
      }

      const pilotsData = (await pilotsResponse.json()) as unknown;
      const dronesData = (await dronesResponse.json()) as unknown;
      const pilots = Array.isArray(pilotsData) ? (pilotsData as PilotBackendRow[]) : [];
      const drones = Array.isArray(dronesData) ? (dronesData as DroneBackendRow[]) : [];
      setPilotDroneRows(buildPilotDroneRows(pilots, drones));
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

  const emptyIfDash = (value: string) => (value === "—" ? "" : value);

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
    const existingDrone = droneRowForRequest(req);
    setShowPendingRequests(false);
    if (existingDrone) {
      openDroneEdit(existingDrone);
      return;
    }
    setRequest(req);
    setShowDroneForm(true);
  };

  const saveDroneEdit = async () => {
    if (!editingDroneRow) return;
    if (!editingDroneForm.modelName.trim()) {
      alert("Please fill in Model Name.");
      return;
    }
    if (
      editingDroneRow.sourceKind !== "assigned" &&
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
      if (editingDroneRow.sourceKind === "fleet") {
        response = await fetch(apiUrl(`/api/drones/${editingDroneRow.droneId}`), {
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
      } else if (editingDroneRow.sourceKind === "profile") {
        response = await fetch(
          apiUrl(`/api/pilots/${editingDroneRow.pilotId}/drones/${editingDroneRow.profileIndex ?? 0}`),
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              drone: {
                id: emptyIfDash(editingDroneRow.droneId),
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
        response = await fetch(apiUrl(`/api/pilots/${editingDroneRow.pilotId}/assign-drone`), {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            drone_id: emptyIfDash(editingDroneRow.droneId),
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

      setEditingDroneRow(null);
      await fetchPilotDroneRows();
      notifyAdminFleetUpdated();
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

      let response: Response;
      if (row.sourceKind === "fleet") {
        response = await fetch(apiUrl(`/api/drones/${row.droneId}`), {
          method: "DELETE",
          headers,
        });
      } else if (row.sourceKind === "profile") {
        response = await fetch(
          apiUrl(`/api/pilots/${row.pilotId}/drones/${row.profileIndex ?? 0}`),
          {
            method: "DELETE",
            headers,
          }
        );
      } else {
        response = await fetch(apiUrl(`/api/pilots/${row.pilotId}/assign-drone`), {
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
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to delete drone details");
      }

      await fetchPilotDroneRows();
      notifyAdminFleetUpdated();
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
        }
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/user-requests"), {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const requestRows = Array.isArray(data?.data)
          ? (data.data as UserRequest[])
          : [];
        const pending = requestRows.filter((req) =>
          req.status === 'pending' && req.request_type === 'add_pilot_details'
        );
        setPendingRequests(dedupePendingPilotRequests(pending));
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl(`/api/user-requests/${requestId}`), {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });

      if (response.ok) {
        // Refresh the pending requests list
        await fetchPendingRequests();
        alert("Request deleted successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete request");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(error instanceof Error ? error.message : "Failed to delete request. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (request) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Request Header */}
        <div className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Pilot Request for Admin Review
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Pilot Name:</span>
              <p className="text-muted-foreground">{request.pilot_name}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Request Type:</span>
              <p className="text-muted-foreground">{request.request_type}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Status:</span>
              <p className="text-muted-foreground">{request.status}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Created:</span>
              <p className="text-muted-foreground">
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="font-medium text-foreground">Description:</span>
            <p className="text-muted-foreground mt-1">{request.description}</p>
          </div>
        </div>

        {/* Pilot Details */}
        {request.pilot_details && (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Pilot Details Submitted
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-foreground">Full Name:</span>
                <p className="text-muted-foreground">{request.pilot_details.fullName || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Email:</span>
                <p className="text-muted-foreground">{request.pilot_details.email || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">City:</span>
                <p className="text-muted-foreground">{request.pilot_details.city || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">State:</span>
                <p className="text-muted-foreground">{request.pilot_details.state || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Flight Hours:</span>
                <p className="text-muted-foreground">{request.pilot_details.flightHours || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">DGCA License:</span>
                <p className="text-muted-foreground">{request.pilot_details.dgca || "—"}</p>
              </div>
            </div>
            {request.pilot_details.bio && (
              <div className="mt-4">
                <span className="font-medium text-foreground">Bio:</span>
                <p className="text-muted-foreground mt-1">{request.pilot_details.bio}</p>
              </div>
            )}
            {request.pilot_details.skills && request.pilot_details.skills.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-foreground">Skills:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {request.pilot_details.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="rounded-full border px-3 py-1 text-xs bg-muted"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {!showDroneForm && (
            <>
              <button
                onClick={() => setShowDroneForm(true)}
                className="px-4 py-2 bg-[#008B8B] text-white rounded-lg hover:bg-[#008B8B]/90 transition-colors"
              >
                Add New Drone Details
              </button>
              <button
                onClick={() => {
                  // Here you could add edit functionality for the request itself
                  alert("Edit request functionality would go here");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Request
              </button>
              <button
                onClick={() => request && handleDeleteRequest(request.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Request
              </button>
            </>
          )}
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
          >
            Back to Requests
          </button>
        </div>

        {/* Drone Form */}
        {showDroneForm && (
          <div className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Add New Drone Details for {request?.pilot_name}
            </h3>
            <div className="text-sm text-muted-foreground mb-4">
              This form will add drone details to the pilot&apos;s profile based on their request.
            </div>
            
            {/* Simple drone form - you can expand this as needed */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008B8B]"
                    placeholder="e.g., DJI Mavic 3"
                    value={droneFormData.modelName}
                    onChange={(e) => setDroneFormData({...droneFormData, modelName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Type
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008B8B]" value={droneFormData.type} onChange={(e) => setDroneFormData({...droneFormData, type: e.target.value})}>
                    <option value="">Select type</option>
                    <option value="FPV">FPV</option>
                    <option value="Autonomous">Autonomous</option>
                    <option value="Line of Sight">Line of Sight</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Camera
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008B8B]"
                    placeholder="e.g., 4K HDR"
                    value={droneFormData.camera}
                    onChange={(e) => setDroneFormData({...droneFormData, camera: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Payload (kg)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008B8B]"
                    placeholder="e.g., 2.5"
                    value={droneFormData.payloadKg}
                    onChange={(e) => setDroneFormData({...droneFormData, payloadKg: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Flight Time (min)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008B8B]"
                    placeholder="e.g., 45"
                    value={droneFormData.flightTimeMin}
                    onChange={(e) => setDroneFormData({...droneFormData, flightTimeMin: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Range (km)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008B8B]"
                    placeholder="e.g., 15"
                    value={droneFormData.rangeKm}
                    onChange={(e) => setDroneFormData({...droneFormData, rangeKm: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowDroneForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
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
                            pilotData = foundPilot;
                            actualPilotId = foundPilot.id;
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

                      // Add drone details to pilot profile
                      const droneResponse = await fetch(apiUrl(`/api/pilots/${actualPilotId}/drones`), {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({ drones: [droneFormData] }),
                      });

                      if (droneResponse.ok) {
                        // Update request status to show drone details were added
                        const statusResponse = await fetch(apiUrl(`/api/user-requests/${request.id}`), {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": token ? `Bearer ${token}` : "",
                          },
                          body: JSON.stringify({ 
                            status: 'completed',
                            description: request.description + ' - added the drone details'
                          }),
                        });

                        if (statusResponse.ok) {
                          alert('Drone details successfully added to pilot profile!');
                          setShowDroneForm(false);
                          // Reset form
                          setDroneFormData({
                            modelName: '',
                            type: '',
                            camera: '',
                            payloadKg: '',
                            flightTimeMin: '',
                            rangeKm: ''
                          });
                          // Refresh the request to show updated status
                          if (requestId) fetchRequestDetails(requestId);
                          await fetchPendingRequests();
                          await fetchPilotDroneRows();
                          // Notify Assign To view to refresh fleet data
                          notifyAdminFleetUpdated();
                        } else {
                          throw new Error('Failed to update request status');
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
                  className="px-4 py-2 bg-[#008B8B] text-white rounded-lg hover:bg-[#008B8B]/90 transition-colors"
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
          <PilotSettingsAddDronePanel
            key={dronePanelKey}
            showAdminRequest={false}
            openFormByDefault
            hideAddButton
            onDroneAdded={() => void fetchPilotDroneRows()}
          />
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
            <section
              key={row.key}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Drone details
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openDroneEdit(row)}
                    className="h-8 w-20 rounded-lg border border-[#008080] text-xs text-foreground transition hover:bg-[#008080]/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDroneRow(row)}
                    disabled={deletingDroneKey === row.key}
                    className="h-8 w-20 rounded-lg border border-red-300 bg-transparent text-xs text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                  >
                    {deletingDroneKey === row.key ? "Deleting" : "Delete"}
                  </button>
                </div>
              </div>

              <div className="px-4 py-4">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Pilot
                    </dt>
                    <dd className="mt-1 font-medium text-sm">
                      {row.pilotName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Pilot ID
                    </dt>
                    <dd className="mt-1">{row.pilotId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Pilot email
                    </dt>
                    <dd className="mt-1 break-all">{row.pilotEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Drone ID
                    </dt>
                    <dd className="mt-1">{row.droneId}</dd>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Model name
                    </dt>
                    <dd className="mt-1 font-medium text-sm">
                      {row.modelName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Type
                    </dt>
                    <dd className="mt-1">{row.type}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Camera
                    </dt>
                    <dd className="mt-1">{row.camera}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Payload
                    </dt>
                    <dd className="mt-1 tabular-nums">{row.payloadKg}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Flight time
                    </dt>
                    <dd className="mt-1 tabular-nums">{row.flightTimeMin}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Range
                    </dt>
                    <dd className="mt-1 tabular-nums">{row.rangeKm}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground">
                      Use cases
                    </dt>
                    <dd className="mt-1">{row.useCases}</dd>
                  </div>
                </dl>
              </div>
            </section>
          ))}
        </div>
      )}

      {editingDroneRow ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close edit drone dialog"
            onClick={() => setEditingDroneRow(null)}
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
                onClick={() => setEditingDroneRow(null)}
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
                onClick={() => setEditingDroneRow(null)}
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
