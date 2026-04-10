import { CommandCenterView } from "@/components/dashboard/command-center-view";

export const metadata = {
  title: "AEROLAMINAR | Command Center",
  description:
    "AEROLAMINAR command center — fleet telemetry, registrations, and operations.",
};

export default function DashboardPage() {
  return <CommandCenterView />;
}
