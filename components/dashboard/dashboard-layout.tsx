"use client";

import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  CircleUser,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Plane,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useAdminDashboardNav } from "@/components/dashboard/admin-dashboard-nav-context";
import { SidebarMenuGlyph } from "@/components/nav/sidebar-menu-glyph";
import { cn } from "@/lib/utils";

const FOOTER_SIDEBAR_INSET_VAR = "--admin-sidebar-footer-inset";

const navMain = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/assign",
    label: "Assign To",
    icon: Plane,
  },
  {
    href: "/dashboard/user-requests",
    label: "User Request",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/completed-deliveries",
    label: "Completed Deliveries",
    icon: CheckCircle2,
  },
  {
    href: "/dashboard/pilot-status",
    label: "Pilot Status",
    icon: BadgeCheck,
  },
  {
    href: "/pilot-profile",
    label: "Profile",
    icon: CircleUser,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
] as const;

const navFooter = [
  { href: "/login", label: "Log Out", icon: LogOut },
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
  const { sidebarExpanded, setSidebarExpanded } = useAdminDashboardNav();

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((open) => !open);

  const onSidebarMenuButtonClick = () => {
    const wide = globalThis.matchMedia?.("(min-width: 1024px)")?.matches;
    if (wide) {
      setSidebarExpanded(false);
    } else {
      toggleSidebar();
    }
  };

  useEffect(() => {
    const updateFooterInset = () => {
      const mq = globalThis.matchMedia?.("(min-width: 1024px)");
      const wide = mq?.matches ?? false;
      let inset = "0px";
      if (wide) {
        inset = sidebarExpanded ? "16rem" : "0px";
      } else if (sidebarOpen) {
        inset = "min(16rem, 85vw)";
      }
      document.documentElement.style.setProperty(
        FOOTER_SIDEBAR_INSET_VAR,
        inset
      );
    };

    updateFooterInset();
    const mq = globalThis.matchMedia?.("(min-width: 1024px)");
    mq?.addEventListener("change", updateFooterInset);
    return () => {
      mq?.removeEventListener("change", updateFooterInset);
      document.documentElement.style.removeProperty(FOOTER_SIDEBAR_INSET_VAR);
    };
  }, [sidebarExpanded, sidebarOpen]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white pt-22 text-[#191c1d] antialiased sm:pt-24">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-22 z-40 bg-[#191c1d]/40 lg:hidden"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="command-center-nav"
        className={cn(
          "fixed bottom-0 left-0 top-22 z-50 flex min-h-0 w-[min(16rem,85vw)] max-w-[16rem] flex-col border-r border-border bg-card lg:border-r-0",
          "transform transition-[transform,width] duration-200 ease-out will-change-transform",
          sidebarExpanded ? "lg:w-64" : "lg:w-0 lg:max-w-0 lg:overflow-hidden lg:border-0 lg:p-0",
          "-translate-x-full lg:translate-x-0",
          sidebarOpen && "translate-x-0"
        )}
        aria-label="Primary navigation"
      >
        <div className="flex shrink-0 items-center px-2 py-3 lg:hidden">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#191c1d] transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35"
            onClick={onSidebarMenuButtonClick}
            aria-expanded={sidebarOpen}
            aria-controls="command-center-nav"
            aria-label="Sidebar menu"
          >
            <SidebarMenuGlyph />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <nav
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-slate-200 px-2 py-3 lg:pt-4"
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
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35",
                        isActive
                          ? "bg-slate-100 text-[#191c1d] shadow-sm ring-1 ring-slate-200"
                          : "text-[#191c1d] hover:bg-slate-100/90 active:bg-slate-100"
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

          <div
            className={cn(
              "relative z-10 mt-auto shrink-0 border-t border-slate-200 bg-white px-2 pt-3",
              "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
            )}
          >
            <nav aria-label="Sign out">
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
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal text-[#191c1d] transition-colors",
                        "hover:bg-slate-100/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]/35 active:bg-slate-100"
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

      {/* Full-height vertical rule at sidebar edge (continues over the global footer in the viewport). */}
      {sidebarExpanded ? (
        <div
          aria-hidden
          className="pointer-events-none fixed bottom-0 left-64 top-22 z-[35] hidden w-px bg-slate-200 lg:block"
        />
      ) : null}

      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-[margin] duration-200 ease-out",
          sidebarExpanded ? "lg:ml-64" : "lg:ml-0"
        )}
      >
        <div className="flex items-center border-b border-slate-200 bg-white px-4 py-2.5 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-[#191c1d] transition-colors hover:bg-slate-100"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="command-center-nav"
            aria-label="Open navigation menu"
          >
            <SidebarMenuGlyph className="w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col space-y-10 bg-white p-4 pb-2 pt-4 sm:p-8 sm:pb-3">
          {children}
        </div>
      </main>
    </div>
  );
}
