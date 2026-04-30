import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";
import { AssignMissionView } from "@/components/pilot-dashboard/assign-mission-view";

export const metadata = {
  title: "Drone Hire | Pilot Assign Mission",
  description: "Open the assign mission workspace from pilot dashboard.",
};

export default function PilotAssignMissionPage() {
  return (
    <PilotDashboardShell pageTitle="Assign Mission">
      <AssignMissionView />
    </PilotDashboardShell>
  );
}
