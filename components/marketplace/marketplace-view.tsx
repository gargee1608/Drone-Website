"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BriefcaseMedical,
  Check,
  CheckCircle2,
  Eye,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ServiceListingMegaMenu } from "@/components/nav/service-listing-mega-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/onboarding", label: "Onboarding Wizards" },
  { href: "/services", label: "Service Listing" },
] as const;

function LoginProfileIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700",
        className
      )}
      aria-hidden
    >
      <Image
        src="/login-user-icon.png"
        alt=""
        width={48}
        height={48}
        className="size-full min-h-full min-w-full object-cover object-center"
      />
    </span>
  );
}

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

const deliveryHeroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB3FJ1-kHMU2jNh4UzLXYgNXB0buR9eGA83Y5iIOASQU4I02VKbk0s_KHrmLQWWnJCco7hrn6izVOgQYRCemzaTIuWPHMco3VR_-w482aEUMJYnBobAs9uBnn742ggwm3qryLkxpYwaBngD9tdRO7WtDL_W5upFAhO5WOnFcNoA0AGyjKdRDXWdxZO2dvOzV8Pwc6E26OzD81yP9xQEVPDOLIRfAPkZBILgg9anA7BJGlpH4Nysb2ORUzMUBWtwQqjYGGLdTtjNJxHI";

const pilotAvatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBh3osiH2bhnHuceAy-rWIfBIOx9gLbALT-Yb9tNe_ZIv3IHRVTWZ098Xp3xj3XUHV3Y5aTplN97ki_S_7SJDPP_pm64VyncnC2__xx0TQpcj21CAhZFeNJnzHhWJQFmTG7Q9Cf61OxsIe-T0A0umVc1SICh1RK58pozoHIavACe81SKhxiBwMSjUtnv5BCgXgyv2jQczNUpL8yCPQ8EcEaLwT2YCGE7VCEilX_em8wEUpI4aa5qHdb3ZkpVFGs-8JmHxxw5QnFOKr6",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBMkLDlti68MiVqt9e9Nm5bECba5aEYupp0uOROkgaNnfrTobjsyZ_A8IP4UARC_8Zdudof02b924DR3qqwYwltgrbyvtyiEmFocNYs7YqdaY3P3JyvvWG187l4lTSWfvlgG-AB8gTtaTcU90GOU_IiO0GaFn66KPbuyS8Ooof0l7EA4XBIeS66HqgAtk56O5SydhcBNIHN_RgLBYzQzM0eiYoCPfrh_U1q3blxTD-kQVJ4IXzdsIVVzeKnPoNYiDZA-IYcxPfTaOHl",
] as const;

type DroneItem = (typeof drones)[number];

type ServiceModalId = "delivery" | "recon" | "logistics";

const serviceModalContent: Record<
  ServiceModalId,
  {
    title: string;
    summary: string;
    details: string;
    tags: string[];
    highlights: string[];
    pricing: string;
    cta: string;
    image?: string;
  }
> = {
  delivery: {
    title: "Autonomous Delivery",
    summary:
      "Fully automated last-mile logistics for e-commerce, pharma, and retail.",
    details:
      "Our autonomous delivery network integrates with national airspace management for 99.9% uptime. Routes are optimized in real time for weather, traffic, and priority tiers. Enterprise SLAs include dedicated corridors and white-glove onboarding for your fulfillment centers.",
    tags: ["Real-time Tracking", "Secure Lockers", "Zero-Emission"],
    highlights: [
      "Batch routing across multiple hubs",
      "Cold-chain options for pharma",
      "API integration with your OMS / WMS",
    ],
    pricing: "Dynamic Scale — quote based on volume & zones",
    cta: "Request Service",
    image: deliveryHeroImage,
  },
  recon: {
    title: "Aerial Recon",
    summary:
      "Asset protection, environmental monitoring, and perimeter security.",
    details:
      "AI-driven thermal imaging and computer vision classify anomalies and raise alerts in your command dashboard. Ideal for infrastructure, renewables, and large campuses. Flight plans are filed automatically where regulations allow.",
    tags: ["Thermal", "CV / AI", "Perimeter"],
    highlights: [
      "24/7 patrol cycles",
      "Thermal heat-mapping exports",
      "Instant threat alerts to SOC",
    ],
    pricing: "From project-based retainers",
    cta: "Get Quote",
  },
  logistics: {
    title: "Critical Logistics",
    summary:
      "Priority emergency response for organ transport, medical supplies, and disaster relief.",
    details:
      "Pre-cleared pilots and aircraft stand ready in major metros. Dispatch coordinates with hospitals and NGOs; encrypted chain-of-custody for sensitive payloads. Remote zones supported via relay staging.",
    tags: ["Emergency", "Medical", "Disaster"],
    highlights: [
      "Median dispatch under 12 minutes (metro)",
      "Organ transport SOPs",
      "Disaster corridor prioritization",
    ],
    pricing: "Priority tier — incident-based billing",
    cta: "Dispatch Now",
  },
};

