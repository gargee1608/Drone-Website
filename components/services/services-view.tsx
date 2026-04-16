"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Package,
  Shield,
  Sparkles,
  Stethoscope,
  Truck,
  Wrench,
} from "lucide-react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { cn } from "@/lib/utils";

const IMG = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuCW8s8jk1yK1r5ft96gVDkr-M9gamodRoYwLYY_zFneEPF6Rw31aDP4vvPwUItudmciJN7jtdouxxmQ95QyUCGn5odcwle8i7Z0P6uIcSEWVpYnIn5Km2xpNWZwIS5_ZNnw1rXOUB8AuIvkOT5zazYmiHEF8YIm6bi2pcYSDMc5p1pJI2QCq1PSeonBkuyni1hC6UoxKoOzx1KwjcQnIW2rX_oE12zQrmASHU12T015OlPRpahX2pzeZYyre3pWQtOgUa9xPARWLxzt",
  logistics:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDCL6ftGsmbzXneBjO2VcVXC9fyLw__MNdiuIQ2aGI1jHCVAgpJjkKXGShzkvSq1BhmhHSlFdmHlARDdR9mTXXJAZo-hSql0yRMcW19NdsxgOULes-tKeQMNHxSFnYhp8uL5AoTF548f-iA3x7bYGr4EI-VJFG_uvfWx6foo58AiorTdE6dQX190NaVAyXCtOPQPWtAMA8k2SJWXgJp851-LlJTJZD_vwrfD5bo0t2txJPeC-PvPZljPUGsaTD2Ya6_6HcKRBwte4qz",
  surveillance:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBRD7BbWt23jp9MsYDTzJ5b2LLwjk2JbD9e23SWj4GKpaZJm0l2jQG14GZMiVQBj_iXFpJGIN-3ydmX5s2Lpv4LaZwAh5KbWKFH1utxDFq_NSAoYPZ13S0wo_Vpi84V9yEIEN_NbsGlLfilfinHsj3k7LytpCHeOOU0RisBtiY8aOrPtGAkejPUlgXCRoghw8kOswhPauV8XWaHClL2qSer_vd3fqWIwo6lpA20aJPF0cOUGGu-KS4qh7CRlr973VmZsTf1rBqn5MM2",
  emergency:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAG9zg0xrwBgchQhwvMU1BdbuO6gScwrFxiU2z0ggoB-T3e6Wg4ipUczmgKTEbb8ZNm_C7U68qO6S6hr8Hjxi6-TB3HayDcDAnQRICuElIhpgvGEB0jgLT5RTueigpl5O_UvLknWT36WuqjR_GVZ6pOgkzOmR_zAhqtk7n0BJ4L15pAGKIZ8daGVvb_bY73P-yYp1_G4v0Y0A_Q_NPirF2aSI9j4uJHsbUsfqumVJHT-heQObNm5JEK5BZGNc-FqaL3ObpLJBv415RC",
  inspection:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCVg9W07BOadoaXa1Hphzmf0zE5IYtRHR9ZRwYz18-gxWfH9hjSrFJePBq2iGdOUvnvF0S3UfTuzqSqEAynDK9GGJxlnUmC0IdPeqk9LM7IMk_L2NFIaVitj2BsAuonSutASCYBcJ534hfojMvJUqaGV1Wd0VHCCU0FTfxGlaRUR6AchZi21cGtDxs2GtwD7hnMF2v8QuONeipulRmiuF-VLpOnmXvk3mVNpVC69pYwp1uvfjCbtstJjhOrOQrxqzLTDo3RglTVIFX0",
} as const;

const headline =
  "font-[family-name:var(--font-landing-headline),ui-sans-serif]";

const categoryPills = [
  {
    title: "Logistics",
    subtitle: "Last-mile & rapid cargo",
    icon: Truck,
    className:
      "services-glass-panel border-[#0891b2]/20 shadow-xl hover:border-[#0891b2]/50",
    iconClass: "text-[#0891b2]",
  },
  {
    title: "Surveillance",
    subtitle: "24/7 Security patrols",
    icon: Eye,
    className:
      "border-slate-200 bg-white shadow-md hover:border-[#16a34a]/40",
    iconClass: "text-[#16a34a]",
  },
  {
    title: "Emergency",
    subtitle: "Rapid medical response",
    icon: Stethoscope,
    className: "border-slate-200 bg-white shadow-md hover:border-[#ef4444]/40",
    iconClass: "text-[#ef4444]",
  },
  {
    title: "Inspection",
    subtitle: "Industrial infrastructure",
    icon: Wrench,
    className: "border-slate-200 bg-white shadow-md hover:border-[#2563eb]/40",
    iconClass: "text-[#2563eb]",
  },
] as const;

