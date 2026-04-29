"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, LogOut, Menu, User, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { HeaderThemeModeToggle } from "@/components/nav/header-theme-mode-toggle";
import { useHasRegisteredPilot } from "@/hooks/use-has-registered-pilot";
import {
  ServiceListingMegaMenu,
  useServiceMegaMenuItems,
} from "@/components/nav/service-listing-mega-menu";
import { useAdminDashboardNav } from "@/components/dashboard/admin-dashboard-nav-context";
import { SidebarMenuGlyph } from "@/components/nav/sidebar-menu-glyph";
import { usePilotDashboardNav } from "@/components/pilot-dashboard/pilot-dashboard-nav-context";
import { useUserDashboardNav } from "@/components/user-dashboard/user-dashboard-nav-context";
import { clearStoredUserSession } from "@/lib/user-session-browser";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact Us" },
] as const;

function LoginProfileIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 overflow-hidden rounded-full bg-slate-100",
        className
      )}
      aria-hidden
    >
      <Image
        src="/login-user-icon.png"
        alt=""
        width={48}
        height={48}
        className="size-full min-h-full min-w-full object-cover object-center"
      />
    </span>
  );
}

export type SiteHeaderProps = {
  /** Primary CTA label (desktop + mobile). */
  ctaLabel?: string;
  /** When set, the primary CTA is a link to this path. */
  ctaHref?: string;
  /** Show notifications bell (desktop toolbar). */
  showNotifications?: boolean;
};

const ctaButtonClassName =
  "hidden h-9 shrink-0 rounded-full bg-gradient-to-r from-[#008B8B] to-[#006b6b] px-4 text-xs font-semibold tracking-wide text-white shadow-md shadow-[#008B8B]/25 transition hover:from-[#008B8B]/90 hover:to-[#006b6b]/90 sm:inline-flex";

