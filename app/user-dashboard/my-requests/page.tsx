import { MyRequestsView } from "@/components/user-dashboard/my-requests-view";

export const metadata = {
  title: "Drone Hire | My Request",
  description: "View your submitted mission requests and details.",
};

export default function MyRequestsPage() {
  return <MyRequestsView />;
}
