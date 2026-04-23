import type { Metadata } from "next";

import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";
import { PilotProfileView } from "@/components/pilot-registration/pilot-profile-view";

export const metadata: Metadata = {
  title: "Profile — Drone Hire",
  description: "Your pilot profile on AEROLAMINAR.",
};

export default function PilotProfilePage() {
  return (
    <PilotDashboardShell pageTitle="Profile" omitPageTitle>
      <PilotProfileView variant="dashboard" />
    </PilotDashboardShell>
  );
}
