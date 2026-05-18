"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PilotSettingsAddDronePanel } from "@/components/settings/pilot-settings-add-drone-panel";
import { notifyAdminFleetUpdated } from "@/lib/admin-fleet-updated";

interface UserRequest {
  id: number;
  pilot_id: number;
  pilot_name: string;
  request_type: string;
  description: string;
  pilot_details: any;
  status: string;
  created_at: string;
}

/** Admin dashboard version of drone management - without admin request option */
export function AdminDroneView() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request");
  const [request, setRequest] = useState<UserRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<UserRequest[]>([]);
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
  }, [requestId]);

  const fetchRequestDetails = async (id: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/user-requests`, {
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
      const response = await fetch(`http://localhost:4000/api/user-requests`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const pending = data.data.filter((req: UserRequest) => 
          req.status === 'pending' && req.request_type === 'add_pilot_details'
        );
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleEditRequest = (req: UserRequest) => {
    // Navigate to the detailed request view for editing
    window.location.href = `/dashboard/drone?request=${req.id}`;
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/user-requests/${requestId}`, {
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
              This form will add drone details to the pilot's profile based on their request.
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
                      let pilotCheckResponse = await fetch(`http://localhost:4000/api/pilots/${request.pilot_id}`, {
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
                        
                        const allPilotsResponse = await fetch(`http://localhost:4000/api/pilots`, {
                          headers: {
                            "Authorization": token ? `Bearer ${token}` : "",
                          },
                        });
                        
                        if (allPilotsResponse.ok) {
                          const allPilots = await allPilotsResponse.json();
                          console.log('Available pilots:', allPilots.map((p: any) => ({ id: p.id, name: p.name })));
                          
                          // Find pilot by name (case-insensitive)
                          const foundPilot = allPilots.find((p: any) => 
                            p.name && p.name.toLowerCase() === request.pilot_name.toLowerCase()
                          );
                          
                          if (foundPilot) {
                            console.log('Found pilot by name:', foundPilot);
                            pilotData = foundPilot;
                            actualPilotId = foundPilot.id;
                          } else {
                            // Create new pilot if not found
                            console.log('Pilot not found, creating new pilot:', request.pilot_name);
                            const createPilotResponse = await fetch(`http://localhost:4000/api/pilots`, {
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
                      const droneResponse = await fetch(`http://localhost:4000/api/pilots/${actualPilotId}/drones`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({ drones: [droneFormData] }),
                      });

                      if (droneResponse.ok) {
                        // Update request status to show drone details were added
                        const statusResponse = await fetch(`http://localhost:4000/api/user-requests/${request.id}`, {
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
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Pending Pilot Requests
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      Request from {req.pilot_name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {req.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Normal Drone Management Section */}
      <PilotSettingsAddDronePanel showAdminRequest={false} />
    </div>
  );
}
