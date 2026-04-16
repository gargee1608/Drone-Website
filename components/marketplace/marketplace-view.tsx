"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  Rocket,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { Button } from "@/components/ui/button";
import { appendUserRequest } from "@/lib/user-requests";
import { cn } from "@/lib/utils";

function payloadKgFromSpecs(payloadLabel: string): string {
  const m = payloadLabel.replace(/,/g, "").match(/([\d.]+)/);
  return m ? m[1] : "0";
}

function parseRangeKmValue(rangeLabel: string): number {
  const m = rangeLabel.match(/([\d.]+)/);
  return m ? Number(m[1]) : 0;
}

function parsePayloadKgValue(payloadLabel: string): number {
  const m = payloadLabel.replace(/,/g, "").match(/([\d.]+)/);
  return m ? Number(m[1]) : 0;
}

export type MarketplaceDrone = {
  id: string;
  name: string;
  rateLabel: string;
  price: string;
  description: string;
  payload: string;
  range: string;
  rating: string;
  ops: string;
  stock: "in-stock" | "backorder";
  image: string;
  category: string;
  battery: string;
  fleetStatus: "active" | "in-transit";
};

const fleetDrones: MarketplaceDrone[] = [
  {
    id: "stratosphere-x1",
    name: "Stratosphere X-1",
    rateLabel: "$210.00/hr",
    price: "$45,000",
    description:
      "AI-optimized for your recent long-range routes. Features advanced turbulence compensation and high-capacity payload support with sub-meter drop accuracy.",
    payload: "40 KG",
    range: "145 KM",
    rating: "5.0",
    ops: "(Optimal match)",
    stock: "in-stock",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDvmxBVJdV_0mcCzrNTpK7oKjywuBTOazrRM671ex7e_rKUpwohQvwL56Hr7Ca47E0RNotCc2lZBc4i9PP2UiH73uySLPU1YwbwFAl4qHiTzgv0yfmc8Bn-kWAm6vt0hEJnar_QHTnte52a1v6DdhwOLge-R0Wb0YM0qGP7sajehbYmPrpTbWE_ied_WnJQMNEOEVrC5wh2St6UORZo0LtV_BA3uvJncekEwmxs6esO7ZoIAYJUjaXBGWzo-A5gmONPG75whpMIfwdj",
    category: "Long-range logistics",
    battery: "95m",
    fleetStatus: "active",
  },
  {
    id: "skyfreight-m1",
    name: "SkyFreight M-1",
    rateLabel: "$185/hr",
    price: "$8,900",
    description: "Medical logistics configuration.",
    payload: "8 KG",
    range: "80 KM",
    rating: "4.8",
    ops: "(412 Ops)",
    stock: "in-stock",
    image: "/skyfreight-m1.png",
    category: "Medical Logistics",
    battery: "120m",
    fleetStatus: "active",
  },
  {
    id: "atlas-h2",
    name: "Atlas H2",
    rateLabel: "$580/hr",
    price: "$24,500",
    description: "Industrial cargo heavy lift.",
    payload: "150 KG",
    range: "45 KM",
    rating: "4.9",
    ops: "(88 Ops)",
    stock: "in-stock",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3EL5l1w65-ciyRuYug13Tdd6dTkXUHlivcCbxIWXlipYWEH2PSjiKPV5_nOU86Nej2FWEhJ0WRf1eNd6KhLrvJ7TQT7cIeZsXoUd9o6dcTwk7o3XVsrGdaBgd-Ww_ap3pB6cMkHwo6A_yNTM1rz1QPnuHfsVYyfbU2dDaZ7qtwDaQinBnLxahKQWppfpsUtlC97ZPs4JXxAOdKeAOXaElauOR-_nndhlvh0eJJxT75RiTnRtRqpffHofgp1BxkXxPH3aQPl3h-Ygd",
    category: "Industrial Cargo",
    battery: "90m",
    fleetStatus: "active",
  },
  {
    id: "aeroscan-v3",
    name: "AeroScan V3",
    rateLabel: "$245/hr",
    price: "$12,200",
    description: "Multi-spectral ISR package.",
    payload: "2.5 KG",
    range: "110 KM",
    rating: "4.7",
    ops: "(201 Ops)",
    stock: "in-stock",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKt65Yr7Bq5PCo_A6ZZ-HheUcf_DgHcOKKshWzDvVNz-BTelwhjXhfojgluS8a2rh3VFZxT7Yr-09F5ImKAuefruuPA73kSNuECUS_hkHCQfGCUHIPpsIgcK0H4AS3rOqvKnIqNioIcb2kWF7NHvGgRx3MR3LnmzuXeEkpdsPC6dcpz5gs_FDi6UzUflj8DqycaZzpaHkiHKb04WaxH_6hCZBPJOMm-bDCVDFlvT-TG7C1A11c9wiN4am6TJ6wXtDfdl2GuV0PwK3Q",
    category: "Multi-Spectral ISR",
    battery: "140m",
    fleetStatus: "in-transit",
  },
  {
    id: "raptor-q4",
    name: "Raptor Q4",
    rateLabel: "$195/hr",
    price: "$14,800",
    description:
      "RTK-enabled surveying and topographic mapping with repeatable flight paths.",
    payload: "5 KG",
    range: "95 KM",
    rating: "4.75",
    ops: "(156 Ops)",
    stock: "in-stock",
    image: "/raptor-q4.png",
    category: "Survey & Mapping",
    battery: "110m",
    fleetStatus: "active",
  },
  {
    id: "cinema-pro-z",
    name: "Cinema Pro Z",
    rateLabel: "$320/hr",
    price: "$19,200",
    description:
      "Ultra-stable gimbal platform for cinematic aerials and broadcast capture.",
    payload: "12 KG",
    range: "65 KM",
    rating: "4.85",
    ops: "(94 Ops)",
    stock: "in-stock",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSbCVecM1NiddkCgagmNNEKH3OOJCw0ZLm82t9KXlK3r6DVTaJSY44QQ9H7IJHUKE14bEqlNmO6Hdz1RFaXyNLgrM6VonZflHHJU_t2ru-40w77raibkiTxBlz3vlu_Xla0M-QnvqGO2ZD8r4wbTr2TUJJFpGVB8Nq_vv0CIWsdwoCQwzyiQ-7FnFuGwpnZoIDvHucoUCON-KT3A_rn5Un02Kb9wAyntUSBIDhGsDNLIPQSi_KRC6AAwVrfyHGAdedit0Q1At8nJ2_",
    category: "Cinematic & Filming",
    battery: "85m",
    fleetStatus: "active",
  },
];

