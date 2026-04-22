import { PilotDashboardView } from "@/components/pilot-dashboard/pilot-dashboard-view";

export const metadata = {
  title: "Drone Hire | Flight deck",
  description:
    "Pilot workspace: live mission control, flight logs, and telemetry.",
};

export default function PilotDashboardPage() {
  return <PilotDashboardView />;
}
