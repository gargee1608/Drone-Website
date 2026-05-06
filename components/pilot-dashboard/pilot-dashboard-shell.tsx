"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Drone,
  LayoutDashboard,
  LogOut,
  Menu,
  Plane,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { usePilotDashboardNav } from "@/components/pilot-dashboard/pilot-dashboard-nav-context";
import { getPilotDisplayName, jwtPayloadRole } from "@/lib/pilot-display-name";
import { PILOT_PROFILE_UPDATED_EVENT } from "@/lib/pilot-profile-snapshot";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

const FOOTER_SIDEBAR_INSET_VAR = "--admin-sidebar-footer-inset";

const sidebarNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/pilot-dashboard" },
  {
    label: "Assign Mission",
    icon: Plane,
    href: "/pilot-dashboard/assign-mission",
  },
  {
    label: "Completed Deliveries",
    icon: CheckCircle2,
    href: "/pilot-dashboard/completed-deliveries",
  },
  {
    label: "Add New Drone Details",
    icon: Drone,
    href: "/pilot-dashboard/drone",
  },
  { label: "Settings", icon: Settings, href: "/settings?from=pilot" },
] as const;

function pilotShellNavHrefPath(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

function pilotShellNavItemIsActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  const base = pilotShellNavHrefPath(href);
  if (base === "/pilot-dashboard") {
    return (
      pathname === "/pilot-dashboard" || pathname === "/pilot-dashboard/"
    );
  }
  if (base === "/settings") {
    return (
      pathname === "/settings" ||
      pathname === "/settings/" ||
      pathname.startsWith("/settings/")
    );
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

function SidebarNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {sidebarNav.map((item) => {
        const Icon = item.icon;
        const isActive = pilotShellNavItemIsActive(pathname, item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-normal text-foreground transition-all duration-200 active:scale-[0.98]",
              isActive
                ? "bg-muted shadow-sm ring-1 ring-border"
                : "hover:bg-muted"
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
        localStorage.removeItem("token");
        localStorage.removeItem("pilot");
        router.replace("/pilot-login");
      }}
      className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-normal text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <LogOut className="size-5 shrink-0" aria-hidden />
      Logout
    </button>
  );
}

function MobileSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto">
        <SidebarNavLinks onNavigate={onNavigate} />
      </div>
      <div className="mt-auto shrink-0 border-t border-border pt-4 pb-2">
        <LogoutControl onAfterClick={onNavigate} />
      </div>
    </div>
  );
}

export type PilotDashboardShellProps = {
  pageTitle: string;
  pageSubtitle?: ReactNode;
  pageTitleClassName?: string;
  pageTitleBarClassName?: string;
  /** When true, skip the large visible page title (use sr-only for a11y). */
  omitPageTitle?: boolean;
  children: ReactNode;
};

