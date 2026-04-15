import { AssignPilotDroneView } from "@/components/dashboard/assign-pilot-drone-view";

export const metadata = {
  title: "Drone Hire | Assign Pilot & Drone",
  description:
    "Allocate pilots and drones to mission parameters from the command center.",
};

export default function AssignPilotDronePage() {
  return <AssignPilotDroneView />;
}
