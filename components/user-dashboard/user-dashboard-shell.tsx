"use client";

import Link from "next/link";
import {
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Menu,
  Plus,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useUserDashboardNav } from "@/components/user-dashboard/user-dashboard-nav-context";
import { clearAuthSession } from "@/lib/auth-session-browser";
import { jwtPayloadRole } from "@/lib/pilot-display-name";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { USER_PROFILE_UPDATED_EVENT } from "@/lib/user-profile-storage";
import { getUserDisplayName } from "@/lib/user-session-browser";
import {
  USER_DASH_BORDER_COLOR,
  USER_DASH_DIVIDER_BORDER,
  USER_DASH_DIVIDER_TOP,
  USER_DASH_NAV_ITEM_ACTIVE,
  USER_DASH_NAV_ITEM_INACTIVE,
  USER_DASH_SIDEBAR_VERTICAL_BORDER,
  USER_DASH_SIDEBAR_VERTICAL_RULE,
} from "@/lib/user-dashboard-styles";
import { cn } from "@/lib/utils";

const FOOTER_SIDEBAR_INSET_VAR = "--admin-sidebar-footer-inset";

const MY_REQUESTS_HREF = "/user-dashboard/my-requests";

/** Same page as embedded user sign-in (`LoginView userOnly`); `panel=user` selects the User tab. */
const USER_LOGIN_HREF = "/pilot-login?panel=user";

const sidebarNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/user-dashboard" },
  { label: "My Request", icon: ClipboardList, href: MY_REQUESTS_HREF },
  {
    label: "User Tracking",
    icon: MapPinned,
    href: "/user-dashboard/user-tracking",
  },
  { label: "Settings", icon: Settings, href: "/settings?from=user" },
] as const;

function userShellNavHrefPath(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

function userShellNavItemIsActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  const base = userShellNavHrefPath(href);
  if (base === "/user-dashboard") {
    return pathname === "/user-dashboard" || pathname === "/user-dashboard/";
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
        const isActive = userShellNavItemIsActive(pathname, item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#191c1d] transition-colors duration-200 active:scale-[0.98] dark:text-foreground",
              isActive ? USER_DASH_NAV_ITEM_ACTIVE : USER_DASH_NAV_ITEM_INACTIVE
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
        clearAuthSession();
        router.replace(USER_LOGIN_HREF);
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
      <div className="mt-auto shrink-0 pt-4 pb-2">
        <LogoutControl onAfterClick={onNavigate} />
      </div>
    </div>
  );
}

export type UserDashboardShellProps = {
  pageTitle: string;
  pageSubtitle?: ReactNode;
  pageTitleClassName?: string;
  pageTitleBarClassName?: string;
  /** When true, skip the large visible page title (use sr-only for a11y). */
  omitPageTitle?: boolean;
  /** Override default `max-w-[1400px]` on the main content column. */
  mainMaxWidthClassName?: string;
  children: ReactNode;
};

export function UserDashboardShell({
  pageTitle,
  pageSubtitle,
  pageTitleClassName,
  pageTitleBarClassName,
  omitPageTitle = false,
  mainMaxWidthClassName,
  children,
}: UserDashboardShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userWelcome, setUserWelcome] = useState<string | null>(null);
  const { sidebarExpanded, setSidebarExpanded } = useUserDashboardNav();

  const isMainUserDashboard =
    pathname === "/user-dashboard" || pathname === "/user-dashboard/";

  useEffect(() => {
    const sync = () => {
      const t =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!t || jwtPayloadRole(t) !== "user") {
        setUserWelcome(null);
        return;
      }
      setUserWelcome(getUserDisplayName(t));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, sync);
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
      <div
        className={cn(
          "flex items-center gap-2 border-b bg-background px-4 py-3 lg:hidden",
          USER_DASH_DIVIDER_BORDER
        )}
      >
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
          <aside
            className={cn(
              "relative absolute left-0 top-0 flex h-full w-[min(18rem,85vw)] flex-col gap-2 bg-white p-4 text-card-foreground shadow-xl",
              USER_DASH_SIDEBAR_VERTICAL_BORDER
            )}
          >
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
          id="user-dashboard-sidebar"
          className={cn(
            "relative hidden flex-col overflow-hidden border-r bg-white text-card-foreground transition-[width] duration-300 ease-out lg:border-r-0 lg:shadow-none lg:fixed lg:bottom-0 lg:left-0 lg:top-20 lg:z-40 lg:flex",
            USER_DASH_BORDER_COLOR,
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
                aria-controls="user-dashboard-sidebar"
              >
                <Menu className="size-[18px]" strokeWidth={2} aria-hidden />
              </button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-2 lg:px-4 lg:pb-4 lg:pt-6">
            <SidebarNavLinks />
          </div>
          {sidebarExpanded ? (
            <div className="mt-auto flex w-full shrink-0 flex-col">
              <div className="shrink-0 px-3.5 pt-4 pb-3">
                <LogoutControl />
              </div>
            </div>
          ) : null}
        </aside>

        {sidebarExpanded ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none fixed bottom-0 left-60 top-20 z-[35] hidden w-px lg:block",
              USER_DASH_SIDEBAR_VERTICAL_RULE
            )}
          />
        ) : null}

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out",
            sidebarExpanded ? "lg:ml-60" : "lg:ml-0"
          )}
        >
          <main
            className={cn(
              "mx-auto w-full flex-1 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-6",
              mainMaxWidthClassName ?? "max-w-[1400px]"
            )}
          >
            <div
              className={cn(omitPageTitle ? "mb-6 sm:mb-8" : "mb-10 sm:mb-12")}
            >
              {omitPageTitle ? (
                <>
                  {isMainUserDashboard ? (
                    <>
                      <h1 className="sr-only lg:hidden">{pageTitle}</h1>
                      <h1
                        className={cn(
                          ADMIN_PAGE_TITLE_CLASS,
                          "mb-4 hidden lg:block sm:mb-5"
                        )}
                      >
                        {pageTitle}
                      </h1>
                      {userWelcome ? (
                        <h2 className="mb-4 text-xl font-bold text-foreground sm:mb-5">
                          Welcome, {userWelcome}
                        </h2>
                      ) : null}
                    </>
                  ) : (
                    <h1 className="sr-only">{pageTitle}</h1>
                  )}
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
                  {userWelcome && isMainUserDashboard ? (
                    <h2 className="mb-4 text-xl font-bold text-foreground sm:mb-5">
                      Welcome, {userWelcome}
                    </h2>
                  ) : null}
                  {children}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between bg-background/95 px-6 py-4 backdrop-blur-md md:hidden",
          USER_DASH_DIVIDER_TOP
        )}
        aria-label="Quick navigation"
      >
        <LayoutDashboard className="size-6 text-[#008B8B]" />
        <Map className="size-6 text-muted-foreground" />
        <div className="-mt-10 rounded-full bg-[#008B8B] p-3 shadow-lg shadow-[#008B8B]/30">
          <Plus className="size-6 text-white" strokeWidth={2.5} />
        </div>
        <History className="size-6 text-muted-foreground" />
        <UserRound className="size-6 text-muted-foreground" />
      </nav>
      <div className="h-20 shrink-0 md:hidden" aria-hidden />
    </div>
  );
}
