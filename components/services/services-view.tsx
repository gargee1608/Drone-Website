"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { RequestServiceModalTrigger } from "@/components/services/request-service-modal-trigger";
import { apiUrl } from "@/lib/api-url";
import type { AdminService } from "@/lib/admin-services";
import { useAdminServicesCatalog } from "@/hooks/use-admin-services-catalog";
import {
  formatRupeePrice,
  getCatalogPriceLabel,
  serviceCatalogItems,
  serviceSlugFromTitle,
} from "@/lib/service-catalog";
import {
  listedServicesExcludingFeatured,
  resolveFeaturedDisplay,
  useFeaturedServiceSelection,
  useFeaturedServiceSlug,
  writeFeaturedSelection,
  type FeaturedListedService,
} from "@/lib/services-featured-selection";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { subscribeServicesDbUpdated } from "@/lib/services-db-updated";
import { cn } from "@/lib/utils";

const headline = "font-[family-name:var(--font-landing-headline)]";
const body = "font-[family-name:var(--font-landing-body)]";

export type ServicesViewProps = {
  embeddedInDashboard?: boolean;
};

type ListedService = FeaturedListedService;

function catalogExcerpt(text: string) {
  return text.replace(/\n/g, " ").trim();
}

function stopSelectNav(e: MouseEvent | KeyboardEvent) {
  e.stopPropagation();
}

function rememberFeaturedService(entry: ListedService) {
  writeFeaturedSelection(entry);
}

function dbRowSlug(row: Record<string, unknown>): string | null {
  if (typeof row.slug === "string" && row.slug.trim()) {
    return row.slug.trim();
  }
  const title = typeof row.title === "string" ? row.title : "";
  const fromTitle = title.trim();
  if (!fromTitle) return null;
  return serviceSlugFromTitle(fromTitle);
}

function buildListedServices(
  adminExtras: AdminService[],
  dbRows: Record<string, unknown>[]
): ListedService[] {
  const out: ListedService[] = [];

  for (const row of dbRows) {
    const id = row.id;
    if (id == null) continue;
    out.push({ kind: "db", key: `db:${String(id)}`, item: row });
  }

  /** Offline fallback: show built-in catalog only when the API returned nothing. */
  if (dbRows.length === 0) {
    for (const item of serviceCatalogItems) {
      out.push({ kind: "static", key: `static:${item.slug}`, item });
    }
  }

  for (const item of adminExtras) {
    out.push({ kind: "admin", key: `admin:${item.id}`, item });
  }

  return out;
}

const serviceCardArticle =
  "group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[#c1c7cf]/30 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-[#006a6e]/5";

const serviceCardImageWrap = "relative block h-44 w-full overflow-hidden sm:h-48";

