"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

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
  if (!token || jwtPayloadRole(token) !== "pilot") return null;
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
};

export function PilotSettingsAddDronePanel({
  withDroneList = true,
}: PilotSettingsAddDronePanelProps = {}) {
  const pathname = usePathname();
  const formId = useId();
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

  function commitDraftDrone() {
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
    const row: PilotProfileDrone = {
      ...emptyDrone(),
      modelName: model,
      type,
      camera: draftCamera.trim(),
      payloadKg: draftPayload.trim(),
      flightTimeMin: draftFlightMin.trim(),
      rangeKm: draftRangeKm.trim(),
      useCases: [...draftUseCases],
    };
    const next: PilotProfileSnapshot = {
      ...base,
      drones: [...base.drones, row],
    };
    persistSnapshot(next);
    if (withDroneList) {
      setDrones(next.drones);
    }
    setDraftModel("");
    setDraftType("");
    setDraftCamera("");
    setDraftPayload("");
    setDraftFlightMin("");
    setDraftRangeKm("");
    setDraftUseCases([]);
    setError(null);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
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
        <Plus className="mr-2 inline size-4" aria-hidden />
        Add new drone
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
      <div className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
        <h3 className="mb-4 text-center text-sm font-semibold text-foreground">
          Your Drone Details
        </h3>
        {drones.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            You haven&apos;t added any drones yet. Use the form below to add
            your first aircraft.
          </p>
        ) : (
          <ul className="space-y-3">
            {drones.map((d, index) => (
              <li
                key={d.id || `${d.modelName}-${index}`}
                className="rounded-xl border border-border bg-card p-3.5"
              >
                {/* Row 1: Model | Type | Camera — row 2: Payload | Flight | Range — row 3: Use cases */}
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 text-xs text-muted-foreground sm:grid-cols-3 sm:gap-y-4">
                  <p className="min-w-0 leading-snug">
                    <span className="font-semibold text-foreground">
                      Model Name
                    </span>
                    {" : "}
                    {d.modelName.trim() || "—"}
                  </p>
                  <p className="min-w-0 leading-snug">
                    <span className="font-semibold text-foreground">Type</span>
                    {" : "}
                    {d.type.trim() || "—"}
                  </p>
                  <p className="min-w-0">
                    <span className="font-semibold text-foreground">
                      Camera
                    </span>
                    {": "}
                    {d.camera.trim() || "—"}
                  </p>
                  <p className="min-w-0">
                    <span className="font-semibold text-foreground">
                      Payload (kg)
                    </span>
                    {": "}
                    {d.payloadKg.trim() || "—"}
                  </p>
                  <p className="min-w-0">
                    <span className="font-semibold text-foreground">
                      Flight time (min)
                    </span>
                    {": "}
                    {d.flightTimeMin.trim() || "—"}
                  </p>
                  <p className="min-w-0">
                    <span className="font-semibold text-foreground">
                      Range (km)
                    </span>
                    {": "}
                    {d.rangeKm.trim() || "—"}
                  </p>
                  <p className="min-w-0 leading-snug sm:col-span-3">
                    <span className="font-semibold text-foreground">
                      Use cases
                    </span>
                    {": "}
                    {d.useCases?.length ? d.useCases.join(", ") : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
        <h3 className="mb-4 text-center text-sm font-semibold text-foreground">
          Add New Drone Details
        </h3>
        <div className="text-left">{formFields}</div>
      </div>
    </div>
  );
}
