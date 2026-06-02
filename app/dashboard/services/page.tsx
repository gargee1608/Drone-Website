import { AdminServicesView } from "@/components/dashboard/admin-services-view";
import {
  normalizeServiceRow,
  type AdminServiceRow,
} from "@/lib/admin-services-merge";
import {
  queryAllServices,
  querySuppressedServiceSlugs,
} from "@/lib/services-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hire A Drone | Manage Services",
  description:
    "Add and manage drone services from the admin command center.",
};

export default async function DashboardServicesPage() {
  let initialDbRows: AdminServiceRow[] = [];
  let initialSuppressedSlugs: string[] = [];
  try {
    const [rows, suppressed] = await Promise.all([
      queryAllServices(),
      querySuppressedServiceSlugs(),
    ]);
    initialDbRows = rows
      .map(normalizeServiceRow)
      .filter((row): row is NonNullable<typeof row> => row !== null);
    initialSuppressedSlugs = suppressed;
  } catch {
    /* Client refresh will retry; built-in catalog still appears */
  }
  return (
    <AdminServicesView
      initialDbRows={initialDbRows}
      initialSuppressedSlugs={initialSuppressedSlugs}
    />
  );
}
