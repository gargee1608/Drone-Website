import { PilotDroneView } from "@/components/pilot-dashboard/pilot-drone-view";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";

export const metadata = {
  title: "Hire A Drone | My Drones",
  description: "Manage your drone fleet and equipment details in your pilot dashboard.",
};

export default function PilotDronePage() {
  return (
    <PilotDashboardShell
      pageTitle="My Drones"
      pageSubtitle="Manage your drone fleet and equipment details"
      hideMobilePageTitle
    >
      <PilotDroneView />
    </PilotDashboardShell>
  );
}