export function MarketplaceView() {
  const [bookmarked, setBookmarked] = useState<Set<string>>(() => new Set());
  const [spotlightId, setSpotlightId] = useState<string>(fleetDrones[0]!.id);

  const [detailModal, setDetailModal] = useState<{
    item: MarketplaceDrone;
    inquirySuccess: boolean;
  } | null>(null);

  const closeModal = useCallback(() => setDetailModal(null), []);

  const addProductToInquiry = useCallback((item: MarketplaceDrone) => {
    appendUserRequest({
      reasonOrTitle: item.name,
      pickupLocation: "",
      dropLocation: "",
      payloadWeightKg: payloadKgFromSpecs(item.payload),
      requestType: "Additional Inquire",
      requestPriority: "standard",
      requestSource: "marketplace_inquiry",
    });
    setDetailModal({ item, inquirySuccess: true });
  }, []);

  useEffect(() => {
    if (!detailModal?.inquirySuccess) return;
    const id = window.setTimeout(() => setDetailModal(null), 2200);
    return () => window.clearTimeout(id);
  }, [detailModal?.inquirySuccess]);

  useEffect(() => {
    if (!detailModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [detailModal, closeModal]);

  /** Default ordering: telemetry (rating) descending, matches former “Telemetry Performance” sort. */
  const filteredSortedFleet = useMemo(() => {
    const list = [...fleetDrones];
    list.sort((a, b) => Number(b.rating) - Number(a.rating));
    return list;
  }, []);

  const spotlightDrone = useMemo(
    () =>
      fleetDrones.find((d) => d.id === spotlightId) ?? fleetDrones[0]!,
    [spotlightId]
  );

  const spotlightRangeKm = parseRangeKmValue(spotlightDrone.range);
  const spotlightPayloadKg = parsePayloadKgValue(spotlightDrone.payload);
  const spotlightRangeBarPct = Math.min(100, (spotlightRangeKm / 150) * 100);
  const spotlightPayloadBarPct = Math.min(100, (spotlightPayloadKg / 160) * 100);

  function toggleBookmark(id: string) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className={cn(
        landingFontClassName,
        "marketplace-page-bg relative flex min-h-0 flex-1 flex-col pt-22 text-slate-900 sm:pt-24"
      )}
    >
      <main className="min-w-0 w-full flex-1 bg-white p-6 sm:p-10 lg:p-12">
          {/* Marketplace header */}
          <header className="relative mb-12 lg:mb-16">
            <div className="pointer-events-none absolute -top-12 -left-12 h-64 w-64 rounded-full bg-[#009aa1]/5 blur-[80px]" />
            <div className="relative z-10">
              <h1 className="mb-4 font-[family-name:var(--font-landing-headline)] text-4xl font-bold tracking-tighter text-slate-900 md:text-6xl lg:text-7xl">
                Marketplace
              </h1>
              <p className="max-w-xl font-[family-name:var(--font-landing-body)] text-lg text-slate-500">
                Discover, Compare &amp; Hire.
              </p>
            </div>
          </header>

          {/* Featured */}
          <section className="mb-16 lg:mb-24">
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl transition-all duration-500 hover:border-[#009aa1]/30">
              <div className="absolute inset-0 bg-gradient-to-br from-[#009aa1]/5 to-transparent opacity-50" />
              <div className="relative flex flex-col items-center gap-12 p-8 lg:flex-row lg:gap-16 lg:p-12">
                <div className="w-full lg:w-5/12">
                  <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#0d6200]/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#0d6200] uppercase">
                    <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
                    Optimal Deployment Match
                  </div>
                  <h2 className="mb-6 font-[family-name:var(--font-landing-headline)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                    {spotlightDrone.name}
                  </h2>
                  <p className="mb-10 font-[family-name:var(--font-landing-body)] text-lg leading-relaxed text-slate-600">
                    {spotlightDrone.description}
                  </p>
                  <div className="mb-12 grid grid-cols-2 gap-8">
                    <div>
                      <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                        Max Range
                      </span>
                      <span className="font-[family-name:var(--font-landing-headline)] text-3xl font-bold text-slate-900">
                        {spotlightRangeKm}{" "}
                        <span className="text-sm font-medium text-slate-400">
                          km
                        </span>
                      </span>
                      <div className="relative mt-2 h-px w-full bg-slate-100">
                        <div
                          className="absolute top-0 left-0 h-full bg-[#009aa1]/30"
                          style={{ width: `${spotlightRangeBarPct}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                        Payload
                      </span>
                      <span className="font-[family-name:var(--font-landing-headline)] text-3xl font-bold text-slate-900">
                        {spotlightPayloadKg}{" "}
                        <span className="text-sm font-medium text-slate-400">
                          kg
                        </span>
                      </span>
                      <div className="relative mt-2 h-px w-full bg-slate-100">
                        <div
                          className="absolute top-0 left-0 h-full bg-[#0d6200]/30"
                          style={{ width: `${spotlightPayloadBarPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setDetailModal({
                          item: spotlightDrone,
                          inquirySuccess: false,
                        })
                      }
                      className="bg-[#009aa1] px-10 py-4 font-[family-name:var(--font-landing-headline)] text-xs font-black tracking-widest text-white uppercase shadow-[0_10px_30px_rgba(0,154,161,0.2)] transition hover:scale-105"
                    >
                      Add to Cart 
                    </button>
                  </div>
                </div>
                <div className="relative w-full lg:w-7/12">
                  <div className="pointer-events-none absolute -inset-10 animate-pulse rounded-full bg-[#009aa1]/10 opacity-20 blur-[100px]" />
                  <div className="relative z-10 aspect-[4/3] w-full">
                    <Image
                      key={spotlightDrone.id}
                      src={spotlightDrone.image}
                      alt={spotlightDrone.name}
                      fill
                      className="object-contain object-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Fleet grid */}
          <section className="pb-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-3">
              {filteredSortedFleet.map((drone) => (
                <article
                  key={drone.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSpotlightId(drone.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSpotlightId(drone.id);
                    }
                  }}
                  aria-pressed={spotlightId === drone.id}
                  aria-label={`Select ${drone.name} for optimal deployment match`}
                  className={cn(
                    "marketplace-glass-card group cursor-pointer rounded-xl p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-xl",
                    spotlightId === drone.id &&
                      "ring-2 ring-[#009aa1] ring-offset-2 ring-offset-white"
                  )}
                >
                  <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                    <Image
                      src={drone.image}
                      alt={drone.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1.5 backdrop-blur-md">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          drone.fleetStatus === "in-transit"
                            ? "animate-pulse bg-[#009aa1]"
                            : "bg-[#0d6200]"
                        )}
                      />
                      <span className="text-[9px] font-black tracking-widest text-slate-900 uppercase">
                        {drone.fleetStatus === "in-transit"
                          ? "In-Transit"
                          : "Active"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(drone.id);
                      }}
                      className="absolute top-4 right-4 rounded-md border border-slate-200 bg-white/90 p-2 text-slate-400 backdrop-blur-md transition-colors hover:text-red-500"
                      aria-label="Bookmark"
                    >
                      <Bookmark
                        className={cn(
                          "size-4",
                          bookmarked.has(drone.id) && "fill-red-500 text-red-500"
                        )}
                      />
                    </button>
                  </div>
                  <div className="mb-6 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-[family-name:var(--font-landing-headline)] text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-[#009aa1]">
                        {drone.name}
                      </h3>
                      <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        {drone.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1">
                      <Star
                        className="size-3 fill-[#009aa1] text-[#009aa1]"
                        aria-hidden
                      />
                      <span className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold text-slate-900">
                        {drone.rating}
                      </span>
                    </div>
                  </div>
                  <div className="mb-8 grid grid-cols-3 gap-4">
                    {(
                      [
                        ["Payload", drone.payload.replace(" KG", "kg")],
                        ["Range", drone.range.replace(" KM", "km")],
                        ["Battery", drone.battery],
                      ] as const
                    ).map(([label, val]) => (
                      <div
                        key={label}
                        className="rounded-md border border-slate-100 bg-slate-50/50 py-3 text-center"
                      >
                        <span className="mb-1 block text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                          {label}
                        </span>
                        <span className="font-[family-name:var(--font-landing-headline)] text-xs font-bold">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="landing-telemetry-line mb-6" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="mb-0.5 block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                        Rate
                      </span>
                      <span className="font-[family-name:var(--font-landing-headline)] text-lg font-bold text-slate-900">
                        {drone.rateLabel.split("/")[0]}{" "}
                        <span className="text-[10px] font-normal text-slate-500">
                          /hr
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModal({ item: drone, inquirySuccess: false });
                      }}
                      className="bg-slate-900 p-3 text-white transition hover:bg-[#009aa1]"
                      aria-label="View details"
                    >
                      <ArrowUpRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

      {/* FAB */}
      <Link
        href="/user-dashboard"
        className="group fixed bottom-10 right-10 z-[100] flex size-16 items-center justify-center rounded-md border border-slate-700 bg-slate-900 shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition active:scale-95"
        aria-label="Open Command Center"
        title="Open Command Center"
      >
        <span className="pointer-events-none absolute right-[calc(100%+0.75rem)] whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 py-3 px-6 font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-[0.2em] text-white uppercase opacity-0 transition-opacity group-hover:opacity-100">
          Open Command Center
        </span>
        <Rocket className="size-8 text-white" strokeWidth={1.25} aria-hidden />
      </Link>

      {detailModal ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Close details"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-detail-title"
            className="relative z-10 flex max-h-[min(90vh,800px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3 top-3 z-20 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>

            <div className="relative h-48 w-full shrink-0 bg-slate-100">
              <Image
                src={detailModal.item.image}
                alt=""
                fill
                className="object-cover"
                sizes="512px"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-8">
              <h2
                id="marketplace-detail-title"
                className="pr-10 font-[family-name:var(--font-landing-headline)] text-xl font-bold tracking-tight text-slate-900"
              >
                {detailModal.item.name}
              </h2>
              <p className="mt-2 font-mono text-lg font-bold text-[#009aa1]">
                {detailModal.item.price}{" "}
                <span className="text-sm font-normal text-slate-500">
                  ({detailModal.item.rateLabel} indicative)
                </span>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {detailModal.item.description}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/90 p-4">
                <div>
                  <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Payload
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {detailModal.item.payload}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Range
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {detailModal.item.range}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2 border-t border-slate-200 pt-4">
                  <Star
                    className="size-4 fill-[#009aa1] text-[#009aa1]"
                    aria-hidden
                  />
                  <span className="text-sm font-bold text-slate-900">
                    {detailModal.item.rating}
                  </span>
                  <span className="text-xs text-slate-400">
                    {detailModal.item.ops}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Specifications are indicative. Final configuration subject to
                compliance and availability in your region.
              </p>
              {detailModal.inquirySuccess ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-slate-800 animate-in fade-in duration-200"
                >
                  <CheckCircle2
                    className="size-5 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  Inquire submitted to the Admin.
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg border-2 border-[#009aa1] !bg-transparent px-6 py-2.5 text-xs font-bold tracking-widest text-[#009aa1] shadow-none hover:!bg-transparent hover:text-[#007070] dark:!bg-transparent dark:hover:!bg-transparent"
                    onClick={() => addProductToInquiry(detailModal.item)}
                  >
                    Add to inquiry
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg border-2 border-slate-300 !bg-transparent px-6 py-2.5 text-xs font-bold tracking-widest text-slate-700 shadow-none hover:!bg-transparent hover:border-slate-400 hover:text-slate-900 dark:!bg-transparent dark:hover:!bg-transparent"
                    onClick={closeModal}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
