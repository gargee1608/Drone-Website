import { PilotDroneView } from "@/components/pilot-dashboard/pilot-drone-view";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";

export const metadata = {
  title: "Drone Hire | My Drones",
  description: "Manage your drone fleet and equipment details in your pilot dashboard.",
};

export default function PilotDronePage() {
  return (
    <PilotDashboardShell pageTitle="My Drones">
      <PilotDroneView />
    </PilotDashboardShell>
  );
}
