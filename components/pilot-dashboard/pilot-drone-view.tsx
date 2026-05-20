"use client";

import { Plus, Edit, Trash2, Drone as DroneIcon, Send } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";

import { patchPilotDroneDetails } from "@/app/services/pilotServices";
import { PilotSettingsAddDronePanel, PilotSettingsAddDronePanelRef } from "@/components/settings/pilot-settings-add-drone-panel";
import { Button } from "@/components/ui/button";
import {
  getPilotDisplayName,
  jwtPayloadRole,
  jwtPayloadSub,
} from "@/lib/pilot-display-name";
import {
  activePilotProfileSnapshotStorageKey,
  maybeMigrateLegacyPilotProfileSnapshotToScoped,
  readPilotProfileSnapshotRawFromBrowser,
} from "@/lib/pilot-profile-browser-storage";
import {
  parsePilotProfileSnapshot,
  PILOT_PROFILE_UPDATED_EVENT,
  type PilotProfileDrone,
  type PilotProfileSnapshot,
} from "@/lib/pilot-profile-snapshot";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api-url";

type BackendDroneDetails = {
  id?: string | number;
  modelName?: string;
  model_name?: string;
  type?: string;
  camera?: string;
  payloadKg?: string | number;
  payload_kg?: string | number;
  flightTimeMin?: string | number;
  flight_time_min?: string | number;
  rangeKg?: string | number;
  rangeKm?: string | number;
  range_km?: string | number;
  useCases?: string[];
  use_cases?: string[];
};

type PilotDetailsResponse = {
  drone_details?: unknown;
  data?: {
    drone_details?: unknown;
  };
};

function pilotDroneDetailsFromResponse(value: unknown): BackendDroneDetails[] {
  const details =
    value && typeof value === "object"
      ? ((value as PilotDetailsResponse).drone_details ??
        (value as PilotDetailsResponse).data?.drone_details)
      : undefined;
  return Array.isArray(details) ? (details as BackendDroneDetails[]) : [];
}

const DELETED_DRONE_IDS_STORAGE_SUFFIX = "::deleted-drone-ids";

function deletedDroneIdsStorageKey() {
  return `${activePilotProfileSnapshotStorageKey()}${DELETED_DRONE_IDS_STORAGE_SUFFIX}`;
}

function readDeletedDroneIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(deletedDroneIdsStorageKey()) || "[]"
    );
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((id) => String(id)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function persistDeletedDroneIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  const next = JSON.stringify([...ids]);
  const key = deletedDroneIdsStorageKey();
  try {
    localStorage.setItem(key, next);
  } catch {
    /* quota */
  }
  sessionStorage.setItem(key, next);
}

function droneIsDeleted(drone: Pick<PilotProfileDrone, "id">, ids: Set<string>) {
  return ids.has(String(drone.id));
}

function readBaseSnapshot(): PilotProfileSnapshot | null {
  if (typeof window === "undefined") return null;
  maybeMigrateLegacyPilotProfileSnapshotToScoped();
  const raw = readPilotProfileSnapshotRawFromBrowser();
  const parsed = parsePilotProfileSnapshot(raw);
  if (parsed) return parsed;
  const token = localStorage.getItem("token");
  if (!token) return null;
  const role = jwtPayloadRole(token);
  if (role === "pilot") {
    let pilotEmail: string | undefined;
    try {
      const pr = localStorage.getItem("pilot");
      if (pr) {
        pilotEmail = (JSON.parse(pr) as { email?: string }).email?.trim();
      }
    } catch {
      /* ignore */
    }
    return {
      fullName: getPilotDisplayName(token),
      email: pilotEmail,
      city: "",
      state: "",
      flightHours: 0,
      bio: "",
      skills: [],
      drones: [],
      dgca: "",
    };
  }
  return null;
}

function persistSnapshot(next: PilotProfileSnapshot) {
  const json = JSON.stringify(next);
  const storeKey = activePilotProfileSnapshotStorageKey();
  try {
    localStorage.setItem(storeKey, json);
  } catch {
    /* quota */
  }
  sessionStorage.setItem(storeKey, json);
  window.dispatchEvent(new Event(PILOT_PROFILE_UPDATED_EVENT));
  const token = localStorage.getItem("token");
  const rawSub = token ? jwtPayloadSub(token) : null;
  const pid = rawSub ? Number.parseInt(rawSub, 10) : NaN;
  if (token && jwtPayloadRole(token) === "pilot" && Number.isFinite(pid)) {
    void patchPilotDroneDetails(pid, next.drones ?? []);
  }
}

