"use client";

import Image from "next/image";
import Link from "next/link";
import { landingFontClassName } from "@/components/landing/landing-fonts";
import { useAdminServicesCatalog } from "@/hooks/use-admin-services-catalog";
import {
  serviceCatalogBadgeClasses,
  serviceCatalogItems,
} from "@/lib/service-catalog";
import { cn } from "@/lib/utils";

const headline = "font-[family-name:var(--font-landing-headline)]";
const body = "font-[family-name:var(--font-landing-body)]";

export type ServicesViewProps = {
  /** When true, omit extra top padding for use inside the admin dashboard shell. */
  embeddedInDashboard?: boolean;
};

export function ServicesView({
  embeddedInDashboard = false,
}: ServicesViewProps = {}) {
  const adminExtras = useAdminServicesCatalog();

  return (
    <div
      className={cn(
        landingFontClassName,
        "relative flex min-h-0 flex-1 flex-col text-slate-900",
        embeddedInDashboard
          ? "pt-0"
          : "marketplace-page-bg pt-22 sm:pt-24"
      )}
    >
      <main className="min-w-0 w-full flex-1 bg-white">
        <section
          id="catalog"
          className="scroll-mt-28 px-4 pb-12 pt-0 sm:px-6 sm:pb-16 lg:pb-20"
        >
          <div className="mx-auto max-w-4xl lg:max-w-6xl xl:max-w-7xl">
            <div className="mb-8 max-w-3xl text-left sm:mb-10 lg:max-w-4xl">
              <p
                className={cn(
                  headline,
                  "text-[11px] font-bold uppercase tracking-[0.35em] text-[#008B8B]"
                )}
              >
                What we offer
              </p>
              <h1
                className={cn(
                  headline,
                  "mt-4 text-[2rem] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
                )}
              >
                Services
              </h1>
              <p
                className={cn(
                  body,
                  "mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base"
                )}
              >
                Smart drone services designed for efficiency, precision, and
                reliability.
              </p>
            </div>

            <ul className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 xl:gap-5">
              {serviceCatalogItems.map((item) => (
                <li key={item.slug} className="min-w-0">
                  <article
                    className={cn(
                      "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5"
                    )}
                  >
                    <Link
                      href={`/services/${item.slug}`}
                      className="relative mx-auto block aspect-[3/4] w-[80%] max-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:w-[78%] sm:max-w-[13rem]"
                    >
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 40vw, (max-width: 1280px) 20vw, 13rem"
                      />
                      <span
                        className={cn(
                          "absolute top-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm sm:top-3 sm:right-3 sm:px-2.5 sm:text-xs",
                          headline,
                          serviceCatalogBadgeClasses(item.topBadge.variant)
                        )}
                      >
                        {item.topBadge.text}
                      </span>
                    </Link>

                    <div className="mx-auto mt-4 flex w-[78%] min-w-0 max-w-[12rem] flex-1 flex-col sm:w-[76%] sm:max-w-[13rem]">
                      <h3
                        className={cn(
                          headline,
                          "text-base font-bold leading-snug tracking-tight text-slate-900 sm:text-lg"
                        )}
                      >
                        <Link
                          href={`/services/${item.slug}`}
                          className="outline-none transition-colors hover:text-[#008B8B] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#008B8B] focus-visible:ring-offset-2"
                        >
                          {item.title}
                        </Link>
                      </h3>
                      <p
                        className={cn(
                          body,
                          "mt-2 flex-1 text-xs leading-relaxed text-slate-600 line-clamp-3 sm:text-[0.8125rem]"
                        )}
                      >
                        {item.description}
                      </p>
                      <div className="mt-4 pt-1">
                        <Link
                          href={`/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`}
                          className={cn(
                            headline,
                            "block w-full rounded-lg bg-[#008B8B] px-3 py-2.5 text-center text-[10px] font-bold tracking-wide text-white uppercase transition hover:bg-[#007a7a] sm:text-[11px]"
                          )}
                        >
                          Request
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
              {adminExtras.map((item) => {
                const requestHref = `/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`;
                return (
                  <li key={item.id} className="min-w-0">
                    <article
                      className={cn(
                        "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5"
                      )}
                    >
                      <Link
                        href={requestHref}
                        className="relative mx-auto block aspect-[3/4] w-[80%] max-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:w-[78%] sm:max-w-[13rem]"
                      >
                        <Image
                          src="/drone-hero.png"
                          alt={item.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 40vw, (max-width: 1280px) 20vw, 13rem"
                        />
                        <span
                          className={cn(
                            "absolute top-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm sm:top-3 sm:right-3 sm:px-2.5 sm:text-xs",
                            headline,
                            serviceCatalogBadgeClasses("light")
                          )}
                        >
                          {item.priceLabel}
                        </span>
                      </Link>

                      <div className="mx-auto mt-4 flex w-[78%] min-w-0 max-w-[12rem] flex-1 flex-col sm:w-[76%] sm:max-w-[13rem]">
                        <h3
                          className={cn(
                            headline,
                            "text-base font-bold leading-snug tracking-tight text-slate-900 sm:text-lg"
                          )}
                        >
                          <Link
                            href={requestHref}
                            className="outline-none transition-colors hover:text-[#008B8B] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#008B8B] focus-visible:ring-offset-2"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p
                          className={cn(
                            body,
                            "mt-2 flex-1 text-xs leading-relaxed text-slate-600 line-clamp-3 sm:text-[0.8125rem]"
                          )}
                        >
                          {item.description}
                        </p>
                        <div className="mt-4 pt-1">
                          <Link
                            href={requestHref}
                            className={cn(
                              headline,
                              "block w-full rounded-lg bg-[#008B8B] px-3 py-2.5 text-center text-[10px] font-bold tracking-wide text-white uppercase transition hover:bg-[#007a7a] sm:text-[11px]"
                            )}
                          >
                            Request
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
