import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { type ServiceCatalogItem } from "@/lib/service-catalog";
import { cn } from "@/lib/utils";

const headline = "font-[family-name:var(--font-landing-headline)]";
const body = "font-[family-name:var(--font-landing-body)]";

type ServiceDetailViewProps = {
  item: ServiceCatalogItem;
};

export function ServiceDetailView({ item }: ServiceDetailViewProps) {
  const requestHref = `/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`;

  return (
    <div
      className={cn(
        landingFontClassName,
        "min-h-0 flex-1 bg-white pt-22 text-slate-900 sm:pt-24"
      )}
    >
      <main className="mx-auto min-w-0 max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:max-w-6xl lg:pb-24">
        {/* Breadcrumb */}
        <nav
          className="mb-8 flex flex-wrap items-center gap-1.5 text-sm"
          aria-label="Breadcrumb"
        >
          <Link
            href="/services"
            className={cn(
              body,
              "font-medium text-[#008B8B] transition-colors hover:text-[#006b6b]"
            )}
          >
            Services
          </Link>
          <ChevronRight
            className="size-4 shrink-0 text-slate-400"
            aria-hidden
          />
          <span
            className={cn(body, "max-w-[min(100%,28rem)] truncate text-slate-600")}
          >
            {item.title}
          </span>
        </nav>

        {/* Copy left · image + indicative rate right (image first on narrow screens) */}
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] md:items-start md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,12.5rem)] lg:gap-12">
          <div className="order-2 min-w-0 md:order-1">
            <h1
              className={cn(
                headline,
                "text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl"
              )}
            >
              {item.title}
            </h1>
            <p
              className={cn(
                body,
                "mt-3 text-[0.9375rem] leading-relaxed text-slate-600 sm:text-base"
              )}
            >
              {item.description}
            </p>

            <section className="mt-8">
              <h2
                className={cn(
                  headline,
                  "text-base font-semibold text-slate-900"
                )}
              >
                Overview
              </h2>
              <div className="mt-4 space-y-4">
                {item.detailSections.map((paragraph, i) => (
                  <p
                    key={i}
                    className={cn(
                      body,
                      "text-[0.9375rem] leading-relaxed text-slate-600 sm:text-base"
                    )}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2
                className={cn(
                  headline,
                  "text-base font-semibold text-slate-900"
                )}
              >
                What you get
              </h2>
              <ul className="mt-4 space-y-3">
                {item.highlights.map((line) => (
                  <li
                    key={line}
                    className={cn(
                      body,
                      "flex gap-3 text-[0.9375rem] leading-snug text-slate-700 sm:text-base"
                    )}
                  >
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-[#008B8B]"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="order-1 mx-auto flex w-full max-w-[11rem] flex-col sm:max-w-[12rem] md:order-2 md:mx-0 md:max-w-none md:justify-self-end md:w-full">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 176px, 200px"
                  priority
                />
              </div>
            </div>

            <div className="mt-6">
              <p
                className={cn(
                  headline,
                  "text-xs font-semibold uppercase tracking-wide text-slate-500"
                )}
              >
                Indicative rate
              </p>
              <p
                className={cn(
                  headline,
                  "mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                )}
              >
                {item.topBadge.text}
              </p>
              <p className={cn(body, "mt-2 text-sm leading-relaxed text-slate-500")}>
                Final quote may vary by scope, region, and compliance.
              </p>
              <Link
                href={requestHref}
                className={cn(
                  headline,
                  "mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#008B8B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#007a7a]"
                )}
              >
                Request this service
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
