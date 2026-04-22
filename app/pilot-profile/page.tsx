import type { Metadata } from "next";

import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";
import { PilotProfileView } from "@/components/pilot-registration/pilot-profile-view";

export const metadata: Metadata = {
  title: "Pilot profile — Drone Hire",
  description: "Your pilot profile on AEROLAMINAR.",
};

export default function PilotProfilePage() {
  return (
    <PilotDashboardShell pageTitle="Pilot profile">
      <PilotProfileView variant="dashboard" />
    </PilotDashboardShell>
  );
}
