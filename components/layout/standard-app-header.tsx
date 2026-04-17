"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

import { ServiceListingMegaMenu } from "@/components/nav/service-listing-mega-menu";
import { cn } from "@/lib/utils";

export const standardAppNavLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/onboarding", label: "Onboarding Wizards" },
  { href: "/services", label: "Service Listing" },
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

export type StandardAppHeaderProps = {
  /** Highlights the matching primary nav link (e.g. `/marketplace`, `/onboarding`, `/services`). */
  activeHref?: string;
};

export function StandardAppHeader({ activeHref }: StandardAppHeaderProps) {
  const [headerSearch, setHeaderSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between gap-3 border-b border-[#e8eaef] bg-[#f8f9fa] px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-[#eceff1] md:hidden"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <X className="size-5" strokeWidth={2.25} aria-hidden />
            ) : (
              <Menu className="size-5" strokeWidth={2.25} aria-hidden />
            )}
          </button>
          <Link
            href="/"
            className="font-heading flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3.5"
          >
            <span className="relative flex size-12 shrink-0 translate-y-0.5 items-center justify-center sm:size-14">
              <Image
                src="/aerolaminar-header-logo.png"
                alt=""
                width={56}
                height={56}
                className="size-full object-contain object-center"
                priority
                aria-hidden
              />
            </span>
            <span className="truncate text-lg font-bold uppercase leading-none tracking-tight text-black sm:text-xl">
              Drone Hire
            </span>
          </Link>
          <nav
            className={cn(
              "site-header-primary-nav hidden items-center gap-6 text-sm font-medium text-[#191c1d] md:flex",
              "lg:gap-8"
            )}
            aria-label="Primary"
          >
            {standardAppNavLinks.map((item) =>
              item.href === "/services" ? (
                <ServiceListingMegaMenu
                  key={item.label}
                  triggerClassName={cn(
                    "site-header-marketing-link text-[#191c1d] hover:opacity-90",
                    activeHref === "/services" &&
                      "border-b-2 border-[#008B8B] pb-0.5 font-semibold text-[#191c1d]"
                  )}
                />
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "site-header-marketing-link",
                    item.href === activeHref
                      ? "border-b-2 border-[#008B8B] pb-0.5 font-semibold text-[#191c1d]"
                      : "text-[#191c1d] transition-colors hover:opacity-90"
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 md:gap-4 md:pl-4 lg:pl-8">
          <div className="relative w-full max-w-[min(100%,18rem)] min-w-[6.5rem] sm:max-w-[20rem] md:max-w-[22rem]">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-500 sm:left-4 sm:size-[1.15rem]"
              aria-hidden
              strokeWidth={2}
            />
            <input
              type="search"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search"
              title="Search mission ID or drone"
              aria-label="Search mission ID or drone"
              className="w-full min-w-0 rounded-full border-0 bg-[#e8eaed] py-1.5 pl-10 pr-4 text-sm leading-normal text-[#191c1d] shadow-inner shadow-slate-900/5 outline-none ring-0 transition placeholder:text-slate-500 focus:bg-[#e3e5e8] focus:ring-2 focus:ring-slate-300/60 sm:pl-11 sm:pr-5"
            />
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-[#e8eaed]"
              aria-label="Notifications"
            >
              <Bell className="size-5" strokeWidth={1.75} />
            </button>
            <Link
              href="/settings"
              className="hidden rounded-full p-2 text-slate-600 transition-colors hover:bg-[#e8eaed] sm:inline-flex"
              aria-label="Settings"
            >
              <Settings className="size-5" strokeWidth={1.75} />
            </Link>
            <Link
              href="/login"
              aria-label="Login"
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-200 text-slate-600 ring-0 transition hover:bg-slate-300/90 sm:h-10 sm:w-10"
            >
              <LoginProfileIcon className="size-full min-h-0 min-w-0 rounded-full" />
            </Link>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-16 z-50 max-h-[min(70vh,calc(100dvh-4rem))] overflow-y-auto border-b border-[#e8eaef] bg-[#f8f9fa] px-4 py-4 shadow-lg">
            <ul className="flex flex-col gap-1">
              {standardAppNavLinks.map((item) => (
                <li key={item.label}>
                  {item.href === "/services" ? (
                    <div className="py-2">
                      <ServiceListingMegaMenu
                        triggerClassName={cn(
                          "site-header-marketing-link text-[#191c1d]",
                          activeHref === "/services" &&
                            "font-semibold text-[#191c1d]"
                        )}
                      />
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "site-header-marketing-link block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#191c1d] hover:bg-[#eceff1]",
                        item.href === activeHref && "ring-1 ring-[#008B8B]/25"
                      )}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </>
  );
}
