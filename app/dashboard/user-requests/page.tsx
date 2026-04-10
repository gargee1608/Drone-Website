import { UserRequestsView } from "@/components/dashboard/user-requests-view";

export const metadata = {
  title: "AEROLAMINAR | User Request",
  description:
    "Review and manage user requests from the admin command center.",
};

export default function UserRequestsPage() {
  return <UserRequestsView />;
}
