"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const rangeOptions = ["0 - 50", "50 - 200", "200 - 500", "500+"] as const;

const drones = [
  {
    id: "vulture",
    name: "Vulture-X Heavy",
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
  const [payloadKg, setPayloadKg] = useState(250);
  const [heavyLift, setHeavyLift] = useState(true);
  const [vtol, setVtol] = useState(false);
  const [urban, setUrban] = useState(false);
  const [rangeKey, setRangeKey] =
    useState<(typeof rangeOptions)[number]>("50 - 200");
  const [detailModal, setDetailModal] = useState<{
    item: DroneItem;
  } | null>(null);

  const closeModal = useCallback(() => setDetailModal(null), []);

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
    <div className="telemetry-grid flex min-h-0 flex-1 flex-col bg-[#F8FAFC] text-[#0F172A]">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8">
        <header className="mb-8 border-b border-slate-200/80 pb-8 sm:mb-10 sm:pb-10">
          <Link
            href="/"
            className="mb-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Back to home
          </Link>
          <h1
            className={cn(
              "text-center text-3xl font-bold uppercase tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
            )}
          >
            Marketplace
          </h1>
        </header>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <aside className="w-full shrink-0 lg:w-72 lg:max-w-[18rem]">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04] lg:sticky lg:top-24 lg:self-start">
              <h3
                className={cn(
                  "mb-6 text-xs font-bold uppercase tracking-widest text-blue-700"
                )}
              >
                Telemetry Filters
              </h3>
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Payload Capacity (KG)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={payloadKg}
                    onChange={(e) => setPayloadKg(Number(e.target.value))}
                    aria-label="Payload capacity in kilograms"
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-[#007AFF]"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-slate-500">
                    <span>0kg</span>
                    <span>500kg</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Drone Type
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        ["Heavy Lift", heavyLift, setHeavyLift] as const,
                        ["VTOL Recon", vtol, setVtol] as const,
                        ["Urban Courier", urban, setUrban] as const,
                      ] as const
                    ).map(([label, checked, setChecked]) => (
                      <label
                        key={label}
                        className="group flex cursor-pointer items-center gap-3"
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          onClick={() => setChecked(!checked)}
                          className={cn(
                            "flex size-4 items-center justify-center rounded border transition-colors",
                            checked
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300 group-hover:border-blue-600"
                          )}
                        >
                          {checked ? (
                            <Check className="size-3 text-white" strokeWidth={3} />
                          ) : null}
                        </button>
                        <span className="text-xs font-medium text-slate-600 group-hover:text-blue-700">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Range (KM)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {rangeOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRangeKey(opt)}
                        className={cn(
                          "rounded-lg py-2 text-[10px] font-bold transition-colors",
                          rangeKey === opt
                            ? "bg-blue-600 text-white shadow-sm"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {drones.map((drone) => (
                <article
                  key={drone.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailModal({ item: drone })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailModal({ item: drone });
                    }
                  }}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.03] transition-all duration-300 hover:border-blue-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <Image
                      src={drone.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      className={cn(
                        "absolute right-4 top-4 rounded-full border px-3 py-1 shadow-sm backdrop-blur-md",
                        drone.stock === "in-stock"
                          ? "border-slate-100 bg-white/90"
                          : "border-red-100 bg-red-50/90"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          drone.stock === "in-stock"
                            ? "text-blue-700"
                            : "text-red-600"
                        )}
                      >
                        {drone.stock === "in-stock" ? "In Stock" : "Backorder"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "text-lg font-bold tracking-tight text-slate-900 uppercase"
                        )}
                      >
                        {drone.name}
                      </h3>
                      <span className="shrink-0 font-mono text-sm font-bold text-blue-600">
                        {drone.price}
                      </span>
                    </div>
                    <p className="mb-6 text-xs text-slate-500">{drone.description}</p>
                    <div className="mb-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          Payload
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {drone.payload}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          Range
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {drone.range}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star
                          className="size-4 fill-blue-600 text-blue-600"
                          aria-hidden
                        />
                        <span className="text-xs font-bold text-slate-900">
                          {drone.rating}
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">
                          {drone.ops}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg bg-slate-50 p-2 text-slate-600 transition-all hover:bg-blue-600 hover:text-white"
                        aria-label="Add to cart"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <ShoppingCart className="size-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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

            <>
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
                        : "border-red-100 bg-red-50/90"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        detailModal.item.stock === "in-stock"
                          ? "text-blue-700"
                          : "text-red-600"
                      )}
                    >
                      {detailModal.item.stock === "in-stock"
                        ? "In Stock"
                        : "Backorder"}
                    </span>
                  </div>
                </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-8">
                  <h2
                    id="marketplace-detail-title"
                    className={cn(
                      "pr-10 text-xl font-bold uppercase tracking-tight text-slate-900"
                    )}
                  >
                    {detailModal.item.name}
                  </h2>
                  <p className="mt-2 font-mono text-lg font-bold text-blue-600">
                    {detailModal.item.price}
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
                        className="size-4 fill-blue-600 text-blue-600"
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
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      className={cn(
                        "rounded-lg bg-blue-700 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-600"
                      )}
                      onClick={closeModal}
                    >
                      Add to inquiry
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeModal}
                    >
                      Close
                    </Button>
                  </div>
              </div>
            </>
          </div>
        </div>
      ) : null}
    </div>
  );
}
