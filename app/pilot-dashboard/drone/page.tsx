import { PilotDroneView } from "@/components/pilot-dashboard/pilot-drone-view";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";

export const metadata = {
  title: "Drone Hire | Add New Drone Details",
  description: "Manage drones registered to your pilot account.",
};

export default function PilotDronePage() {
  return (
    <PilotDashboardShell pageTitle="Add New Drone Details">
      <PilotDroneView />
    </PilotDashboardShell>
  );
}
