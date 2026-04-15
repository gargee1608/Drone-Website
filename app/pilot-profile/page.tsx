import type { Metadata } from "next";

import { PilotProfileView } from "@/components/pilot-registration/pilot-profile-view";

export const metadata: Metadata = {
  title: "Pilot profile — Drone Hire",
  description: "Your pilot profile on AEROLAMINAR.",
};

export default function PilotProfilePage() {
  return <PilotProfileView />;
}
