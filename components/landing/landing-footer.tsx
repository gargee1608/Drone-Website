import Image from "next/image";
import Link from "next/link";
import { Link2, Mail, MapPin, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type LandingFooterProps = {
  className?: string;
  /** Rich marketing layout for the home page only. */
  variant?: "default" | "home";
  /** When true, footer is transparent and sits behind modal overlays. */
  overlaySuppressed?: boolean;
};

const footerOverlaySuppressedClass =
  "pointer-events-none z-30 border-transparent bg-transparent bg-none from-transparent via-transparent to-transparent shadow-none transition-[background-color,border-color] duration-200";

const solutions = [
  { href: "/services", label: "Mission Services" },
  { href: "/contact", label: "Enterprise Quotes" },
  { href: "/blogs", label: "Insights & Updates" },
  { href: "/pilot-registration", label: "Pilot Network" },
] as const;

const companyLinks = [
  { href: "/matching-hub", label: "Find a Pilot" },
  { href: "/login", label: "Client Login" },
  { href: "/pilot-login", label: "Pilot Login" },
  { href: "/signup", label: "Create Account" },
] as const;

const socialLinks = [
  { href: "https://twitter.com", label: "X / Twitter", Icon: X },
  { href: "https://linkedin.com", label: "LinkedIn", Icon: Link2 },
] as const;

const contactEmail = "info@dronehire.com";
const contactAddress =
  "7th Floor, Samanvay Silver Complex, Vadodara, Gujarat 390020";

const headlineClass =
  "font-[family-name:var(--font-landing-headline)] text-[11px] font-bold tracking-[0.25em] text-[#008B8B] uppercase";

const linkClass =
  "text-sm text-slate-600 transition-colors hover:text-[#008B8B]";

function FooterSocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2 pt-1", className)}>
      {socialLinks.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-[#008B8B]/15 bg-white text-slate-600 shadow-sm transition-colors hover:border-[#008B8B]/30 hover:bg-[#008B8B] hover:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </a>
      ))}
    </div>
  );
}

function BrandBlock() {
  return (
    <>
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2.5 text-left transition-opacity hover:opacity-90"
      >
        <Image
          src="/drone-logo.png"
          alt=""
          width={36}
          height={36}
          className="size-8 shrink-0 object-contain sm:size-9"
          style={{
            filter:
              "brightness(0) saturate(100%) invert(36%) sepia(93%) saturate(1594%) hue-rotate(151deg) brightness(92%) contrast(89%)",
          }}
          aria-hidden
        />
        <span className="font-[family-name:var(--font-landing-headline)] text-lg leading-tight sm:text-xl">
          <span className="font-bold tracking-tight text-foreground">HIRE </span>
          <span className="font-semibold tracking-tight text-[#008B8B]">
            A DRONE
          </span>
        </span>
      </Link>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        Turning flight plans into deliveries. Smart drone logistics and on-demand
        aerial services for industry, agriculture, and beyond.
      </p>
    </>
  );
}

function HomeFooter({
  className,
  overlaySuppressed = false,
}: {
  className?: string;
  overlaySuppressed?: boolean;
}) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative z-[60] w-full shrink-0 overflow-hidden",
        "bg-gradient-to-b from-white via-[#f5fbfb] to-[#eef8f8]",
        "transition-[padding-left,padding-right] duration-200 ease-out",
        overlaySuppressed && footerOverlaySuppressedClass,
        className
      )}
      role="contentinfo"
    >
      <div
        className={cn(
          "pointer-events-none absolute -left-32 top-8 size-80 rounded-full bg-[#008B8B]/10 blur-3xl",
          overlaySuppressed && "opacity-0"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute -right-24 bottom-20 size-96 rounded-full bg-[#0D9488]/10 blur-3xl",
          overlaySuppressed && "opacity-0"
        )}
        aria-hidden
      />

      <div
        className={cn(
          "landing-section-rule h-px w-full",
          overlaySuppressed && "opacity-0"
        )}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-5">
            <BrandBlock />
            <FooterSocialLinks className="justify-start" />
          </div>

          <nav className="lg:col-span-2" aria-label="Solutions">
            <h3 className={headlineClass}>Solutions</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {solutions.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-2" aria-label="Company">
            <h3 className={headlineClass}>Company</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h3 className={headlineClass}>Contact</h3>
            <ul className="mt-5 flex flex-col gap-4">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex gap-3 text-sm text-slate-600 transition-colors hover:text-[#008B8B]"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]">
                    <Mail className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 break-all pt-1.5">{contactEmail}</span>
                </a>
              </li>
              <li>
                <div className="flex gap-3 text-sm text-slate-600">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]">
                    <MapPin className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 pt-1 leading-relaxed">
                    {contactAddress}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div
          className={cn(
            "mt-12 border-t border-[#008B8B]/10 pt-8 lg:mt-14",
            overlaySuppressed && "border-transparent"
          )}
        >
          <p className="text-center text-xs text-slate-500">
            © {year} Hire A Drone. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function DefaultFooter({
  className,
  overlaySuppressed = false,
}: {
  className?: string;
  overlaySuppressed?: boolean;
}) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative z-[60] w-full shrink-0 border-t border-border bg-background text-muted-foreground",
        "transition-[padding-left,padding-right] duration-200 ease-out",
        overlaySuppressed && footerOverlaySuppressedClass,
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <BrandBlock />
          </div>

          <nav aria-label="Solutions">
            <h3 className={headlineClass}>Solutions</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {solutions.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[#008B8B]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className={headlineClass}>Contact</h3>
            <ul className="mt-5 flex flex-col gap-4">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="group flex gap-2.5 text-sm text-muted-foreground transition-colors hover:text-[#008B8B]"
                >
                  <Mail
                    className="mt-0.5 size-4 shrink-0 text-[#008B8B]"
                    aria-hidden
                  />
                  <span className="break-all">{contactEmail}</span>
                </a>
              </li>
              <li>
                <div className="flex gap-2.5 text-sm text-muted-foreground">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-[#008B8B]"
                    aria-hidden
                  />
                  <span className="leading-relaxed">{contactAddress}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div
          className={cn(
            "mt-12 border-t border-border pt-6",
            overlaySuppressed && "border-transparent"
          )}
        >
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            © {year} Hire A Drone. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LandingFooter({
  className,
  variant = "default",
  overlaySuppressed = false,
}: LandingFooterProps) {
  if (variant === "home") {
    return (
      <HomeFooter
        className={className}
        overlaySuppressed={overlaySuppressed}
      />
    );
  }
  return (
    <DefaultFooter
      className={className}
      overlaySuppressed={overlaySuppressed}
    />
  );
}
