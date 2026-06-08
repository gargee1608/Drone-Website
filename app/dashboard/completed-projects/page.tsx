import { CompletedProjectsView } from "@/components/dashboard/completed-projects-view";

export const metadata = {
  title: "Hire A Drone | Completed Project",
  description:
    "Review completed project requests from the admin command center.",
};

export default function CompletedProjectsPage() {
  return <CompletedProjectsView />;
}
