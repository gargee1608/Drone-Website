import { CommandCenterView } from "@/components/dashboard/command-center-view";

export const metadata = {
  title: "Drone Hire | Dashboard",
  description:
    "AEROLAMINAR admin dashboard — fleet telemetry, registrations, and operations.",
};

export default function DashboardPage() {
  return <CommandCenterView />;
}
