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
import { serviceCatalogItems } from "@/lib/service-catalog";
import {
  mergeFeaturedWithLive,
  useFeaturedServiceSelection,
  writeFeaturedSelection,
  type FeaturedListedService,
} from "@/lib/services-featured-selection";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
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

const serviceCardArticle =
  "group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[#c1c7cf]/30 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-[#006a6e]/5";

const serviceCardImageWrap = "relative block h-44 w-full overflow-hidden sm:h-48";

const serviceGridBtnClass =
  "flex w-full items-center justify-center rounded-md border-2 border-[#006a6e] bg-[#006a6e] px-3 py-2 text-center font-[family-name:var(--font-landing-headline)] text-[11px] font-bold uppercase tracking-widest text-white shadow-sm transition hover:border-[#005a5d] hover:bg-[#005a5d] sm:text-xs";

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
          <Link href={`/services/${item.slug}`} className="block h-full w-full">
            <Image
              src={item.image}
              alt={item.imageAlt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          </Link>
          <div className="pointer-events-none absolute left-3 top-3">
            <span className="rounded border border-[#c1c7cf]/30 bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#006a6e] shadow-sm backdrop-blur-md sm:px-2.5 sm:text-[10px]">
              {item.topBadge.text}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3
            className={cn(
              headline,
              "mb-2 text-lg font-bold leading-tight text-[#1a1c1e] transition-colors group-hover:text-[#006a6e] sm:text-xl"
            )}
          >
            <Link href={`/services/${item.slug}`} onClick={blockNav}>
              {item.title}
            </Link>
          </h3>
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#41474d]">
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
            <span className="rounded border border-[#c1c7cf]/30 bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm backdrop-blur-md sm:px-2.5 sm:text-[10px]">
              {item.priceLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3
            className={cn(
              headline,
              "mb-2 text-lg font-bold leading-tight text-[#1a1c1e] transition-colors group-hover:text-[#006a6e] sm:text-xl"
            )}
          >
            <Link
              href={`/user-dashboard/create-request?reason=${encodeURIComponent(item.title)}`}
              onClick={blockNav}
            >
              {item.title}
            </Link>
          </h3>
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#41474d]">
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
  const price = service.price != null ? String(service.price) : "";
  const image = typeof service.image === "string" ? service.image : "";

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
            href={`/user-dashboard/create-request?reason=${encodeURIComponent(title)}`}
            className="block h-full w-full"
          >
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </Link>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#edeef2] text-xs font-semibold uppercase tracking-wider text-[#41474d]">
            No image
          </div>
        )}
        {price ? (
          <div className="pointer-events-none absolute left-3 top-3">
            <span className="rounded border border-[#c1c7cf]/30 bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#006a6e] shadow-sm backdrop-blur-md sm:px-2.5 sm:text-[10px]">
              ₹{price}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3
          className={cn(
            headline,
            "mb-2 text-lg font-bold leading-tight text-[#1a1c1e] transition-colors group-hover:text-[#006a6e] sm:text-xl"
          )}
        >
          <Link
            href={`/user-dashboard/create-request?reason=${encodeURIComponent(title)}`}
            onClick={blockNav}
          >
            {title}
          </Link>
        </h3>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#41474d]">
          {description}
        </p>
        <div
          className="mt-auto space-y-2 border-t border-[#c1c7cf]/10 pt-3"
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
  "inline-flex w-fit items-center justify-center rounded-md border-2 border-[#006a6e] bg-transparent px-5 py-2 text-center font-[family-name:var(--font-landing-headline)] text-[11px] font-bold uppercase tracking-widest text-[#006a6e] transition-all hover:bg-[#006a6e]/10 active:scale-95 sm:px-6 sm:py-2.5 sm:text-xs";

const featuredBtnPrimary =
  "inline-flex w-fit items-center justify-center rounded-md border-2 border-[#006a6e] bg-[#006a6e] px-5 py-2 text-center font-[family-name:var(--font-landing-headline)] text-[11px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:border-[#005a5d] hover:bg-[#005a5d] active:scale-95 sm:px-6 sm:py-2.5 sm:text-xs";

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
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#41474d] sm:text-[11px]">
          {prefix}
        </span>
      ) : null}
      <span
        className={cn(
          headline,
          "text-lg font-bold tabular-nums text-[#1a1c1e] sm:text-xl"
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
            "max-w-prose text-sm leading-relaxed text-[#41474d] sm:text-base"
          )}
        >
          Choose a service from the catalog below. It will appear here in a{" "}
          <span className="font-semibold text-[#1a1c1e]">featured</span> layout
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
        <span className="mb-2 inline-block w-fit rounded-full border border-[#006a6e]/25 bg-[#006a6e]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#006a6e] sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]">
          Featured service
        </span>
        <h2
          className={cn("mb-2 sm:mb-3", ADMIN_PAGE_TITLE_CLASS, "text-black")}
        >
          {item.title}
        </h2>
        <p
          className={cn(
            body,
            "mb-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:mb-5 sm:text-[15px] md:max-w-2xl"
          )}
        >
          {catalogExcerpt(item.description)}
        </p>
        <FeaturedPriceRow value={item.topBadge.text} />
        <div
          onClick={blockNav}
          className="flex flex-wrap items-center gap-2.5"
        >
          <Link href={`/services/${item.slug}`} className={featuredBtnOutline}>
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
        onClick={blockNav}
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
        <span className="mb-2 inline-block w-fit rounded-full border border-[#006a6e]/25 bg-[#006a6e]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#006a6e] sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]">
          Featured service
        </span>
        <h2
          className={cn("mb-2 sm:mb-3", ADMIN_PAGE_TITLE_CLASS, "text-black")}
        >
          {item.title}
        </h2>
        <p
          className={cn(
            body,
            "mb-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:mb-5 sm:text-[15px] md:max-w-2xl"
          )}
        >
          {catalogExcerpt(item.description)}
        </p>
        <FeaturedPriceRow prefix="Rate" value={item.priceLabel} />
        <div
          onClick={blockNav}
          className="flex flex-wrap items-center gap-2.5"
        >
          <Link href={href} className={featuredBtnOutline}>
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
    const href = `/user-dashboard/create-request?reason=${encodeURIComponent(title)}`;
    const img =
      typeof entry.item.image === "string" ? entry.item.image.trim() : "";
    left = (
      <>
        <span className="mb-2 inline-block w-fit rounded-full border border-[#006a6e]/25 bg-[#006a6e]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#006a6e] sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]">
          Featured listing
        </span>
        <h2
          className={cn("mb-2 sm:mb-3", ADMIN_PAGE_TITLE_CLASS, "text-black")}
        >
          {title}
        </h2>
        <p
          className={cn(
            body,
            "mb-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:mb-5 sm:text-[15px] md:max-w-2xl"
          )}
        >
          {desc}
        </p>
        {entry.item.price != null ? (
          <FeaturedPriceRow
            prefix="Starting at"
            value={`₹${String(entry.item.price)}`}
          />
        ) : null}
        <div
          onClick={blockNav}
          className="flex flex-wrap items-center gap-2.5"
        >
          <Link href={href} className={featuredBtnOutline}>
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
      <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-[#edeef2] text-xs font-medium text-[#41474d] md:min-h-[220px]">
        No image
      </div>
    );
  }

  return (
    <section
      className="group relative mb-8 overflow-hidden rounded-xl border border-[#c1c7cf]/40 bg-white shadow-lg sm:mb-10"
      role="region"
      aria-label="Service preview"
    >
      <div className="flex flex-col md:flex-row md:items-stretch md:min-h-[min(260px,38vh)] lg:min-h-[300px]">
        <div className="flex w-full max-w-xl flex-col justify-center p-4 sm:p-5 md:p-6 md:w-[min(100%,24rem)] md:max-w-[46%] md:flex-shrink-0 lg:w-[min(100%,26rem)]">
          {left}
        </div>
        <div className="relative h-[min(200px,36vh)] w-full bg-white md:h-auto md:min-h-[220px] md:flex-1">
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
        "blogs-hud-grid relative flex min-h-0 flex-1 flex-col bg-white text-[#1a1c1e]",
        embeddedInDashboard ? "pt-0" : "pt-22 sm:pt-24"
      )}
    >
      <section
        id="catalog"
        className={cn(
          "scroll-mt-28",
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
                onSelect={writeFeaturedSelection}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
