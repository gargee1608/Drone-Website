import { Globe, X } from "lucide-react";

const company = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "API Docs" },
  { href: "#", label: "Contact Support" },
] as const;

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-50 to-white py-3 sm:py-4">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-3 md:items-start md:gap-x-6 md:gap-y-0">
          <div>
            <p className="mt-8 font-heading text-xs font-bold leading-none tracking-tight text-foreground sm:mt-10 sm:text-sm">
              AEROLAMINAR
            </p>
          </div>
          <div className="min-w-0 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px] sm:tracking-widest">
              Company
            </p>
            <ul className="mt-1.5 flex flex-nowrap items-center justify-center gap-x-2 sm:gap-x-3 md:gap-x-4">
              {company.map((link) => (
                <li key={link.label} className="shrink-0">
                  <a
                    href={link.href}
                    className="whitespace-nowrap text-[10px] leading-tight text-muted-foreground transition hover:text-foreground sm:text-[11px] md:text-xs"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex justify-center gap-1.5">
              <a
                href="https://twitter.com"
                className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                aria-label="Twitter"
              >
                <X className="size-3" />
              </a>
              <a
                href="#"
                className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                aria-label="Website"
              >
                <Globe className="size-3" />
              </a>
            </div>
            <p className="text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
              © {new Date().getFullYear()} AEROLAMINAR Logistics. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
