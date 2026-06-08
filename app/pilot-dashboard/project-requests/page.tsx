import { PilotProjectRequestsView } from "@/components/pilot-dashboard/pilot-project-requests-view";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";

export const metadata = {
  title: "Hire A Drone | Pilot Project Requests",
  description: "View project requests assigned to you from the pilot dashboard.",
};

export default function PilotProjectRequestsPage() {
  return (
    <PilotDashboardShell pageTitle="Project Requests">
      <PilotProjectRequestsView />
    </PilotDashboardShell>
  );
}
