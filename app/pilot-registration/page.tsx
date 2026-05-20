import type { Metadata } from "next";

import { PilotRegistrationPageShell } from "@/components/pilot-registration/pilot-registration-page-shell";

export const metadata: Metadata = {
  title: "Pilot & Drone Registration — Hire A Drone",
  description:
    "Join India's drone pilot network — register as a pilot and list your drone when you have one.",
};

export default function PilotRegistrationPage() {
  return <PilotRegistrationPageShell />;
}
