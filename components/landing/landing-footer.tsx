import Link from "next/link";
import { Globe, Shield } from "lucide-react";

import { cn } from "@/lib/utils";

export type LandingFooterProps = {
  className?: string;
};

const resources = [
  { href: "/marketplace", label: "Company" },
  { href: "/services", label: "Services" },
  { href: "#", label: "Support" },
  { href: "#", label: "Terms" },
] as const;

const connect = [
  { href: "https://twitter.com", label: "X / Twitter" },
  { href: "https://linkedin.com", label: "LinkedIn" },
  { href: "https://discord.com", label: "Discord" },
] as const;

export function LandingFooter({ className }: LandingFooterProps) {
  return (
    <footer
      className={cn(
        "relative z-[60] w-full shrink-0 border-t border-slate-200 bg-white py-5 sm:py-6",
        "transition-[padding-left,padding-right] duration-200 ease-out",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 md:grid-cols-[minmax(220px,1.2fr)_auto_auto] md:items-start md:gap-8">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <div className="font-[family-name:var(--font-landing-headline)] text-2xl font-black tracking-tighter text-[#009aa1] uppercase">
            Drone Hire
          </div>
          <p className="max-w-[18rem] text-center text-xs leading-relaxed text-slate-500 md:text-left">
            Leading the autonomous revolution. Delivering the future, one
            coordinate at a time.
          </p>
        </div>

        <div className="grid w-full max-w-[30rem] grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:max-w-none md:gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-[0.3em] text-slate-900 uppercase">
              Resources
            </span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-500 sm:grid-cols-4">
              {resources.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="transition-colors hover:text-[#009aa1]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-[0.3em] text-slate-900 uppercase">
              Connect
            </span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-500 sm:grid-cols-3">
              {connect.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="transition-colors hover:text-[#009aa1]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2.5 md:items-end">
          <p className="text-center text-xs text-slate-500 md:text-right">
            © {new Date().getFullYear()} Drone Hire. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <span className="flex size-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-500">
              <Globe className="size-4" aria-hidden />
            </span>
            <span className="flex size-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-500">
              <Shield className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