/** Enhanced pilot dashboard drone view with existing drone display */
export function PilotDroneView() {
  const dronePanelRef = useRef<PilotSettingsAddDronePanelRef>(null);
  const backendSyncPausedUntilRef = useRef(0);
  const showAddFormRef = useRef(false);
  const [drones, setDrones] = useState<PilotProfileDrone[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [, setIsRefreshing] = useState(false);
  const [deletedDroneIds, setDeletedDroneIds] =
    useState<Set<string>>(readDeletedDroneIds);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDrone, setEditingDrone] = useState<PilotProfileDrone | null>(null);
  showAddFormRef.current = showAddForm;

  const refreshFromStorage = useCallback((forceUpdate = false) => {
    console.log("🔄 refreshFromStorage called, forceUpdate:", forceUpdate);

    const base = readBaseSnapshot();
    console.log("📦 Reading from storage, base:", base);

    if (base && base.drones) {
      console.log("📦 Storage has", base.drones.length, "drones");

      // Always update if forceUpdate is true
      if (forceUpdate) {
        console.log("✅ Force updating UI from storage");
        setDrones([...base.drones]);
      } else {
        // Otherwise check if counts differ
        setDrones(prevDrones => {
          console.log("📦 UI has", prevDrones.length, "drones");
          if (base.drones.length !== prevDrones.length) {
            console.log("✅ Updating UI from storage (count changed)");
            return [...base.drones];
          } else {
            console.log("🔄 Skipping update (counts match)");
            return prevDrones;
          }
        });
      }
    } else {
      console.log("📭 No base data, keeping current state");
    }
  }, []);

  const pauseBackendSync = useCallback((durationMs = 4000) => {
    backendSyncPausedUntilRef.current = Date.now() + durationMs;
  }, []);

  const fetchDroneDataFromBackend = useCallback(async (manual = false) => {
    try {
      if (
        !manual &&
        (showAddFormRef.current || Date.now() < backendSyncPausedUntilRef.current)
      ) {
        return;
      }
      if (manual) setIsRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get pilot ID from token
      let pilotId = null;
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          pilotId = payload.sub ? parseInt(payload.sub, 10) : null;
        }
      } catch (tokenError) {
        console.warn("Invalid token format:", tokenError);
        return;
      }

      if (!pilotId) return;

      // Fetch pilot data with drone details from backend
      const response = await fetch(apiUrl(`/api/pilots/${pilotId}`), {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const pilotData = (await response.json()) as unknown;
        const backendDrones = pilotDroneDetailsFromResponse(pilotData);
        if (backendDrones.length > 0) {
          // Update local storage with backend data
          const base = readBaseSnapshot();
          if (base) {
            const updatedSnapshot: PilotProfileSnapshot = {
              ...base,
              drones: backendDrones
                .map((drone, index) => ({
                  id: drone.id ? String(drone.id) : `local-${Date.now()}-${index}`,
                  modelName: String(drone.modelName || drone.model_name || ''),
                  type: String(drone.type || ''),
                  camera: String(drone.camera || ''),
                  payloadKg: String(drone.payloadKg || drone.payload_kg || ''),
                  flightTimeMin: String(drone.flightTimeMin || drone.flight_time_min || ''),
                  rangeKm: String(drone.rangeKm || drone.rangeKg || drone.range_km || ''),
                  useCases: Array.isArray(drone.useCases)
                    ? drone.useCases
                    : Array.isArray(drone.use_cases)
                      ? drone.use_cases
                      : [],
                }))
                .filter((drone) => !droneIsDeleted(drone, readDeletedDroneIds()))
            };
            persistSnapshot(updatedSnapshot);
            setDrones(updatedSnapshot.drones);
            
            if (manual) {
              setError("Drone data synced successfully!");
              setJustAdded(true);
              setTimeout(() => {
                setJustAdded(false);
                setError(null);
              }, 2000);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching drone data from backend:", error);
      if (manual) {
        setError("Failed to sync drone data from server");
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshFromStorage();
    fetchDroneDataFromBackend();
  }, [refreshFromStorage, fetchDroneDataFromBackend]);

  useEffect(() => {
    const onUpdated = () => {
      console.log("📢 PILOT_PROFILE_UPDATED_EVENT received");
      refreshFromStorage(true);
      fetchDroneDataFromBackend();
    };
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, onUpdated);
  }, [refreshFromStorage, fetchDroneDataFromBackend]);

  useEffect(() => {
    const onFocus = () => {
      refreshFromStorage();
      fetchDroneDataFromBackend();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshFromStorage, fetchDroneDataFromBackend]);

  // Refresh drone data when add form is closed (to show newly added drones)
  useEffect(() => {
    if (!showAddForm) {
      console.log("🔄 Add form closed, refreshing drone data");
      fetchDroneDataFromBackend();
    }
  }, [showAddForm, fetchDroneDataFromBackend]);

  // Periodic sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDroneDataFromBackend();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDroneDataFromBackend]);

  async function handleDeleteDrone(drone: PilotProfileDrone) {
    console.log("🗑️ Delete button clicked for drone:", drone);
    
    const confirmDelete = confirm("Are you sure you want to delete this drone?");
    
    if (!confirmDelete) {
      console.log("❌ User cancelled deletion");
      return;
    }

    console.log("✅ User confirmed deletion");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to delete a drone.");
        return;
      }

      // Check if drone ID is a local storage ID (doesn't exist in backend yet)
      const isLocalStorageDrone = typeof drone.id === 'string' && drone.id.startsWith('drone-');
      
      if (!isLocalStorageDrone) {
        // Try to delete from backend first
        try {
          const response = await fetch(apiUrl(`/api/drones/${drone.id}`), {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn("Backend delete failed:", errorData.error);
            // Continue with local storage deletion even if backend fails
          } else {
            console.log("✅ Drone deleted from backend successfully");
          }
        } catch (backendError) {
          console.warn("Error deleting from backend, removing from local storage only:", backendError);
          // Continue with local storage deletion
        }
      } else {
        console.log("📦 Local storage drone detected, skipping backend delete");
      }

      // Persist deleted IDs so backend refreshes/page reloads do not show the row again.
      setDeletedDroneIds(prev => {
        const next = new Set(prev).add(String(drone.id));
        persistDeletedDroneIds(next);
        return next;
      });

      // Update local state
      const filteredDrones = drones.filter(d => d.id !== drone.id);
      setDrones(filteredDrones);

      // Update localStorage
      const storeKey = activePilotProfileSnapshotStorageKey();
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const updatedData = {
          ...parsed,
          drones: filteredDrones
        };
        localStorage.setItem(storeKey, JSON.stringify(updatedData));
        sessionStorage.setItem(storeKey, JSON.stringify(updatedData));
      }

      // Show success message
      setError("Drone details deleted successfully!");
      setJustAdded(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setJustAdded(false);
        setError(null);
      }, 3000);

    } catch (error) {
      console.error("Error deleting drone:", error);
      setError(error instanceof Error ? error.message : "Failed to delete drone. Please try again.");
    }
  }

  async function handleSendAdminRequest() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to send a request to admin.");
        return;
      }

      // Get pilot ID from token
      let pilotId = null;
      let pilotName = "";
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          pilotId = payload.sub ? parseInt(payload.sub, 10) : null;
          pilotName = payload.name || getPilotDisplayName(token);
        }
      } catch (tokenError) {
        console.warn("Invalid token format:", tokenError);
        setError("Invalid authentication token.");
        return;
      }

      if (!pilotId) {
        setError("Could not determine pilot ID.");
        return;
      }

      // Get current pilot profile and drone details
      const base = readBaseSnapshot();
      const pilotDetails = base ? {
        fullName: base.fullName,
        email: base.email,
        city: base.city,
        state: base.state,
        flightHours: base.flightHours,
        bio: base.bio,
        skills: base.skills,
        drones: base.drones,
        dgca: base.dgca
      } : null;

      // Send request to admin with pilot details
      const response = await fetch(apiUrl("/api/user-requests"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          pilot_id: pilotId,
          pilot_name: pilotName,
          request_type: "add_pilot_details",
          description: "Request to add/update pilot details and drone information",
          pilot_details: pilotDetails,
          status: "pending"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send request to admin");
      }

      const result = await response.json();
      console.log("Admin request sent successfully:", result);
      
      // Show success message
      setError("Request sent successfully!");
      setJustAdded(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setJustAdded(false);
        setError(null);
      }, 3000);
      
    } catch (error) {
      console.error("Error sending admin request:", error);
      setError(error instanceof Error ? error.message : "Failed to send request to admin. Please try again.");
    }
  }

  const visibleDrones = drones.filter(drone =>
    !droneIsDeleted(drone, deletedDroneIds) &&
    !(drone.modelName?.toLowerCase().includes('dji') &&
      drone.type === 'FPV' &&
      drone.camera === '5K' &&
      drone.payloadKg === '3.5' &&
      drone.flightTimeMin === '56')
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your drone fleet and equipment details
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSendAdminRequest}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-500/10"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Request to Admin
          </Button>
          <Button
            onClick={() => {
              if (isEditMode) {
                pauseBackendSync();
                // Trigger save when in edit mode
                if (dronePanelRef.current) {
                  dronePanelRef.current.triggerSave();
                }
              } else {
                setShowAddForm(!showAddForm);
                if (!showAddForm) {
                  setIsEditMode(false);
                  setEditingDrone(null);
                }
              }
            }}
            variant="outline"
            className="border-[#008B8B] text-[#008B8B] hover:bg-[#008B8B]/10"
          >
            {isEditMode ? (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {showAddForm ? "Cancel" : "Add New Drone"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={cn(
          "rounded-lg p-3 text-sm",
          justAdded 
            ? "bg-green-50 border border-green-200 text-green-800" 
            : "bg-red-50 border border-red-200 text-red-800"
        )}>
          {error}
        </div>
      )}

      {/* Existing Drones Display */}
      {visibleDrones.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Your Fleet</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Drone Model</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Camera</th>
                    <th className="px-4 py-3 font-semibold">Payload</th>
                    <th className="px-4 py-3 font-semibold">Flight Time</th>
                    <th className="px-4 py-3 font-semibold">Range</th>
                    <th className="px-4 py-3 font-semibold">Use Cases</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleDrones.map((drone, index) => (
                    <tr
                      key={drone.id || `drone-${index}`}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <DroneIcon className="h-4 w-4 shrink-0 text-[#008B8B]" />
                          <span>{drone.modelName || "Unnamed Drone"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {drone.type || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {drone.camera || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {drone.payloadKg ? `${drone.payloadKg} kg` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {drone.flightTimeMin ? `${drone.flightTimeMin} min` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {drone.rangeKm ? `${drone.rangeKm} km` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {drone.useCases && drone.useCases.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {drone.useCases.map((useCase, idx) => (
                              <span
                                key={idx}
                                className="inline-block rounded-full bg-[#008B8B]/10 px-2 py-1 text-xs font-medium text-[#008B8B]"
                              >
                                {useCase}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              pauseBackendSync();
                              setIsEditMode(true);
                              setEditingDrone(drone);
                              setShowAddForm(true);
                            }}
                            className="h-8 px-2"
                            aria-label={`Edit ${drone.modelName || "drone"}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDrone(drone)}
                            className="h-8 px-2 text-red-600 hover:border-red-300 hover:text-red-700"
                            aria-label={`Delete ${drone.modelName || "drone"}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Drones State */}
      {visibleDrones.length === 0 && (
        <div className="text-center py-12">
          <DroneIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Drones Added Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first drone to start managing your fleet
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-[#008B8B] hover:bg-[#006b6b]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Drone
            </Button>
            <Button
              onClick={handleSendAdminRequest}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-500/10"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Request to Admin
            </Button>
          </div>
        </div>
      )}

      {/* Add Drone Form */}
      {showAddForm && (
        <div className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {isEditMode ? "Save Changes" : "Add New Drone Details"}
            </h3>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setIsEditMode(false);
                setEditingDrone(null);
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
          <PilotSettingsAddDronePanel
            ref={dronePanelRef}
            showAdminRequest={true}
            withDroneList={false}
            openFormByDefault={true}
            editingDrone={editingDrone}
            onDroneAdded={() => {
              console.log("🎯 onDroneAdded callback triggered");
              pauseBackendSync();
              refreshFromStorage(true);
              setIsEditMode(false);
              setEditingDrone(null);
              setShowAddForm(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
