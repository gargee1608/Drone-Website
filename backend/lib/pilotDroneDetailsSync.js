const pool = require("../db");

async function ensurePilotDroneDetailsColumn() {
  await pool.query(
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS drone_details JSONB NOT NULL DEFAULT '[]'::jsonb"
  );
}

function normalizePilotDroneDetails(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item;
    const useCasesRaw = Array.isArray(o.useCases)
      ? o.useCases
      : Array.isArray(o.use_cases)
        ? o.use_cases
        : [];
    const useCases = useCasesRaw
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .slice(0, 12);
    out.push({
      id: String(o.id ?? "").trim().slice(0, 120),
      modelName: String(o.modelName ?? o.model_name ?? "").trim().slice(0, 120),
      type: String(o.type ?? "").trim().slice(0, 120),
      camera: String(o.camera ?? "").trim().slice(0, 120),
      payloadKg: String(o.payloadKg ?? o.payload_kg ?? "").trim().slice(0, 40),
      flightTimeMin: String(
        o.flightTimeMin ?? o.flight_time_min ?? ""
      )
        .trim()
        .slice(0, 40),
      rangeKm: String(o.rangeKm ?? o.range_km ?? "").trim().slice(0, 40),
      useCases,
    });
    if (out.length >= 50) break;
  }
  return out;
}

function pilotDroneIdentityKey(drone) {
  const id = String(drone?.id ?? "").trim();
  if (id) return `id:${id}`;
  const useCases = Array.isArray(drone?.useCases)
    ? drone.useCases.map((v) => String(v ?? "").trim().toLowerCase()).join("|")
    : "";
  return [
    "f",
    String(drone?.modelName ?? "").trim().toLowerCase(),
    String(drone?.type ?? "").trim().toLowerCase(),
    String(drone?.camera ?? "").trim().toLowerCase(),
    String(drone?.payloadKg ?? "").trim().toLowerCase(),
    String(drone?.flightTimeMin ?? "").trim().toLowerCase(),
    String(drone?.rangeKm ?? "").trim().toLowerCase(),
    useCases,
  ].join("::");
}

function mergePilotDroneDetails(existingValue, incomingValue) {
  const existing = normalizePilotDroneDetails(existingValue);
  const incoming = normalizePilotDroneDetails(incomingValue);
  if (incoming.length === 0) return existing;
  if (existing.length === 0) return incoming;

  const merged = [];
  const keyToIndex = new Map();

  for (const drone of existing) {
    const key = pilotDroneIdentityKey(drone);
    if (keyToIndex.has(key)) continue;
    keyToIndex.set(key, merged.length);
    merged.push(drone);
  }

  for (const drone of incoming) {
    const key = pilotDroneIdentityKey(drone);
    const idx = keyToIndex.get(key);
    if (idx == null) {
      keyToIndex.set(key, merged.length);
      merged.push(drone);
      continue;
    }
    merged[idx] = drone;
  }

  return merged.slice(0, 50);
}

function fleetRowToProfileDrone(row) {
  if (!row || typeof row !== "object") return null;
  const useCases = Array.isArray(row.use_cases)
    ? row.use_cases.map((v) => String(v ?? "").trim()).filter(Boolean)
    : [];
  const id = row.id != null ? String(row.id) : "";
  if (!id) return null;
  return {
    id,
    modelName: String(row.model_name ?? "").trim(),
    type: String(row.type ?? "").trim(),
    camera: String(row.camera ?? "").trim(),
    payloadKg:
      row.max_payload_kg != null && row.max_payload_kg !== ""
        ? String(row.max_payload_kg)
        : "",
    flightTimeMin:
      row.flight_time_min != null && row.flight_time_min !== ""
        ? String(row.flight_time_min)
        : "",
    rangeKm:
      row.max_range_km != null && row.max_range_km !== ""
        ? String(row.max_range_km)
        : "",
    useCases,
  };
}

async function loadFleetDronesForPilot(pilotId) {
  const pid = Number.parseInt(String(pilotId), 10);
  if (!Number.isFinite(pid)) return [];
  const result = await pool.query(
    `SELECT * FROM drones WHERE pilot_id = $1 ORDER BY id ASC`,
    [pid]
  );
  return result.rows
    .map(fleetRowToProfileDrone)
    .filter((row) => row != null);
}

/** Persist merged fleet + profile drones into `pilots.drone_details`. */
async function syncPilotDroneDetailsFromFleet(pilotId) {
  const pid = Number.parseInt(String(pilotId), 10);
  if (!Number.isFinite(pid)) return;

  await ensurePilotDroneDetailsColumn();
  const fleetDrones = await loadFleetDronesForPilot(pid);
  const existing = await pool.query(
    `SELECT drone_details FROM pilots WHERE id = $1`,
    [pid]
  );
  if (existing.rows.length === 0) return;

  const merged = mergePilotDroneDetails(
    existing.rows[0]?.drone_details,
    fleetDrones
  );

  await pool.query(
    `UPDATE pilots SET drone_details = $1::jsonb WHERE id = $2`,
    [JSON.stringify(merged), pid]
  );
}

/** Read-time merge for GET pilot (does not write). */
function mergeFleetIntoPilotRow(pilotRow) {
  if (!pilotRow || typeof pilotRow !== "object") return pilotRow;
  return pilotRow;
}

async function enrichPilotRowWithFleetDrones(pilotRow) {
  if (!pilotRow || typeof pilotRow !== "object") return pilotRow;
  const pid = Number.parseInt(String(pilotRow.id), 10);
  if (!Number.isFinite(pid)) return pilotRow;
  const fleetDrones = await loadFleetDronesForPilot(pid);
  const merged = mergePilotDroneDetails(pilotRow.drone_details, fleetDrones);
  return { ...pilotRow, drone_details: merged };
}

module.exports = {
  normalizePilotDroneDetails,
  mergePilotDroneDetails,
  fleetRowToProfileDrone,
  loadFleetDronesForPilot,
  syncPilotDroneDetailsFromFleet,
  enrichPilotRowWithFleetDrones,
};
