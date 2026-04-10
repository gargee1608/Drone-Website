"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Header } from "@/components/landing/header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const services = [
  {
    id: "delivery",
    title: "Delivery Services",
    description:
      "Last-mile logistics and medical supply transport for urban and remote areas.",
    details:
      "Our delivery network combines autonomous routing with human oversight for regulated corridors. We coordinate scheduling, chain-of-custody for sensitive cargo, and proof-of-delivery documentation suitable for audits.",
    highlights: [
      "Live GPS tracking and ETA updates",
      "Temperature-controlled options for medical cargo",
      "Urban and remote landing zones",
    ] as const,
    tags: "E-commerce, Medical",
    priceLabel: "Starts At",
    price: "$15/delivery",
    badge: "Recommended" as const,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0b-H9QMbhTcjEGiYxHYnLvGU8JNeWcEcnL81k5wW3f3J-A6xLgoxBcJHl7uLvxV1sfc9XIRpZuNWfxVnXjCoGnGRGhx9rM5zxVMylPshzrETXbQhtuibiaoXLAj3xk4tcOELpejU1CZpx0Hw97u366tgdv3Ckqu7FI99PUVrSg8OHAmRLUDY8uIZleJ1xEBdvkuzxnHMqV7ZgMcs9ga1rGVDCqi0s_33gCoJt1h3PS1gFfIPVO7W4TzEMJjhGabfKUv3A9_CJEmLB",
    alt: "Delivery Drone",
  },
  {
    id: "surveillance",
    title: "Surveillance & Monitoring",
    description:
      "Real-time aerial oversight and security with advanced thermal imaging capabilities.",
    details:
      "Deploy scheduled or on-demand flights with encrypted video downlink and alert rules. Ideal for perimeter monitoring, construction progress, and asset protection without ground crew in hazardous areas.",
    highlights: [
      "Thermal and RGB payloads",
      "Event-based alerts and recording retention",
      "Repeatable flight paths for comparisons",
    ] as const,
    tags: "Estate security, Construction",
    priceLabel: "Starts At",
    price: "$45/hour",
    badge: "Popular" as const,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCanBsSw9-eQI691lB1AOfek_N7Fh_MjbpiwZRCG7cEotI7alO6qc1xdtFIVPkOEa1GNGNnc0AG1Kl0Efp0ueOMaDGy8i4lw67xAvFUtjsEfAEgjFpfaDTbxE1pYYy7roChw_k2Wo4xg5M6xOnM1ypmUHPFlQwCZ3_7YH373uGQoMs9gR0W7jN7UBsjrtn-pSYkVYIRhzSo4Qr1j_Lsxrrm1ILpdkzTs9ZR_CznfyoDGjqC6aZKUnAaiPsMAmBkNvbLIny8GX-WZNja",
    alt: "Surveillance Drone",
  },
  {
    id: "emergency",
    title: "Emergency Logistics",
    description:
      "Rapid response for critical situations, including search and rescue support.",
    details:
      "Priority dispatch integrates with incident command workflows. We prioritize airspace clearance, weather checks, and payload swaps (medical, comms relay, imaging) for time-critical missions.",
    highlights: [
      "24/7 standby coordination",
      "SAR and disaster-response playbooks",
      "Custom quote for multi-day deployments",
    ] as const,
    tags: "Search & rescue, Disaster relief",
    priceLabel: "Pricing",
    price: "Custom Quote",
    badge: null,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBSWCM4cEtwdoXkkGe27sqZ4pT_pVQ719L-gb6AsbS8nGX_j5SdQ49naZ2PS-9vFHGmK2wWgFmLugsc_UVG8E0cmfOwptbSGgAh5VIO0l2pE-gSsVt-NZ3BZIqF7rHz9K_R7Bv-n63tNRNlw5kvKNUrhOmuUqxEJFYJk3jFF5C0HBFYmystP2r2MxamGcjS8NAR7fxoY9JyPqAcBiIRHJDAmvgRFesSiD4WYQO-HV2OG2WLtj1ueKjz71s16PD2t6g2hN32QMB6KwYc",
    alt: "Emergency Drone",
  },
  {
    id: "infrastructure",
    title: "Infrastructure Inspection",
    description:
      "High-resolution industrial asset analysis for preventive maintenance cycles.",
    details:
      "Capture repeatable imagery and point-cloud–ready data for turbines, transmission lines, bridges, and solar fields. Reports highlight anomalies and trend wear over time to support maintenance planning.",
    highlights: [
      "High-res zoom and thermal options",
      "GIS-friendly exports",
      "Per-site or subscription pricing",
    ] as const,
    tags: "Wind turbines, Power lines",
    priceLabel: "Starts At",
    price: "$85/site",
    badge: null,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTiVHZ7V_T50i7dGPz-bejwXaBN8w7CZwJSe3tVXeuOSIDecYdffjJzucz2tLVykkBN8Lk5uS7iGGkooeI086fEICxMYpjYwxZlFDvroSmlDB-U3YNBPCMXaIMGbYiZSf6x1-_g_g_Qmzt_omhXTsX0HvQ5u8PNsXoPjCeJ1pmeRARDsZX4SRQm2Gl6sVKT_MezyFxasJRBZUoWnY2SZfWLo0cxXPbdtATPjOibQcLgrqUqc0Dfc4HvpXnfh8nspuc8Me3Xw6fTfeY",
    alt: "Inspection Drone",
  },
] as const;

const enterpriseImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBr4Prar4XG8lD4Ylkh54V0yEzkyEE-fULYX6UT33cL-0AZyDuHEjuBfzst1viKXg7Qibb0ZUYD5bVwqM0akeWh5amvODBYjtx04fz3oPP30iqlWVW4TPFhV6N9r_EwfFAAmWS3zxCPBR9_ZxjbxlKAH_UuBJbXSk8qxrV3I8W_qQsY4uB6LuOvR_llVyLsJdWm0ojkUFO3sjKCXbRE0kVpoD0MjOl7xkkO-7W6z-7mWbcL7-VzEIC24b-1OgVUvxOVn0TrB6mIM8Xs";

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      className="text-slate-500 transition-all duration-300 hover:scale-110 hover:text-[#0058bc]"
    >
      {children}
    </a>
  );
}

export function ServicesView() {
  const [detailService, setDetailService] = useState<
    (typeof services)[number] | null
  >(null);

  useEffect(() => {
    if (!detailService) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailService(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [detailService]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] antialiased">
      <Header />

      <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-4 sm:pt-5">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>
        <section className="mb-12">
          <div className="mb-8 max-w-3xl">
            <h1
              className={cn(
                "mb-2 text-4xl font-bold tracking-tight text-[#191c1d] sm:text-5xl"
              )}
            >
              Our Services
            </h1>
            <p className="text-lg text-[#414755]">
              Explore specialized drone-powered solutions designed for the next
              generation of logistics and aerial intelligence.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((card) => (
            <article
              key={card.id}
              id={card.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetailService(card)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDetailService(card);
                }
              }}
              className="glass-card group relative scroll-mt-28 flex cursor-pointer flex-col rounded-2xl border border-white/40 p-6 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058bc]"
            >
              {card.badge ? (
                <div className="absolute right-4 top-4 z-10">
                  <span className="rounded-full bg-[#d8e2ff] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#001a41]">
                    {card.badge}
                  </span>
                </div>
              ) : null}
              <div className="relative mb-6 h-40 w-full overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <h3
                className={cn(
                  "mb-3 text-xl font-bold text-[#191c1d]"
                )}
              >
                {card.title}
              </h3>
              <p className="mb-6 flex-grow text-sm leading-relaxed text-[#414755]">
                {card.description}
              </p>
              <div className="mb-8 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[#006195]" />
                  <span className="text-xs font-medium text-[#414755]">
                    {card.tags}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium uppercase tracking-tighter text-[#717786]">
                    {card.priceLabel}
                  </span>
                  <span className="text-lg font-bold text-[#191c1d]">
                    {card.price}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-full rounded-xl bg-gradient-to-br from-[#0058bc] to-[#0070eb] py-4 text-sm font-bold tracking-tight text-white transition-all group-hover:shadow-lg group-hover:shadow-[#0058bc]/30"
                )}
              >
                Request Service
              </button>
            </article>
          ))}
        </div>

        <div className="relative mt-24 flex min-h-[280px] flex-col overflow-hidden rounded-3xl p-8 sm:aspect-[21/9] sm:min-h-0 sm:items-center sm:p-12">
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0058bc] to-[#006195] opacity-90" />
          <div
            className="absolute inset-0 z-[1] opacity-20"
            style={{
              backgroundImage:
                "url(https://www.transparenttextures.com/patterns/cubes.png)",
            }}
          />
          <div className="relative z-10 max-w-2xl text-white sm:pr-[45%]">
            <span
              className={cn(
                "mb-4 block text-xs font-bold uppercase tracking-[0.3em] opacity-80"
              )}
            >
              Fleet Operations
            </span>
            <h2
              className={cn(
                "mb-6 text-3xl font-bold sm:text-4xl"
              )}
            >
              Need a custom enterprise fleet?
            </h2>
            <p className="mb-8 text-lg leading-relaxed opacity-90">
              Our logistics specialists can design a dedicated aerial corridor for
              your recurring supply chain needs.
            </p>
            <button
              type="button"
              className={cn(
                "rounded-full bg-white px-8 py-3 text-sm font-bold text-[#0058bc] transition-all hover:bg-opacity-90"
              )}
            >
              Schedule Consultation
            </button>
          </div>
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-1/2 overflow-hidden opacity-30 sm:block">
            <Image
              src={enterpriseImage}
              alt=""
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className="relative mt-8 h-44 w-full shrink-0 overflow-hidden rounded-xl opacity-30 sm:hidden">
            <Image
              src={enterpriseImage}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      </main>

      {detailService ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/60 backdrop-blur-[2px]"
            aria-label="Close service details"
            onClick={() => setDetailService(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-detail-title"
            className="relative z-10 flex max-h-[min(85vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="relative h-40 w-full shrink-0 bg-slate-100 dark:bg-slate-800 sm:h-44">
              <div className="absolute inset-2.5 sm:inset-3">
                <div className="relative h-full w-full">
                  <Image
                    src={detailService.image}
                    alt={detailService.alt}
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 640px) 100vw, 28rem"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailService(null)}
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/95 text-[#191c1d] shadow-md transition hover:bg-white dark:bg-slate-900/95 dark:text-white sm:right-2.5 sm:top-2.5"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <h2
                id="service-detail-title"
                className={cn(
                  "mb-2 text-xl font-bold text-[#191c1d] dark:text-white sm:text-2xl"
                )}
              >
                {detailService.title}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-[#414755] dark:text-slate-300">
                {detailService.description}
              </p>
              <p className="mb-4 text-sm leading-relaxed text-[#414755] dark:text-slate-300">
                {detailService.details}
              </p>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#717786] dark:text-slate-400">
                Highlights
              </p>
              <ul className="mb-6 space-y-2">
                {detailService.highlights.map((line) => (
                  <li
                    key={line}
                    className="flex gap-2 text-sm text-[#414755] dark:text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#006195]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-baseline gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                <span className="text-xs font-medium uppercase tracking-tighter text-[#717786] dark:text-slate-400">
                  {detailService.priceLabel}
                </span>
                <span className="text-xl font-bold text-[#191c1d] dark:text-white">
                  {detailService.price}
                </span>
                <span className="ml-auto text-xs text-[#717786] dark:text-slate-400">
                  {detailService.tags}
                </span>
              </div>
              <Button
                type="button"
                className={cn(
                  "mt-5 w-full rounded-lg bg-gradient-to-br from-[#0058bc] to-[#0070eb] py-2.5 text-sm font-bold tracking-tight text-white"
                )}
                onClick={() => setDetailService(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="w-full border-t border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 md:grid-cols-2">
          <div>
            <span
              className={cn(
                "mb-4 block text-base font-bold text-slate-900 dark:text-white"
              )}
            >
              AEROLAMINAR
            </span>
            <p className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Precision aerial logistics for the modern enterprise. Scale your
              operations with the world&apos;s most advanced drone network.
            </p>
          </div>
          <div className="flex flex-col gap-6 md:items-end">
            <div className="flex flex-wrap gap-6 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <a
                href="#"
                className="whitespace-nowrap underline transition-all hover:text-slate-900 dark:hover:text-white"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="whitespace-nowrap underline transition-all hover:text-slate-900 dark:hover:text-white"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="whitespace-nowrap underline transition-all hover:text-slate-900 dark:hover:text-white"
              >
                Contact Support
              </a>
              <a
                href="#"
                className="whitespace-nowrap underline transition-all hover:text-slate-900 dark:hover:text-white"
              >
                Fleet Registry
              </a>
            </div>
            <div className="mb-2 flex gap-5 md:justify-end">
              <SocialIcon href="#" label="Instagram">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="LinkedIn">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="X (Twitter)">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="Facebook">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </SocialIcon>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600">
              © 2024 AEROLAMINAR Logistics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
