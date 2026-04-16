"use client";

import Image from "next/image";
import {
  AtSign,
  Clock,
  Handshake,
  Info,
  MapPin,
  PlaneTakeoff,
} from "lucide-react";
import { useState } from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { cn } from "@/lib/utils";

/** Brand palette aligned with contact mock (primary #006a6e, secondary #106e00, tertiary #0056cf) */
const primary = "#006a6e";
const secondaryGreen = "#106e00";

const HERO_DRONE_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAd5Qx2LlWCZ9-TzvqoK7pqHmclSOHr17jAUqBID_gAtDBlz_woxh40RL0aYje_8Pq7fnTA43RQqObbP3Lut9zNeEcMA4UQPajuTicEqNLx4o65RfGnI1sjRz2gImY-2ybKjGr4pDw1vrJOoUzQ5ZohOV9HMGVTO09zg0gRB643966yyC2Adzdh-B1mV7TLLU1-YuPT5SOwLWrDWlE4FDEmzGVueL-k35aZm5SyMzREfwlNJJiBKjNXvn_ZhEjJYPbewfjqAxkP4X_7";

const MAP_BG_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAYin33I4RLGs36bM7VeBou6cWwS1NmSh9VJfVDjsnKe_UrmI9iOzGvwPffhjT6VfPeCmabuegMyJoTglDofzLWjM1eF1VqN8xebyYC5rWuF9acKu5la7Zf8dzGqnnRa9J25PbTZGsBakr4yaWVNDU0zSIPyiDmeOGRTTcZ0h7Phh0OkhmhQw-VyxAp7d6iuwU15aeg2c6qx-eUKpQmcmMMnQNjaGdLKxIkRL2lou3kYKuJpvsgXhNc4ZXAk_uUjmCKXmkBLlVt5PQm";

type InquiryTab = "service" | "partnership" | "general";

const inquiryTabs: {
  id: InquiryTab;
  label: string;
  icon: typeof PlaneTakeoff;
}[] = [
  { id: "service", label: "Service Request", icon: PlaneTakeoff },
  { id: "partnership", label: "Partnership", icon: Handshake },
  { id: "general", label: "General Inquiry", icon: Info },
];