const serviceGridBtnClass =
  "flex w-full items-center justify-center rounded-md border-2 border-[#006a6e] bg-transparent px-3 py-2 text-center font-[family-name:var(--font-landing-headline)] text-[11px] font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#4ddbd9] shadow-sm transition hover:border-[#005a5d] hover:bg-[#006a6e]/10 sm:text-xs";

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
        className={serviceCardArticle}
      >
        <div onClick={blockNav} className={serviceCardImageWrap}>
          <Link
            href={`/services/${item.slug}`}
            className="block h-full w-full"
            onClick={() => rememberFeaturedService(entry)}
          >
            <Image
              src={item.image}
              alt={item.imageAlt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          </Link>
          <div className="pointer-events-none absolute left-3 top-3">
            <span className="rounded border border-[#c1c7cf]/30 bg-card px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#4ddbd9] shadow-sm backdrop-blur-md sm:px-2.5 sm:text-[10px]">
              {formatRupeePrice(item.topBadge.text)}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3
            className={cn(
              headline,
              "mb-2 text-lg font-bold leading-tight text-[#1a1c1e] dark:text-white transition-colors group-hover:text-[#006a6e] dark:group-hover:text-[#4ddbd9] sm:text-xl"
            )}
          >
            <Link
              href={`/services/${item.slug}`}
              onClick={(e) => {
                blockNav(e);
                rememberFeaturedService(entry);
              }}
            >
              {item.title}
            </Link>
          </h3>
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#41474d] dark:text-slate-300">
            {catalogExcerpt(item.description)}
          </p>
          <div
            className="mt-auto space-y-2 border-t border-[#c1c7cf]/10 pt-3"
            onClick={blockNav}
          >
            <RequestServiceModalTrigger
              reasonTitle={item.title}
              className={serviceGridBtnClass}
            />
          </div>
        </div>
      </article>
    );
  }

  if (entry.kind === "admin") {
    const { item } = entry;
    return (
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
        className={serviceCardArticle}
      >
        <div onClick={blockNav} className={serviceCardImageWrap}>
          <Link
            href={`/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`}
            className="block h-full w-full"
          >
            <Image
              src={item.image}
              alt={item.imageAlt}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          </Link>
          <div className="pointer-events-none absolute left-3 top-3">
            <span className="rounded border border-[#c1c7cf]/30 bg-card px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#4ddbd9] shadow-sm backdrop-blur-md sm:px-2.5 sm:text-[10px]">
              {formatRupeePrice(item.priceLabel)}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3
            className={cn(
              headline,
              "mb-2 text-lg font-bold leading-tight text-[#1a1c1e] dark:text-white transition-colors group-hover:text-[#006a6e] dark:group-hover:text-[#4ddbd9] sm:text-xl"
            )}
          >
            <Link
              href={`/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`}
              onClick={blockNav}
            >
              {item.title}
            </Link>
          </h3>
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#41474d] dark:text-slate-300">
            {catalogExcerpt(item.description)}
          </p>
          <div
            className="mt-auto space-y-2 border-t border-[#c1c7cf]/10 pt-3"
            onClick={blockNav}
          >
            <RequestServiceModalTrigger
              reasonTitle={item.title}
              className={serviceGridBtnClass}
            />
          </div>
        </div>
      </article>
    );
  }

  const service = entry.item;
  const title = String(service.title ?? "Service");
  const description = catalogExcerpt(String(service.description ?? ""));
  const image = typeof service.image === "string" ? service.image : "";
  const slug =
    typeof service.slug === "string" && service.slug.trim()
      ? service.slug.trim()
      : serviceSlugFromTitle(title);
  const priceLabel = getCatalogPriceLabel(
    slug,
    service.price as string | number | null | undefined
  );
  const detailHref = `/services/${slug}`;

  return (
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
      className={serviceCardArticle}
    >
      <div onClick={blockNav} className={serviceCardImageWrap}>
        {image ? (
          <Link
            href={detailHref}
            className="block h-full w-full"
            onClick={() => rememberFeaturedService(entry)}
          >
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </Link>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#edeef2] dark:bg-slate-800 text-xs font-semibold uppercase tracking-wider text-[#41474d] dark:text-slate-300">
            No image
          </div>
        )}
        {priceLabel ? (
          <div className="pointer-events-none absolute left-3 top-3">
            <span className="rounded border border-[#c1c7cf]/30 bg-card px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#4ddbd9] shadow-sm backdrop-blur-md sm:px-2.5 sm:text-[10px]">
              {priceLabel}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3
          className={cn(
            headline,
            "mb-2 text-lg font-bold leading-tight text-[#1a1c1e] dark:text-white transition-colors group-hover:text-[#006a6e] dark:group-hover:text-[#4ddbd9] sm:text-xl"
          )}
        >
          <Link
            href={detailHref}
            onClick={(e) => {
              blockNav(e);
              rememberFeaturedService(entry);
            }}
          >
            {title}
          </Link>
        </h3>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#41474d] dark:text-slate-300">
          {description}
        </p>
        <div
          className="mt-auto border-t border-[#c1c7cf]/10 pt-3"
          onClick={blockNav}
        >
          <RequestServiceModalTrigger
            reasonTitle={title}
            className={serviceGridBtnClass}
          />
        </div>
      </div>
    </article>
  );
}

const featuredBtnOutline =
  "inline-flex w-fit items-center justify-center rounded-md border-2 border-[#006a6e] bg-transparent px-5 py-2 text-center font-[family-name:var(--font-landing-headline)] text-[11px] font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#4ddbd9] transition-all hover:bg-[#006a6e]/10 active:scale-95 sm:px-6 sm:py-2.5 sm:text-xs";

const featuredBtnPrimary =
  "inline-flex w-fit items-center justify-center rounded-md border-2 border-[#006a6e] bg-transparent px-5 py-2 text-center font-[family-name:var(--font-landing-headline)] text-[11px] font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#4ddbd9] shadow-sm transition-all hover:border-[#005a5d] hover:bg-[#006a6e]/10 active:scale-95 sm:px-6 sm:py-2.5 sm:text-xs";

function FeaturedPriceRow({
  prefix = "Starting at",
  value,
}: {
  prefix?: string;
  value: string;
}) {
  const showPrefix = Boolean(prefix?.trim());
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:mb-5">
      {showPrefix ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground sm:text-[11px]">
          {prefix}
        </span>
      ) : null}
      <span
        className={cn(
          headline,
          "text-lg font-bold tabular-nums text-foreground sm:text-xl"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SelectedServiceFeaturedBox({ entry }: { entry: ListedService | null }) {
  const blockNav = (e: MouseEvent<HTMLElement>) => stopSelectNav(e);

  if (!entry) {
    return (
      <section
        className="mb-8 rounded-xl border border-[#c1c7cf]/40 bg-[#edeef2]/50 p-5 shadow-sm sm:mb-10 sm:p-6"
        role="region"
        aria-label="Service preview"
      >
        <p
          className={cn(
            body,
            "max-w-prose text-sm leading-relaxed text-foreground sm:text-base"
          )}
        >
          Choose a service from the catalog below. It will appear here in a{" "}
          <span className="font-semibold text-foreground">featured</span> layout
          with quick actions—same style as the Blogs page.
        </p>
      </section>
    );
  }

  let left: ReactNode;
  let right: ReactNode;

  if (entry.kind === "static") {
    const item = entry.item;
    left = (
      <>
        <span className="mb-2 inline-block w-fit rounded-full border border-[#006a6e]/25 bg-[#006a6e]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#006a6e] dark:text-[#4ddbd9] sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]">
          Featured service
        </span>
        <h2
          className={cn("mb-2 sm:mb-3", ADMIN_PAGE_TITLE_CLASS, "text-foreground")}
        >
          <Link
            href={`/services/${item.slug}`}
            onClick={(e) => {
              blockNav(e);
              rememberFeaturedService(entry);
            }}
            className="transition-colors hover:text-[#006a6e] dark:hover:text-[#4ddbd9]"
          >
            {item.title}
          </Link>
        </h2>
        <p
          className={cn(
            body,
            "mb-4 max-w-xl text-sm leading-relaxed text-foreground sm:mb-5 sm:text-[15px] md:max-w-2xl"
          )}
        >
          {catalogExcerpt(item.description)}
        </p>
        <FeaturedPriceRow value={formatRupeePrice(item.topBadge.text)} />
        <div onClick={blockNav} className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/services/${item.slug}`}
            className={featuredBtnOutline}
            onClick={() => rememberFeaturedService(entry)}
          >
            View details
          </Link>
          <RequestServiceModalTrigger
            reasonTitle={item.title}
            label="Request"
            className={featuredBtnPrimary}
          />
        </div>
      </>
    );
    right = (
      <Link
        href={`/services/${item.slug}`}
        className="absolute inset-0 block"
        onClick={(e) => {
          blockNav(e);
          rememberFeaturedService(entry);
        }}
      >
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          className="object-contain object-center p-3 transition-transform duration-700 group-hover:scale-[1.02] md:object-right"
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
      </Link>
    );
  } else if (entry.kind === "admin") {
    const item = entry.item;
    const href = `/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`;
    left = (
      <>
        <span className="mb-2 inline-block w-fit rounded-full border border-[#006a6e]/25 bg-[#006a6e]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#006a6e] dark:text-[#4ddbd9] sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]">
          Featured service
        </span>
        <h2
          className={cn("mb-2 sm:mb-3", ADMIN_PAGE_TITLE_CLASS, "text-foreground")}
        >
          <Link
            href={href}
            onClick={(e) => {
              blockNav(e);
              rememberFeaturedService(entry);
            }}
            className="transition-colors hover:text-[#006a6e] dark:hover:text-[#4ddbd9]"
          >
            {item.title}
          </Link>
        </h2>
        <p
          className={cn(
            body,
            "mb-4 max-w-xl text-sm leading-relaxed text-foreground sm:mb-5 sm:text-[15px] md:max-w-2xl"
          )}
        >
          {catalogExcerpt(item.description)}
        </p>
        <FeaturedPriceRow prefix="Rate" value={formatRupeePrice(item.priceLabel)} />
        <div onClick={blockNav} className="flex flex-wrap items-center gap-2.5">
          <Link
            href={href}
            className={featuredBtnOutline}
            onClick={() => rememberFeaturedService(entry)}
          >
            View details
          </Link>
          <RequestServiceModalTrigger
            reasonTitle={item.title}
            label="Request"
            className={featuredBtnPrimary}
          />
        </div>
      </>
    );
    right = (
      <Link href={href} className="absolute inset-0 block" onClick={blockNav}>
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          unoptimized
          className="object-contain object-center p-3 transition-transform duration-700 group-hover:scale-[1.02] md:object-right"
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      </Link>
    );
  } else {
    const title = String(entry.item.title ?? "Service");
    const desc = catalogExcerpt(String(entry.item.description ?? ""));
    const slug =
      typeof entry.item.slug === "string" && String(entry.item.slug).trim()
        ? String(entry.item.slug).trim()
        : serviceSlugFromTitle(title);
    const href = `/services/${slug}`;
    const featuredPriceLabel = getCatalogPriceLabel(
      slug,
      entry.item.price as string | number | null | undefined
    );
    const img =
      typeof entry.item.image === "string" ? entry.item.image.trim() : "";
    left = (
      <>
        <span className="mb-2 inline-block w-fit rounded-full border border-[#006a6e]/25 bg-[#006a6e]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#006a6e] dark:text-[#4ddbd9] sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]">
          Featured listing
        </span>
        <h2
          className={cn("mb-2 sm:mb-3", ADMIN_PAGE_TITLE_CLASS, "text-foreground")}
        >
          <Link
            href={href}
            onClick={(e) => {
              blockNav(e);
              rememberFeaturedService(entry);
            }}
            className="transition-colors hover:text-[#006a6e] dark:hover:text-[#4ddbd9]"
          >
            {title}
          </Link>
        </h2>
        <p
          className={cn(
            body,
            "mb-4 max-w-xl text-sm leading-relaxed text-foreground sm:mb-5 sm:text-[15px] md:max-w-2xl"
          )}
        >
          {desc}
        </p>
        {featuredPriceLabel ? (
          <FeaturedPriceRow
            prefix="Starting at"
            value={featuredPriceLabel}
          />
        ) : null}
        <div onClick={blockNav} className="flex flex-wrap items-center gap-2.5">
          <Link
            href={href}
            className={featuredBtnOutline}
            onClick={() => rememberFeaturedService(entry)}
          >
            View details
          </Link>
          <RequestServiceModalTrigger
            reasonTitle={title}
            label="Request"
            className={featuredBtnPrimary}
          />
        </div>
      </>
    );
    right = img ? (
      <Link href={href} className="absolute inset-0 block p-3" onClick={blockNav}>
        <img
          src={img}
          alt={title}
          className="h-full w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.02] md:object-right"
        />
      </Link>
    ) : (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-[#edeef2] dark:bg-slate-800 text-xs font-medium text-[#41474d] dark:text-slate-300 md:min-h-[220px]">
        No image
      </div>
    );
  }

  return (
    <section
      className="group relative mb-8 overflow-hidden rounded-xl border border-[#c1c7cf]/40 bg-card shadow-lg sm:mb-10"
      role="region"
      aria-label="Service preview"
    >
      <div className="flex flex-col md:flex-row md:items-stretch md:min-h-[min(260px,38vh)] lg:min-h-[300px]">
        <div className="flex w-full max-w-xl flex-col justify-center p-4 sm:p-5 md:p-6 md:w-[min(100%,24rem)] md:max-w-[46%] md:flex-shrink-0 lg:w-[min(100%,26rem)]">
          {left}
        </div>
        <div className="relative h-[min(200px,36vh)] w-full bg-card md:h-auto md:min-h-[220px] md:flex-1">
          {right}
        </div>
      </div>
    </section>
  );
}

export function ServicesView({
  embeddedInDashboard = false,
}: ServicesViewProps = {}) {
  const adminExtras = useAdminServicesCatalog();
  const [dbServices, setDbServices] = useState<Record<string, unknown>[]>([]);
  const persistedSelection = useFeaturedServiceSelection();
  const persistedSlug = useFeaturedServiceSlug();

  useEffect(() => {
    let disposed = false;

    const loadDbServices = () => {
      fetch(apiUrl("/api/services"))
        .then(async (res) => {
          const data: unknown = await res.json().catch(() => null);
          if (disposed) return;
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
          if (!disposed) {
            console.log("Error fetching services:", err);
            setDbServices([]);
          }
        });
    };

    loadDbServices();
    const unsubscribe = subscribeServicesDbUpdated(loadDbServices);
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const allListed = useMemo(
    () => buildListedServices(adminExtras, dbServices),
    [adminExtras, dbServices]
  );

  const displayEntry = useMemo(
    () =>
      resolveFeaturedDisplay(persistedSlug, persistedSelection, allListed),
    [persistedSlug, persistedSelection, allListed]
  );

  const gridItems = useMemo(
    () => listedServicesExcludingFeatured(allListed, displayEntry),
    [allListed, displayEntry]
  );

  return (
    <div
      className={cn(
        landingFontClassName,
        "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground",
        !embeddedInDashboard && "services-hud-grid",
        embeddedInDashboard ? "pt-0" : "pt-22 sm:pt-24"
      )}
    >
      {!embeddedInDashboard ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-24 h-80 w-80 rounded-full bg-[#006a6e]/12 blur-3xl dark:bg-[#4ddbd9]/10" />
          <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#008b8b]/10 blur-[100px] dark:bg-[#006a6e]/20" />
          <div className="absolute bottom-0 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-[#006a6e]/8 blur-3xl dark:bg-[#4ddbd9]/6" />
          <div className="landing-telemetry-line absolute left-0 right-0 top-[18%] opacity-30" />
        </div>
      ) : null}
      <section
        id="catalog"
        className={cn(
          "relative z-10 scroll-mt-28",
          embeddedInDashboard ? "px-4 py-5 sm:px-5" : "px-5 py-8 sm:px-6"
        )}
      >
        <div className="mx-auto max-w-6xl">
          <SelectedServiceFeaturedBox entry={displayEntry} />

          <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-7">
            {gridItems.map((entry) => (
              <ServiceGridCard
                key={entry.key}
                entry={entry}
                onSelect={rememberFeaturedService}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
