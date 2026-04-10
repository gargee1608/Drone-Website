/**
 * sessionStorage: latest submit (for /pilot-profile right after registration).
 * localStorage: last successful registration (pilot profile page; not used to pre-fill registration).
 */
export const PILOT_PROFILE_STORAGE_KEY = "aerolaminar_pilot_profile_snapshot";

/** Dispatched on window after a pilot profile snapshot is saved (e.g. registration submit). */
export const PILOT_PROFILE_UPDATED_EVENT = "aerolaminar-pilot-profile-updated";

export type PilotProfileDrone = {
  id: string;
  modelName: string;
  type: string;
  camera: string;
  payloadKg: string;
  flightTimeMin: string;
  rangeKm: string;
  useCases: string[];
};

export type PilotProfileSnapshot = {
  fullName: string;
  email?: string;
  phone?: string;
  city: string;
  state: string;
  /** Full digits; optional for snapshots saved before this field existed */
  aadhaar?: string;
  flightHours: number;
  bio: string;
  skills: string[];
  drones: PilotProfileDrone[];
  dgca: string;
};

export function parsePilotProfileSnapshot(
  raw: string | null
): PilotProfileSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PilotProfileSnapshot;
  } catch {
    return null;
  }
}