export function PilotDashboardShell({
  pageTitle,
  pageSubtitle,
  pageTitleClassName,
  pageTitleBarClassName,
  omitPageTitle = false,
  children,
}: PilotDashboardShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pilotWelcome, setPilotWelcome] = useState<string | null>(null);
  const { sidebarExpanded, setSidebarExpanded } = usePilotDashboardNav();

  const isMainPilotDashboard =
    pathname === "/pilot-dashboard" || pathname === "/pilot-dashboard/";

  useEffect(() => {
    const sync = () => {
      const t =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;
      if (!t || jwtPayloadRole(t) !== "pilot") {
        setPilotWelcome(null);
        return;
      }
      setPilotWelcome(getPilotDisplayName(t));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    setSidebarExpanded(true);
  }, [setSidebarExpanded]);

  useEffect(() => {
    const updateFooterInset = () => {
      const mq = globalThis.matchMedia?.("(min-width: 1024px)");
      const wide = mq?.matches ?? false;
      const inset = wide && sidebarExpanded ? "15rem" : "0px";
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
  }, [sidebarExpanded]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden bg-background pt-20 text-foreground sm:pt-22">
      <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-1.5 lg:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" strokeWidth={2.25} aria-hidden />
        </button>
        <span
          className={cn(
            "font-bold text-[#191c1d] dark:text-white",
            pageTitleBarClassName ?? "text-sm"
          )}
        >
          {pageTitle}
        </span>
      </div>

      {mobileNavOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-50 lg:hidden"
          role="dialog"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(18rem,85vw)] flex-col gap-2 border-r border-border bg-card p-4 text-card-foreground shadow-xl">
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
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
        <aside
          id="pilot-dashboard-sidebar"
          className={cn(
            "hidden flex-col overflow-hidden border-r border-border bg-card text-card-foreground transition-[width] duration-300 ease-out lg:border-r-0 lg:shadow-none lg:fixed lg:bottom-0 lg:left-0 lg:top-20 lg:z-40 lg:flex",
            sidebarExpanded ? "lg:w-60" : "lg:w-0 lg:border-0 lg:p-0"
          )}
          aria-hidden={!sidebarExpanded}
        >
          {sidebarExpanded ? (
            <div className="shrink-0 px-2 py-2 lg:hidden">
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35"
                onClick={() => setSidebarExpanded(false)}
                aria-label="Collapse sidebar"
                aria-expanded={sidebarExpanded}
                aria-controls="pilot-dashboard-sidebar"
              >
                <Menu className="size-[18px]" strokeWidth={2} aria-hidden />
              </button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-2 lg:px-3 lg:pb-3 lg:pt-0">
            <SidebarNavLinks />
          </div>
          {sidebarExpanded ? (
            <div className="mt-auto flex w-full shrink-0 flex-col">
              <div className="shrink-0 border-t border-border px-3.5 pt-3 pb-3">
                <LogoutControl />
              </div>
            </div>
          ) : null}
        </aside>

        {sidebarExpanded ? (
          <div
            aria-hidden
            className="pointer-events-none fixed bottom-0 left-60 top-20 z-[35] hidden w-px bg-border lg:block"
          />
        ) : null}

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out",
            sidebarExpanded ? "lg:ml-60" : "lg:ml-0"
          )}
        >
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-0">
            <div
              className={cn(omitPageTitle ? "mb-4 sm:mb-6" : "mb-8 sm:mb-10")}
            >
              {pilotWelcome && isMainPilotDashboard ? (
                <h2 className="mb-4 text-xl font-bold text-foreground sm:mb-5">
                  Welcome, {pilotWelcome} 
                </h2>
              ) : null}
              {omitPageTitle ? (
                <>
                  <h1 className="sr-only">{pageTitle}</h1>
                  {children}
                </>
              ) : pageSubtitle ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1
                      className={cn(
                        ADMIN_PAGE_TITLE_CLASS,
                        pageTitleClassName
                      )}
                    >
                      {pageTitle}
                    </h1>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {pageSubtitle}
                  </p>
                  <div className="mt-8 sm:mt-10">{children}</div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1
                      className={cn(
                        ADMIN_PAGE_TITLE_CLASS,
                        "mb-6",
                        pageTitleClassName
                      )}
                    >
                      {pageTitle}
                    </h1>
                  </div>
                  {children}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-border bg-background/95 px-6 py-4 backdrop-blur-md md:hidden"
        aria-label="Quick navigation"
      >
        <LayoutDashboard className="size-6 text-[#008B8B]" />
        <Plane className="size-6 text-muted-foreground" />
        <div className="-mt-10 rounded-full bg-[#008B8B] p-3 shadow-lg shadow-[#008B8B]/30">
          <Plane className="size-6 text-white" strokeWidth={2.5} />
        </div>
        <ClipboardList className="size-6 text-muted-foreground" />
        <UserRound className="size-6 text-muted-foreground" />
      </nav>
      <div className="h-20 shrink-0 md:hidden" aria-hidden />
    </div>
  );
}
