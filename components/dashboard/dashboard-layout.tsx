"use client";

import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  adminMobilePageTitle,
  commandCenterNavItemIsActive as navItemIsActive,
  commandCenterNavMain as navMain,
} from "@/components/dashboard/command-center-sidebar-nav";
import { useAdminDashboardNav } from "@/components/dashboard/admin-dashboard-nav-context";
import { SidebarMenuGlyph } from "@/components/nav/sidebar-menu-glyph";
import { clearAuthSession } from "@/lib/auth-session-browser";
import { cn } from "@/lib/utils";

const FOOTER_SIDEBAR_INSET_VAR = "--admin-sidebar-footer-inset";
const ADMIN_LOGIN_HREF = "/admin";

function AdminLogoutControl({ onAfterClick }: { onAfterClick?: () => void }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        onAfterClick?.();
        clearAuthSession();
        router.replace(ADMIN_LOGIN_HREF);
      }}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal transition-colors",
        "text-foreground hover:bg-muted dark:text-white/90 dark:hover:bg-white/10",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35",
        "active:bg-muted dark:active:bg-white/10"
      )}
    >
      <LogOut
        className="size-[1.125rem] shrink-0 text-current"
        aria-hidden
        strokeWidth={2}
      />
      <span>Logout</span>
    </button>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mobilePageTitle = adminMobilePageTitle(pathname);
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
    /**
     * Footer sits outside `main`; only `lg+` shifts with the fixed sidebar (drawer overlays on mobile).
     * `sidebarOpen` is listed in deps so the dependency array length stays stable (avoids React dev warning on refresh).
     */
    const updateFooterInset = () => {
      const mq = globalThis.matchMedia?.("(min-width: 1024px)");
      const wide = mq?.matches ?? false;
      const inset = wide && sidebarExpanded ? "16rem" : "0px";
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
    <div className="admin-dashboard flex min-h-0 flex-1 flex-col overflow-x-hidden bg-background pt-20 text-foreground antialiased sm:pt-22">
      <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-3 lg:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
          onClick={toggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="command-center-nav"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" strokeWidth={2.25} aria-hidden />
        </button>
        <span className="text-sm font-bold text-[#191c1d] dark:text-white">
          {mobilePageTitle}
        </span>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-20 z-40 bg-[#191c1d]/40 sm:top-22 lg:hidden"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="command-center-nav"
        className={cn(
          "fixed bottom-0 left-0 top-20 z-50 flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] min-h-0 w-[min(16rem,85vw)] max-w-[16rem] flex-col bg-white text-foreground dark:bg-black dark:text-white sm:top-22 sm:h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100dvh-5.5rem)]",
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
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35 dark:text-white dark:hover:bg-white/10"
            onClick={onSidebarMenuButtonClick}
            aria-expanded={sidebarOpen}
            aria-controls="command-center-nav"
            aria-label="Sidebar menu"
          >
            <SidebarMenuGlyph />
          </button>
        </div>

        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-white dark:bg-black">
          <nav
            className="min-h-0 overflow-y-auto overscroll-contain border-t border-border bg-white px-2 py-2 dark:border-white/20 dark:bg-black lg:border-t-0 lg:pb-2 lg:pt-4"
            aria-label="Primary"
          >
            <ul className="flex flex-col gap-2" role="list">
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
                          ? "bg-[#008B8B]/10 text-[#006b6b] shadow-sm dark:bg-[#008B8B]/20 dark:text-[#5ec4c4]"
                          : "text-foreground hover:bg-muted active:bg-muted dark:text-white/90 dark:hover:bg-white/10 dark:active:bg-white/10"
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

          <div className="relative z-10 w-full shrink-0 bg-white dark:bg-black">
            <div className="admin-shell-footer-rule" aria-hidden />
            <nav
              aria-label="Logout"
              className="admin-shell-footer-pane flex items-center px-2"
            >
              <ul className="flex w-full flex-col gap-2" role="list">
                <li>
                  <AdminLogoutControl
                    onAfterClick={() => {
                      if (
                        globalThis.matchMedia?.("(max-width: 1023px)")
                          .matches
                      ) {
                        closeSidebar();
                      }
                    }}
                  />
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </aside>

      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-[margin] duration-200 ease-out",
          sidebarExpanded ? "lg:ml-64" : "lg:ml-0"
        )}
      >
        <div className="flex flex-1 flex-col space-y-10 bg-background px-3 pb-2 pt-0 sm:px-5 sm:pb-2">
          {children}
        </div>
      </main>
    </div>
  );
}
