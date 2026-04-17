import type { Metadata } from "next";

import { PilotProfileView } from "@/components/pilot-registration/pilot-profile-view";

export const metadata: Metadata = {
  title: "Profile — Drone Hire",
  description: "Pilot profile in the command center.",
};

export default function DashboardProfilePage() {
  return <PilotProfileView variant="dashboard" />;
}
