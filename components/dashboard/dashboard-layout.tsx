"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  commandCenterNavFooter as navFooter,
  commandCenterNavItemIsActive as navItemIsActive,
  commandCenterNavMain as navMain,
} from "@/components/dashboard/command-center-sidebar-nav";
import { useAdminDashboardNav } from "@/components/dashboard/admin-dashboard-nav-context";
import { SidebarMenuGlyph } from "@/components/nav/sidebar-menu-glyph";
import { cn } from "@/lib/utils";
const FOOTER_SIDEBAR_INSET_VAR = "--admin-sidebar-footer-inset";

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
    <div className="admin-dashboard flex min-h-0 flex-1 flex-col bg-background pt-20 text-foreground antialiased sm:pt-22">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-20 z-40 bg-[#191c1d]/40 lg:hidden"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="command-center-nav"
        className={cn(
          "fixed bottom-0 left-0 top-20 z-50 flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] min-h-0 w-[min(16rem,85vw)] max-w-[16rem] flex-col border-r border-border bg-card lg:border-r-0",
          "transform transition-[transform,width] duration-200 ease-out will-change-transform",
          sidebarExpanded ? "lg:w-64" : "lg:w-0 lg:max-w-0 lg:overflow-hidden lg:border-0 lg:p-0",
          "-translate-x-full lg:translate-x-0",
          sidebarOpen && "translate-x-0"
        )}
        aria-label="Primary navigation"
      >
        <div className="flex shrink-0 items-center px-2 py-2 lg:hidden">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35"
            onClick={onSidebarMenuButtonClick}
            aria-expanded={sidebarOpen}
            aria-controls="command-center-nav"
            aria-label="Sidebar menu"
          >
            <SidebarMenuGlyph />
          </button>
        </div>

        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
          <nav
            className="min-h-0 overflow-y-auto overscroll-contain border-t border-border px-2 py-2 lg:border-t-0 lg:pb-2 lg:pt-0"
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
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35",
                        isActive
                          ? "bg-muted text-foreground shadow-sm ring-1 ring-border"
                          : "text-foreground hover:bg-muted/90 active:bg-muted"
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
              "relative z-10 w-full shrink-0 border-t border-border bg-card px-2 pt-2",
              "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
            )}
          >
            <nav aria-label="Logout">
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
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal text-foreground transition-colors",
                        "hover:bg-muted/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35 active:bg-muted"
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
          className="pointer-events-none fixed bottom-0 left-64 top-20 z-[35] hidden w-px bg-border lg:block"
        />
      ) : null}

      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-[margin] duration-200 ease-out",
          sidebarExpanded ? "lg:ml-64" : "lg:ml-0"
        )}
      >
        <div className="flex items-center border-b border-border bg-card px-4 py-2.5 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="command-center-nav"
            aria-label="Open navigation menu"
          >
            <SidebarMenuGlyph className="w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col space-y-10 bg-background px-3 pb-2 pt-0 sm:px-5 sm:pb-2">
          {children}
        </div>
      </main>
    </div>
  );
}
