import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";

export type MissionRequestRow = {
  id: string;
  title: string;
  payout: string;
  description: string;
  payload: string;
  distance: string;
  posted: string;
  duration: string;
  aircraftClass: string;
  clearance: string;
  requirements: string;
};

function normalizeMissionRow(raw: unknown): MissionRequestRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r.mission_code ?? "").trim();
  if (!id) return null;
  return {
    id,
    title: String(r.title ?? ""),
    payout: String(r.payout ?? ""),
    description: String(r.description ?? ""),
    payload: String(r.payload ?? ""),
    distance: String(r.distance ?? ""),
    posted: String(r.posted ?? ""),
    duration: String(r.duration ?? ""),
    aircraftClass: String(r.aircraftClass ?? r.aircraft_class ?? ""),
    clearance: String(r.clearance ?? ""),
    requirements: String(r.requirements ?? ""),
  };
}

export async function fetchMissionRequestsList(): Promise<{
  ok: boolean;
  data: MissionRequestRow[];
  error?: string;
}> {
  try {
    const res = await fetch(apiUrl("/api/missions-requests"), {
      cache: "no-store",
    });
    const body = await readResponseJson(res);
    if (!body.okParse || body.data == null || typeof body.data !== "object") {
      return { ok: false, data: [], error: "Invalid response from server." };
    }
    const envelope = body.data as {
      success?: boolean;
      data?: unknown;
      error?: string;
    };
    if (!res.ok || envelope.success === false) {
      return {
        ok: false,
        data: [],
        error:
          typeof envelope.error === "string"
            ? envelope.error
            : "Could not load missions.",
      };
    }
    const list = Array.isArray(envelope.data) ? envelope.data : [];
    const data = list
      .map(normalizeMissionRow)
      .filter((row): row is MissionRequestRow => row != null);
    return { ok: true, data };
  } catch {
    return { ok: false, data: [], error: "Could not reach the API server." };
  }
}
