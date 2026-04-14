"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

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
    priceLabel: "Starts At",
    price: "$499",
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
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8f9fa] text-[#191c1d] antialiased">
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-6 pb-20 pt-4 sm:pt-5">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>
        <section className="mb-12 text-center">
          <h1
            className={cn(
              "mb-8 text-4xl font-bold tracking-tight text-[#191c1d] sm:text-5xl"
            )}
          >
            Our Services
          </h1>
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
            className="relative z-10 flex max-h-[min(85vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl"
          >
            <div className="relative h-40 w-full shrink-0 bg-slate-100 sm:h-44">
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
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/95 text-[#191c1d] shadow-md transition hover:bg-white sm:right-2.5 sm:top-2.5"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <h2
                id="service-detail-title"
                className={cn(
                  "mb-2 text-xl font-bold text-[#191c1d] sm:text-2xl"
                )}
              >
                {detailService.title}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-[#414755]">
                {detailService.description}
              </p>
              <p className="mb-4 text-sm leading-relaxed text-[#414755]">
                {detailService.details}
              </p>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#717786]">
                Highlights
              </p>
              <ul className="mb-6 space-y-2">
                {detailService.highlights.map((line) => (
                  <li
                    key={line}
                    className="flex gap-2 text-sm text-[#414755]"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#006195]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-baseline gap-2 border-t border-slate-200 pt-4">
                <span className="text-xs font-medium uppercase tracking-tighter text-[#717786]">
                  {detailService.priceLabel}
                </span>
                <span className="text-xl font-bold text-[#191c1d]">
                  {detailService.price}
                </span>
                <span className="ml-auto text-xs text-[#717786]">
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
    </div>
  );
}
