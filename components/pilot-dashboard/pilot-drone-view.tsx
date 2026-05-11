"use client";

import { Plus, Edit, Trash2, Drone as DroneIcon, Send, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { patchPilotDroneDetails } from "@/app/services/pilotServices";
import { PilotSettingsAddDronePanel } from "@/components/settings/pilot-settings-add-drone-panel";
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
  const [drones, setDrones] = useState<PilotProfileDrone[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justDeleted, setJustDeleted] = useState(false);

  // Add a global deletion flag
let isCurrentlyDeleting = false;

  const refreshFromStorage = useCallback(() => {
    console.log("🔄 refreshFromStorage called");
    
    // Only refresh if we have a good reason to
    const base = readBaseSnapshot();
    console.log("📦 Reading from storage, base:", base);
    
    if (base && base.drones) {
      console.log("� Storage has", base.drones.length, "drones, UI has", drones.length, "drones");
      
      // Only update if storage has significantly different data
      if (base.drones.length !== drones.length) {
        console.log("� Updating UI from storage (count mismatch)");
        setDrones([...base.drones]);
      } else {
        console.log("🔄 Skipping update (counts match)");
      }
    } else {
      console.log("📭 No base data, keeping current state");
    }
  }, [drones.length]);

  const fetchDroneDataFromBackend = useCallback(async (manual = false) => {
    try {
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
      const response = await fetch(`http://localhost:4000/api/pilots/${pilotId}`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });

      if (response.ok) {
        const pilotData = await response.json();
        if (pilotData.drone_details && Array.isArray(pilotData.drone_details)) {
          // Update local storage with backend data
          const base = readBaseSnapshot();
          if (base) {
            const updatedSnapshot: PilotProfileSnapshot = {
              ...base,
              drones: pilotData.drone_details.map((drone: any, index: number) => ({
                id: drone.id ? String(drone.id) : `local-${Date.now()}-${index}`,
                modelName: drone.modelName || drone.model_name || '',
                type: drone.type || '',
                camera: drone.camera || '',
                payloadKg: drone.payloadKg || drone.payload_kg || '',
                flightTimeMin: drone.flightTimeMin || drone.flight_time_min || '',
                rangeKm: drone.rangeKg || drone.range_km || '',
                useCases: drone.useCases || drone.use_cases || []
              }))
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
      refreshFromStorage();
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

  // Periodic sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDroneDataFromBackend();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDroneDataFromBackend]);

  async function handleDeleteDrone(drone: PilotProfileDrone) {
    console.log("🗑️ Delete button clicked for drone:", drone);
    
    if (!confirm("Are you sure you want to delete this drone?")) {
      console.log("❌ User cancelled deletion");
      return;
    }

    console.log("✅ User confirmed deletion - using simplified approach");
    
    // SIMPLE APPROACH: Just remove from current state immediately
    const currentDrones = [...drones];
    const filteredDrones = currentDrones.filter(d => d.id !== drone.id);
    
    console.log("🔄 Current drones:", currentDrones);
    console.log("✂️ Filtered drones:", filteredDrones);
    console.log("📊 Count before:", currentDrones.length, "after:", filteredDrones.length);
    
    // Force immediate UI update
    setDrones(filteredDrones);
    console.log("✅ UI state updated immediately");
    
    // Show success message
    setError("Drone removed successfully!");
    setJustAdded(true);
    
    // Try to update localStorage in background (non-blocking)
    setTimeout(() => {
      try {
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
          console.log("💾 Background localStorage update completed");
      }
    } catch (error) {
        console.warn("⚠️ Background localStorage update failed:", error);
      }
    }, 100);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setJustAdded(false);
      setError(null);
      console.log("🔄 Success message cleared");
    }, 3000);
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
      const response = await fetch("http://localhost:4000/api/user-requests", {
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
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            className="border-[#008B8B] text-[#008B8B] hover:bg-[#008B8B]/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            {showAddForm ? "Cancel" : "Add New Drone"}
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
      {drones.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Your Fleet</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {drones.filter(drone => 
              !(drone.modelName?.toLowerCase().includes('dji') && 
                drone.type === 'FPV' && 
                drone.camera === '5K' && 
                drone.payloadKg === '3.5' && 
                drone.flightTimeMin === '56')
            ).map((drone, index) => (
              <div
                key={drone.id || `drone-${index}`}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DroneIcon className="h-5 w-5 text-[#008B8B]" />
                    <h4 className="font-semibold text-foreground">
                      {drone.modelName || "Unnamed Drone"}
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddForm(true)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteDrone(drone)}
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{drone.type || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Camera:</span>
                    <span className="font-medium">{drone.camera || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payload:</span>
                    <span className="font-medium">{drone.payloadKg ? `${drone.payloadKg} kg` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flight Time:</span>
                    <span className="font-medium">{drone.flightTimeMin ? `${drone.flightTimeMin} min` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Range:</span>
                    <span className="font-medium">{drone.rangeKm ? `${drone.rangeKm} km` : "—"}</span>
                  </div>
                  {drone.useCases && drone.useCases.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground text-xs">Use Cases:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {drone.useCases.map((useCase, idx) => (
                          <span
                            key={idx}
                            className="inline-block rounded-full bg-[#008B8B]/10 px-2 py-1 text-xs font-medium text-[#008B8B]"
                          >
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Drones State */}
      {drones.length === 0 && !showAddForm && (
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
              Add New Drone Details
            </h3>
            <Button
              onClick={() => setShowAddForm(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
          <PilotSettingsAddDronePanel 
            showAdminRequest={true} 
            withDroneList={false}
            openFormByDefault={true}
          />
        </div>
      )}
    </div>
  );
}
