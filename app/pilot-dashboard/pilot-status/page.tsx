import { PilotStatusView } from "@/components/dashboard/pilot-status-view";

export const metadata = {
  title: "Drone Hire | Pilot Status",
  description: "Monitor pilot readiness, certifications, and operational availability.",
};

export default function PilotDashboardPilotStatusPage() {
  return <PilotStatusView />;
}
