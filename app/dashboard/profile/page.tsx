import { redirect } from "next/navigation";

/** Profile is available under Settings → Profile information. */
export default function DashboardProfilePage() {
  redirect("/settings?from=admin");
}
