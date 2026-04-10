"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CircleHelp,
  LogOut,
  Map,
  Megaphone,
  Network,
  Rocket,
  Save,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

const sidebarItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "regions", label: "Operational Regions", icon: Network },
] as const;

const notificationRows = [
  {
    event: "Mission Failure",
    email: true,
    sms: true,
    push: true,
  },
  {
    event: "Telemetry Alert",
    email: true,
    sms: false,
    push: true,
  },
  {
    event: "Fleet Updates",
    email: false,
    sms: false,
    push: true,
  },
  {
    event: "Billing Report",
    email: true,
    sms: false,
    push: false,
  },
] as const;

const regions = [
  {
    name: "North American Corridor",
    detail: "42 Active Fleet Units",
    active: true,
  },
  {
    name: "Pacific Rim Zone",
    detail: "Maintenance Standby",
    active: false,
  },
  {
    name: "European Alpine Sector",
    detail: "18 Active Fleet Units",
    active: true,
  },
] as const;

export function SettingsDashboard() {
  const [activeNav, setActiveNav] = useState<string>("profile");
  const [twoFactor, setTwoFactor] = useState(true);
  const [biometric, setBiometric] = useState(true);
  const [sso, setSso] = useState(false);
  const [savedDialogOpen, setSavedDialogOpen] = useState(false);

  useEffect(() => {
    if (!savedDialogOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSavedDialogOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [savedDialogOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.965_0.008_256)]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 font-heading text-base font-bold tracking-tight text-primary transition-opacity hover:opacity-90"
          >
            <Image
              src="/aerolaminar-logo.png"
              alt=""
              width={40}
              height={40}
              className="h-8 w-8 shrink-0 object-contain object-center sm:h-9 sm:w-9"
              priority
              aria-hidden
            />
            <span className="leading-tight">AEROLAMINAR</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <span className="border-b-2 border-primary pb-0.5 text-primary">
              Settings
            </span>
            <a
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Fleet
            </a>
            <a
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Missions
            </a>
          </nav>

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
            <div className="relative hidden min-w-0 max-w-xs flex-1 sm:block xl:max-w-md">
              <Input
                type="search"
                placeholder="Search parameters..."
                className="h-9 rounded-full border-border/80 bg-muted/40 pl-3 text-sm shadow-none"
                aria-label="Search parameters"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Help"
            >
              <CircleHelp className="size-[18px]" />
            </Button>
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-border/60"
              aria-label="Account"
              role="img"
            >
              <User className="size-[18px] text-muted-foreground" strokeWidth={2} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Mobile section nav */}
        <div className="border-b border-border/80 bg-white px-3 py-2 lg:hidden">
          <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const selected = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border/80 bg-white lg:flex xl:w-64">
          <div className="flex items-start gap-3 border-b border-border/60 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Rocket className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="font-heading text-sm font-semibold leading-tight text-foreground">
                Logistics Command
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Precision Fleet v2.4
              </p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 p-3">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const selected = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    selected
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0",
                      selected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border/60 p-3">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              <CircleHelp className="size-[18px]" />
              Help
            </button>
            <button
              type="button"
              className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-[18px]" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-auto px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <header className="mb-8">
              <Link
                href="/"
                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back to home
              </Link>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                System Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Configure your command center parameters and security protocols.
              </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              {/* Profile */}
              <Card className="border-border/60 shadow-sm ring-1 ring-black/[0.04]">
                <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <User className="size-5 text-primary" />
                    Profile Settings
                  </CardTitle>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Identity verified
                  </span>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div
                      className="mx-auto flex size-[140px] shrink-0 items-center justify-center rounded-xl bg-slate-900 sm:mx-0"
                      aria-hidden
                    >
                      <User className="size-[72px] text-slate-300" strokeWidth={1.25} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Full name
                          </label>
                          <Input
                            readOnly
                            defaultValue="Alexander Sterling"
                            className="h-10 border-border/80 bg-muted/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Email address
                          </label>
                          <Input
                            readOnly
                            defaultValue="a.sterling@aerolaminar.ic"
                            className="h-10 border-border/80 bg-muted/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Operational title
                        </label>
                        <Input
                          readOnly
                          defaultValue="Chief of Aerial Logistics"
                          className="h-10 border-border/80 bg-muted/50"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="border-border/60 shadow-sm ring-1 ring-black/[0.04]">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Shield className="size-5 text-primary" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/60 px-0 pt-0">
                  <div className="flex items-center justify-between gap-4 px-4 py-4">
                    <div>
                      <p className="font-medium text-foreground">
                        Two-Factor Auth
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Secure via Authenticator app
                      </p>
                    </div>
                    <Switch
                      checked={twoFactor}
                      onCheckedChange={setTwoFactor}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-4">
                    <div>
                      <p className="font-medium text-foreground">
                        Biometric Login
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Fingerprint or Face ID
                      </p>
                    </div>
                    <Switch
                      checked={biometric}
                      onCheckedChange={setBiometric}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-4">
                    <div>
                      <p className="font-medium text-foreground">
                        SSO Connectivity
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Corporate single sign-on
                      </p>
                    </div>
                    <Switch checked={sso} onCheckedChange={setSso} />
                  </div>
                </CardContent>
              </Card>

              {/* Operational Regions */}
              <Card className="border-border/60 shadow-sm ring-1 ring-black/[0.04]">
                <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Map className="size-5 text-primary" />
                    Operational Regions
                  </CardTitle>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Manage Maps
                  </button>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {regions.map((region) => (
                    <div
                      key={region.name}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-3"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Map className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {region.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {region.detail}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full ring-2 ring-background",
                          region.active ? "bg-emerald-500" : "bg-muted-foreground/40"
                        )}
                        aria-label={
                          region.active ? "Active" : "Standby"
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border-border/60 shadow-sm ring-1 ring-black/[0.04]">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Megaphone className="size-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto pt-2">
                  <table className="w-full min-w-[320px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Event type
                        </th>
                        <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Email
                        </th>
                        <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          SMS
                        </th>
                        <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Push
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificationRows.map((row) => (
                        <tr
                          key={row.event}
                          className="border-b border-border/40 last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium text-foreground">
                            {row.event}
                          </td>
                          <td className="py-3 text-center">
                            <input
                              type="checkbox"
                              defaultChecked={row.email}
                              className="size-4 rounded border-border accent-primary"
                              readOnly
                            />
                          </td>
                          <td className="py-3 text-center">
                            <input
                              type="checkbox"
                              defaultChecked={row.sms}
                              className="size-4 rounded border-border accent-primary"
                              readOnly
                            />
                          </td>
                          <td className="py-3 text-center">
                            <input
                              type="checkbox"
                              defaultChecked={row.push}
                              className="size-4 rounded border-border accent-primary"
                              readOnly
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-end gap-3">
              <Button variant="secondary" className="min-w-[100px] rounded-full">
                Cancel
              </Button>
              <Button
                type="button"
                className="min-w-[140px] gap-2 rounded-full"
                onClick={() => setSavedDialogOpen(true)}
              >
                <Save className="size-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </main>
        </div>
      </div>

      {savedDialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-saved-title"
          aria-describedby="settings-saved-desc"
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={() => setSavedDialogOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="settings-saved-title"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Settings saved
            </h2>
            <p
              id="settings-saved-desc"
              className="mt-2 text-sm text-muted-foreground"
            >
              Your changes have been updated.
            </p>
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                className="min-w-[88px] rounded-full"
                onClick={() => setSavedDialogOpen(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
