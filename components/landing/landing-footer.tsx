import Link from "next/link";
import { Mail, MapPin, Plane } from "lucide-react";

import { cn } from "@/lib/utils";

export type LandingFooterProps = {
  className?: string;
};

const solutions = [
  { href: "/services", label: "Mission Services" },
  { href: "/contact", label: "Enterprise Quotes" },
  { href: "/blogs", label: "Insights & Updates" },
  { href: "/pilot-registration", label: "Pilot Network" },
] as const;

const contactEmail = "info@dronehire.com";
const contactAddress =
  "7th Floor, Samanvay Silver Complex, Vadodara, Gujarat 390020";

export function LandingFooter({ className }: LandingFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative z-[60] w-full shrink-0 border-t border-slate-200 bg-white text-slate-700",
        "transition-[padding-left,padding-right] duration-200 ease-out",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2.5 text-left transition-opacity hover:opacity-90"
            >
              <Plane
                className="size-8 shrink-0 text-[#008B8B] sm:size-9"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="font-[family-name:var(--font-landing-headline)] text-lg leading-tight sm:text-xl">
                <span className="font-bold tracking-tight text-slate-900">
                  DRONE{" "}
                </span>
                <span className="font-semibold tracking-tight text-[#008B8B]">
                  HIRE
                </span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-600">
              Turning flight plans into deliveries. Smart drone logistics and
              on-demand aerial services for industry, agriculture, and beyond.
            </p>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="font-[family-name:var(--font-landing-headline)] text-[11px] font-bold tracking-[0.25em] text-[#008B8B] uppercase">
              Solutions
            </h3>
            <ul className="mt-5 flex flex-col gap-3" role="list">
              {solutions.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-600 transition-colors hover:text-[#008B8B]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-[family-name:var(--font-landing-headline)] text-[11px] font-bold tracking-[0.25em] text-[#008B8B] uppercase">
              Contact
            </h3>
            <ul className="mt-5 flex flex-col gap-4" role="list">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="group flex gap-2.5 text-sm text-slate-600 transition-colors hover:text-[#008B8B]"
                >
                  <Mail
                    className="mt-0.5 size-4 shrink-0 text-[#008B8B]"
                    aria-hidden
                  />
                  <span className="break-all">{contactEmail}</span>
                </a>
              </li>
              <li>
                <div className="flex gap-2.5 text-sm text-slate-600">
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

        <div className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-center text-xs leading-relaxed text-slate-500">
            © {year} Drone Hire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
