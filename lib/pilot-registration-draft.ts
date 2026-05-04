import {
  normalizeCertifications,
  type PilotCertificationUpload,
  type PilotProfileDrone,
} from "@/lib/pilot-profile-snapshot";

/**
 * Draft saved only while using /pilot-registration (auto-save).
 * Cleared when registration is submitted successfully.
 */
export const PILOT_REGISTRATION_DRAFT_KEY =
  "aerolaminar_pilot_registration_form_draft";

/** Set on successful submit; next visit to /pilot-registration skips draft restore (handles races / stale draft). */
export const PILOT_REGISTRATION_FORCE_BLANK_NEXT_KEY =
  "aerolaminar_pilot_registration_force_blank_next_open";

export type PilotRegistrationDraft = {
  step: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  aadhaar: string;
  dgca: string;
  selectedSkills: string[];
  certifications?: PilotCertificationUpload[];
  flightHours: number;
  bio: string;
  droneModel: string;
  droneType: string;
  droneCamera: string;
  dronePayload: string;
  droneFlightMin: string;
  droneRangeKm: string;
  droneUseCases: string[];
  drones: PilotProfileDrone[];
};

function clampStep(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 1;
  return Math.min(4, Math.max(1, Math.round(n)));
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function dronesFromJson(v: unknown): PilotProfileDrone[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row): PilotProfileDrone | null => {
      if (!row || typeof row !== "object") return null;
      const d = row as Record<string, unknown>;
      return {
        id: str(d.id) || `drone-${Math.random().toString(36).slice(2, 11)}`,
        modelName: str(d.modelName),
        type: str(d.type),
        camera: str(d.camera),
        payloadKg: str(d.payloadKg),
        flightTimeMin: str(d.flightTimeMin),
        rangeKm: str(d.rangeKm),
        useCases: strArr(d.useCases),
      };
    })
    .filter((x): x is PilotProfileDrone => x !== null);
}

/** Returns null only when JSON is invalid or not an object. */
export function parsePilotRegistrationDraft(
  raw: string | null
): PilotRegistrationDraft | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const d = parsed as Record<string, unknown>;
    return {
      step: clampStep(d.step),
      fullName: str(d.fullName),
      email: str(d.email),
      phone: str(d.phone),
      city: str(d.city),
      state: str(d.state),
      aadhaar: str(d.aadhaar),
      dgca: str(d.dgca),
      selectedSkills: strArr(d.selectedSkills),
      certifications: normalizeCertifications(d.certifications),
      flightHours: num(d.flightHours),
      bio: str(d.bio),
      droneModel: str(d.droneModel),
      droneType: str(d.droneType),
      droneCamera: str(d.droneCamera),
      dronePayload: str(d.dronePayload),
      droneFlightMin: str(d.droneFlightMin),
      droneRangeKm: str(d.droneRangeKm),
      droneUseCases: strArr(d.droneUseCases),
      drones: dronesFromJson(d.drones),
    };
  } catch {
    return null;
  }
}

export function savePilotRegistrationDraft(draft: PilotRegistrationDraft) {
  try {
    localStorage.setItem(PILOT_REGISTRATION_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function clearPilotRegistrationDraft() {
  try {
    localStorage.removeItem(PILOT_REGISTRATION_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Call after a successful registration submit so the next time the form opens it stays blank. */
export function markPilotRegistrationSubmittedNextOpenBlank() {
  clearPilotRegistrationDraft();
  try {
    localStorage.setItem(PILOT_REGISTRATION_FORCE_BLANK_NEXT_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Returns true once if the user just submitted; clears the flag and draft so the form opens empty. */
export function consumePilotRegistrationForceBlankNextOpen(): boolean {
  try {
    if (localStorage.getItem(PILOT_REGISTRATION_FORCE_BLANK_NEXT_KEY) !== "1") {
      return false;
    }
    localStorage.removeItem(PILOT_REGISTRATION_FORCE_BLANK_NEXT_KEY);
    clearPilotRegistrationDraft();
    return true;
  } catch {
    return false;
  }
}
