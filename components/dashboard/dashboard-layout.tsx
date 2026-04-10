"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ClipboardList,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Plane,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const cc = {
  onSecondaryContainer: "#4d5b7f",
} as const;

const navMain = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/assign",
    label: "Assign Pilot or Drone",
    icon: Plane,
  },
  {
    href: "/dashboard/user-requests",
    label: "User Request",
    icon: ClipboardList,
  },
] as const;

const navFooter = [
  { href: "/login", label: "Log Out", icon: LogOut },
] as const;

const footerCompanyLinks = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "API Docs" },
  { href: "#", label: "Contact Support" },
] as const;

function navItemIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((open) => !open);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa] text-[#191c1d] antialiased">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#191c1d]/40 lg:hidden"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="command-center-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[min(16rem,85vw)] max-w-[16rem] flex-col border-r border-[#c1c6d7]/30 bg-[#f3f4f5]",
          "transform transition-transform duration-200 ease-out will-change-transform",
          "lg:w-64",
          "-translate-x-full",
          sidebarOpen && "translate-x-0"
        )}
        aria-label="Command center sidebar"
      >
        <div className="flex shrink-0 items-center border-b border-[#c1c6d7]/25 px-2 py-3">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-[#e7e8e9] hover:text-[#0058bc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="command-center-nav"
            aria-label={
              sidebarOpen ? "Collapse navigation" : "Expand navigation"
            }
          >
            <Menu className="size-[18px]" aria-hidden strokeWidth={2} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <nav
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3"
            aria-label="Primary"
          >
            <ul className="flex flex-col gap-0.5" role="list">
              {navMain.map(({ href, label, icon: Icon }) => {
                const isActive = navItemIsActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        if (
                          globalThis.matchMedia?.("(max-width: 1023px)")
                            .matches
                        ) {
                          closeSidebar();
                        }
                      }}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35",
                        isActive
                          ? "bg-white text-[#0058bc] shadow-sm ring-1 ring-[#c1c6d7]/40"
                          : "text-[#4d5b7f] hover:bg-[#e7e8e9]/80 active:bg-[#e7e8e9]"
                      )}
                    >
                      <Icon
                        className="size-[1.125rem] shrink-0 opacity-90"
                        aria-hidden
                        strokeWidth={2}
                      />
                      <span className="min-w-0 leading-snug">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="shrink-0 border-t border-[#c1c6d7]/25 bg-[#f3f4f5]/80 px-2 py-3">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-[#717786]">
              Account
            </p>
            <nav aria-label="Account actions">
              <ul className="flex flex-col gap-0.5" role="list">
                {navFooter.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => {
                        if (
                          globalThis.matchMedia?.("(max-width: 1023px)")
                            .matches
                        ) {
                          closeSidebar();
                        }
                      }}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#4d5b7f] transition-colors",
                        "hover:bg-[#e7e8e9]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35 active:bg-[#e7e8e9]"
                      )}
                    >
                      <Icon
                        className="size-[1.125rem] shrink-0"
                        aria-hidden
                        strokeWidth={2}
                      />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </aside>

      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-[margin] duration-200 ease-out",
          sidebarOpen && "lg:ml-64"
        )}
      >
        <header
          className="sticky top-0 z-50 flex w-full min-w-0 items-center justify-between gap-3 border-b border-[#c1c6d7]/20 bg-[#f8f9fa]/95 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950 sm:gap-4 sm:px-6 lg:px-8"
        >
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                className="shrink-0 rounded-xl p-1.5 text-[#4d5b7f] transition-colors hover:bg-[#e7e8e9] hover:text-[#0058bc] dark:text-slate-300"
                onClick={toggleSidebar}
                aria-expanded={sidebarOpen}
                aria-controls="command-center-nav"
                aria-label="Open navigation menu"
              >
                <Menu className="size-4" aria-hidden strokeWidth={2} />
              </button>
            )}
            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <Image
                src="/aerolaminar-logo.png"
                alt=""
                width={64}
                height={64}
                className="h-11 w-auto shrink-0 translate-y-1 object-contain sm:h-12 sm:translate-y-1.5 md:h-14 md:translate-y-1.5"
                priority
                aria-hidden
              />
              <span
                className={cn(
                  "shrink-0 text-lg font-bold leading-none tracking-tighter text-[#0058bc] dark:text-[#0070eb] sm:text-xl"
                )}
              >
                AEROLAMINAR
              </span>
            </div>
          </div>

          <div className="flex min-w-0 max-w-[min(100%,calc(100%-8rem))] flex-1 items-center justify-end gap-2 sm:gap-3 md:gap-4">
            <div className="group relative hidden min-w-0 sm:block sm:w-full sm:max-w-[14rem] md:max-w-xs lg:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2"
                style={{ color: cc.onSecondaryContainer }}
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search"
                className="h-8 w-full rounded-xl border-0 bg-[#e1e3e4] pl-9 pr-3 text-xs transition-shadow focus-visible:ring-2 focus-visible:ring-[#0058bc]/20"
                aria-label="Search"
              />
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                className="p-2 transition-colors hover:text-[#0058bc]"
                style={{ color: cc.onSecondaryContainer }}
                aria-label="Notifications"
              >
                <Bell className="size-5" />
              </button>
              <Link
                href="/settings"
                className="p-2 transition-colors hover:text-[#0058bc]"
                style={{ color: cc.onSecondaryContainer }}
                aria-label="Settings"
              >
                <Settings className="size-5" />
              </Link>
            </div>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c1c6d7]/30 bg-[#e7e8e9]"
              aria-label="Account"
            >
              <User
                className="size-[18px]"
                strokeWidth={2}
                style={{ color: cc.onSecondaryContainer }}
                aria-hidden
              />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col space-y-10 p-4 pb-24 sm:p-8 sm:pb-24">
          {children}
        </div>

        <footer
          className="mt-auto w-full border-t border-slate-200/90 bg-[#f8f9fa] py-4 sm:py-5"
          role="contentinfo"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:px-8 md:grid-cols-3 md:items-center md:gap-6 lg:gap-10">
            <div className="text-center md:text-left">
              <p className="text-sm font-bold tracking-tight text-slate-900">
                AEROLAMINAR
              </p>
            </div>
            <div className="min-w-0 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-900 sm:text-[11px] sm:tracking-widest">
                Company
              </p>
              <ul className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:flex-nowrap sm:gap-x-3 md:gap-x-4">
                {footerCompanyLinks.map((link) => (
                  <li key={link.label} className="shrink-0">
                    <a
                      href={link.href}
                      className="whitespace-nowrap text-[10px] leading-tight text-slate-600 transition hover:text-slate-900 sm:text-[11px] md:text-xs"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex w-full justify-center gap-2">
                <a
                  href="https://twitter.com"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="X (Twitter)"
                >
                  <X className="size-3.5" strokeWidth={2} aria-hidden />
                </a>
                <a
                  href="#"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Website"
                >
                  <Globe className="size-3.5" strokeWidth={2} aria-hidden />
                </a>
              </div>
              <p className="whitespace-nowrap text-center text-[10px] leading-snug text-slate-600 sm:text-[11px]">
                © {new Date().getFullYear()} AEROLAMINAR Logistics. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
