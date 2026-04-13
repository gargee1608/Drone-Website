"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ClipboardList,
  Globe,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Plus,
  Search,
  Settings,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const sidebarNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/user-dashboard" },
  { label: "My Request", icon: ClipboardList, href: "/user-dashboard/my-requests" },
  { label: "Marketplace", icon: Store, href: "/marketplace" },
] as const;

const footerCompanyLinks = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "API Docs" },
  { href: "#", label: "Contact Support" },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <nav className="flex flex-1 flex-col gap-2">
        {sidebarNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[#c1c6d7]/30 pt-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            router.replace("/login");
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          Logout
        </button>
      </div>
    </div>
  );
}

export type UserDashboardShellProps = {
  pageTitle: string;
  /** Optional line under the title (e.g. welcome message). */
  pageSubtitle?: ReactNode;
  /** Extra classes for the page heading (e.g. `text-center`). */
  pageTitleClassName?: string;
  children: ReactNode;
};

export function UserDashboardShell({
  pageTitle,
  pageSubtitle,
  pageTitleClassName,
  children,
}: UserDashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [headerSearch, setHeaderSearch] = useState("");

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f8f9fa] text-[#191c1d]">
      <header className="fixed top-0 z-50 mx-auto flex h-16 w-full max-w-[1920px] items-center justify-between gap-4 border-b border-[#e8eaef] bg-[#f8f9fa] px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-[#eceff1] lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            className="hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-[#eceff1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400/50 lg:inline-flex"
            onClick={() => setSidebarExpanded((open) => !open)}
            aria-label={
              sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"
            }
            aria-expanded={sidebarExpanded}
            aria-controls="user-dashboard-sidebar"
          >
            <Menu className="size-5" strokeWidth={2.25} aria-hidden />
          </button>
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <Image
              src="/aerolaminar-header-logo.png"
              alt=""
              width={40}
              height={40}
              className="size-9 shrink-0 object-contain sm:size-10"
              priority
              aria-hidden
            />
            <span className="truncate text-lg font-bold uppercase tracking-tight text-black sm:text-xl">
              AEROLAMINAR
            </span>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 pl-4 sm:gap-4 sm:pl-8">
          <div className="relative w-full max-w-[min(100%,18rem)] min-w-[7.5rem] sm:max-w-[20rem] md:max-w-[22rem]">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-500 sm:left-4 sm:size-[1.15rem]"
              aria-hidden
              strokeWidth={2}
            />
            <input
              type="search"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search"
              title="Search mission ID or drone"
              aria-label="Search mission ID or drone"
              className="w-full min-w-0 rounded-full border-0 bg-[#e8eaed] py-2.5 pl-10 pr-4 text-sm text-[#191c1d] shadow-inner shadow-slate-900/5 outline-none ring-0 transition placeholder:text-slate-500 focus:bg-[#e3e5e8] focus:ring-2 focus:ring-slate-300/60 sm:py-2.5 sm:pl-11 sm:pr-5"
            />
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-[#e8eaed]"
              aria-label="Notifications"
            >
              <Bell className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-[#e8eaed]"
              aria-label="Settings"
            >
              <Settings className="size-5" strokeWidth={1.75} />
            </button>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-200 text-slate-600 transition-colors hover:bg-slate-300/90 sm:h-10 sm:w-10"
            aria-label="Account"
          >
            <UserRound className="size-[1.15rem]" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </header>

      <aside
        id="user-dashboard-sidebar"
        className={cn(
          "fixed left-0 top-16 z-40 hidden h-[calc(100dvh-4rem)] w-60 flex-col gap-2 bg-[#f8f9fa] p-3.5 transition-transform duration-300 ease-out lg:flex",
          sidebarExpanded
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!sidebarExpanded}
      >
        <SidebarContent />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(18rem,85vw)] flex-col gap-2 bg-slate-50 p-4 shadow-xl">
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-h-screen flex-col pt-16 transition-[margin] duration-300 ease-out",
          sidebarExpanded ? "lg:ml-60" : "lg:ml-0"
        )}
      >
        <div className="flex flex-1 flex-col lg:flex-row">
          <main className="mx-auto w-full max-w-[1280px] flex-1 p-5 sm:p-6 lg:p-8">
            <div className="mb-8 sm:mb-10">
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight text-[#191c1d] sm:text-3xl",
                  !pageSubtitle && "mb-6",
                  pageTitleClassName
                )}
              >
                {pageTitle}
              </h1>
              {pageSubtitle ? (
                <>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4d5b7f] sm:text-base">
                    {pageSubtitle}
                  </p>
                  <div className="mt-8 sm:mt-10">{children}</div>
                </>
              ) : (
                children
              )}
            </div>
          </main>
        </div>

        <footer
          className="mt-auto w-full border-t border-slate-200/90 bg-[#f8f9fa] py-4 sm:py-5"
          role="contentinfo"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:px-8 md:grid-cols-3 md:items-center md:gap-6 lg:gap-10">
            <div className="text-center md:text-left">
              <p className="text-sm font-bold tracking-tight text-black">
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

        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-[#e1e3e4]/60 bg-white/80 px-6 py-4 backdrop-blur-md md:hidden"
          aria-label="Quick navigation"
        >
          <LayoutDashboard className="size-6 text-[#0058bc]" />
          <Map className="size-6 text-[#414755]" />
          <div className="-mt-10 rounded-full bg-[#0058bc] p-3 shadow-lg shadow-[#0058bc]/30">
            <Plus className="size-6 text-white" strokeWidth={2.5} />
          </div>
          <History className="size-6 text-[#414755]" />
          <UserRound className="size-6 text-[#414755]" />
        </nav>
        <div className="h-20 shrink-0 md:hidden" aria-hidden />
      </div>
    </div>
  );
}
