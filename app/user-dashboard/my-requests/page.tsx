import { Suspense } from "react";

import { MyRequestsView } from "@/components/user-dashboard/my-requests-view";

export const metadata = {
  title: "Hire A Drone | My Request",
  description: "View your submitted mission requests and details.",
};

export default function MyRequestsPage() {
  return (
    <Suspense>
      <MyRequestsView />
    </Suspense>
  );
}