const serviceCards = [
  {
    title: "Precision Logistics",
    description:
      "Medical supply, e-commerce, and ultra-rapid cargo transport via autonomous corridors.",
    badge: "FROM $12/km",
    badgeClass: "text-[#0891b2]",
    checks: [
      "Cold-chain integrity for medical payloads",
      "15-minute delivery radius within city hubs",
    ],
    btnClass: "bg-[#0891b2] text-white",
    iconBox: "bg-[#0891b2]/10 text-[#0891b2]",
    CardIcon: Package,
    image: IMG.logistics,
    imageAlt: "Logistics drone",
    borderHover: "hover:border-[#0891b2]/30",
  },
  {
    title: "Aerial Surveillance",
    description:
      "Site monitoring, security patrols, and thermal imaging for persistent awareness.",
    badge: "FROM $85/hr",
    badgeClass: "text-[#16a34a]",
    checks: [
      "Multi-spectrum thermal imaging suite",
      "Automated AI object detection & tracking",
    ],
    btnClass: "bg-[#16a34a] text-white",
    iconBox: "bg-[#16a34a]/10 text-[#16a34a]",
    CardIcon: Shield,
    image: IMG.surveillance,
    imageAlt: "Surveillance drone",
    borderHover: "hover:border-[#16a34a]/30",
  },
  {
    title: "Emergency Response",
    description:
      "Disaster relief, search and rescue, and urgent medical delivery in critical zones.",
    badge: "PRIORITY DEPLOY",
    badgeClass: "text-[#ef4444]",
    checks: [
      "Deploy within 120 seconds of alert",
      "SAR-integrated terrain scanning",
    ],
    btnClass: "bg-[#ef4444] text-white",
    iconBox: "bg-[#ef4444]/10 text-[#ef4444]",
    CardIcon: AlertCircle,
    image: IMG.emergency,
    imageAlt: "Emergency drone",
    borderHover: "hover:border-[#ef4444]/30",
  },
  {
    title: "Infrastructure Inspection",
    description:
      "Power line, bridge, and pipeline monitoring using high-res LiDAR and photogrammetry.",
    badge: "FROM $150/site",
    badgeClass: "text-[#2563eb]",
    checks: [
      "Automated 3D digital twin generation",
      "Sub-millimeter defect detection AI",
    ],
    btnClass: "bg-[#2563eb] text-white",
    iconBox: "bg-[#2563eb]/10 text-[#2563eb]",
    CardIcon: Sparkles,
    image: IMG.inspection,
    imageAlt: "Inspection drone",
    borderHover: "hover:border-[#2563eb]/30",
  },
] as const;

export function ServicesView() {
  return (
    <div
      className={cn(
        landingFontClassName,
        "services-telemetry-grid relative flex min-h-0 flex-1 flex-col bg-[#f8fafc] pt-22 text-[#0f172a] sm:pt-24"
      )}
    >
      <div className="w-full flex-1 bg-white" role="main">
        <section className="relative flex h-[min(500px,85vh)] items-center overflow-hidden px-4 sm:px-8 lg:px-24">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/60 to-transparent" />
            <Image
              src={IMG.hero}
              alt="Futuristic drone operations"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="relative z-20 max-w-4xl">
            <h1
              className={cn(
                headline,
                "mb-4 text-4xl font-bold leading-tight tracking-tight text-black sm:text-5xl md:text-6xl lg:text-7xl"
              )}
            >
              Our Services
            </h1>
            <p className="max-w-2xl font-[family-name:var(--font-landing-body)] text-lg font-light text-[#475569] sm:text-xl">
              High-precision aerial intelligence and autonomous logistics
              designed for the next era of enterprise operations.
            </p>
          </div>
        </section>

        <div className="relative z-30 -mt-8 px-4 sm:px-8 lg:px-24">
          <div className="services-no-scrollbar flex gap-4 overflow-x-auto pb-4">
            {categoryPills.map((pill) => {
              const Icon = pill.icon;
              return (
                <div
                  key={pill.title}
                  className={cn(
                    "min-w-[280px] flex-none cursor-pointer rounded-2xl border px-8 py-6 transition-all",
                    pill.className
                  )}
                >
                  <Icon
                    className={cn("mb-3 block size-8", pill.iconClass)}
                    strokeWidth={1.75}
                  />
                  <h3
                    className={cn(headline, "font-bold text-[#0f172a]")}
                  >
                    {pill.title}
                  </h3>
                  <p className="text-sm text-[#475569]">{pill.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-8 p-4 sm:p-8 lg:p-24 md:grid-cols-2">
          {serviceCards.map((card) => {
            const Icon = card.CardIcon;
            return (
              <article
                key={card.title}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all",
                  card.borderHover
                )}
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                  <div
                    className={cn(
                      headline,
                      "absolute right-4 top-4 rounded-full border border-slate-200 bg-white/90 px-4 py-1 text-sm font-bold shadow-sm backdrop-blur-md",
                      card.badgeClass
                    )}
                  >
                    {card.badge}
                  </div>
                </div>
                <div className="p-8">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2
                        className={cn(
                          headline,
                          "mb-2 text-2xl font-bold text-[#0f172a]"
                        )}
                      >
                        {card.title}
                      </h2>
                      <p className="font-[family-name:var(--font-landing-body)] text-[#475569]">
                        {card.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl",
                        card.iconBox
                      )}
                    >
                      <Icon className="size-6" strokeWidth={1.75} />
                    </div>
                  </div>
                  <div className="mb-8 space-y-3">
                    {card.checks.map((line) => (
                      <div
                        key={line}
                        className="flex items-center gap-3 text-sm text-[#1e293b]"
                      >
                        <CheckCircle2
                          className="size-4 shrink-0 text-[#16a34a]"
                          aria-hidden
                        />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/user-dashboard/create-request"
                    className={cn(
                      headline,
                      "block w-full rounded-xl py-4 text-center font-bold shadow-md transition-all active:scale-95",
                      card.btnClass
                    )}
                  >
                    Request Service
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
