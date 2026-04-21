"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { apiUrl } from "@/lib/api-url";
import { useAdminServicesCatalog } from "@/hooks/use-admin-services-catalog";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import {
  serviceCatalogBadgeClasses,
  serviceCatalogItems,
} from "@/lib/service-catalog";
import { cn } from "@/lib/utils";

const headline = "font-[family-name:var(--font-landing-headline)]";
const body = "font-[family-name:var(--font-landing-body)]";

export type ServicesViewProps = {
  embeddedInDashboard?: boolean;
};

export function ServicesView({
  embeddedInDashboard = false,
}: ServicesViewProps = {}) {
  const adminExtras = useAdminServicesCatalog();

  // ✅ NEW: DB services state
  const [dbServices, setDbServices] = useState<any[]>([]);

  // 🔄 Fetch from backend (API returns an array of rows, or { error } on failure)
  useEffect(() => {
    fetch(apiUrl("/api/services"))
      .then(async (res) => {
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data)) {
          if (
            data &&
            typeof data === "object" &&
            "error" in data &&
            process.env.NODE_ENV === "development"
          ) {
            console.warn(
              "Services API:",
              (data as { error?: string }).error ?? res.status
            );
          }
          setDbServices([]);
          return;
        }
        setDbServices(data);
      })
      .catch((err) => {
        console.log("Error fetching services:", err);
        setDbServices([]);
      });
  }, []);

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

            {/* HEADER */}
            <div className="mb-8 max-w-3xl text-left sm:mb-10 lg:max-w-4xl">
              <p className={cn(
                headline,
                "text-[11px] font-bold uppercase tracking-[0.35em] text-[#008B8B]"
              )}>
                What we offer
              </p>

              <h1 className={cn("mt-4", ADMIN_PAGE_TITLE_CLASS)}>Services</h1>

              <p className={cn(
                body,
                "mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base"
              )}>
                Smart drone services designed for efficiency, precision, and reliability.
              </p>
            </div>

            {/* EXISTING STATIC + ADMIN SERVICES */}
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 xl:gap-5">

              {/* STATIC SERVICES */}
              {serviceCatalogItems.map((item) => (
                <li key={item.slug}>
                  <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">

                    <Link href={`/services/${item.slug}`}>
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        width={300}
                        height={400}
                        className="rounded-xl"
                      />
                    </Link>

                    <h3 className="mt-3 font-bold">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.description}</p>

                    <Link
                      href={`/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`}
                      className="mt-3 block rounded bg-[#008B8B] p-2 text-center text-white"
                    >
                      Request
                    </Link>
                  </article>
                </li>
              ))}

              {/* ADMIN SERVICES */}
              {adminExtras.map((item) => (
                <li key={item.id}>
                  <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">

                    <Link href={`/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`}>
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        width={300}
                        height={400}
                        unoptimized
                        className="rounded-xl"
                      />
                    </Link>

                    <h3 className="mt-3 font-bold">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.description}</p>

                    <Link
                      href={`/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`}
                      className="mt-3 block rounded bg-[#008B8B] p-2 text-center text-white"
                    >
                      Request
                    </Link>
                  </article>
                </li>
              ))}

              {/* 🆕 DATABASE SERVICES (FROM POSTGRESQL) */}
              {dbServices.map((service) => (
  <li key={service.id}>
    <article className="group flex h-full flex-col rounded-2xl border border-blue-200 bg-slate-50 p-4 shadow-sm">

      {/* IMAGE */}
      {service.image && (
        <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl">
          <img
            src={service.image}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* TITLE */}
      <h3 className="font-bold text-black">{service.title}</h3>

<p className="text-sm text-black">
  {service.description}
</p>

<p className="mt-2 font-semibold text-black">
  ₹{service.price}
</p>

      <Link
        href={`/user-dashboard/create-request?reason=${encodeURIComponent(service.title)}`}
       className="mt-3 block rounded bg-[#006D6D] p-2 text-center text-white hover:bg-[#005a5a] transition"
      >
        Request
      </Link>

    </article>
  </li>
))}

            </ul>

          </div>
        </section>
      </main>
    </div>
  );
}