"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Bell, Menu, Settings, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useHasRegisteredPilot } from "@/hooks/use-has-registered-pilot";
import {
  serviceMegaColumns,
  ServiceListingMegaMenu,
} from "@/components/nav/service-listing-mega-menu";
import { useAdminDashboardNav } from "@/components/dashboard/admin-dashboard-nav-context";
import { SidebarMenuGlyph } from "@/components/nav/sidebar-menu-glyph";
import { useUserDashboardNav } from "@/components/user-dashboard/user-dashboard-nav-context";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/onboarding", label: "Onboarding Wizards" },
  { href: "/services", label: "Service Listing" },
] as const;

function LoginProfileIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 overflow-hidden rounded-full bg-slate-100",
        className
      )}
      aria-hidden
    >
      <Image
        src="/login-user-icon.png"
        alt=""
        width={48}
        height={48}
        className="size-full min-h-full min-w-full object-cover object-center"
      />
    </span>
  );
}

export type SiteHeaderProps = {
  /** Primary CTA label (desktop + mobile). */
  ctaLabel?: string;
  /** When set, the primary CTA is a link to this path. */
  ctaHref?: string;
  /** Show notifications bell (desktop toolbar). */
  showNotifications?: boolean;
};

const ctaButtonClassName =
  "hidden h-9 shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-xs font-semibold tracking-wide text-white shadow-md shadow-blue-500/25 transition hover:from-blue-600/90 hover:to-indigo-600/90 sm:inline-flex";

const headerPilotRegisterClassName =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-600 px-4 text-xs font-semibold tracking-wide text-white shadow-none transition hover:border-blue-700 hover:bg-blue-700 hover:text-white";

const headerRegisteredPilotClassName =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-blue-600 bg-transparent px-3 text-xs font-semibold tracking-wide text-blue-700 shadow-none transition hover:bg-blue-50/70 hover:text-blue-900";

const mobileCtaClassName =
  "mt-4 w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold tracking-wide text-white shadow-md shadow-blue-500/25";

const mobilePilotRegisterClassName =
  "mt-4 w-full rounded-full border-2 border-blue-600 bg-blue-600 font-semibold tracking-wide text-white shadow-none transition hover:border-blue-700 hover:bg-blue-700 hover:text-white";

const mobileRegisteredPilotClassName =
  "mt-2 w-full rounded-full border-2 border-blue-600 bg-transparent font-semibold tracking-wide text-blue-700 shadow-none transition hover:bg-blue-50/70 hover:text-blue-900";

