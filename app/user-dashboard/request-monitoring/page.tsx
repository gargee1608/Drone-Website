import { RequestMonitoringView } from "@/components/user-dashboard/request-monitoring-view";

export const metadata = {
  title: "Drone Hire | Request Monitoring",
  description: "Monitor your mission requests and activity.",
};

export default function RequestMonitoringPage() {
  return <RequestMonitoringView />;
}
