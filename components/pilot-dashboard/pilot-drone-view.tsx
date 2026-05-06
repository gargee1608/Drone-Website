"use client";

import { PilotSettingsAddDronePanel } from "@/components/settings/pilot-settings-add-drone-panel";

/** Same add-drone flow as Settings → Profile → Drone details (`PilotSettingsAddDronePanel`). */
export function PilotDroneView() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PilotSettingsAddDronePanel />
    </div>
  );
}
