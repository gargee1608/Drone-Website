import { apiUrl } from "@/lib/api-url";
import type { PilotProfileDrone } from "@/lib/pilot-profile-snapshot";

type RawDrone = Record<string, unknown>;

/** Merge drone lists; later lists override earlier entries with the same id. */
export function mergePilotDroneLists(
  ...lists: PilotProfileDrone[][]
): PilotProfileDrone[] {
  const map = new Map<string, PilotProfileDrone>();
  for (const list of lists) {
    for (const d of list) {
      const id = String(d.id ?? "").trim();
      if (!id) continue;
      map.set(id, d);
    }
  }
  return [...map.values()];
}

export function mapRawDroneToProfile(
  drone: RawDrone,
  fallbackIndex = 0
): PilotProfileDrone {
  const idRaw = drone.id;
  const id =
    idRaw != null && String(idRaw).trim()
      ? String(idRaw)
      : `local-${Date.now()}-${fallbackIndex}`;
  return {
    id,
    modelName: String(drone.modelName ?? drone.model_name ?? "").trim(),
    type: String(drone.type ?? "").trim(),
    camera: String(drone.camera ?? "").trim(),
    payloadKg: String(
      drone.payloadKg ?? drone.payload_kg ?? drone.max_payload_kg ?? ""
    ).trim(),
    flightTimeMin: String(
      drone.flightTimeMin ?? drone.flight_time_min ?? ""
    ).trim(),
    rangeKm: String(
      drone.rangeKm ?? drone.rangeKg ?? drone.range_km ?? drone.max_range_km ?? ""
    ).trim(),
    useCases: Array.isArray(drone.useCases)
      ? (drone.useCases as string[]).map((v) => String(v))
      : Array.isArray(drone.use_cases)
        ? (drone.use_cases as string[]).map((v) => String(v))
        : [],
  };
}

export function droneDetailsFromPilotResponse(value: unknown): RawDrone[] {
  if (!value || typeof value !== "object") return [];
  const o = value as Record<string, unknown>;
  const nested = o.data;
  const details =
    o.drone_details ??
    (nested && typeof nested === "object"
      ? (nested as Record<string, unknown>).drone_details
      : undefined);
  return Array.isArray(details) ? (details as RawDrone[]) : [];
}

/**
 * Load every drone registered for a pilot (profile JSON + `drones` fleet table).
 * Used by Pilot Dashboard → My Drones so admin-added and self-added rows all appear.
 */
export async function fetchPilotDronesFromApi(
  pilotId: number,
  token: string
): Promise<PilotProfileDrone[]> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  const [pilotRes, fleetRes] = await Promise.all([
    fetch(apiUrl(`/api/pilots/${pilotId}`), { headers, cache: "no-store" }),
    fetch(apiUrl("/api/drones"), { headers, cache: "no-store" }),
  ]);

  const profileRows: RawDrone[] = [];
  if (pilotRes.ok) {
    const pilotData: unknown = await pilotRes.json();
    profileRows.push(...droneDetailsFromPilotResponse(pilotData));
  }

  const fleetRows: RawDrone[] = [];
  if (fleetRes.ok) {
    const fleetData: unknown = await fleetRes.json();
    const all = Array.isArray(fleetData) ? fleetData : [];
    for (const row of all) {
      if (!row || typeof row !== "object") continue;
      const r = row as RawDrone;
      const rowPilotId = Number.parseInt(String(r.pilot_id ?? ""), 10);
      if (rowPilotId === pilotId) {
        fleetRows.push(r);
      }
    }
  }

  const fromFleet = fleetRows.map((r, i) => mapRawDroneToProfile(r, i));
  const fromProfile = profileRows.map((r, i) => mapRawDroneToProfile(r, i));

  return mergePilotDroneLists(fromFleet, fromProfile);
}
