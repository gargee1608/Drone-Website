import Link from "next/link";
import { Globe, X } from "lucide-react";

import { cn } from "@/lib/utils";

const company = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "API Docs" },
  { href: "#", label: "Contact Support" },
] as const;

const marketingResources = [
  { href: "/marketplace", label: "Company" },
  { href: "/services", label: "Services" },
  { href: "#", label: "Support" },
  { href: "#", label: "Terms" },
] as const;

const marketingConnect = [
  { href: "https://twitter.com", label: "X / Twitter", short: "X / Twitter" },
  { href: "https://linkedin.com", label: "LinkedIn", short: "LinkedIn" },
  { href: "https://discord.com", label: "Discord", short: "Discord" },
] as const;

export type SiteFooterProps = {
  /** Sits inside a dashboard column (no global left inset for fixed sidebar). */
  variant?: "default" | "embedded" | "marketing";
  className?: string;
};

/** Slim footer — full width; `marketing` adds landing-style columns. */
export function SiteFooter({
  variant = "default",
  className,
}: SiteFooterProps) {
  const embedded = variant === "embedded";
  const marketing = variant === "marketing";

  if (marketing) {
    return (
      <footer
        className={cn(
          "relative z-20 w-full min-w-0 shrink-0 overflow-x-hidden py-10 sm:py-12",
          className
        )}
        role="contentinfo"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr] lg:gap-12 lg:px-8">
          <div className="space-y-3">
            <p className="font-heading text-lg font-bold tracking-tight text-foreground">
              AEROLAMINAR
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              Leading the autonomous revolution. Delivering the future, one
              coordinate at a time.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Resources
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {marketingResources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-teal-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Connect
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {marketingConnect.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-teal-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.short}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-border/50 px-4 pt-8 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-[11px] text-muted-foreground sm:text-left sm:text-xs">
            © {new Date().getFullYear()} Aerolaminar Drone Logistics. All rights
            reserved.
          </p>
          <div className="flex shrink-0 gap-2">
            <a
              href="https://twitter.com"
              className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-border hover:text-foreground"
              aria-label="X"
            >
              <X className="size-3.5" strokeWidth={2} />
            </a>
            <a
              href="#"
              className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-border hover:text-foreground"
              aria-label="Website"
            >
              <Globe className="size-3.5" strokeWidth={2} />
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={cn(
        "relative z-20 w-full min-w-0 shrink-0 overflow-x-hidden bg-background",
        embedded && "border-t border-border",
        !embedded &&
          "pl-[var(--admin-sidebar-footer-inset,0px)] transition-[padding-left] duration-200 ease-out",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto box-border flex w-full min-w-0 max-w-[1200px] flex-col items-center justify-between gap-4 px-4 pt-0.5 sm:flex-row sm:gap-6 sm:px-6 sm:pt-1 md:items-center md:gap-6 md:pt-1.5 lg:gap-8 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <p className="w-full min-w-0 shrink text-center font-heading text-sm font-bold uppercase leading-snug tracking-tight text-foreground sm:w-auto sm:text-left">
          AEROLAMINAR
        </p>

        <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-1 sm:w-auto sm:gap-0.5 md:items-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Company
          </p>
          <nav aria-label="Company" className="w-full min-w-0">
            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-center sm:gap-x-3 md:gap-x-4">
              {company.map((link) => (
                <li key={link.label} className="min-w-0">
                  <a
                    href={link.href}
                    className="inline-block text-center text-[13px] font-normal leading-snug text-muted-foreground transition-colors hover:text-[#0058bc] sm:text-left"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex w-full min-w-0 shrink-0 flex-col items-center gap-1.5 sm:w-auto sm:items-end">
          <div className="flex shrink-0 gap-2">
            <a
              href="https://twitter.com"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-border hover:text-foreground"
              aria-label="X"
            >
              <X className="size-3" strokeWidth={2} />
            </a>
            <a
              href="#"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-border hover:text-foreground"
              aria-label="Website"
            >
              <Globe className="size-3" strokeWidth={2} />
            </a>
          </div>
          <p className="w-full min-w-0 max-w-[18rem] text-balance text-center text-[11px] leading-snug text-muted-foreground sm:max-w-[min(100%,20rem)] sm:text-right sm:text-xs">
            © {new Date().getFullYear()} AEROLAMINAR Logistics. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
