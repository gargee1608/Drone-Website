"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Home as HomeIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Plane,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";

import { useAdminDashboardNav } from "@/components/dashboard/admin-dashboard-nav-context";
import {
  ServiceListingMegaMenu,
  useServiceMegaMenuItems,
} from "@/components/nav/service-listing-mega-menu";
import { SidebarMenuGlyph } from "@/components/nav/sidebar-menu-glyph";
import { usePilotDashboardNav } from "@/components/pilot-dashboard/pilot-dashboard-nav-context";
import { useUserDashboardNav } from "@/components/user-dashboard/user-dashboard-nav-context";
import { AdminInboxMenu } from "@/components/notifications/admin-inbox-menu";
import { PilotMissionNotificationsMenu } from "@/components/notifications/pilot-mission-notifications-menu";
import { HeaderThemeModeToggle } from "@/components/nav/header-theme-mode-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { getPilotDisplayName, jwtPayloadRole } from "@/lib/pilot-display-name";
import {
  clearStoredUserSession,
  readStoredUserSession,
  type StoredUserSession,
} from "@/lib/user-session-browser";
import { cn } from "@/lib/utils";

const landingOutlineButtonClassName =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-4 font-[family-name:var(--font-landing-headline)] text-xs font-bold tracking-wider text-[#008B8B] uppercase transition hover:border-[#006b6b] hover:text-[#006b6b] hover:bg-transparent dark:border-white dark:text-white dark:hover:border-white/85 dark:hover:text-white";

export function LandingHeader() {
  const serviceMegaMenuItems = useServiceMegaMenuItems();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isAdminDashboard =
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    (pathname?.startsWith("/dashboard/") ?? false);
  const isAdminLoginPage =
    pathname === "/admin" || pathname === "/admin/";
  const isPilotLoginPage =
    pathname === "/pilot-login" || pathname === "/pilot-login/";
  const isResetPasswordPage =
    pathname === "/reset-password" || pathname === "/reset-password/";
  const isUserDashboard = pathname?.startsWith("/user-dashboard") ?? false;
  const isPilotDashboard =
    pathname?.startsWith("/pilot-dashboard") ||
    pathname?.startsWith("/pilot-profile") ||
    false;
  /** Header search (desktop + mobile drawer) — hidden on admin dashboard and admin login. */
  const showHeaderSearchBar = !isAdminDashboard && !isAdminLoginPage;
  const isSettingsPage =
    pathname === "/settings" || (pathname?.startsWith("/settings/") ?? false);
  const settingsFrom = searchParams.get("from");
  /** Home / Services / Blogs / Contact — hidden on user dashboard shell, admin dashboard, pilot dashboard areas, and admin login; all `/settings` URLs are excluded via `!isSettingsPage` below. */
  const isUserShellMarketingHidden = isUserDashboard;
  const showMarketingHeaderNav =
    !isAdminDashboard &&
    !isAdminLoginPage &&
    !isPilotDashboard &&
    !isUserShellMarketingHidden &&
    !isSettingsPage;
  const isPilotSettingsContext =
    isSettingsPage && settingsFrom === "pilot";
  const showUserDashboardSidebar =
    isUserDashboard || (isSettingsPage && settingsFrom !== "pilot");
  const showPilotDashboardSidebar =
    isPilotDashboard || isPilotSettingsContext;
  const compactAppHeader =
    isAdminDashboard ||
    isUserDashboard ||
    isPilotDashboard ||
    isSettingsPage;
  const isHomePage = pathname === "/" || pathname === "";
  const isMatchingHub = pathname === "/matching-hub";
  const isPilotRegistration =
    pathname === "/pilot-registration" ||
    (pathname?.startsWith("/pilot-registration/") ?? false);
  const {
    sidebarExpanded: adminSidebarExpanded,
    setSidebarExpanded: setAdminSidebarExpanded,
  } = useAdminDashboardNav();
  const {
    sidebarExpanded: userSidebarExpanded,
    setSidebarExpanded: setUserSidebarExpanded,
  } = useUserDashboardNav();
  const {
    sidebarExpanded: pilotSidebarExpanded,
    setSidebarExpanded: setPilotSidebarExpanded,
  } = usePilotDashboardNav();

  const isMarketingAuthPage =
    pathname === "/services" ||
    (pathname?.startsWith("/services/") ?? false) ||
    pathname === "/blogs" ||
    (pathname?.startsWith("/blogs/") ?? false) ||
    pathname === "/contact";
  const hideRegisterPilotCta =
    isAdminLoginPage ||
    pathname === "/pilot-login" ||
    pathname === "/reset-password" ||
    pathname === "/pilot-registration" ||
    pathname === "/settings" ||
    pathname?.startsWith("/settings/") ||
    isAdminDashboard ||
    isUserDashboard ||
    isPilotDashboard;
  const showHeaderLoginButton = isHomePage || isMarketingAuthPage;
  const hideLoginIcon =
    isAdminLoginPage ||
    pathname === "/pilot-login" ||
    pathname === "/pilot-registration" ||
    showHeaderLoginButton;

  const hideNotificationsAndSettings =
    pathname === "/services" ||
    (pathname?.startsWith("/services/") ?? false) ||
    pathname === "/blogs" ||
    (pathname?.startsWith("/blogs/") ?? false) ||
    pathname === "/contact" ||
    isMatchingHub;

  const settingsHref =
    isPilotDashboard || isPilotSettingsContext
      ? "/settings?from=pilot"
      : isUserDashboard
        ? "/settings?from=user"
        : isAdminDashboard
          ? "/settings?from=admin"
          : "/settings";

  const showHeaderNotifications =
    isAdminDashboard ||
    isUserDashboard ||
    (isSettingsPage &&
      (settingsFrom === "admin" || settingsFrom === "user"));
  const showPilotThemeToggle =
    isPilotDashboard || isPilotSettingsContext;
  const showPilotNotifications =
    isPilotDashboard || isPilotSettingsContext;
  const profileHref =
    isPilotDashboard || settingsFrom === "pilot"
      ? "/pilot-profile"
      : isAdminDashboard || settingsFrom === "admin"
        ? "/settings?from=admin"
        : "/settings?from=user";

  const showAccountMenu =
    isAdminDashboard ||
    isUserDashboard ||
    isPilotDashboard ||
    (isSettingsPage &&
      (settingsFrom === "user" ||
        settingsFrom === "admin" ||
        settingsFrom === "pilot"));

  const isAdminSettingsContext =
    isSettingsPage && settingsFrom === "admin";
  const isUserSettingsContext =
    isSettingsPage && settingsFrom === "user";
  /** Includes `/settings` without `from` (user shell) and `?from=user`. */
  const isUserLogoutContext =
    isUserDashboard ||
    (isSettingsPage &&
      settingsFrom !== "pilot" &&
      settingsFrom !== "admin");
  const isPilotLogoutContext =
    isPilotDashboard ||
    (isSettingsPage && settingsFrom === "pilot");

  const showHeaderSettingsIcon = !(
    isPilotDashboard ||
    isPilotSettingsContext ||
    isAdminDashboard ||
    isUserDashboard ||
    isAdminSettingsContext ||
    isUserSettingsContext ||
    isAdminLoginPage ||
    isPilotLoginPage ||
    isResetPasswordPage
  );

  const [appUserSession, setAppUserSession] =
    useState<StoredUserSession | null>(null);
  const [pilotMarketingActive, setPilotMarketingActive] = useState(false);
  const [marketingUserMenuOpen, setMarketingUserMenuOpen] = useState(false);
  const marketingUserMenuRef = useRef<HTMLDivElement>(null);

  const hasLoggedInAppUser = appUserSession != null;
  const onMarketingAuthSurface = isHomePage || isMarketingAuthPage;
  const hideMarketingRegisterAndLogin =
    (hasLoggedInAppUser || pilotMarketingActive) && onMarketingAuthSurface;

  const appUserDisplayName =
    appUserSession?.fullName?.trim() ||
    appUserSession?.name?.trim() ||
    appUserSession?.email?.split("@")[0]?.trim() ||
    "Account";
  const appUserInitial =
    (appUserDisplayName.slice(0, 1) || "?").toUpperCase();

  const pilotDisplayNameForChip =
    pilotMarketingActive && !hasLoggedInAppUser
      ? getPilotDisplayName(
          typeof window !== "undefined" ? localStorage.getItem("token") : null
        )
      : "";
  const pilotInitialForChip =
    (pilotDisplayNameForChip.slice(0, 1) || "?").toUpperCase();

  /** On `/`, logged-in app user: one tap opens user dashboard (no dropdown). */
  const appUserMarketingHomeDirect = hasLoggedInAppUser && isHomePage;

  const marketingUserChipClassName =
    "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border-0 bg-transparent px-1 font-normal text-slate-800 transition-colors hover:bg-slate-100/90 hover:text-[#008B8B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35 dark:text-white dark:hover:bg-white/10 dark:hover:text-white sm:px-1.5";

  useEffect(() => {
    function syncMarketingSessions() {
      const user = readStoredUserSession();
      setAppUserSession(user);
      if (typeof window === "undefined") {
        setPilotMarketingActive(false);
        return;
      }
      const token = localStorage.getItem("token");
      const pilotSession =
        !user &&
        Boolean(token && jwtPayloadRole(token) === "pilot");
      setPilotMarketingActive(pilotSession);
    }
    syncMarketingSessions();
    if (typeof window === "undefined") return;
    window.addEventListener("storage", syncMarketingSessions);
    return () => window.removeEventListener("storage", syncMarketingSessions);
  }, [pathname]);

  useEffect(() => {
    setAccountMenuOpen(false);
    setMarketingUserMenuOpen(false);
  }, [pathname]);

  function logoutMarketingAccountAndGoHome() {
    setOpen(false);
    setMarketingUserMenuOpen(false);
    setAccountMenuOpen(false);
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("pilot");
      clearStoredUserSession();
    } catch {
      /* ignore */
    }
    setAppUserSession(null);
    setPilotMarketingActive(false);
    router.replace("/");
  }

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = accountMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!marketingUserMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = marketingUserMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setMarketingUserMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMarketingUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [marketingUserMenuOpen]);

  const linkClass = (href: string) =>
    cn(
      "text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-[#008B8B] dark:text-white dark:hover:text-white",
      (pathname === href || pathname?.startsWith(`${href}/`)) &&
        "font-semibold text-slate-900 dark:text-white"
    );

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full border-b dark:text-white",
        compactAppHeader
          ? "border-border bg-background"
          : "border-slate-100 bg-white dark:border-border dark:bg-background"
      )}
    >
      <nav
        className={cn(
          "mx-auto flex max-w-[1600px] flex-wrap items-center justify-between px-4 sm:px-6 lg:px-8",
          compactAppHeader
            ? "gap-3 py-2.5 sm:py-3"
            : "gap-4 py-4"
        )}
        aria-label="Primary"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 sm:gap-8 lg:gap-12">
          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            {isAdminDashboard ? (
              <button
                type="button"
                className="hidden size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#008B8B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35 dark:text-white dark:hover:bg-white/10 dark:hover:text-white lg:inline-flex"
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
            {showUserDashboardSidebar ? (
              <button
                type="button"
                className="hidden size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#008B8B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35 dark:text-white dark:hover:bg-white/10 dark:hover:text-white lg:inline-flex"
                onClick={() =>
                  setUserSidebarExpanded(!userSidebarExpanded)
                }
                aria-label={
                  userSidebarExpanded
                    ? "Collapse sidebar"
                    : "Expand sidebar"
                }
                aria-expanded={userSidebarExpanded}
                aria-controls="user-dashboard-sidebar"
              >
                <SidebarMenuGlyph />
              </button>
            ) : null}
            {showPilotDashboardSidebar ? (
              <button
                type="button"
                className="hidden size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#008B8B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35 dark:text-white dark:hover:bg-white/10 dark:hover:text-white lg:inline-flex"
                onClick={() =>
                  setPilotSidebarExpanded(!pilotSidebarExpanded)
                }
                aria-label={
                  pilotSidebarExpanded
                    ? "Collapse pilot sidebar"
                    : "Expand pilot sidebar"
                }
                aria-expanded={pilotSidebarExpanded}
                aria-controls="pilot-dashboard-sidebar"
              >
                <SidebarMenuGlyph />
              </button>
            ) : null}
            <Link
              href="/"
              className="inline-flex min-w-0 items-center gap-2 font-[family-name:var(--font-landing-headline)] text-lg font-bold tracking-tighter text-[#008B8B] uppercase sm:gap-2.5 sm:text-xl"
            >
              <Plane
                className="size-6 shrink-0 text-[#008B8B] sm:size-7"
                strokeWidth={1.75}
                aria-hidden
              />
              <span>Drone Hire</span>
            </Link>
          </div>
          {showMarketingHeaderNav ? (
            <div className="hidden items-center gap-8 md:flex">
              <Link href="/" className={linkClass("/")}>
                Home
              </Link>
              <ServiceListingMegaMenu
                variant="landing"
                label="Services"
                triggerClassName={cn(
                  (pathname === "/services" ||
                    pathname?.startsWith("/services/")) &&
                    "font-semibold text-slate-900 dark:text-white"
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
          {showHeaderSearchBar ? (
            <div className="hidden min-w-0 items-center rounded-full border border-slate-200 bg-white py-2 pl-3 pr-2 dark:border-white/20 dark:bg-white/5 lg:flex">
              <Search
                className="mr-2 size-4 shrink-0 text-slate-500 dark:text-white"
                aria-hidden
              />
              <input
                type="search"
                name="track-delivery"
                placeholder="Search..."
                className="w-40 min-w-0 border-0 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white dark:placeholder:text-white/45 xl:w-48"
                autoComplete="off"
              />
            </div>
          ) : null}
          <div className="flex items-center gap-2 sm:gap-4">
            {!isSettingsPage ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-700 md:hidden dark:text-white"
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
                "hidden sm:inline-flex",
                landingOutlineButtonClassName,
                (hideRegisterPilotCta || hideMarketingRegisterAndLogin) &&
                  "sm:hidden"
              )}
            >
              New Registration
            </Link>
            {showHeaderLoginButton && !hideMarketingRegisterAndLogin ? (
              <Link
                href="/pilot-login"
                className={cn("hidden sm:inline-flex", landingOutlineButtonClassName)}
              >
                Login
              </Link>
            ) : null}
            {appUserMarketingHomeDirect ? (
              <Link
                href="/user-dashboard"
                className={cn(marketingUserChipClassName, "no-underline")}
                aria-label="Open user dashboard"
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/15 text-xs font-semibold text-[#008B8B] dark:bg-white/15 dark:text-white"
                  aria-hidden
                >
                  {appUserInitial}
                </span>
                <span className="max-w-[6rem] truncate text-sm font-medium sm:max-w-[10rem]">
                  {appUserDisplayName}
                </span>
              </Link>
            ) : hasLoggedInAppUser && hideMarketingRegisterAndLogin ? (
              <div className="relative shrink-0" ref={marketingUserMenuRef}>
                <button
                  type="button"
                  onClick={() => setMarketingUserMenuOpen((v) => !v)}
                  aria-expanded={marketingUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className={marketingUserChipClassName}
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/15 text-xs font-semibold text-[#008B8B] dark:bg-white/15 dark:text-white"
                    aria-hidden
                  >
                    {appUserInitial}
                  </span>
                  <span className="max-w-[6rem] truncate text-sm font-medium sm:max-w-[10rem]">
                    {appUserDisplayName}
                  </span>
                </button>
                {marketingUserMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-[60] mt-1.5 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg ring-1 ring-black/5"
                  >
                    <Link
                      href="/"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      onClick={() => setMarketingUserMenuOpen(false)}
                    >
                      <HomeIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      Home
                    </Link>
                    <Link
                      href="/user-dashboard"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      onClick={() => setMarketingUserMenuOpen(false)}
                    >
                      <LayoutDashboard
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      User dashboard
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      onClick={logoutMarketingAccountAndGoHome}
                    >
                      <LogOut className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : pilotMarketingActive &&
              !hasLoggedInAppUser &&
              hideMarketingRegisterAndLogin ? (
              <Link
                href="/pilot-dashboard"
                className={cn(marketingUserChipClassName, "no-underline")}
                aria-label="Open pilot dashboard"
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/15 text-xs font-semibold text-[#008B8B] dark:bg-white/15 dark:text-white"
                  aria-hidden
                >
                  {pilotInitialForChip}
                </span>
                <span className="max-w-[6rem] truncate text-sm font-medium sm:max-w-[10rem]">
                  {pilotDisplayNameForChip || "Pilot"}
                </span>
              </Link>
            ) : null}
            {!isHomePage &&
            !isPilotRegistration &&
            !hideNotificationsAndSettings ? (
              <>
                {showHeaderNotifications ? (
                  <>
                    <AdminInboxMenu />
                    <HeaderThemeModeToggle />
                  </>
                ) : null}
                {showPilotThemeToggle ? <HeaderThemeModeToggle /> : null}
                {showPilotNotifications ? (
                  <PilotMissionNotificationsMenu />
                ) : null}
                {showHeaderSettingsIcon ? (
                  <Link
                    href={settingsHref}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "text-slate-500 hover:text-[#008B8B] dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                    aria-label="Settings"
                  >
                    <Settings className="size-5" />
                  </Link>
                ) : null}
              </>
            ) : null}
            {showAccountMenu ? (
              <div className="relative shrink-0" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "shrink-0 text-slate-500 hover:text-[#008B8B] focus-visible:ring-2 focus-visible:ring-[#008B8B]/35 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                  )}
                >
                  <User className="size-5" aria-hidden />
                </button>
                {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-[60] mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg ring-1 ring-black/5"
                  >
                    {isUserLogoutContext ||
                    isPilotLogoutContext ||
                    isAdminDashboard ||
                    isAdminSettingsContext ? (
                      <Link
                        href="/"
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <HomeIcon
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        Home
                      </Link>
                    ) : null}
                    <Link
                      href={profileHref}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        try {
                          localStorage.removeItem("token");
                          localStorage.removeItem("pilot");
                          if (isUserLogoutContext || isPilotLogoutContext) {
                            clearStoredUserSession();
                          }
                        } catch {
                          /* ignore */
                        }
                        router.replace(
                          isPilotDashboard || settingsFrom === "pilot"
                            ? "/pilot-login"
                            : isUserLogoutContext
                              ? "/pilot-login?panel=user"
                              : "/admin"
                        );
                      }}
                    >
                      <LogOut className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : !hideLoginIcon && !isHomePage && !isMatchingHub ? (
              <Link
                href="/pilot-login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "shrink-0 text-slate-500 hover:text-[#008B8B] dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
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
        {showHeaderSearchBar ? (
          <div className="mb-3 flex rounded-full border border-slate-200 bg-white py-2 pl-3 pr-2">
            <Search className="mr-2 size-4 shrink-0 text-slate-500" aria-hidden />
            <input
              type="search"
              placeholder="Track delivery..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm focus:ring-0"
            />
          </div>
        ) : null}
        {!isAdminDashboard ? (
          <div className="flex flex-col gap-1">
            {showMarketingHeaderNav ? (
              <>
                <Link
                  href="/"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Home
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
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#008B8B] hover:bg-slate-50"
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
              </>
            ) : null}
            {showAccountMenu && !isAdminDashboard ? (
              <div className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-3">
                {isUserLogoutContext || isPilotLogoutContext ? (
                  <Link
                    href="/"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    Home
                  </Link>
                ) : null}
                <Link
                  href={profileHref}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setOpen(false);
                    try {
                      localStorage.removeItem("token");
                      localStorage.removeItem("pilot");
                      if (isUserLogoutContext || isPilotLogoutContext) {
                        clearStoredUserSession();
                      }
                    } catch {
                      /* ignore */
                    }
                    if (
                      isPilotDashboard ||
                      settingsFrom === "pilot"
                    ) {
                      router.replace("/pilot-login");
                    } else if (isUserLogoutContext) {
                      router.replace("/pilot-login?panel=user");
                    } else {
                      router.replace("/admin");
                    }
                  }}
                >
                  Logout
                </button>
              </div>
            ) : !isMatchingHub &&
              !isAdminLoginPage &&
              !hideMarketingRegisterAndLogin ? (
              <Link
                href="/pilot-login"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <Link
              href={profileHref}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <button
              type="button"
              className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                router.replace("/admin");
              }}
            >
              Logout
            </button>
          </div>
        )}
        {isHomePage && !hideMarketingRegisterAndLogin ? (
          <Link
            href="/pilot-login"
            className="mt-4 flex h-11 w-full items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent font-[family-name:var(--font-landing-headline)] text-xs font-bold tracking-wider text-[#008B8B] uppercase hover:border-[#006b6b] hover:text-[#006b6b] hover:bg-transparent"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
        ) : null}
        {!hideRegisterPilotCta && !hideMarketingRegisterAndLogin ? (
          <Link
            href="/pilot-registration"
            className={cn(
              "flex h-11 w-full items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent font-[family-name:var(--font-landing-headline)] text-xs font-bold tracking-wider text-[#008B8B] uppercase hover:border-[#006b6b] hover:text-[#006b6b] hover:bg-transparent",
              isHomePage ? "mt-2" : "mt-4"
            )}
            onClick={() => setOpen(false)}
          >
            New Registration
          </Link>
        ) : null}
      </div>
    </header>
  );
}
