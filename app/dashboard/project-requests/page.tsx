import { ProjectRequestsView } from "@/components/dashboard/project-requests-view";

export const metadata = {
  title: "Hire A Drone | Project Requests",
  description:
    "Review project requests from the admin command center.",
};

export default function ProjectRequestsPage() {
  return <ProjectRequestsView />;
}