export function ContactView() {
  const [inquiry, setInquiry] = useState<InquiryTab>("service");

  return (
    <div
      className={cn(
        landingFontClassName,
        "relative flex min-h-0 flex-1 flex-col bg-white pt-22 font-[family-name:var(--font-landing-body)] text-[#141a20] selection:bg-[#006a6e]/10 antialiased sm:pt-24"
      )}
    >
      {/* Hero */}
      <section className="contact-hud-grid relative flex min-h-[min(614px,90vh)] items-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-white to-white"
          aria-hidden
        />
        <div className="relative z-20 container mx-auto flex flex-col items-center gap-12 px-8 md:flex-row">
          <div className="w-full md:w-1/2">
            <h1 className="mb-6 font-[family-name:var(--font-landing-headline)] text-5xl font-bold leading-none tracking-tighter text-[#1a2027] sm:text-6xl md:text-7xl">
              Get in <span className="text-[#006a6e]">Touch</span> with Us
            </h1>
            <p className="max-w-lg text-xl font-light leading-relaxed text-[#43484e]">
              Have questions or need drone services? We&apos;re here to help.
              Reach out to our flight operations team for technical support or
              partnerships.
            </p>
          </div>
          <div className="relative h-[320px] w-full sm:h-[380px] md:h-[400px] md:w-1/2">
            <div
              className="absolute inset-0 rounded-full blur-[100px]"
              style={{ backgroundColor: `${primary}14` }}
              aria-hidden
            />
            <Image
              src={HERO_DRONE_SRC}
              alt="Professional delivery drone"
              fill
              className="relative z-10 object-contain drop-shadow-[0_20px_50px_rgba(0,106,110,0.15)]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* Inquiry category tabs */}
      <section className="relative z-30 -mt-24 mb-20 px-8">
        <div className="container mx-auto">
          <div
            className="inline-flex max-w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
            role="tablist"
            aria-label="Inquiry type"
          >
            {inquiryTabs.map(({ id, label, icon: Icon }) => {
              const active = inquiry === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setInquiry(id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-6 py-4 font-[family-name:var(--font-landing-headline)] text-sm font-semibold transition-all sm:px-8",
                    active
                      ? "text-white shadow-sm"
                      : "text-[#43484e] hover:bg-slate-100"
                  )}
                  style={
                    active
                      ? { backgroundColor: primary }
                      : undefined
                  }
                >
                  <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="container mx-auto mb-28 px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-40 blur-3xl"
              style={{ backgroundColor: `${primary}14` }}
              aria-hidden
            />
            <h2 className="mb-6 flex items-center gap-2.5 font-[family-name:var(--font-landing-headline)] text-xl font-bold tracking-tight text-[#1a2027] sm:text-2xl">
              <span
                className="h-6 w-1 shrink-0 rounded-full sm:h-7"
                style={{ backgroundColor: primary }}
                aria-hidden
              />
              Contact Info
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex shrink-0 rounded-md p-2"
                  style={{ color: primary, backgroundColor: `${primary}1a` }}
                >
                  <MapPin className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#43484e] sm:text-xs">
                    Office Address
                  </p>
                  <p className="text-sm leading-snug text-[#1a2027] sm:text-base">
                    88 Aviator Drive, Skyport Hub,
                    <br />
                    San Francisco, CA 94105
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex shrink-0 rounded-md p-2"
                  style={{ color: primary, backgroundColor: `${primary}1a` }}
                >
                  <Clock className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#43484e] sm:text-xs">
                    Operational Hours
                  </p>
                  <p className="text-sm leading-snug text-[#1a2027] sm:text-base">
                    Mon–Sat, 9 AM – 6 PM PST
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex shrink-0 rounded-md p-2"
                  style={{ color: primary, backgroundColor: `${primary}1a` }}
                >
                  <AtSign className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#43484e] sm:text-xs">
                    Direct Comms
                  </p>
                  <p className="text-sm font-semibold leading-snug text-[#1a2027] sm:text-base">
                    <a
                      href="mailto:ops@dronehire.example"
                      className="hover:underline"
                      style={{ color: primary }}
                    >
                      ops@dronehire.example
                    </a>
                  </p>
                  <p className="text-sm text-[#1a2027] sm:text-base">
                    +1 (888) AERO-FLY
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map — centered, narrower than full viewport, slightly shorter than before */}
      <section className="w-full px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm sm:h-[340px] lg:h-[380px]">
            <div
              className="absolute inset-0 z-0 bg-cover bg-center contrast-75 saturate-50"
              style={{ backgroundImage: `url('${MAP_BG_SRC}')` }}
              role="img"
              aria-label="Map of San Francisco area"
            />
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex h-[75%] w-[75%] max-w-md animate-pulse items-center justify-center rounded-full border border-[#006a6e]/10 sm:h-[70%] sm:w-[70%]">
                <div className="h-[58%] w-[58%] rounded-full border border-[#006a6e]/5" />
              </div>
              <div className="absolute flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-lg border border-[#006a6e]/20 bg-white/90 px-3 py-2.5 shadow-xl backdrop-blur-md sm:gap-3 sm:p-4">
                <span
                  className="relative flex size-3 shrink-0"
                  aria-hidden
                >
                  <span
                    className="absolute inline-flex size-3 animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: secondaryGreen }}
                  />
                  <span
                    className="relative inline-flex size-3 rounded-full"
                    style={{ backgroundColor: secondaryGreen }}
                  />
                </span>
                <p
                  className="font-[family-name:var(--font-landing-headline)] text-sm font-bold sm:text-base"
                  style={{ color: primary }}
                >
                  Headquarters Locked
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
