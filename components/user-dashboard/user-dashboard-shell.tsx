"use client";

import Link from "next/link";
import {
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Plus,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { SiteFooter } from "@/components/nav/site-footer";
import { useUserDashboardNav } from "@/components/user-dashboard/user-dashboard-nav-context";
import { cn } from "@/lib/utils";

const sidebarNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/user-dashboard" },
  { label: "My Request", icon: ClipboardList, href: "/user-dashboard/my-requests" },
  { label: "Marketplace", icon: Store, href: "/marketplace" },
] as const;

function SidebarNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
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
  );
}

function LogoutControl({ onAfterClick }: { onAfterClick?: () => void }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        onAfterClick?.();
        router.replace("/login");
      }}
      className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400/50"
    >
      <LogOut className="size-5 shrink-0" aria-hidden />
      Logout
    </button>
  );
}

/** Mobile drawer: nav + divider + logout */
function MobileSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto">
        <SidebarNavLinks onNavigate={onNavigate} />
      </div>
      <div className="mt-auto shrink-0 border-t border-[#c1c6d7]/30 pt-4 pb-2">
        <LogoutControl onAfterClick={onNavigate} />
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
  const { sidebarExpanded, setSidebarExpanded } = useUserDashboardNav();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden bg-[#f8f9fa] text-[#191c1d]">
      <div className="flex items-center gap-2 border-b border-[#e8eaef] bg-[#f8f9fa] px-4 py-2 lg:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-[#eceff1]"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" strokeWidth={2.25} aria-hidden />
        </button>
        <span className="text-sm font-bold text-[#191c1d]">{pageTitle}</span>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 lg:hidden" role="dialog">
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
            <div className="flex min-h-0 flex-1 flex-col">
              <MobileSidebarContent
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:relative">
        {/* Desktop: fixed rail from below site header to bottom of viewport (matches admin dashboard). */}
        <aside
          id="user-dashboard-sidebar"
          className={cn(
            "hidden flex-col overflow-hidden border-r border-[#e8eaef] bg-[#f5f7f9] shadow-[inset_-1px_0_0_rgba(15,23,42,0.02)] transition-[width] duration-300 ease-out lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:z-40 lg:flex",
            sidebarExpanded ? "lg:w-60" : "lg:w-0 lg:border-0 lg:p-0"
          )}
          aria-hidden={!sidebarExpanded}
        >
          {sidebarExpanded ? (
            <div className="shrink-0 border-b border-[#e8eaef] px-2 py-3">
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-[#0058bc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35"
                onClick={() => setSidebarExpanded(false)}
                aria-label="Collapse sidebar"
                aria-expanded={sidebarExpanded}
                aria-controls="user-dashboard-sidebar"
              >
                <Menu className="size-[18px]" strokeWidth={2} aria-hidden />
              </button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 pt-3">
            <SidebarNavLinks />
          </div>
          {sidebarExpanded ? (
            <div className="mt-auto shrink-0 border-t border-[#e8eaef] px-3.5 pt-3 pb-3">
              <LogoutControl />
            </div>
          ) : null}
        </aside>

        {/* Main column + footer (footer only as wide as content, not under sidebar) */}
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out",
            sidebarExpanded ? "lg:ml-60" : "lg:ml-0"
          )}
        >
          <main className="mx-auto w-full max-w-[1280px] flex-1 p-5 sm:p-6 lg:p-8">
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-3">
                <h1
                  className={cn(
                    "text-2xl font-bold tracking-tight text-[#191c1d] sm:text-3xl",
                    !pageSubtitle && "mb-6",
                    pageTitleClassName
                  )}
                >
                  {pageTitle}
                </h1>
              </div>
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
          <SiteFooter variant="embedded" />
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-[#e1e3e4]/60 bg-white/80 px-6 py-4 backdrop-blur-md md:hidden"
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
  );
}
