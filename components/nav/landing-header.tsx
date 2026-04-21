"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Menu, Search, Settings, User, X } from "lucide-react";

import {
  ServiceListingMegaMenu,
  serviceMegaMenuItems,
} from "@/components/nav/service-listing-mega-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hideRegisterPilotCta =
    pathname === "/login" ||
    pathname === "/pilot-registration" ||
    pathname === "/blogs" ||
    pathname?.startsWith("/blogs/") ||
    pathname === "/contact";
  const hideLoginIcon = pathname === "/pilot-registration";
  const hideNotificationsAndSettings =
    pathname === "/services" ||
    (pathname?.startsWith("/services/") ?? false) ||
    pathname === "/blogs" ||
    (pathname?.startsWith("/blogs/") ?? false) ||
    pathname === "/contact";

  const linkClass = (href: string) =>
    cn(
      "transition-colors hover:text-[#008B8B]",
      (pathname === href || pathname?.startsWith(`${href}/`)) &&
        "font-semibold text-slate-900"
    );

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8 lg:gap-12">
          <Link
            href="/"
            className="font-[family-name:var(--font-landing-headline)] text-lg font-bold tracking-tighter text-[#008B8B] uppercase shrink-0"
          >
            Drone Hire
          </Link>
          <nav
            className="hidden items-center gap-6 text-sm font-medium tracking-tight text-slate-600 md:flex md:gap-8"
            aria-label="Primary"
          >
            <Link href="/" className={linkClass("/")}>
              Home
            </Link>
            <ServiceListingMegaMenu
              variant="landing"
              label="Services"
              triggerClassName={cn(
                (pathname === "/services" ||
                  pathname?.startsWith("/services/")) &&
                  "font-semibold text-slate-900"
              )}
            />
            <Link href="/blogs" className={linkClass("/blogs")}>
              Blogs
            </Link>
            <Link href="/contact" className={linkClass("/contact")}>
              Contact Us
            </Link>
          </nav>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4 sm:gap-6">
          <div className="hidden min-w-0 max-w-[12rem] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 lg:flex xl:max-w-[14rem]">
            <Search className="size-4 shrink-0 text-slate-500" aria-hidden />
            <input
              type="search"
              placeholder="Track delivery..."
              className="min-w-0 flex-1 border-0 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              aria-label="Track delivery"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/pilot-registration"
              className={cn(
                "hidden h-9 shrink-0 items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-5 text-xs font-bold tracking-wider text-[#008B8B] uppercase transition hover:border-[#006b6b] hover:text-[#006b6b] hover:bg-transparent sm:inline-flex",
                "font-[family-name:var(--font-landing-headline)]",
                hideRegisterPilotCta && "sm:hidden"
              )}
            >
              New Registration
            </Link>
            {!hideNotificationsAndSettings ? (
              <>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:text-[#008B8B]"
                  aria-label="Notifications"
                >
                  <Bell className="size-5" />
                </button>
                <Link
                  href="/settings"
                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:text-[#008B8B]"
                  aria-label="Settings"
                >
                  <Settings className="size-5" />
                </Link>
              </>
            ) : null}
            {!hideLoginIcon ? (
              <Link
                href="/login"
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:text-[#008B8B]"
                aria-label="Login"
              >
                <User className="size-5" />
              </Link>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-slate-100 bg-white px-4 py-4 md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <Link
            href="/"
            className="rounded-lg py-2"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <div className="pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Services
          </div>
          {serviceMegaMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg py-2 pl-4"
              onClick={() => setOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          <Link
            href="/services"
            className="rounded-lg py-2 text-[#008B8B] font-semibold"
            onClick={() => setOpen(false)}
          >
            View all services
          </Link>
          <Link
            href="/blogs"
            className="rounded-lg py-2"
            onClick={() => setOpen(false)}
          >
            Blogs
          </Link>
          <Link
            href="/contact"
            className="rounded-lg py-2"
            onClick={() => setOpen(false)}
          >
            Contact Us
          </Link>
          <Link
            href="/login"
            className="rounded-lg py-2"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
          {!hideRegisterPilotCta ? (
            <Link
              href="/pilot-registration"
              className="mt-2 rounded-md border-2 border-[#008B8B] bg-transparent py-3 text-center text-xs font-bold tracking-wider text-[#008B8B] uppercase hover:border-[#006b6b] hover:text-[#006b6b] hover:bg-transparent"
              onClick={() => setOpen(false)}
            >
              New Registration
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
