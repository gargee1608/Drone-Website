import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";
import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";

export const metadata = {
  title: "Account Settings — Drone Hire",
  description: "Manage your Drone Hire account and preferences.",
};

type SettingsPageProps = {
  searchParams: Promise<{ from?: string | string[] }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const sp = await searchParams;
  const raw = sp.from;
  const from = Array.isArray(raw) ? raw[0] : raw;
  const isAdmin = from === "admin";

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="mx-auto w-full max-w-[1280px]">
          <h1 className="mb-8 text-2xl font-bold tracking-tight text-[#191c1d] sm:mb-10 sm:text-3xl">
            Settings
          </h1>
          <SettingsDashboard />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <UserDashboardShell pageTitle="Settings">
      <SettingsDashboard />
    </UserDashboardShell>
  );
}
