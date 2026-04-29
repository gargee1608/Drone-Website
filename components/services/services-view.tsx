"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { RequestServiceModalTrigger } from "@/components/services/request-service-modal-trigger";
import { apiUrl } from "@/lib/api-url";
import type { AdminService } from "@/lib/admin-services";
import { useAdminServicesCatalog } from "@/hooks/use-admin-services-catalog";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { serviceCatalogItems } from "@/lib/service-catalog";
import {
  mergeFeaturedWithLive,
  useFeaturedServiceSelection,
  writeFeaturedSelection,
  type FeaturedListedService,
} from "@/lib/services-featured-selection";
import { cn } from "@/lib/utils";

const headline = "font-[family-name:var(--font-landing-headline)]";
const body = "font-[family-name:var(--font-landing-body)]";

export type ServicesViewProps = {
  embeddedInDashboard?: boolean;
};

type ListedService = FeaturedListedService;

function stopSelectNav(e: MouseEvent | KeyboardEvent) {
  e.stopPropagation();
}

function buildListedServices(
  adminExtras: AdminService[],
  dbRows: Record<string, unknown>[]
): ListedService[] {
  const out: ListedService[] = [];
  for (const item of serviceCatalogItems) {
    out.push({ kind: "static", key: `static:${item.slug}`, item });
  }
  for (const item of adminExtras) {
    out.push({ kind: "admin", key: `admin:${item.id}`, item });
  }
  for (const row of dbRows) {
    const id = row.id;
    if (id == null) continue;
    out.push({ kind: "db", key: `db:${String(id)}`, item: row });
  }
  return out;
}

function ServiceGridCard({
  entry,
  onSelect,
}: {
  entry: ListedService;
  onSelect: (entry: ListedService) => void;
}) {
  const blockNav = (e: MouseEvent<HTMLElement>) => stopSelectNav(e);

  if (entry.kind === "static") {
    const { item } = entry;
    return (
      <li key={entry.key}>
        <article
          role="button"
          tabIndex={0}
          onClick={() => onSelect(entry)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(entry);
            }
          }}
          className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
        >
          <div onClick={blockNav} className="block">
            <Link href={`/services/${item.slug}`} className="block">
              <Image
                src={item.image}
                alt={item.imageAlt}
                width={300}
                height={400}
                className="rounded-xl"
              />
            </Link>
          </div>
          <h3 className="mt-3 font-bold">{item.title}</h3>
          <p className="whitespace-pre-line text-sm text-slate-600">
            {item.description}
          </p>
          <div onClick={blockNav} className="mt-auto pt-3">
            <RequestServiceModalTrigger
              reasonTitle={item.title}
              className="block w-full rounded-md border-2 border-[#008B8B] bg-transparent p-2 text-center text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
            />
          </div>
        </article>
      </li>
    );
  }

  if (entry.kind === "admin") {
    const { item } = entry;
    return (
      <li key={entry.key}>
        <article
          role="button"
          tabIndex={0}
          onClick={() => onSelect(entry)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(entry);
            }
          }}
          className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
        >
          <div onClick={blockNav} className="block">
            <Link
              href={`/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`}
              className="block"
            >
              <Image
                src={item.image}
                alt={item.imageAlt}
                width={300}
                height={400}
                unoptimized
                className="rounded-xl"
              />
            </Link>
          </div>
          <h3 className="mt-3 font-bold">{item.title}</h3>
          <p className="whitespace-pre-line text-sm text-slate-600">
            {item.description}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {item.priceLabel}
          </p>
          <div onClick={blockNav} className="mt-auto pt-3">
            <RequestServiceModalTrigger
              reasonTitle={item.title}
              className="block w-full rounded-md border-2 border-[#008B8B] bg-transparent p-2 text-center text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
            />
          </div>
        </article>
      </li>
    );
  }

  const service = entry.item;
  const title = String(service.title ?? "Service");
  const description = String(service.description ?? "");
  const price = service.price != null ? String(service.price) : "";
  const image = typeof service.image === "string" ? service.image : "";

  return (
    <li key={entry.key}>
      <article
        role="button"
        tabIndex={0}
        onClick={() => onSelect(entry)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(entry);
          }
        }}
        className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
      >
        {image ? (
          <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl">
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="whitespace-pre-line text-sm text-slate-600">{description}</p>
        {price ? (
          <p className="mt-2 font-semibold text-slate-900">₹{price}</p>
        ) : null}
        <div onClick={blockNav} className="mt-auto pt-3">
          <RequestServiceModalTrigger
            reasonTitle={title}
            className="block w-full rounded-md border-2 border-[#008B8B] bg-transparent p-2 text-center text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
          />
        </div>
      </article>
    </li>
  );
}

