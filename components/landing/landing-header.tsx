"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Home as HomeIcon,
  LayoutDashboard,
  LogOut,
  Menu,
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
import { PilotHeaderThemeToggle } from "@/components/pilot-dashboard/pilot-header-theme-toggle";
import { usePilotDashboardNav } from "@/components/pilot-dashboard/pilot-dashboard-nav-context";
import { useUserDashboardNav } from "@/components/user-dashboard/user-dashboard-nav-context";
import { AdminInboxMenu } from "@/components/notifications/admin-inbox-menu";
import { PilotMissionNotificationsMenu } from "@/components/notifications/pilot-mission-notifications-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { getPilotDisplayName, jwtPayloadRole } from "@/lib/pilot-display-name";
import {
  buildAdminProfileForDisplay,
} from "@/lib/admin-profile-storage";
import { clearAuthSession } from "@/lib/auth-session-browser";
import {
  readStoredUserSession,
  type StoredUserSession,
} from "@/lib/user-session-browser";
import { isPilotRegistrationFromAdmin } from "@/lib/pilot-registration-from-admin";
import { cn } from "@/lib/utils";

const landingOutlineButtonClassName =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-4 font-[family-name:var(--font-landing-headline)] text-xs font-bold tracking-wider text-[#008B8B] uppercase transition hover:border-[#006b6b] hover:bg-transparent hover:text-[#006b6b] dark:border-white dark:text-white dark:hover:border-white/85 dark:hover:text-white";

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
  const isSignupPage = pathname === "/signup" || pathname === "/signup/";
  const isUserDashboard = pathname?.startsWith("/user-dashboard") ?? false;
  const isPilotDashboard =
    pathname?.startsWith("/pilot-dashboard") ||
    pathname?.startsWith("/pilot-profile") ||
    false;
  const isSettingsPage =
    pathname === "/settings" || (pathname?.startsWith("/settings/") ?? false);
  const settingsFrom = searchParams.get("from");
  const isPilotRegistration =
    pathname === "/pilot-registration" ||
    (pathname?.startsWith("/pilot-registration/") ?? false);
  const isAdminPilotRegistration = isPilotRegistrationFromAdmin(
    pathname,
    settingsFrom
  );
  const isAdminCommandCenterShell =
    isAdminDashboard || isAdminPilotRegistration;
  /** Header search (desktop + mobile drawer) — hidden on admin dashboard and admin login. */
  const showHeaderSearchBar =
    !isAdminCommandCenterShell && !isAdminLoginPage;
  /** Home / Services / Blogs / Contact — hidden on user dashboard shell, admin dashboard, pilot dashboard areas, and admin login; all `/settings` URLs are excluded via `!isSettingsPage` below. */
  const isUserShellMarketingHidden = isUserDashboard;
  const showMarketingHeaderNav =
    !isAdminCommandCenterShell &&
    !isAdminLoginPage &&
    !isPilotDashboard &&
    !isUserShellMarketingHidden &&
    !isSettingsPage;
  const isPilotSettingsContext =
    isSettingsPage && settingsFrom === "pilot";
  /** Pilot dashboard, profile, and `?from=pilot` settings — theme toggle in header. */
  const pilotShellLightHeader =
    isPilotDashboard || isPilotSettingsContext;
  const showUserDashboardSidebar =
    isUserDashboard || (isSettingsPage && settingsFrom !== "pilot");
  const showPilotDashboardSidebar =
    isPilotDashboard || isPilotSettingsContext;
  const compactAppHeader =
    isAdminCommandCenterShell ||
    isUserDashboard ||
    isPilotDashboard ||
    isSettingsPage;
  const isHomePage = pathname === "/" || pathname === "";
  const isMatchingHub = pathname === "/matching-hub";
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
    isMatchingHub ||
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
    isAdminCommandCenterShell ||
    isUserDashboard ||
    (isSettingsPage &&
      (settingsFrom === "admin" || settingsFrom === "user"));
  const adminInboxAudience =
    isUserDashboard || (isSettingsPage && settingsFrom === "user")
      ? "user"
      : "admin";
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

  const logoHref =
    isAdminCommandCenterShell || isAdminSettingsContext
      ? "/dashboard"
      : isPilotDashboard || isPilotSettingsContext
        ? "/pilot-dashboard"
        : isUserDashboard ||
            isUserSettingsContext ||
            (isSettingsPage &&
              settingsFrom !== "admin" &&
              settingsFrom !== "pilot")
          ? "/user-dashboard"
          : "/";
  /** Includes `/settings` without `from` (user shell) and `?from=user`. */
  const isUserLogoutContext =
    isUserDashboard ||
    (isSettingsPage &&
      settingsFrom !== "pilot" &&
      settingsFrom !== "admin");
  const isPilotLogoutContext =
    isPilotDashboard ||
    (isSettingsPage && settingsFrom === "pilot");

  /** Sun/moon control: pilot, user, and admin app shells (+ matching settings). */
  const showDashboardShellThemeToggle =
    pilotShellLightHeader ||
    isUserDashboard ||
    isUserSettingsContext ||
    isAdminCommandCenterShell ||
    isAdminSettingsContext;

  /** Dashboard shells use theme tokens in light and dark (not marketing `dark:text-white`). */
  const appDashboardShell =
    isAdminCommandCenterShell ||
    isUserDashboard ||
    isPilotDashboard ||
    isAdminSettingsContext ||
    isUserSettingsContext ||
    isPilotSettingsContext;

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
  const [adminMarketingActive, setAdminMarketingActive] = useState(false);
  const [marketingUserMenuOpen, setMarketingUserMenuOpen] = useState(false);
  const marketingUserMenuRef = useRef<HTMLDivElement>(null);

  const hasLoggedInAppUser = appUserSession != null;
  const hasLoggedInAdmin = adminMarketingActive;
  const onMarketingAuthSurface = isHomePage || isMarketingAuthPage;
  /** Public pages always show Login + New Registration — never persisted session chips. */
  const showAnonymousMarketingHeader = onMarketingAuthSurface;
  const hideMarketingRegisterAndLogin = false;

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

  const adminProfile = buildAdminProfileForDisplay();
  const adminDisplayName =
    `${adminProfile.firstName} ${adminProfile.lastName}`.trim() || "Admin";
  const adminInitial =
    (adminDisplayName.slice(0, 1) || "?").toUpperCase();

  /** On `/`, logged-in app user: one tap opens user dashboard (disabled on anonymous marketing header). */
  const appUserMarketingHomeDirect =
    hasLoggedInAppUser && isHomePage && !showAnonymousMarketingHeader;

  const marketingUserChipClassName =
    "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border-0 bg-transparent px-1 font-normal text-slate-800 transition-colors hover:bg-slate-100/90 hover:text-[#008B8B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35 dark:text-white dark:hover:bg-white/10 dark:hover:text-white sm:px-1.5";

  useEffect(() => {
    function syncMarketingSessions() {
      const user = readStoredUserSession();
      setAppUserSession(user);
      if (typeof window === "undefined") {
        setPilotMarketingActive(false);
        setAdminMarketingActive(false);
        return;
      }
      const token = localStorage.getItem("token");
      const pilotSession =
        !user &&
        Boolean(token && jwtPayloadRole(token) === "pilot");
      setPilotMarketingActive(pilotSession);
      const adminSession = Boolean(token && jwtPayloadRole(token) === "admin");
      setAdminMarketingActive(adminSession);
    }
    syncMarketingSessions();
    if (typeof window === "undefined") return;
    window.addEventListener("storage", syncMarketingSessions);
    return () => window.removeEventListener("storage", syncMarketingSessions);
  }, [pathname]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAccountMenuOpen(false);
      setMarketingUserMenuOpen(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  function logoutMarketingAccountAndGoHome() {
    setOpen(false);
    setMarketingUserMenuOpen(false);
    setAccountMenuOpen(false);
    clearAuthSession();
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
        "fixed top-0 z-50 w-full border-b border-border bg-background text-foreground",
        (isSignupPage || isPilotRegistration) &&
          "light-header bg-white text-[#191c1d]",
        appDashboardShell && "dark:border-border dark:bg-background dark:text-foreground",
        !appDashboardShell && "dark:text-white"
      )}
    >
      <nav
        className={cn(
          "mx-auto flex max-w-[1600px] flex-nowrap items-center justify-between px-2 min-[380px]:px-3 sm:px-6 lg:px-8",
          compactAppHeader
            ? "gap-3 py-2.5 sm:py-3"
            : "gap-1 py-3 min-[380px]:gap-2 sm:gap-4 sm:py-4"
        )}
        aria-label="Primary"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-8 lg:gap-12">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            {isAdminCommandCenterShell ? (
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
              href={logoHref}
              className="inline-flex shrink-0 items-center gap-1 overflow-visible font-[family-name:var(--font-landing-headline)] text-[11px] font-bold tracking-[-0.04em] text-[#008B8B] uppercase min-[380px]:gap-1.5 min-[380px]:text-sm sm:gap-2.5 sm:text-xl xl:max-w-none"
            >
              <Image
                src="/drone-logo.png"
                alt="Hire A Drone Logo"
                width={48}
                height={48}
                className="size-8 shrink-0 min-[380px]:size-9 sm:size-12 xl:size-14"
                style={{ filter: 'brightness(0) saturate(100%) invert(36%) sepia(93%) saturate(1594%) hue-rotate(151deg) brightness(92%) contrast(89%)' }}
              />
              <span className="whitespace-nowrap">Hire A Drone</span>
            </Link>
          </div>
          {showMarketingHeaderNav ? (
            <div className="hidden items-center gap-8 xl:flex">
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

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-3 lg:gap-6">
          {showHeaderSearchBar ? (
            <div className="hidden min-w-0 items-center rounded-full border border-border bg-card py-2 pl-3 pr-2 dark:border-white/20 dark:bg-white/5 xl:flex">
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
          <div className="flex items-center gap-1 sm:gap-4">
            {!isSettingsPage ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "size-8 shrink-0 text-slate-700 min-[380px]:size-9 xl:hidden",
                  appDashboardShell
                    ? "dark:text-white dark:hover:bg-white/10"
                    : "dark:text-white"
                )}
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
                landingOutlineButtonClassName,
                "inline-flex h-9 whitespace-nowrap rounded-lg px-2 text-[9px] tracking-normal min-[360px]:px-2.5 min-[380px]:px-3 min-[380px]:text-[10px] sm:px-4 sm:text-xs sm:tracking-wider",
                (hideRegisterPilotCta || hideMarketingRegisterAndLogin) &&
                  "hidden"
              )}
            >
              <span className="hidden min-[360px]:inline">New Registration</span>
              <span className="min-[360px]:hidden">Register</span>
            </Link>
            {hasLoggedInAdmin &&
            onMarketingAuthSurface &&
            !showAnonymousMarketingHeader ? (
              <Link
                href="/dashboard"
                className={cn(marketingUserChipClassName, "no-underline")}
                aria-label="Open admin dashboard"
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/15 text-xs font-semibold text-[#008B8B] dark:bg-white/15 dark:text-white"
                  aria-hidden
                >
                  {adminInitial}
                </span>
                <span className="max-w-[6rem] truncate text-sm font-medium sm:max-w-[10rem]">
                  {adminDisplayName}
                </span>
              </Link>
            ) : showHeaderLoginButton && !hideMarketingRegisterAndLogin ? (
              <Link
                href="/pilot-login"
                aria-label="Login"
                title="Login"
                className={cn(
                  landingOutlineButtonClassName,
                  "inline-flex size-8 min-w-8 translate-x-0.5 border-0 px-0 text-[#008B8B] hover:border-0 min-[380px]:size-9 min-[380px]:min-w-9 dark:text-white dark:hover:border-0 sm:translate-x-0"
                )}
              >
                <User className="size-4 shrink-0" aria-hidden />
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
            ) : hasLoggedInAppUser &&
              hideMarketingRegisterAndLogin &&
              !showAnonymousMarketingHeader ? (
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
                      <HomeIcon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
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
                      Dashboard
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
              hideMarketingRegisterAndLogin &&
              !showAnonymousMarketingHeader ? (
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
                  <AdminInboxMenu audience={adminInboxAudience} />
                ) : null}
                {showDashboardShellThemeToggle ? (
                  <PilotHeaderThemeToggle />
                ) : null}
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
                    "shrink-0 text-slate-500 hover:text-[#008B8B] focus-visible:ring-2 focus-visible:ring-[#008B8B]/35",
                    appDashboardShell
                      ? "dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                      : "dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
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
                      <>
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
                        <Link
                          href={isUserLogoutContext ? "/user-dashboard" : isPilotLogoutContext ? "/pilot-dashboard" : "/dashboard"}
                          role="menuitem"
                          className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <LayoutDashboard
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          Dashboard
                        </Link>
                      </>
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
                        clearAuthSession();
                        setAppUserSession(null);
                        setPilotMarketingActive(false);
                        setAdminMarketingActive(false);
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
                  "shrink-0 text-slate-500 hover:text-[#008B8B]",
                  appDashboardShell
                    ? "dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                    : "dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
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
          "max-h-[calc(100svh-4.5rem)] overflow-y-auto border-t border-border bg-background px-4 py-4 shadow-lg xl:hidden",
          open ? "block" : "hidden"
        )}
      >
        {showHeaderSearchBar ? (
          <div className="mb-3 flex min-w-0 items-center rounded-full border border-slate-200 bg-white py-2 pl-3 pr-2 dark:border-white/20 dark:bg-white/5">
            <Search
              className="mr-2 size-4 shrink-0 text-slate-500 dark:text-white/70"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Track delivery..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 focus:ring-0 dark:bg-transparent dark:text-white dark:placeholder:text-white/45"
            />
          </div>
        ) : null}
        {!isAdminCommandCenterShell ? (
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
                  <>
                    <Link
                      href="/"
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      href={isUserLogoutContext ? "/user-dashboard" : "/pilot-dashboard"}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </>
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
                    clearAuthSession();
                    setAppUserSession(null);
                    setPilotMarketingActive(false);
                    setAdminMarketingActive(false);
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
                clearAuthSession();
                setAppUserSession(null);
                setPilotMarketingActive(false);
                setAdminMarketingActive(false);
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
            aria-label="Login"
            title="Login"
            className="mt-4 flex h-11 w-full items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent text-[#008B8B] hover:border-[#006b6b] hover:bg-transparent hover:text-[#006b6b]"
            onClick={() => setOpen(false)}
          >
            <User className="size-5" aria-hidden />
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