type DetailModal =
  | { kind: "drone"; item: DroneItem }
  | { kind: "service"; id: ServiceModalId };

export function MarketplaceView() {
  const [payloadKg, setPayloadKg] = useState(250);
  const [heavyLift, setHeavyLift] = useState(true);
  const [vtol, setVtol] = useState(false);
  const [urban, setUrban] = useState(false);
  const [rangeKey, setRangeKey] =
    useState<(typeof rangeOptions)[number]>("50 - 200");
  const [detailModal, setDetailModal] = useState<DetailModal | null>(null);

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
    <div className="telemetry-grid min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex w-full min-w-0 items-center gap-2 py-3 pl-2 pr-2 sm:gap-3 sm:pl-3 sm:pr-3 lg:gap-4 lg:pl-4 lg:pr-5">
          <div className="flex min-w-0 shrink-0 items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            <Link
              href="/"
              className="ml-1 flex shrink-0 items-center gap-2.5 font-heading text-sm font-bold tracking-tight text-foreground transition-opacity hover:opacity-90 sm:ml-2 sm:text-base lg:ml-3"
            >
              <Image
                src="/aerolaminar-logo.png"
                alt=""
                width={48}
                height={48}
                className="h-9 w-9 shrink-0 translate-y-px object-contain object-center sm:h-10 sm:w-10 sm:translate-y-0.5"
                priority
                aria-hidden
              />
              <span className="leading-tight">AEROLAMINAR</span>
            </Link>
            <nav
              className={cn(
                "hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex",
                "lg:gap-8"
              )}
              aria-label="Primary"
            >
              {navLinks.map((item) =>
                item.label === "Marketplace" ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="border-b-2 border-blue-600 pb-0.5 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  >
                    {item.label}
                  </Link>
                ) : item.href === "/services" ? (
                  <ServiceListingMegaMenu
                    key={item.label}
                    triggerClassName="text-muted-foreground"
                  />
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          </div>

          <div className="relative mx-auto hidden min-w-0 flex-1 md:block md:max-w-xs lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search Smart. Fly Better"
              className="h-9 rounded-full border-border/80 bg-card pl-9 shadow-sm"
              aria-label="Search marketplace"
            />
          </div>

          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2 md:ml-0 md:flex-1 md:justify-end md:pl-2 lg:pl-4">
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </Button>
              <Link
                href="/settings"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "hidden text-muted-foreground hover:text-foreground sm:inline-flex"
                )}
                aria-label="Settings"
              >
                <Settings className="size-4" />
              </Link>
              <Button
                type="button"
                className="hidden h-9 shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-xs font-semibold tracking-wide text-white shadow-md shadow-blue-500/25 transition hover:from-blue-600/90 hover:to-indigo-600/90 sm:inline-flex"
              >
                LAUNCH MISSION
              </Button>
            </div>
            <div className="flex shrink-0 items-center gap-0 border-l border-border/50 pl-2 sm:pl-3 md:pl-4">
              <Link
                href="/login"
                aria-label="Login"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "inline-flex shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground"
                )}
              >
                <LoginProfileIcon className="size-10 sm:size-11" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-8 sm:pt-8">
        <header className="mb-10 sm:mb-12">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="flex min-w-0 flex-col">
              <Link
                href="/"
                className="mb-3 inline-flex w-fit items-center gap-2 pl-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:mb-4 sm:pl-2 -ml-4 sm:-ml-8 lg:-ml-12"
              >
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
                Back to home
              </Link>
              <div className="space-y-2 pl-0.5 sm:pl-2 lg:pl-4 -ml-5 sm:-ml-10 lg:-ml-12">
                <h1
                  className={cn(
                    "text-4xl font-bold uppercase leading-none tracking-tight text-slate-900 sm:text-5xl"
                  )}
                >
                  Marketplace
                </h1>
                <p className="max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
                  Precision logistics and autonomous aerial systems. Filter by
                  technical specifications or operational utility.
                </p>
              </div>
            </div>
            <div
              className={cn(
                "flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400"
              )}
            >
              <span>
                Active Units:{" "}
                <span className="font-bold text-blue-600">1,248</span>
              </span>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" />
              <span>
                Global Nodes:{" "}
                <span className="font-bold text-blue-600">84</span>
              </span>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
              <p className="text-xs font-semibold leading-relaxed text-blue-700">
                Enterprise custom fleet solutions available for verified logistics
                pilots.
              </p>
              <button
                type="button"
                className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 transition-transform hover:translate-x-1"
              >
                View Pilot HQ
                <ArrowRight className="size-4" />
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {drones.map((drone) => (
                <article
                  key={drone.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailModal({ kind: "drone", item: drone })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailModal({ kind: "drone", item: drone });
                    }
                  }}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:border-blue-300 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
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

            {/* Specialized Services */}
            <div className="mt-16 sm:mt-20">
              <h2
                className={cn(
                  "mb-8 text-3xl font-bold tracking-tight text-slate-900 uppercase"
                )}
              >
                Specialized Services
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div
                  className="group relative min-h-[360px] cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md md:col-span-2"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setDetailModal({ kind: "service", id: "delivery" })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailModal({ kind: "service", id: "delivery" });
                    }
                  }}
                >
                  <div className="absolute inset-0">
                    <Image
                      src={deliveryHeroImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                  <div className="relative flex h-full min-h-[360px] flex-col justify-end p-8 sm:p-10">
                    <div className="mb-4 flex items-center gap-3">
                      <Truck className="size-9 shrink-0 text-blue-700" />
                      <h3
                        className={cn(
                          "text-2xl font-bold uppercase tracking-tight text-slate-900 sm:text-3xl"
                        )}
                      >
                        Autonomous Delivery
                      </h3>
                    </div>
                    <p className="mb-6 max-w-lg text-sm text-slate-600">
                      Fully automated last-mile logistics for e-commerce, pharma,
                      and retail. Integrated with national airspace management for
                      99.9% uptime.
                    </p>
                    <div className="mb-8 flex flex-wrap gap-4">
                      {["Real-time Tracking", "Secure Lockers", "Zero-Emission"].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Pricing
                        </span>
                        <span
                          className={cn(
                            "text-xl font-bold text-blue-700"
                          )}
                        >
                          Dynamic Scale
                        </span>
                      </div>
                      <Button
                        type="button"
                        className={cn(
                          "h-auto rounded-lg bg-blue-700 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-200 hover:bg-blue-600"
                        )}
                      >
                        Request Service
                      </Button>
                    </div>
                  </div>
                </div>

                <div
                  className="flex h-full cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-400"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setDetailModal({ kind: "service", id: "recon" })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailModal({ kind: "service", id: "recon" });
                    }
                  }}
                >
                  <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-blue-50">
                    <Eye className="size-8 text-blue-700" />
                  </div>
                  <h3
                    className={cn(
                      "mb-4 text-xl font-bold uppercase tracking-tight text-slate-900"
                    )}
                  >
                    Aerial Recon
                  </h3>
                  <p className="mb-6 text-xs leading-relaxed text-slate-500">
                    Asset protection, environmental monitoring, and perimeter
                    security using AI-driven thermal imaging and computer vision.
                  </p>
                  <ul className="mb-8 flex-1 space-y-3">
                    {[
                      "24/7 Patrol Cycles",
                      "Thermal Heat-mapping",
                      "Instant Threat Alerts",
                    ].map((line) => (
                      <li
                        key={line}
                        className="flex items-center gap-3 text-xs font-medium text-slate-600"
                      >
                        <CheckCircle2 className="size-4 shrink-0 text-blue-600" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-auto w-full rounded-lg border-2 border-blue-100 py-3 text-[10px] font-bold uppercase tracking-widest text-blue-700 hover:bg-blue-50"
                    )}
                  >
                    Get Quote
                  </Button>
                </div>

                <div
                  className="flex h-full cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-400"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setDetailModal({ kind: "service", id: "logistics" })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailModal({ kind: "service", id: "logistics" });
                    }
                  }}
                >
                  <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-blue-50">
                    <BriefcaseMedical className="size-8 text-blue-700" />
                  </div>
                  <h3
                    className={cn(
                      "mb-4 text-xl font-bold uppercase tracking-tight text-slate-900"
                    )}
                  >
                    Critical Logistics
                  </h3>
                  <p className="mb-6 text-xs leading-relaxed text-slate-500">
                    Priority emergency response for organ transport, medical
                    supplies, and disaster relief support in remote zones.
                  </p>
                  <div className="mb-8 rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Response Time
                    </span>
                    <span
                      className={cn(
                        "text-2xl font-bold text-blue-700"
                      )}
                    >
                      &lt; 12 Minutes
                    </span>
                  </div>
                  <Button
                    type="button"
                    className={cn(
                      "h-auto w-full rounded-lg bg-slate-900 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-slate-800"
                    )}
                  >
                    Dispatch Now
                  </Button>
                </div>

                <div className="flex flex-col items-stretch justify-between gap-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm md:col-span-2 md:flex-row md:items-center md:p-10">
                  <div className="flex flex-wrap gap-10 sm:gap-12">
                    <div>
                      <span
                        className={cn(
                          "text-4xl font-bold text-slate-900"
                        )}
                      >
                        15.2k
                      </span>
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Daily Flights
                      </span>
                    </div>
                    <div>
                      <span
                        className={cn(
                          "text-4xl font-bold text-slate-900"
                        )}
                      >
                        99.98%
                      </span>
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Safety Rate
                      </span>
                    </div>
                    <div>
                      <span
                        className={cn(
                          "text-4xl font-bold text-slate-900"
                        )}
                      >
                        1.2m
                      </span>
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        KM Flown
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex -space-x-3">
                      {pilotAvatars.map((src, i) => (
                        <div
                          key={i}
                          className="relative size-10 overflow-hidden rounded-full border-4 border-white shadow-sm"
                        >
                          <Image
                            src={src}
                            alt=""
                            width={40}
                            height={40}
                            className="size-full object-cover"
                          />
                        </div>
                      ))}
                      <div className="flex size-10 items-center justify-center rounded-full border-4 border-white bg-slate-100 text-[10px] font-bold text-slate-500 shadow-sm">
                        +12
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      New Pilots Online
                    </span>
                  </div>
                </div>
              </div>
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

            {detailModal.kind === "drone" ? (
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
                  <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
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
            ) : (
              <>
                {serviceModalContent[detailModal.id].image ? (
                  <div className="relative h-40 w-full shrink-0 bg-slate-100">
                    <Image
                      src={serviceModalContent[detailModal.id].image!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="512px"
                    />
                  </div>
                ) : null}
                <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-8">
                  <h2
                    id="marketplace-detail-title"
                    className={cn(
                      "pr-10 text-xl font-bold uppercase tracking-tight text-slate-900"
                    )}
                  >
                    {serviceModalContent[detailModal.id].title}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {serviceModalContent[detailModal.id].summary}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    {serviceModalContent[detailModal.id].details}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {serviceModalContent[detailModal.id].tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-6 space-y-2">
                    {serviceModalContent[detailModal.id].highlights.map(
                      (line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-600" />
                          {line}
                        </li>
                      )
                    )}
                  </ul>
                  <p className="mt-6 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm font-semibold text-blue-900">
                    {serviceModalContent[detailModal.id].pricing}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      className={cn(
                        "rounded-lg bg-blue-700 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-600"
                      )}
                      onClick={closeModal}
                    >
                      {serviceModalContent[detailModal.id].cta}
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
            )}
          </div>
        </div>
      ) : null}

      <footer className="w-full border-t border-slate-100 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-8 md:flex-row">
          <div className="text-center md:text-left">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center justify-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 transition-opacity hover:opacity-90 md:justify-start"
              )}
            >
              <Image
                src="/aerolaminar-logo.png"
                alt=""
                width={40}
                height={40}
                className="h-8 w-8 shrink-0 object-contain object-center sm:h-9 sm:w-9"
                aria-hidden
              />
              <span className="leading-tight">AEROLAMINAR</span>
            </Link>
            <p className="mt-2 text-sm text-slate-500">
              © 2024 AEROLAMINAR Logistics. All rights reserved.
            </p>
          </div>
          <nav
            className="flex flex-nowrap items-center justify-center gap-x-2 sm:gap-x-4 md:gap-x-6 lg:gap-8"
            aria-label="Legal and support"
          >
            {["Privacy Policy", "Terms of Service", "API Docs", "Contact Support"].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="shrink-0 whitespace-nowrap text-xs text-slate-500 transition-colors hover:text-blue-500 sm:text-sm"
                >
                  {label}
                </a>
              )
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
