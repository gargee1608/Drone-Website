"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Menu, Search, Settings, User, X } from "lucide-react";

import { useAdminDashboardNav } from "@/components/dashboard/admin-dashboard-nav-context";
import {
  ServiceListingMegaMenu,
  serviceMegaMenuItems,
} from "@/components/nav/service-listing-mega-menu";
import { SidebarMenuGlyph } from "@/components/nav/sidebar-menu-glyph";
import { useUserDashboardNav } from "@/components/user-dashboard/user-dashboard-nav-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdminDashboard =
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    (pathname?.startsWith("/dashboard/") ?? false);
  const isUserDashboard = pathname?.startsWith("/user-dashboard") ?? false;
  const isSettingsPage =
    pathname === "/settings" || (pathname?.startsWith("/settings/") ?? false);
  const {
    sidebarExpanded: adminSidebarExpanded,
    setSidebarExpanded: setAdminSidebarExpanded,
  } = useAdminDashboardNav();
  const {
    sidebarExpanded: userSidebarExpanded,
    setSidebarExpanded: setUserSidebarExpanded,
  } = useUserDashboardNav();

  const hideRegisterPilotCta =
    pathname === "/login" ||
    pathname === "/pilot-registration" ||
    pathname === "/marketplace" ||
    pathname?.startsWith("/marketplace/") ||
    pathname === "/services" ||
    pathname?.startsWith("/services/") ||
    pathname === "/blogs" ||
    pathname?.startsWith("/blogs/") ||
    pathname === "/contact" ||
    pathname === "/settings" ||
    pathname?.startsWith("/settings/") ||
    isAdminDashboard ||
    isUserDashboard;
  const hideLoginIcon = pathname === "/pilot-registration";

  const settingsHref = isUserDashboard
    ? "/settings?from=user"
    : isAdminDashboard
      ? "/settings?from=admin"
      : "/settings";

  const linkClass = (href: string) =>
    cn(
      "text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-[#0d6200]",
      (pathname === href || pathname?.startsWith(`${href}/`)) &&
        "font-semibold text-slate-900"
    );

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white">
      <nav
        className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Primary"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 sm:gap-8 lg:gap-12">
          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            {isSettingsPage ? (
              <button
                type="button"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#009aa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009aa1]/35"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("settings-nav-toggle"));
                  }
                }}
                aria-label="Toggle settings sidebar"
              >
                <Menu className="size-5" strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
            {isAdminDashboard ? (
              <button
                type="button"
                className="hidden size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#009aa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009aa1]/35 lg:inline-flex"
                onClick={() =>
                  setAdminSidebarExpanded(!adminSidebarExpanded)
                }
                aria-label={
                  adminSidebarExpanded
                    ? "Collapse command center sidebar"
                    : "Expand command center sidebar"
                }
                aria-expanded={adminSidebarExpanded}
                aria-controls="command-center-nav"
              >
                <SidebarMenuGlyph />
              </button>
            ) : null}
            {isUserDashboard ? (
              <button
                type="button"
                className="hidden size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#009aa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009aa1]/35 lg:inline-flex"
                onClick={() =>
                  setUserSidebarExpanded(!userSidebarExpanded)
                }
                aria-label={
                  userSidebarExpanded
                    ? "Collapse user dashboard sidebar"
                    : "Expand user dashboard sidebar"
                }
                aria-expanded={userSidebarExpanded}
                aria-controls="user-dashboard-sidebar"
              >
                <SidebarMenuGlyph />
              </button>
            ) : null}
            <Link
              href="/"
              className="font-[family-name:var(--font-landing-headline)] text-lg font-bold tracking-tighter text-[#009aa1] uppercase sm:text-xl"
            >
              Drone Hire
            </Link>
          </div>
          {!isAdminDashboard ? (
            <div className="hidden items-center gap-8 md:flex">
              <Link href="/" className={linkClass("/")}>
                Home
              </Link>
              <Link href="/marketplace" className={linkClass("/marketplace")}>
                Marketplace
              </Link>
              <ServiceListingMegaMenu
                variant="landing"
                label="Services"
                triggerClassName={cn(
                  (pathname === "/services" ||
                    pathname?.startsWith("/services/")) &&
                    "font-semibold text-slate-900"
                )}
              />
              <Link href="/blogs" className={linkClass("/blogs")}>
                Blogs
              </Link>
              <Link href="/contact" className={linkClass("/contact")}>
                Contact Us
              </Link>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-4 lg:gap-6">
          <div className="hidden min-w-0 items-center rounded-full border border-slate-200 bg-white py-2 pl-3 pr-2 lg:flex">
            <Search
              className="mr-2 size-4 shrink-0 text-slate-500"
              aria-hidden
            />
            <input
              type="search"
              name="track-delivery"
              placeholder="Search..."
              className="w-40 min-w-0 border-0 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:ring-0 xl:w-48"
              autoComplete="off"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {!isSettingsPage ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="landing-mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            ) : null}
            <Link
              href="/pilot-registration"
              className={cn(
                "hidden h-9 shrink-0 items-center justify-center rounded-md border-2 border-[#008C8C] bg-transparent px-4 font-[family-name:var(--font-landing-headline)] text-xs font-bold tracking-wider text-[#008C8C] uppercase transition hover:border-[#007070] hover:text-[#007070] hover:bg-transparent sm:inline-flex",
                hideRegisterPilotCta && "sm:hidden"
              )}
            >
              Register a Pilot
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-[#009aa1]"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
            </Button>
            <Link
              href={settingsHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "text-slate-500 hover:text-[#009aa1]"
              )}
              aria-label="Settings"
            >
              <Settings className="size-5" />
            </Link>
            {!hideLoginIcon ? (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "shrink-0 text-slate-500 hover:text-[#009aa1]"
                )}
                aria-label="Login"
              >
                <User className="size-5" />
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      <div
        id="landing-mobile-nav"
        className={cn(
          "border-t border-slate-100 bg-white px-4 py-4 md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="mb-3 flex rounded-full border border-slate-200 bg-white py-2 pl-3 pr-2">
          <Search className="mr-2 size-4 shrink-0 text-slate-500" aria-hidden />
          <input
            type="search"
            placeholder="Track delivery..."
            className="min-w-0 flex-1 border-0 bg-transparent text-sm focus:ring-0"
          />
        </div>
        {!isAdminDashboard ? (
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/marketplace"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Marketplace
            </Link>
            <div className="px-3 pt-1 pb-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Services
            </div>
            {serviceMegaMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg py-2 pl-6 pr-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {item.title}
              </Link>
            ))}
            <Link
              href="/services"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#009aa1] hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              View all services
            </Link>
            <Link
              href="/blogs"
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-50",
                pathname === "/blogs" || pathname?.startsWith("/blogs/")
                  ? "font-semibold text-slate-900"
                  : "text-slate-700"
              )}
              onClick={() => setOpen(false)}
            >
              Blogs
            </Link>
            <Link
              href="/contact"
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-50",
                pathname === "/contact"
                  ? "font-semibold text-slate-900"
                  : "text-slate-700"
              )}
              onClick={() => setOpen(false)}
            >
              Contact Us
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
        )}
        {!hideRegisterPilotCta ? (
          <Link
            href="/pilot-registration"
            className="mt-4 flex h-11 w-full items-center justify-center rounded-md border-2 border-[#008C8C] bg-transparent font-[family-name:var(--font-landing-headline)] text-xs font-bold tracking-wider text-[#008C8C] uppercase hover:border-[#007070] hover:text-[#007070] hover:bg-transparent"
            onClick={() => setOpen(false)}
          >
            Register a Pilot
          </Link>
        ) : null}
      </div>
    </header>
  );
}