function SelectedServiceFeaturedBox({ entry }: { entry: ListedService | null }) {
  const blockNav = (e: MouseEvent<HTMLElement>) => stopSelectNav(e);

  const imageShell =
    "relative w-full max-h-[220px] overflow-hidden rounded-lg border border-slate-200 sm:max-h-[240px] sm:w-[220px] sm:max-w-[220px] md:w-[240px] md:max-w-[240px]";

  if (!entry) {
    return (
      <div
        className="mb-6 rounded-xl border-2 border-slate-300 p-3.5 sm:mb-7 sm:p-4"
        role="region"
        aria-label="Service preview"
      >
        <p
          className={cn(
            body,
            "text-sm leading-relaxed text-slate-600 sm:text-base"
          )}
        >
          Choose a service from the catalog below. It will appear here with
          <span className="font-semibold text-slate-800"> View </span>
          and
          <span className="font-semibold text-slate-800"> Request </span>
          options.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mb-6 rounded-xl border-2 border-slate-300 p-3 sm:mb-7 sm:p-3.5"
      role="region"
      aria-label="Service preview"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          {entry.kind === "static" ? (
            <>
              <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                {entry.item.title}
              </h2>
              <p
                className={cn(
                  body,
                  "mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base"
                )}
              >
                {entry.item.description}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900 sm:text-base">
                Price - {entry.item.topBadge.text}
              </p>
              <div onClick={blockNav} className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href={`/services/${entry.item.slug}`}
                  className="inline-flex items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-4 py-2 text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
                >
                  View
                </Link>
                <RequestServiceModalTrigger
                  reasonTitle={entry.item.title}
                  label="Request"
                  className="inline-flex items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-4 py-2 text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
                />
              </div>
            </>
          ) : null}

          {entry.kind === "admin" ? (
            <>
              <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                {entry.item.title}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-800 sm:text-base">
                {entry.item.priceLabel}
              </p>
              <p
                className={cn(
                  body,
                  "mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base"
                )}
              >
                {entry.item.description}
              </p>
              <div onClick={blockNav} className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href={`/user-dashboard/create-request?reason=${encodeURIComponent(entry.item.title)}`}
                  className="inline-flex items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-4 py-2 text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
                >
                  View
                </Link>
                <RequestServiceModalTrigger
                  reasonTitle={entry.item.title}
                  label="Request"
                  className="inline-flex items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-4 py-2 text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
                />
              </div>
            </>
          ) : null}

          {entry.kind === "db" ? (
            <>
              <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                {String(entry.item.title ?? "Service")}
              </h2>
              {entry.item.price != null ? (
                <p className="mt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  ₹{String(entry.item.price)}
                </p>
              ) : null}
              <p
                className={cn(
                  body,
                  "mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base"
                )}
              >
                {String(entry.item.description ?? "")}
              </p>
              <div onClick={blockNav} className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href={`/user-dashboard/create-request?reason=${encodeURIComponent(String(entry.item.title ?? "Service"))}`}
                  className="inline-flex items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-4 py-2 text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
                >
                  View
                </Link>
                <RequestServiceModalTrigger
                  reasonTitle={String(entry.item.title ?? "")}
                  label="Request"
                  className="inline-flex items-center justify-center rounded-md border-2 border-[#008B8B] bg-transparent px-4 py-2 text-sm font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/10"
                />
              </div>
            </>
          ) : null}
        </div>

        {entry.kind === "static" ? (
          <div className="shrink-0 sm:pl-1" onClick={blockNav}>
            <Link href={`/services/${entry.item.slug}`} className="block">
              <Image
                src={entry.item.image}
                alt={entry.item.imageAlt}
                width={280}
                height={320}
                className={cn(imageShell, "h-[200px] w-full object-cover sm:h-[220px]")}
              />
            </Link>
          </div>
        ) : null}

        {entry.kind === "admin" ? (
          <div className="shrink-0 sm:pl-1" onClick={blockNav}>
            <Link
              href={`/user-dashboard/create-request?reason=${encodeURIComponent(entry.item.title)}`}
              className="block"
            >
              <Image
                src={entry.item.image}
                alt={entry.item.imageAlt}
                width={280}
                height={320}
                unoptimized
                className={cn(imageShell, "h-[200px] w-full object-cover sm:h-[220px]")}
              />
            </Link>
          </div>
        ) : null}

        {entry.kind === "db" &&
        typeof entry.item.image === "string" &&
        entry.item.image ? (
          <div className={cn(imageShell, "h-[200px] shrink-0 sm:h-[220px] sm:pl-1")}>
            <img
              src={entry.item.image}
              alt={String(entry.item.title ?? "Service")}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ServicesView({
  embeddedInDashboard = false,
}: ServicesViewProps = {}) {
  const adminExtras = useAdminServicesCatalog();
  const [dbServices, setDbServices] = useState<Record<string, unknown>[]>([]);
  const persistedSelection = useFeaturedServiceSelection();

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
        setDbServices(
          data.filter(
            (row): row is Record<string, unknown> =>
              typeof row === "object" && row !== null && !Array.isArray(row)
          )
        );
      })
      .catch((err) => {
        console.log("Error fetching services:", err);
        setDbServices([]);
      });
  }, []);

  const allListed = useMemo(
    () => buildListedServices(adminExtras, dbServices),
    [adminExtras, dbServices]
  );

  const displayEntry = useMemo(
    () => mergeFeaturedWithLive(persistedSelection, allListed),
    [persistedSelection, allListed]
  );

  const gridItems = allListed;

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
            <div className="mb-2 max-w-3xl text-left sm:mb-3 lg:max-w-4xl">
              <p
                className={cn(
                  headline,
                  "text-[11px] font-bold uppercase tracking-[0.35em] text-[#008B8B]"
                )}
              >
                What we offer
              </p>

              <h1 className={cn("mt-1", ADMIN_PAGE_TITLE_CLASS)}>Services</h1>

              <p
                className={cn(
                  body,
                  "mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base"
                )}
              >
                Smart drone services designed for efficiency, precision, and
                reliability.
              </p>
            </div>

            <SelectedServiceFeaturedBox entry={displayEntry} />

            <ul className="mt-4 grid grid-cols-1 gap-5 sm:mt-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 xl:gap-5">
              {gridItems.map((entry) => (
                <ServiceGridCard
                  key={entry.key}
                  entry={entry}
                  onSelect={writeFeaturedSelection}
                />
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