const headerPilotRegisterClassName =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full border-2 border-[#008B8B] bg-[#008B8B] px-4 text-xs font-semibold tracking-wide text-white shadow-none transition hover:border-[#006b6b] hover:bg-[#006b6b] hover:text-white";

const headerRegisteredPilotClassName =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[#008B8B] bg-transparent px-3 text-xs font-semibold tracking-wide text-[#008B8B] shadow-none transition hover:bg-[#008B8B]/10 hover:text-[#006b6b]";

const mobileCtaClassName =
  "mt-4 w-full rounded-full bg-gradient-to-r from-[#008B8B] to-[#006b6b] font-semibold tracking-wide text-white shadow-md shadow-[#008B8B]/25";

const mobilePilotRegisterClassName =
  "mt-4 w-full rounded-full border-2 border-[#008B8B] bg-[#008B8B] font-semibold tracking-wide text-white shadow-none transition hover:border-[#006b6b] hover:bg-[#006b6b] hover:text-white";

const mobileRegisteredPilotClassName =
  "mt-2 w-full rounded-full border-2 border-[#008B8B] bg-transparent font-semibold tracking-wide text-[#008B8B] shadow-none transition hover:bg-[#008B8B]/10 hover:text-[#006b6b]";

export function SiteHeader({
  ctaLabel = "New Registration",
  ctaHref = "/pilot-registration",
  showNotifications = false,
}: SiteHeaderProps = {}) {
  const serviceMegaMenuItems = useServiceMegaMenuItems();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const hasRegisteredPilot = useHasRegisteredPilot();
  const {
    sidebarExpanded: userSidebarExpanded,
    setSidebarExpanded: setUserSidebarExpanded,
  } = useUserDashboardNav();
  const {
    sidebarExpanded: adminSidebarExpanded,
    setSidebarExpanded: setAdminSidebarExpanded,
  } = useAdminDashboardNav();
  const {
    sidebarExpanded: pilotSidebarExpanded,
    setSidebarExpanded: setPilotSidebarExpanded,
  } = usePilotDashboardNav();

  const isUserDashboard = pathname?.startsWith("/user-dashboard") ?? false;
  const isPilotDashboard = pathname?.startsWith("/pilot-dashboard") ?? false;
  const isAdminDashboard =
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    (pathname?.startsWith("/dashboard/") ?? false);
  const isSettingsPage = pathname?.startsWith("/settings") ?? false;

  const showUserDashboardSidebarToggle = isUserDashboard;
  const showPilotDashboardSidebarToggle = isPilotDashboard;
  const showAdminDashboardSidebarToggle = isAdminDashboard;

  const showDashboardAccountChrome = isUserDashboard || isAdminDashboard;

  const profileHref = isUserDashboard
    ? "/user-dashboard/profile"
    : "/dashboard/profile";

  const whiteHeaderChrome =
    isSettingsPage || isAdminDashboard || isUserDashboard || isPilotDashboard;

  /** Hide New Registration / Registered Pilot on admin & user dashboards only. */
  const showPilotRegistrationCtas =
    !isAdminDashboard && !isUserDashboard && !isPilotDashboard;

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [pathname]);

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

  const navLinkClass = (href: string, options?: { services?: boolean }) => {
    const active = options?.services
      ? pathname.startsWith("/services")
      : pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "site-header-marketing-link shrink-0 text-foreground transition-colors hover:text-foreground/85",
      active && "border-b-2 border-[#008B8B] pb-0.5 font-semibold text-foreground"
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        whiteHeaderChrome
          ? "border-slate-200 bg-white"
          : "border-border bg-background/95"
      )}
    >
      <div className="flex w-full min-w-0 items-center gap-2 py-3 pl-2 pr-2 sm:gap-3 sm:pl-3 sm:pr-3 lg:gap-4 lg:pl-4 lg:pr-5">
        <div className="ml-1 flex min-w-0 shrink-0 items-center gap-1.5 sm:ml-2 sm:gap-2 lg:ml-3">
          {showAdminDashboardSidebarToggle ? (
            <button
              type="button"
              className="hidden lg:inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#008B8B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35"
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
          {showUserDashboardSidebarToggle ? (
            <button
              type="button"
              className="hidden lg:inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#008B8B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35"
              onClick={() =>
                setUserSidebarExpanded(!userSidebarExpanded)
              }
              aria-label={
                userSidebarExpanded
                  ? "Collapse user dashboard sidebar"
                  : "Expand user dashboard sidebar"
              }
              aria-expanded={userSidebarExpanded}
              aria-controls="user-dashboard-sidebar"
            >
              <SidebarMenuGlyph />
            </button>
          ) : null}
          {showPilotDashboardSidebarToggle ? (
            <button
              type="button"
              className="hidden lg:inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[#4d5b7f] transition-colors hover:bg-slate-100 hover:text-[#008B8B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35"
              onClick={() =>
                setPilotSidebarExpanded(!pilotSidebarExpanded)
              }
              aria-label={
                pilotSidebarExpanded
                  ? "Collapse pilot dashboard sidebar"
                  : "Expand pilot dashboard sidebar"
              }
              aria-expanded={pilotSidebarExpanded}
              aria-controls="pilot-dashboard-sidebar"
            >
              <SidebarMenuGlyph />
            </button>
          ) : null}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1 font-heading text-base font-bold tracking-tight text-black transition-opacity hover:opacity-90 sm:text-lg lg:text-xl"
          >
            <Image
              src="/aerolaminar-logo.png"
              alt=""
              width={72}
              height={72}
              className="h-12 w-12 shrink-0 translate-y-px object-contain object-center sm:h-14 sm:w-14 sm:translate-y-0.5 lg:h-16 lg:w-16"
              priority
              aria-hidden
            />
            <span className="leading-tight">Drone Hire</span>
          </Link>
        </div>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 md:gap-4 md:pl-2 lg:pl-4">
          {showNotifications ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </Button>
              <HeaderThemeModeToggle />
            </div>
          ) : null}
          <nav
            className={cn(
              "site-header-primary-nav hidden min-w-0 items-center gap-3 text-sm font-medium text-[#191c1d] md:flex",
              "lg:gap-5"
            )}
            aria-label="Main navigation"
          >
            {nav.map((item) =>
              item.href === "/services" ? (
                <ServiceListingMegaMenu
                  key={item.href}
                  triggerClassName={navLinkClass("/services", { services: true })}
                />
              ) : item.href.startsWith("/") ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(item.href)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="shrink-0 transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {showPilotRegistrationCtas && ctaHref ? (
              ctaHref === "/pilot-registration" ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href={ctaHref}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      headerPilotRegisterClassName
                    )}
                  >
                    {ctaLabel}
                  </Link>
                  {hasRegisteredPilot ? (
                    <Link
                      href="/pilot-profile"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        headerRegisteredPilotClassName
                      )}
                    >
                      Registered Pilot
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Link
                  href={ctaHref}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    ctaButtonClassName
                  )}
                >
                  {ctaLabel}
                </Link>
              )
            ) : showPilotRegistrationCtas && !ctaHref ? (
              <Button className={ctaButtonClassName}>{ctaLabel}</Button>
            ) : null}
          </div>
          {/* Account menu (dashboards); settings live in sidebars */}
          <div className="flex shrink-0 items-center gap-0.5 border-l border-border/50 pl-2 sm:gap-1 sm:pl-3 md:pl-4">
            {showDashboardAccountChrome ? (
              <div className="relative shrink-0" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "inline-flex shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#008B8B]/35"
                  )}
                >
                  <LoginProfileIcon className="size-10 sm:size-11" />
                </button>
                {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-[60] mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
                  >
                    <Link
                      href={profileHref}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#191c1d] transition-colors hover:bg-slate-50"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <User className="size-4 shrink-0 text-slate-600" aria-hidden />
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[#191c1d] transition-colors hover:bg-slate-50"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        try {
                          localStorage.removeItem("token");
                          if (isUserDashboard) {
                            localStorage.removeItem("pilot");
                            clearStoredUserSession();
                          }
                        } catch {
                          /* ignore */
                        }
                        router.replace(
                          isUserDashboard
                            ? "/pilot-login?panel=user"
                            : "/login"
                        );
                      }}
                    >
                      <LogOut className="size-4 shrink-0 text-slate-600" aria-hidden />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                aria-label="Login"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "inline-flex shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground"
                )}
              >
                <LoginProfileIcon className="size-10 sm:size-11" />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 shrink-0 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-t px-3 py-4 sm:px-4 md:hidden",
          whiteHeaderChrome
            ? "border-slate-200/80 bg-white"
            : "border-border/60 bg-background/95",
          open ? "block" : "hidden"
        )}
      >
        <nav
          className="site-header-primary-nav flex flex-col gap-3 text-sm font-medium text-[#191c1d]"
          aria-label="Main navigation"
        >
          {nav.map((item) =>
            item.href === "/services" ? (
              <div key={item.href} className="flex flex-col gap-1">
                <Link
                  href="/services"
                  className={cn(
                    navLinkClass("/services", { services: true }),
                    "rounded-lg px-2 py-2 transition-colors hover:bg-muted hover:text-[#191c1d]"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
                <div className="ml-2 overflow-hidden rounded-xl border border-border/80 bg-card text-sm shadow-md">
                  <div className="divide-y divide-border/60">
                    {serviceMegaMenuItems.map(({ href, title, description }) => (
                      <Link
                        key={href}
                        href={href}
                        className="block px-3 py-3 transition-colors first:pt-2.5 hover:bg-muted"
                        onClick={() => setOpen(false)}
                      >
                        <div className="text-sm font-medium text-foreground">
                          {title}
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {description}
                        </p>
                      </Link>
                    ))}
                    <div className="flex justify-end border-t border-border/60 bg-muted/20 py-2 pl-2 pr-3">
                      <Link
                        href="/services"
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "inline-flex w-auto shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#008B8B] to-[#006b6b] px-4 text-sm text-white"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        View all services
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : item.href.startsWith("/") ? (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  navLinkClass(item.href),
                  "rounded-lg px-2 py-2 transition-colors hover:bg-muted hover:text-[#191c1d]"
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="site-header-marketing-link rounded-lg px-2 py-2 text-[#191c1d] transition-colors hover:bg-muted hover:text-[#191c1d]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
          {showDashboardAccountChrome ? (
            <div className="flex flex-col gap-1 border-t border-border/60 pt-3">
              <Link
                href={profileHref}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#191c1d] transition-colors hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <User className="size-4 shrink-0 text-slate-600" aria-hidden />
                Profile
              </Link>
              <button
                type="button"
                className="inline-flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-[#191c1d] transition-colors hover:bg-muted"
                onClick={() => {
                  setOpen(false);
                  try {
                    localStorage.removeItem("token");
                    if (isUserDashboard) {
                      localStorage.removeItem("pilot");
                      clearStoredUserSession();
                    }
                  } catch {
                    /* ignore */
                  }
                  router.replace(
                    isUserDashboard
                      ? "/pilot-login?panel=user"
                      : "/login"
                  );
                }}
              >
                <LogOut className="size-4 shrink-0 text-slate-600" aria-hidden />
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Login"
              className="inline-flex w-fit items-center justify-center rounded-lg px-2 py-2 transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <LoginProfileIcon className="size-10 sm:size-11" />
            </Link>
          )}
        </nav>
        {showPilotRegistrationCtas && ctaHref ? (
          ctaHref === "/pilot-registration" ? (
            <div className="flex flex-col">
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  mobilePilotRegisterClassName,
                  "inline-flex h-11 items-center justify-center"
                )}
                onClick={() => setOpen(false)}
              >
                {ctaLabel}
              </Link>
              {hasRegisteredPilot ? (
                <Link
                  href="/pilot-profile"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    mobileRegisteredPilotClassName,
                    "inline-flex h-11 items-center justify-center"
                  )}
                  onClick={() => setOpen(false)}
                >
                  Registered Pilot
                </Link>
              ) : null}
            </div>
          ) : (
            <Link
              href={ctaHref}
              className={cn(
                buttonVariants({ variant: "default" }),
                mobileCtaClassName,
                "inline-flex items-center justify-center"
              )}
              onClick={() => setOpen(false)}
            >
              {ctaLabel}
            </Link>
          )
        ) : showPilotRegistrationCtas && !ctaHref ? (
          <Button
            className={mobileCtaClassName}
            onClick={() => setOpen(false)}
          >
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
