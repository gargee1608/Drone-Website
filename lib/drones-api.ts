import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";

/** Normalized drone registered by a pilot (profile JSON and/or `drones` fleet row). */
export type HubDroneRow = {
  id: string;
  pilotId: string;
  pilotName: string;
  modelName: string;
  type: string;
  camera: string;
  serialNumber: string;
  maxPayloadKg: number | null;
  maxRangeKm: number | null;
  flightTimeMin: number | null;
  batteryPercent: number | null;
  firmware: string;
  imageUrl: string;
  status: string;
  subtitle: string;
  useCases: string[];
};

function textField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function numField(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (value == null || value === "") continue;
    const n = typeof value === "number" ? value : Number.parseFloat(String(value));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function useCasesField(row: Record<string, unknown>): string[] {
  const raw = row.use_cases ?? row.useCases;
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => String(v ?? "").trim()).filter(Boolean);
}

function parsePilotDroneDetailsField(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function droneMergeKey(row: HubDroneRow): string {
  if (row.pilotId && row.id) return `${row.pilotId}::${row.id}`;
  return row.id;
}

/** Map API / profile JSON into a single hub drone row. */
export function normalizeHubDroneRow(raw: unknown): HubDroneRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = textField(r, "id");
  if (!id) return null;

  return {
    id,
    pilotId: textField(r, "pilot_id", "pilotId"),
    pilotName: textField(r, "pilot_name", "pilotName"),
    modelName: textField(r, "model_name", "modelName") || "Drone",
    type: textField(r, "type"),
    camera: textField(r, "camera"),
    serialNumber: textField(r, "serial_number", "serialNumber"),
    maxPayloadKg: numField(r, "max_payload_kg", "maxPayloadKg", "payload_kg", "payloadKg"),
    maxRangeKm: numField(r, "max_range_km", "maxRangeKm", "range_km", "rangeKm"),
    flightTimeMin: numField(r, "flight_time_min", "flightTimeMin"),
    batteryPercent: numField(r, "battery_percent", "batteryPercent"),
    firmware: textField(r, "firmware"),
    imageUrl: textField(r, "image_url", "imageUrl"),
    status: textField(r, "status") || "ready",
    subtitle: textField(r, "subtitle"),
    useCases: useCasesField(r),
  };
}

function normalizeProfileDroneToHub(
  raw: unknown,
  pilotId: string,
  pilotName: string,
  index: number
): HubDroneRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const merged: Record<string, unknown> = {
    ...r,
    pilot_id: pilotId || r.pilot_id,
    pilot_name: pilotName || r.pilot_name,
    model_name: r.modelName ?? r.model_name,
    max_payload_kg: r.max_payload_kg ?? r.maxPayloadKg ?? r.payload_kg ?? r.payloadKg,
    max_range_km: r.max_range_km ?? r.maxRangeKm ?? r.range_km ?? r.rangeKm,
    flight_time_min: r.flight_time_min ?? r.flightTimeMin,
    use_cases: r.use_cases ?? r.useCases,
  };
  const id =
    textField(merged, "id") ||
    (pilotId ? `profile-${pilotId}-${index}` : `profile-${index}`);
  merged.id = id;
  const row = normalizeHubDroneRow(merged);
  if (!row) return null;
  return {
    ...row,
    pilotId: pilotId || row.pilotId,
    pilotName: pilotName || row.pilotName,
  };
}

function parseDroneArray(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
  }
  return [];
}

function mergeHubDrone(existing: HubDroneRow, incoming: HubDroneRow): HubDroneRow {
  return {
    id: incoming.id || existing.id,
    pilotId: incoming.pilotId || existing.pilotId,
    pilotName: incoming.pilotName || existing.pilotName,
    modelName: incoming.modelName || existing.modelName,
    type: incoming.type || existing.type,
    camera: incoming.camera || existing.camera,
    serialNumber: incoming.serialNumber || existing.serialNumber,
    maxPayloadKg: incoming.maxPayloadKg ?? existing.maxPayloadKg,
    maxRangeKm: incoming.maxRangeKm ?? existing.maxRangeKm,
    flightTimeMin: incoming.flightTimeMin ?? existing.flightTimeMin,
    batteryPercent: incoming.batteryPercent ?? existing.batteryPercent,
    firmware: incoming.firmware || existing.firmware,
    imageUrl: incoming.imageUrl || existing.imageUrl,
    status: incoming.status || existing.status,
    subtitle: incoming.subtitle || existing.subtitle,
    useCases: incoming.useCases.length > 0 ? incoming.useCases : existing.useCases,
  };
}

