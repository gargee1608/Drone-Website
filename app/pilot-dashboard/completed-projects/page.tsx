import { CompletedProjectsView } from "@/components/dashboard/completed-projects-view";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";

export const metadata = {
  title: "Hire A Drone | Pilot Completed Project",
  description: "Track completed projects from pilot command view.",
};

export default function PilotCompletedProjectsPage() {
  return (
    <PilotDashboardShell pageTitle="Completed Project">
      <CompletedProjectsView showPageTitle={false} pilotScoped />
    </PilotDashboardShell>
  );
}