export function SiteHeader({
  ctaLabel = "Register a Pilot",
  ctaHref = "/pilot-registration",
  showNotifications = false,
}: SiteHeaderProps = {}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hasRegisteredPilot = useHasRegisteredPilot();
  const {
    sidebarExpanded: userSidebarExpanded,
    expandSidebar: expandUserSidebar,
  } = useUserDashboardNav();
  const {
    sidebarExpanded: adminSidebarExpanded,
    expandSidebar: expandAdminSidebar,
  } = useAdminDashboardNav();

  const isUserDashboard = pathname?.startsWith("/user-dashboard") ?? false;
  const isAdminDashboard =
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    (pathname?.startsWith("/dashboard/") ?? false);

  const showUserDashboardExpandInHeader =
    isUserDashboard && !userSidebarExpanded;
  const showAdminDashboardExpandInHeader =
    isAdminDashboard && !adminSidebarExpanded;

  const navLinkClass = (href: string, options?: { services?: boolean }) => {
    const active = options?.services
      ? pathname.startsWith("/services")
      : pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "shrink-0 transition-colors hover:text-foreground",
      active && "border-b-2 border-[#0058bc] pb-0.5 font-semibold text-[#0058bc]"
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="flex w-full min-w-0 items-center gap-2 py-3 pl-2 pr-2 sm:gap-3 sm:pl-3 sm:pr-3 lg:gap-4 lg:pl-4 lg:pr-5">
        <div className="ml-1 flex min-w-0 shrink-0 items-center gap-1.5 sm:ml-2 sm:gap-2 lg:ml-3">
          {showAdminDashboardExpandInHeader ? (
            <button
              type="button"
              className="hidden lg:inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#0058bc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35"
              onClick={expandAdminSidebar}
              aria-label="Expand command center sidebar"
              aria-expanded={adminSidebarExpanded}
              aria-controls="command-center-nav"
            >
              <SidebarMenuGlyph />
            </button>
          ) : null}
          {showUserDashboardExpandInHeader ? (
            <button
              type="button"
              className="hidden lg:inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#0058bc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35"
              onClick={expandUserSidebar}
              aria-label="Expand user dashboard sidebar"
              aria-expanded={userSidebarExpanded}
              aria-controls="user-dashboard-sidebar"
            >
              <SidebarMenuGlyph />
            </button>
          ) : null}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 font-heading text-sm font-bold tracking-tight text-black transition-opacity hover:opacity-90 sm:text-base"
          >
            <Image
              src="/aerolaminar-logo.png"
              alt=""
              width={48}
              height={48}
              className="h-9 w-9 shrink-0 translate-y-px object-contain object-center sm:h-10 sm:w-10 sm:translate-y-0.5"
              priority
              aria-hidden
            />
            <span className="leading-tight">AEROLAMINAR</span>
          </Link>
        </div>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 md:gap-4 md:pl-2 lg:pl-4">
          {showNotifications ? (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </Button>
          ) : null}
          <nav
            className={cn(
              "hidden min-w-0 items-center gap-3 text-sm font-medium text-muted-foreground md:flex",
              "lg:gap-5"
            )}
          >
            {nav.map((item) =>
              item.href === "/services" ? (
                <ServiceListingMegaMenu
                  key={item.href}
                  triggerClassName={navLinkClass("/services", { services: true })}
                />
              ) : item.href.startsWith("/") ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(item.href)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="shrink-0 transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {ctaHref ? (
              ctaHref === "/pilot-registration" ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href={ctaHref}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      headerPilotRegisterClassName
                    )}
                  >
                    {ctaLabel}
                  </Link>
                  {hasRegisteredPilot ? (
                    <Link
                      href="/pilot-profile"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        headerRegisteredPilotClassName
                      )}
                    >
                      Registered Pilot
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Link
                  href={ctaHref}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    ctaButtonClassName
                  )}
                >
                  {ctaLabel}
                </Link>
              )
            ) : (
              <Button className={ctaButtonClassName}>{ctaLabel}</Button>
            )}
          </div>
          {/* Settings + login + menu */}
          <div className="flex shrink-0 items-center gap-0.5 border-l border-border/50 pl-2 sm:gap-1 sm:pl-3 md:pl-4">
            <Link
              href="/settings"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Settings"
            >
              <Settings className="size-4" />
            </Link>
            <Link
              href="/login"
              aria-label="Login"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "inline-flex shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground"
              )}
            >
              <LoginProfileIcon className="size-10 sm:size-11" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 shrink-0 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-border/60 bg-background/95 px-3 py-4 sm:px-4 md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
          {nav.map((item) =>
            item.href === "/services" ? (
              <div key={item.href} className="flex flex-col gap-1">
                <Link
                  href="/services"
                  className="rounded-lg px-2 py-2 transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
                <div className="ml-2 overflow-hidden rounded-xl border border-border/80 bg-card text-sm shadow-md">
                  <div className="divide-y divide-border/60">
                    {serviceMegaColumns.map((col) => (
                      <div key={col.heading} className="p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          {col.heading}
                        </p>
                        <div className="flex flex-col gap-2">
                          {col.items.map(
                            ({ href, title, description, Icon }) => (
                              <Link
                                key={href}
                                href={href}
                                className="flex gap-2 rounded-lg p-2 transition-colors hover:bg-muted"
                                onClick={() => setOpen(false)}
                              >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                                  <Icon className="size-4" aria-hidden />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-foreground">
                                    {title}
                                  </div>
                                  <p className="text-xs leading-snug text-muted-foreground">
                                    {description}
                                  </p>
                                </div>
                              </Link>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end border-t border-border/60 bg-muted/20 py-2 pl-2 pr-3">
                      <Link
                        href="/services"
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "inline-flex w-auto shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm text-white"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        View all services
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : item.href.startsWith("/") ? (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2 py-2 transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-2 py-2 transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
          <Link
            href="/settings"
            className="rounded-lg px-2 py-2 transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <Link
            href="/login"
            aria-label="Login"
            className="inline-flex w-fit items-center justify-center rounded-lg px-2 py-2 transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <LoginProfileIcon className="size-10 sm:size-11" />
          </Link>
        </nav>
        {ctaHref ? (
          ctaHref === "/pilot-registration" ? (
            <div className="flex flex-col">
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  mobilePilotRegisterClassName,
                  "inline-flex h-11 items-center justify-center"
                )}
                onClick={() => setOpen(false)}
              >
                {ctaLabel}
              </Link>
              {hasRegisteredPilot ? (
                <Link
                  href="/pilot-profile"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    mobileRegisteredPilotClassName,
                    "inline-flex h-11 items-center justify-center"
                  )}
                  onClick={() => setOpen(false)}
                >
                  Registered Pilot
                </Link>
              ) : null}
            </div>
          ) : (
            <Link
              href={ctaHref}
              className={cn(
                buttonVariants({ variant: "default" }),
                mobileCtaClassName,
                "inline-flex items-center justify-center"
              )}
              onClick={() => setOpen(false)}
            >
              {ctaLabel}
            </Link>
          )
        ) : (
          <Button
            className={mobileCtaClassName}
            onClick={() => setOpen(false)}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </header>
  );
}