export function hubDroneSummary(drone: HubDroneRow): string {
  const parts = [
    drone.modelName,
    drone.type,
    drone.maxPayloadKg != null ? `${drone.maxPayloadKg} kg` : "",
    drone.maxRangeKm != null ? `${drone.maxRangeKm} km` : "",
  ].filter(Boolean);
  return parts.join(" · ") || drone.modelName;
}

export async function fetchDronesList(): Promise<{
  ok: boolean;
  data: HubDroneRow[];
  error?: string;
}> {
  try {
    const res = await fetch(apiUrl("/api/drones"), { cache: "no-store" });
    const body = await readResponseJson(res);
    if (!body.okParse) {
      return { ok: false, data: [], error: "Invalid response from server." };
    }
    if (!res.ok) {
      const err =
        body.data &&
        typeof body.data === "object" &&
        "error" in (body.data as Record<string, unknown>) &&
        typeof (body.data as Record<string, unknown>).error === "string"
          ? String((body.data as Record<string, unknown>).error)
          : "Could not load drones.";
      return { ok: false, data: [], error: err };
    }
    const list = parseDroneArray(body.data);
    const data = list
      .map(normalizeHubDroneRow)
      .filter((row): row is HubDroneRow => row != null && Boolean(row.pilotId));
    return { ok: true, data };
  } catch {
    return { ok: false, data: [], error: "Could not reach the API server." };
  }
}

/**
 * Every drone registered by pilots: `pilots.drone_details` plus `drones` rows with `pilot_id`.
 */
export async function fetchPilotRegisteredHubDrones(): Promise<{
  ok: boolean;
  data: HubDroneRow[];
  error?: string;
}> {
  try {
    const [pilotsRes, fleetRes] = await Promise.all([
      fetch(apiUrl("/api/pilots"), { cache: "no-store" }),
      fetch(apiUrl("/api/drones"), { cache: "no-store" }),
    ]);

    const byKey = new Map<string, HubDroneRow>();
    let pilotsOk = false;

    const put = (row: HubDroneRow | null) => {
      if (!row || !row.pilotId) return;
      const key = droneMergeKey(row);
      const prev = byKey.get(key);
      byKey.set(key, prev ? mergeHubDrone(prev, row) : row);
    };

    if (pilotsRes.ok) {
      const pilotsBody = await readResponseJson(pilotsRes);
      if (pilotsBody.okParse) {
        pilotsOk = true;
        const pilots = parseDroneArray(pilotsBody.data);
        for (const pilot of pilots) {
          if (!pilot || typeof pilot !== "object") continue;
          const pr = pilot as Record<string, unknown>;
          const pilotId = textField(pr, "id");
          if (!pilotId) continue;
          const pilotName =
            textField(pr, "name") || `Pilot #${pilotId}`;
          const details = parsePilotDroneDetailsField(
            pr.drone_details ?? pr.droneDetails
          );
          for (let i = 0; i < details.length; i += 1) {
            put(normalizeProfileDroneToHub(details[i], pilotId, pilotName, i));
          }
        }
      }
    }

    if (fleetRes.ok) {
      const fleetBody = await readResponseJson(fleetRes);
      if (fleetBody.okParse) {
        for (const raw of parseDroneArray(fleetBody.data)) {
          if (!raw || typeof raw !== "object") continue;
          const r = raw as Record<string, unknown>;
          const pilotId = textField(r, "pilot_id", "pilotId");
          if (!pilotId) continue;
          put(normalizeHubDroneRow(raw));
        }
      }
    }

    const data = [...byKey.values()].sort((a, b) => {
      const byPilot = a.pilotName.localeCompare(b.pilotName, undefined, {
        sensitivity: "base",
      });
      if (byPilot !== 0) return byPilot;
      return a.modelName.localeCompare(b.modelName, undefined, {
        sensitivity: "base",
      });
    });

    if (data.length === 0) {
      if (!pilotsOk && !fleetRes.ok) {
        return {
          ok: false,
          data: [],
          error: "Could not load pilot-registered drones.",
        };
      }
    }

    return { ok: true, data };
  } catch {
    return { ok: false, data: [], error: "Could not reach the API server." };
  }
}

/** @deprecated Use {@link fetchPilotRegisteredHubDrones}. */
export async function fetchAllHubDrones(): Promise<{
  ok: boolean;
  data: HubDroneRow[];
  error?: string;
}> {
  return fetchPilotRegisteredHubDrones();
}
