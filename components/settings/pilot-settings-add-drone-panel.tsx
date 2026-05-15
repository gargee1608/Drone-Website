"use client";

import { Plus, Edit, Trash2, X, Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, forwardRef, useImperativeHandle } from "react";

import { patchPilotDroneDetails } from "@/app/services/pilotServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { snapshotForSharedStorage } from "@/lib/pilot-profile-photo-storage";
import {
  parsePilotProfileSnapshot,
  PILOT_PROFILE_UPDATED_EVENT,
  type PilotProfileDrone,
  type PilotProfileSnapshot,
} from "@/lib/pilot-profile-snapshot";
import { cn } from "@/lib/utils";

const DRONE_TYPE_OPTIONS = ["FPV", "Autonomous", "Line of Sight"] as const;

const DRONE_USE_CASE_OPTIONS = [
  "Survey",
  "Filming",
  "Inspection",
  "Delivery",
  "Security",
] as const;

const selectClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function emptyDrone(): PilotProfileDrone {
  return {
    id: `drone-${
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11)
    }`,
    modelName: "",
    type: "",
    camera: "",
    payloadKg: "",
    flightTimeMin: "",
    rangeKm: "",
    useCases: [],
  };
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
  if (role === "admin") {
    return {
      fullName: getPilotDisplayName(token),
      email: undefined,
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
  const json = JSON.stringify(snapshotForSharedStorage(next));
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

export type PilotSettingsAddDronePanelProps = {
  /**
   * When false, only the add form is shown (drone list comes from parent profile).
   * Use inside PilotProfileView embedded drone section.
   */
  withDroneList?: boolean;
  /**
   * When true, shows option to send request to admin for adding pilot details.
   * Used in Pilot Dashboard context.
   */
  showAdminRequest?: boolean;
  /**
   * Whether to open the form by default (default false)
   */
  openFormByDefault?: boolean;
  /**
   * Callback called when a drone is successfully added
   */
  onDroneAdded?: () => void;
  /**
   * Drone data to edit (if provided, form will be in edit mode)
   */
  editingDrone?: PilotProfileDrone | null;
  /**
   * Callback to trigger save from parent component
   */
  onSaveTrigger?: () => void;
};

export interface PilotSettingsAddDronePanelRef {
  triggerSave: () => void;
}

export const PilotSettingsAddDronePanel = forwardRef<
  PilotSettingsAddDronePanelRef,
  PilotSettingsAddDronePanelProps
>(function PilotSettingsAddDronePanel({
  withDroneList = true,
  showAdminRequest = false,
  openFormByDefault = false,
  onDroneAdded,
  editingDrone,
  onSaveTrigger,
}, ref) {
  const pathname = usePathname();
  const router = useRouter();
  const formId = useId();
  const [showForm, setShowForm] = useState(openFormByDefault);
  const [editingDroneId, setEditingDroneId] = useState<string | null>(null);
  const [editingDroneData, setEditingDroneData] = useState<PilotProfileDrone | null>(null);
  const [drones, setDrones] = useState<PilotProfileDrone[]>([]);
  const [draftModel, setDraftModel] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftCamera, setDraftCamera] = useState("");
  const [draftPayload, setDraftPayload] = useState("");
  const [draftFlightMin, setDraftFlightMin] = useState("");
  const [draftRangeKm, setDraftRangeKm] = useState("");
  const [draftUseCases, setDraftUseCases] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  // Expose the save function to parent component
  useImperativeHandle(ref, () => ({
    triggerSave: () => {
      commitDraftDrone();
    }
  }), [editingDroneId, draftModel, draftType, draftCamera, draftPayload, draftFlightMin, draftRangeKm, draftUseCases]);

  // Debug: Log draft values when they change
  useEffect(() => {
    if (showForm) {
      console.log("Current draft values:", {
        model: draftModel,
        type: draftType,
        camera: draftCamera,
        payload: draftPayload,
        flightTime: draftFlightMin,
        range: draftRangeKm,
        useCases: draftUseCases,
        editingId: editingDroneId
      });
    }
  }, [draftModel, draftType, draftCamera, draftPayload, draftFlightMin, draftRangeKm, draftUseCases, showForm, editingDroneId]);

  // Populate form when editingDrone prop is provided
  useEffect(() => {
    if (editingDrone) {
      setEditingDroneId(editingDrone.id);
      setDraftModel(editingDrone.modelName || "");
      setDraftType(editingDrone.type || "");
      setDraftCamera(editingDrone.camera || "");
      setDraftPayload(editingDrone.payloadKg || "");
      setDraftFlightMin(editingDrone.flightTimeMin || "");
      setDraftRangeKm(editingDrone.rangeKm || "");
      setDraftUseCases(editingDrone.useCases || []);
    } else {
      // Reset form when not editing
      setEditingDroneId(null);
      setDraftModel("");
      setDraftType("");
      setDraftCamera("");
      setDraftPayload("");
      setDraftFlightMin("");
      setDraftRangeKm("");
      setDraftUseCases([]);
    }
  }, [editingDrone]);

  const refreshFromStorage = useCallback(() => {
    const base = readBaseSnapshot();
    setDrones(base ? [...base.drones] : []);
  }, []);

  useEffect(() => {
    if (!withDroneList) return;
    refreshFromStorage();
  }, [withDroneList, refreshFromStorage, pathname]);

  useEffect(() => {
    if (!withDroneList) return;
    const onUpdated = () => refreshFromStorage();
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, onUpdated);
  }, [withDroneList, refreshFromStorage]);

  useEffect(() => {
    if (!withDroneList) return;
    const onFocus = () => refreshFromStorage();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [withDroneList, refreshFromStorage]);

  function toggleDraftUseCase(label: string) {
    setDraftUseCases((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label]
    );
  }

  function handleEditDrone(drone: PilotProfileDrone) {
    console.log("Editing drone inline:", drone);
    
    // Set the drone for inline editing
    setEditingDroneId(drone.id);
    setEditingDroneData({
      ...drone,
      useCases: [...drone.useCases]
    });
  }

  function handleCancelEdit() {
    setEditingDroneId(null);
    setEditingDroneData(null);
  }

  async function handleSaveInlineEdit() {
    if (!editingDroneData) return;

    console.log("Saving inline edit for drone:", editingDroneData);

    try {
      const token = localStorage.getItem("token");
      console.log("Token found:", !!token);
      
      // Get pilot ID from token
      let pilotId = null;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            pilotId = payload.sub ? parseInt(payload.sub, 10) : null;
            console.log("Pilot ID extracted:", pilotId);
          }
        } catch (tokenError) {
          console.warn("Invalid token format, proceeding without pilot_id:", tokenError);
        }
      }

      // Update drone in backend
      const droneData = {
        model_name: editingDroneData.modelName,
        type: editingDroneData.type,
        camera: editingDroneData.camera || null,
        payload_kg: editingDroneData.payloadKg || null,
        flight_time_min: editingDroneData.flightTimeMin || null,
        range_km: editingDroneData.rangeKm || null,
        use_cases: editingDroneData.useCases,
      };

      console.log("Sending drone data to backend:", droneData);
      console.log("Updating drone ID:", editingDroneData.id);
      console.log("Drone ID type:", typeof editingDroneData.id);

      // Check if drone ID is a local storage ID (starts with "drone-") or a database ID
      let droneId: string | number = editingDroneData.id;
      let isNewDrone = false;
      
      if (typeof droneId === 'string' && droneId.startsWith('drone-')) {
        console.log("Local drone detected, creating new drone in database first");
        isNewDrone = true;
        
        // Create new drone in database first
        const createResponse = await fetch("http://localhost:4000/api/drones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            pilot_id: pilotId,
            model_name: editingDroneData.modelName,
            type: editingDroneData.type,
            camera: editingDroneData.camera || null,
            payload_kg: editingDroneData.payloadKg || null,
            flight_time_min: editingDroneData.flightTimeMin || null,
            range_km: editingDroneData.rangeKm || null,
            use_cases: editingDroneData.useCases,
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error("Failed to create drone in database");
        }
        
        const createResult = await createResponse.json();
        droneId = String(createResult.id);
        console.log("Created new drone with ID:", droneId);

        // Update the editing drone data with the new database ID
        setEditingDroneData({
          ...editingDroneData,
          id: droneId
        });
      }
      
      // Convert string ID to number if needed
      if (typeof droneId === 'string' && !isNaN(Number(droneId))) {
        droneId = Number(droneId);
        console.log("Converted string ID to number:", droneId);
      }

      const response = await fetch(`http://localhost:4000/api/drones/${droneId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(droneData),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) { 
        let errorMessage = "Failed to update drone";
        try {  
          const responseText = await response.text();
          console.log("Error response text:", responseText);
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn("Could not parse error response:", parseError);
        }
        
        // Fallback: Update local storage only if backend update fails
        console.warn("Backend update failed, updating local storage only");
        const base = readBaseSnapshot();
        if (base) {
          const next: PilotProfileSnapshot = {
            ...base,
            drones: base.drones.map(d => d.id === editingDroneData.id ? editingDroneData : d),
          };
          persistSnapshot(next);
          if (withDroneList) {
            setDrones(next.drones);
          }
        }
        
        // Exit edit mode even if backend failed
        setEditingDroneId(null);
        setEditingDroneData(null);
        
        throw new Error(errorMessage + " (Updated locally only)");
      }

      const result = await response.json();
      console.log("Drone updated successfully:", result);

      // Update local storage with backend response
      const base = readBaseSnapshot();
      if (base) {
        const updatedDrone = {
          ...editingDroneData,
          id: result.id || editingDroneData.id
        };
        
        let next: PilotProfileSnapshot;
        if (isNewDrone) {
          // For new drones, replace the old local drone with the new database drone
          next = {
            ...base,
            drones: base.drones.map(d => d.id === editingDroneData.id ? updatedDrone : d),
          };
        } else {
          // For existing drones, update normally
          next = {
            ...base,
            drones: base.drones.map(d => d.id === editingDroneData.id ? updatedDrone : d),
          };
        }
        
        persistSnapshot(next);
        if (withDroneList) {
          setDrones(next.drones);
        }
      }

      // Exit edit mode
      setEditingDroneId(null);
      setEditingDroneData(null);

      // Notify parent component that drone was updated
      if (onDroneAdded) {
        onDroneAdded();
      }

    } catch (error) {
      console.error("Error updating drone:", error);
      setError(error instanceof Error ? error.message : "Failed to update drone");
    }
  }

  function updateEditingDroneField(field: keyof PilotProfileDrone, value: any) {
    if (!editingDroneData) return;
    setEditingDroneData({
      ...editingDroneData,
      [field]: value
    });
  }

  async function handleSaveDrone(updatedDrone: PilotProfileDrone) {
    try {
      const token = localStorage.getItem("token");
      
      // Get pilot ID from token
      let pilotId = null;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            pilotId = payload.sub ? parseInt(payload.sub, 10) : null;
          }
        } catch (tokenError) {
          console.warn("Invalid token format, proceeding without pilot_id:", tokenError);
        }
      }

      // Ensure we have a pilot ID for drone operations
      if (!pilotId) {
        setError("Unable to determine pilot ID. Please log in again to update drones.");
        return;
      }

      // Update drone in backend
      const droneData = {
        model_name: updatedDrone.modelName,
        type: updatedDrone.type,
        camera: updatedDrone.camera || null,
        payload_kg: updatedDrone.payloadKg || null,
        flight_time_min: updatedDrone.flightTimeMin || null,
        range_km: updatedDrone.rangeKm || null,
        use_cases: updatedDrone.useCases,
      };

      const response = await fetch(`http://localhost:4000/api/drones/${updatedDrone.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(droneData),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update drone";
        try {
          const responseText = await response.text();
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn("Could not parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Drone updated successfully:", result);

      // Update local storage
      const base = readBaseSnapshot();
      if (base) {
        const next: PilotProfileSnapshot = {
          ...base,
          drones: base.drones.map(d => d.id === updatedDrone.id ? updatedDrone : d),
        };
        persistSnapshot(next);
        if (withDroneList) {
          setDrones(next.drones);
        }
      }

    } catch (error) {
      console.error("Error updating drone:", error);
      throw error;
    }
  }

  async function handleDeleteDrone(drone: PilotProfileDrone) {
    if (!confirm("Are you sure you want to delete this drone?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Try to delete from backend first
      const response = await fetch(`http://localhost:4000/api/drones/${drone.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });

      if (response.ok) {
        console.log("Drone deleted successfully from backend");
      } else {
        console.warn("Failed to delete from backend, removing from local storage only");
      }
    } catch (error) {
      console.warn("Error deleting from backend, removing from local storage only:", error);
    }

    // Always remove from local storage
    const base = readBaseSnapshot();
    if (base) {
      const next: PilotProfileSnapshot = {
        ...base,
        drones: base.drones.filter(d => d.id !== drone.id),
      };
      persistSnapshot(next);
      if (withDroneList) {
        setDrones(next.drones);
      }
    }
  }

  async function commitDraftDrone() {
    const base = readBaseSnapshot();
    if (!base) {
      setError("Could not load your pilot profile. Try again after opening Profile.");
      return;
    }
    const model = draftModel.trim();
    const type = draftType.trim();
    if (!model) {
      setError("Model name is required.");
      return;
    }
    if (!type) {
      setError("Type is required.");
      return;
    }

    try {
      // Get pilot ID from token
      const token = localStorage.getItem("token");
      let pilotId = null;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            pilotId = payload.sub ? parseInt(payload.sub, 10) : null;
          }
        } catch (tokenError) {
          console.warn("Invalid token format, proceeding without pilot_id:", tokenError);
          // Continue without pilot_id if token is invalid
        }
      }

      // Ensure we have a pilot ID for drone creation
      if (!pilotId && !editingDroneId) {
        setError("Unable to determine pilot ID. Please log in again to add drones.");
        return;
      }

      // Save to backend
      const droneData = {
        model_name: model,
        type,
        camera: draftCamera.trim() || null,
        payload_kg: draftPayload.trim() || null,
        flight_time_min: draftFlightMin.trim() || null,
        range_km: draftRangeKm.trim() || null,
        use_cases: draftUseCases,
      };
      
      console.log("Saving drone data:", droneData);
      
      let response;
      let isNewDrone = false;
      let droneId = editingDroneId;

      console.log("Editing drone ID:", editingDroneId, "Type:", typeof editingDroneId);

      if (editingDroneId) {
        // Check if drone ID is a local storage ID (starts with "drone-") or a database ID
        if (typeof editingDroneId === 'string' && editingDroneId.startsWith('drone-')) {
          console.log("Local drone detected, creating new drone in database first");
          isNewDrone = true;

          // Create new drone in database first
          const createData = {
            ...droneData,
            pilot_id: pilotId,
          };

          try {
            const createResponse = await fetch("http://localhost:4000/api/drones", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : "",
              },
              body: JSON.stringify(createData),
            });

            if (!createResponse.ok) {
              const errorText = await createResponse.text();
              console.error("Failed to create drone in database:", errorText);
              throw new Error("Failed to create drone in database");
            }

            const createResult = await createResponse.json();
            droneId = createResult.id;
            console.log("Created new drone with ID:", droneId);

            // Update the editing drone ID with the new database ID
            setEditingDroneId(droneId);

            // Now update the drone with the correct data
            response = await fetch(`http://localhost:4000/api/drones/${droneId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : "",
              },
              body: JSON.stringify(droneData),
            });
          } catch (createError) {
            console.error("Error creating drone:", createError);
            // If creation fails, just save to local storage
            console.warn("Falling back to local storage only");
            // Don't set response - let it fall through to local storage save
            response = { ok: false, status: 500, text: () => Promise.resolve("Backend unavailable") };
          }
        } else {
          // Update existing drone in database
          console.log("Updating existing drone with ID:", editingDroneId);
          try {
            response = await fetch(`http://localhost:4000/api/drones/${editingDroneId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : "",
              },
              body: JSON.stringify(droneData),
            });
          } catch (networkError) {
            console.error("Network error when updating drone:", networkError);
            // Set response to indicate network failure
            response = { ok: false, status: 0, text: () => Promise.resolve("Network error") };
          }
        }
      } else {
        // Create new drone - always include pilot_id
        const createData = {
          ...droneData,
          pilot_id: pilotId,
        };
        
        console.log("Creating new drone for pilot:", pilotId, createData);
        
        try {
          response = await fetch("http://localhost:4000/api/drones", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify(createData),
          });
        } catch (networkError) {
          console.error("Network error when creating drone:", networkError);
          // Set response to indicate network failure
          response = { ok: false, status: 0, text: () => Promise.resolve("Network error"), json: () => Promise.resolve({}) };
        }
      }
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        let errorMessage = "Failed to save drone";
        try {
          const responseText = await response.text();
          console.log("Error response text:", responseText);
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn("Could not parse error response:", parseError);
        }

        // Fallback: Save to local storage only if backend is not available or drone not found
        if (response.status === 500 || response.status === 0 || response.status === 404) {
          console.warn("Backend error (status:", response.status, "), saving to local storage only");
          const row: PilotProfileDrone = {
            ...emptyDrone(),
            id: editingDroneId || `drone-${Date.now()}`,
            modelName: model,
            type,
            camera: draftCamera.trim(),
            payloadKg: draftPayload.trim(),
            flightTimeMin: draftFlightMin.trim(),
            rangeKm: draftRangeKm.trim(),
            useCases: [...draftUseCases],
          };

          let next: PilotProfileSnapshot;
          if (editingDroneId) {
            // Update existing drone in local storage
            next = {
              ...base,
              drones: base.drones.map(d => d.id === editingDroneId ? row : d),
            };
          } else {
            // Add new drone to local storage
            next = {
              ...base,
              drones: [...base.drones, row],
            };
          }

          persistSnapshot(next);
          if (withDroneList) {
            setDrones(next.drones);
          }

          // Call the callback to notify parent
          if (onDroneAdded) {
            onDroneAdded();
          }

          // Reset form
          setDraftModel("");
          setDraftType("");
          setDraftCamera("");
          setDraftPayload("");
          setDraftFlightMin("");
          setDraftRangeKm("");
          setDraftUseCases([]);
          setEditingDroneId(null);
          setError("Save successfully");
          setJustAdded(true);
          window.setTimeout(() => setJustAdded(false), 2200);

          return; // Exit successfully after local storage save
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Drone saved successfully:", result);

      // Also save to local storage for backward compatibility
      const row: PilotProfileDrone = {
        ...emptyDrone(),
        id: result.id || droneId || editingDroneId || `drone-${Date.now()}`,
        modelName: model,
        type,
        camera: draftCamera.trim(),
        payloadKg: draftPayload.trim(),
        flightTimeMin: draftFlightMin.trim(),
        rangeKm: draftRangeKm.trim(),
        useCases: [...draftUseCases],
      };

      let next: PilotProfileSnapshot;
      if (editingDroneId) {
        // Update existing drone in local storage
        // Match by the original editingDroneId (before any potential ID change from backend)
        const oldId = editingDroneId;
        const newId = result.id || droneId || editingDroneId;
        
        console.log("Updating drone in local storage - oldId:", oldId, "newId:", newId);
        
        next = {
          ...base,
          drones: base.drones.map(d => {
            // Match by old ID (string or number comparison)
            const match = String(d.id) === String(oldId);
            if (match) {
              console.log("Found drone to update:", d.id, "->", newId);
              return { ...row, id: newId };
            }
            return d;
          }),
        };
      } else {
        // Add new drone to local storage
        next = {
          ...base,
          drones: [...base.drones, row],
        };
      }

      persistSnapshot(next);
      if (withDroneList) {
        setDrones(next.drones);
      }

      // Call the callback to notify parent after a small delay to ensure storage is updated
      console.log("🔔 Calling onDroneAdded callback after successful save");
      setTimeout(() => {
        if (onDroneAdded) {
          onDroneAdded();
          console.log("✅ onDroneAdded callback executed");
        } else {
          console.log("⚠️ onDroneAdded callback is not defined");
        }
      }, 100);

      // Reset form
      setDraftModel("");
      setDraftType("");
      setDraftCamera("");
      setDraftPayload("");
      setDraftFlightMin("");
      setDraftRangeKm("");
      setDraftUseCases([]);
      setEditingDroneId(null);
      setError("Save successfully");
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 2200);
      
    } catch (error) {
      console.error("Error saving drone:", error);
      setError(error instanceof Error ? error.message : "Failed to save drone. Please try again.");
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

  const formFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor={`${formId}-model`}
          className="text-sm font-medium text-foreground"
        >
          Model name <RequiredMark />
        </label>
        <Input
          id={`${formId}-model`}
          value={draftModel}
          onChange={(e) => setDraftModel(e.target.value)}
          placeholder="DJI Mavic 3"
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor={`${formId}-type`}
          className="text-sm font-medium text-foreground"
        >
          Type <RequiredMark />
        </label>
        <select
          id={`${formId}-type`}
          value={draftType}
          onChange={(e) => setDraftType(e.target.value)}
          className={selectClass}
        >
          <option value="">Select type</option>
          {DRONE_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Technical specifications
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`${formId}-camera`}
            className="text-sm font-medium text-foreground"
          >
            Camera
          </label>
          <Input
            id={`${formId}-camera`}
            value={draftCamera}
            onChange={(e) => setDraftCamera(e.target.value)}
            placeholder="4K HDR"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor={`${formId}-payload`}
            className="text-sm font-medium text-foreground"
          >
            Payload (kg)
          </label>
          <Input
            id={`${formId}-payload`}
            value={draftPayload}
            onChange={(e) => setDraftPayload(e.target.value)}
            placeholder="2.5"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor={`${formId}-flight`}
            className="text-sm font-medium text-foreground"
          >
            Flight time (min)
          </label>
          <Input
            id={`${formId}-flight`}
            value={draftFlightMin}
            onChange={(e) => setDraftFlightMin(e.target.value)}
            placeholder="45"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor={`${formId}-range`}
            className="text-sm font-medium text-foreground"
          >
            Range (km)
          </label>
          <Input
            id={`${formId}-range`}
            value={draftRangeKm}
            onChange={(e) => setDraftRangeKm(e.target.value)}
            placeholder="15"
            className="h-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Use cases</p>
        <div className="flex flex-wrap gap-2">
          {DRONE_USE_CASE_OPTIONS.map((label) => {
            const on = draftUseCases.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleDraftUseCase(label)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  on
                    ? "border-[#008B8B] bg-[#008B8B]/10 text-[#006060]"
                    : "border-border bg-background text-foreground hover:bg-muted/50"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {justAdded ? (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Your new drone was saved to your profile.
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full border-[#008B8B] py-5 font-semibold text-[#008B8B] hover:bg-[#008B8B]/10"
        onClick={commitDraftDrone}
      >
        {editingDroneId ? (
          <>
            <Edit className="mr-2 inline size-4" aria-hidden />
            Save Changes
          </>
        ) : (
          <>
            <Plus className="mr-2 inline size-4" aria-hidden />
            Add new drone
          </>
        )}
      </Button>
    </div>
  );

  if (!withDroneList) {
    return (
      <div className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
        <h3 className="mb-4 text-center text-sm font-semibold text-foreground">
          Add New Drone Details
        </h3>
        <div className="text-left">{formFields}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => setShowForm(!showForm)}
          variant="outline"
          className="border-[#008B8B] text-[#008B8B] hover:bg-[#008B8B]/10 px-6 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Drone Details
        </Button>
        {showAdminRequest && (
          <Button
            onClick={handleSendAdminRequest}
            variant="outline"
            className="border-purple-500 text-purple-600 hover:bg-purple-50 px-6 py-2"
          >
            <Send className="mr-2 h-4 w-4" />
            Send request to admin
          </Button>
        )}
      </div>
      
      {showForm && (
        <div className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {editingDroneId ? "Edit Drone Details" : "Add New Drone Details"}
            </h3>
            {editingDroneId && (
              <button
                onClick={() => console.log("Current drones state:", drones)}
                className="text-xs text-gray-500 underline"
              >
                Debug Drones
              </button>
            )}
            <Button
              onClick={() => {
                setShowForm(false);
                setEditingDroneId(null);
                // Reset form
                setDraftModel("");
                setDraftType("");
                setDraftCamera("");
                setDraftPayload("");
                setDraftFlightMin("");
                setDraftRangeKm("");
                setDraftUseCases([]);
              }}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-2"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-left">{formFields}</div>
        </div>
      )}
    </div>
  );
});
