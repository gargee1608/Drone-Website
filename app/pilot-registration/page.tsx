import type { Metadata } from "next";

import { PilotRegistrationView } from "@/components/pilot-registration/pilot-registration-view";

export const metadata: Metadata = {
  title: "Pilot & Drone Registration — Drone Hire",
  description:
    "Join India's drone pilot network — register as a pilot and list your drone when you have one.",
};

export default function PilotRegistrationPage() {
  return <PilotRegistrationView />;
}
