"use client";

import Image from "next/image";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import {
  ArrowLeft,
  CheckCircle2,
  Search,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { appendUserRequest } from "@/lib/user-requests";
import { cn } from "@/lib/utils";

function payloadKgFromSpecs(payloadLabel: string): string {
  const m = payloadLabel.replace(/,/g, "").match(/([\d.]+)/);
  return m ? m[1] : "0";
}

const headline = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const drones = [
  {
    id: "vulture",
    name: "Vulture-X Heavy",
    rateLabel: "$128.00/hr",
    price: "$12,499",
    description:
      "Designed for industrial payload transit in high-altitude environments.",
    payload: "120 KG",
    range: "450 KM",
    rating: "4.9",
    ops: "(128 Ops)",
    stock: "in-stock" as const,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3Fgm-88LsBGghlvOQ_R4kedFctC3MMJMrOyQzSkH2zi0UZn4_TMxTX0lLF6rtqF8ohPh-KYlAYTea5Y7azIbGN-fHlW_koF69AvSKSo2r9D2DYEohBYe5KcxFay6RjAKk8PiYlpoEPtIDeul_kfEOWaLauWoFtKK8qCOebE3y39hPSMW0zFdGKcSxtBFK9jY6vvlypo3fH0ePAso-8tb52lrVsezDH2Hb9NbSkV3NuKi1xiMg--D9tvgZQshOKA8ugTGzNFbzHS10",
  },
  {
    id: "neon",
    name: "Neon-Sprint 4",
    rateLabel: "$42.00/hr",
    price: "$4,200",
    description:
      "Optimized for rapid urban courier tasks and emergency medical delivery.",
    payload: "15 KG",
    range: "85 KM",
    rating: "4.7",
    ops: "(542 Ops)",
    stock: "in-stock" as const,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCz3EBNMlFpbSiF3zExzhnKKaJcUIXHTaF-I6oyZEikQnEEP8qeN2R1spgaQP2AqIxo0gvwC5x-7pnbuycg1dz_XM43QKh0bB2Ajx59ozgCo-ywmWZ1HiFRl6s7BgpM3I_LJewTxqV51VLwMTDLf7jCH2sp_On8aTgmXu7UDhAVNDZFGxTcA5-SZrlQN-aiW1gftiTNKmchs33tznBn7ANGM0CfhZ_efRTZimXvu9pe8g8drxHSVbin_dodAMg51dSYJF1_6F4Kq809",
  },
  {
    id: "sentinel",
    name: "Sentinel VTOL",
    rateLabel: "$95.00/hr",
    price: "$18,900",
    description:
      "Advanced surveillance and topographical mapping with hybrid endurance.",
    payload: "45 KG",
    range: "1,200 KM",
    rating: "5.0",
    ops: "(34 Ops)",
    stock: "backorder" as const,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuApO_1DorAuz3ygPlA_jM9vUuX_-GTbVbzINnmb3JgNGQlIKh-LvpvQJboZkcJHsVG0s6YhBS_v0tubH-PUroWogpkl-st1GbIl3ijRc2ltv7k-0b8da9Az_CgckzwPxsKSLR_tNTgqDdgMoAlN3k2z0mAoxNvvX9RvZHjYY7cTkCM4cJ8JycYUEIVUYu-PoXMA4HAtW9A_abyAdr8NWd2VDjjGkfWZ1_93Hc0HhXb0TpbfByLL1NDtpmgi5gaMW6J4yIMYblFQ2BU3",
  },
] as const;

type DroneItem = (typeof drones)[number];

export function MarketplaceView() {
  const [heroSearch, setHeroSearch] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const [detailModal, setDetailModal] = useState<{
    item: DroneItem;
    inquirySuccess: boolean;
  } | null>(null);

  const closeModal = useCallback(() => setDetailModal(null), []);

  const addProductToInquiry = useCallback((item: DroneItem) => {
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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <div className="shrink-0 pl-3 pt-2 sm:pl-4 sm:pt-4 lg:pl-5">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back to home
        </Link>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6 lg:px-8 sm:pb-20">
        <div className="mb-8">
          <section className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h1 className="shrink-0 font-heading text-2xl font-bold tracking-tight text-[#191c1d] sm:text-3xl">
                Marketplace
              </h1>
              <div className="relative w-full sm:max-w-xl md:max-w-2xl">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#0058bc] sm:left-3 sm:size-4"
                aria-hidden
              />
              <input
                type="search"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search by model, capability, or payload..."
                className="w-full rounded-full border-0 bg-slate-100 py-2 pl-9 pr-3 text-[11px] leading-tight text-[#191c1d] placeholder:text-[#717786] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0058bc]/30 sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-xs"
                aria-label="Search marketplace"
              />
              </div>
            </div>
          </section>

          {/* Product grid */}
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3"
          >
            {drones.map((drone) => (
              <article
                key={drone.id}
                className="glass-card-marketplace group flex flex-col overflow-hidden rounded-[2rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative h-56 shrink-0">
                  <Image
                    src={drone.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className={cn(
                      "absolute left-4 top-4 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                      drone.stock === "in-stock"
                        ? "bg-[#d8e2ff] text-[#001a41]"
                        : "bg-amber-100 text-amber-900"
                    )}
                  >
                    <CheckCircle2 className="size-3 shrink-0" aria-hidden />
                    {drone.stock === "in-stock" ? "Available" : "On request"}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3
                      className={cn(
                        "text-xl font-bold text-[#191c1d]",
                        headline.className
                      )}
                    >
                      {drone.name}
                    </h3>
                    <span className="shrink-0 font-semibold text-[#0058bc]">
                      {drone.rateLabel}
                    </span>
                  </div>
                  <p className="mb-6 text-sm font-medium text-[#414755]">
                    {drone.description}
                  </p>
                  <div className="mb-8 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-[#f3f4f5] p-3">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#505e83]">
                        Payload
                      </span>
                      <span className="font-bold text-[#191c1d]">
                        {drone.payload}
                      </span>
                    </div>
                    <div className="rounded-xl bg-[#f3f4f5] p-3">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#505e83]">
                        Range
                      </span>
                      <span className="font-bold text-[#191c1d]">
                        {drone.range}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDetailModal({ item: drone, inquirySuccess: false })
                    }
                    className="mt-auto w-full rounded-full bg-gradient-to-r from-[#0058bc] to-[#0070eb] py-3 text-sm font-bold text-white shadow-lg shadow-[#0058bc]/20 transition-all hover:opacity-90 active:scale-[0.99]"
                  >
                    Select drone
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      {detailModal ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
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
              <div
                className={cn(
                  "absolute right-4 top-4 rounded-full border px-3 py-1 shadow-sm backdrop-blur-md",
                  detailModal.item.stock === "in-stock"
                    ? "border-slate-100 bg-white/90"
                    : "border-amber-100 bg-amber-50/90"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    detailModal.item.stock === "in-stock"
                      ? "text-blue-700"
                      : "text-amber-800"
                  )}
                >
                  {detailModal.item.stock === "in-stock"
                    ? "Available"
                    : "On request"}
                </span>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-8">
              <h2
                id="marketplace-detail-title"
                className={cn(
                  "pr-10 text-xl font-bold tracking-tight text-slate-900",
                  headline.className
                )}
              >
                {detailModal.item.name}
              </h2>
              <p className="mt-2 font-mono text-lg font-bold text-[#0058bc]">
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
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Payload
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {detailModal.item.payload}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Range
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {detailModal.item.range}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2 border-t border-slate-200 pt-4">
                  <Star
                    className="size-4 fill-[#0058bc] text-[#0058bc]"
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
                    className="rounded-lg bg-[#0058bc] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#004493]"
                    onClick={() => addProductToInquiry(detailModal.item)}
                  >
                    Add to inquiry
                  </Button>
                  <Button type="button" variant="outline" onClick={closeModal}>
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
