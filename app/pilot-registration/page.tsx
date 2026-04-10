import type { Metadata } from "next";

import { PilotRegistrationView } from "@/components/pilot-registration/pilot-registration-view";

export const metadata: Metadata = {
  title: "Pilot Registration — AEROLAMINAR",
  description:
    "Join India's drone pilot network — register as a verified pilot.",
};

export default function PilotRegistrationPage() {
  return <PilotRegistrationView />;
}
