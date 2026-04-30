import { Suspense } from "react";
import { PilotLoginView } from "@/components/pilot-login/pilot-login-view";

export const metadata = {
  title: "Drone Hire — Pilot Login",
  description: "Sign in as a certified pilot to open your pilot dashboard.",
};

export default function PilotLoginPage() {
  return (
    <Suspense fallback={null}>
      <PilotLoginView />
    </Suspense>
  );
}
