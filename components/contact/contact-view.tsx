"use client";

import Image from "next/image";
import {
  AtSign,
  Clock,
  MapPin,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { cn } from "@/lib/utils";

/** Brand palette aligned with contact mock (primary #006a6e, secondary #106e00, tertiary #0056cf) */
const primary = "#006a6e";
const secondaryGreen = "#106e00";

const HERO_DRONE_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAd5Qx2LlWCZ9-TzvqoK7pqHmclSOHr17jAUqBID_gAtDBlz_woxh40RL0aYje_8Pq7fnTA43RQqObbP3Lut9zNeEcMA4UQPajuTicEqNLx4o65RfGnI1sjRz2gImY-2ybKjGr4pDw1vrJOoUzQ5ZohOV9HMGVTO09zg0gRB643966yyC2Adzdh-B1mV7TLLU1-YuPT5SOwLWrDWlE4FDEmzGVueL-k35aZm5SyMzREfwlNJJiBKjNXvn_ZhEjJYPbewfjqAxkP4X_7";

const MAP_BG_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAYin33I4RLGs36bM7VeBou6cWwS1NmSh9VJfVDjsnKe_UrmI9iOzGvwPffhjT6VfPeCmabuegMyJoTglDofzLWjM1eF1VqN8xebyYC5rWuF9acKu5la7Zf8dzGqnnRa9J25PbTZGsBakr4yaWVNDU0zSIPyiDmeOGRTTcZ0h7Phh0OkhmhQw-VyxAp7d6iuwU15aeg2c6qx-eUKpQmcmMMnQNjaGdLKxIkRL2lou3kYKuJpvsgXhNc4ZXAk_uUjmCKXmkBLlVt5PQm";

export function ContactView() {
  const [submitted, setSubmitted] = useState(false);

  function handleInquirySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <div
      className={cn(
        landingFontClassName,
        "relative flex min-h-0 flex-1 flex-col bg-white pt-20 font-[family-name:var(--font-landing-body)] text-[#141a20] selection:bg-[#006a6e]/10 antialiased sm:pt-22"
      )}
    >
      {/* Hero */}
      <section className="contact-hud-grid relative py-8 sm:py-10 lg:py-12">
        <div className="container mx-auto grid items-center gap-8 px-6 md:grid-cols-2 md:gap-10 lg:px-8">
          <div className="w-full">
            <h1 className="mb-4 font-[family-name:var(--font-landing-headline)] text-4xl font-bold leading-[1.02] tracking-tighter text-[#1a2027] sm:text-5xl md:text-6xl">
              Get in <span className="text-[#006a6e]">Touch</span> with Us
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#43484e] sm:text-lg">
              Have questions or need drone services? We&apos;re here to help.
              Reach out to our flight operations team for technical support or
              partnerships.
            </p>
          </div>
          <div className="relative h-[260px] w-full rounded-xl bg-white sm:h-[320px] md:h-[360px]">
            <Image
              src={HERO_DRONE_SRC}
              alt="Professional delivery drone"
              fill
              className="relative z-10 object-contain drop-shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* Inquiry + contact details side-by-side */}
      <section className="container mx-auto mb-20 px-6 pt-2 sm:mb-24 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
            <h2 className="mb-2 font-[family-name:var(--font-landing-headline)] text-xl font-bold tracking-tight text-[#1a2027] sm:text-2xl">
              Send an Inquiry
            </h2>
            <p className="mb-6 text-sm text-[#43484e] sm:text-base">
              Fill in your details and our team will get back to you shortly.
            </p>

            <form className="space-y-4" onSubmit={handleInquirySubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#43484e]">
                    Full name
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-[#1a2027] outline-none transition focus:border-[#006a6e] focus:ring-2 focus:ring-[#006a6e]/20"
                    placeholder="Jane Doe"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#43484e]">
                    Email
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-[#1a2027] outline-none transition focus:border-[#006a6e] focus:ring-2 focus:ring-[#006a6e]/20"
                    placeholder="you@company.com"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#43484e]">
                    Phone (optional)
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-[#1a2027] outline-none transition focus:border-[#006a6e] focus:ring-2 focus:ring-[#006a6e]/20"
                    placeholder="+1 (555) 000-0000"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#43484e]">
                    Company (optional)
                  </span>
                  <input
                    type="text"
                    name="company"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-[#1a2027] outline-none transition focus:border-[#006a6e] focus:ring-2 focus:ring-[#006a6e]/20"
                    placeholder="Company name"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#43484e]">
                  Message
                </span>
                <textarea
                  name="message"
                  required
                  rows={5}
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-[#1a2027] outline-none transition focus:border-[#006a6e] focus:ring-2 focus:ring-[#006a6e]/20"
                  placeholder="Tell us about your inquiry..."
                />
              </label>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-[family-name:var(--font-landing-headline)] text-xs font-bold tracking-wider text-white uppercase transition hover:opacity-90 sm:ml-auto"
                  style={{ backgroundColor: primary }}
                >
                  Submit inquiry
                </button>
              </div>

              {submitted ? (
                <p
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                  role="status"
                >
                  Thanks! We received your inquiry and will contact you soon.
                </p>
              ) : null}
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
            <h2 className="mb-6 flex items-center gap-2.5 font-[family-name:var(--font-landing-headline)] text-xl font-bold tracking-tight text-[#1a2027] sm:text-2xl">
              <span
                className="h-6 w-1 shrink-0 rounded-full sm:h-7"
                style={{ backgroundColor: primary }}
                aria-hidden
              />
              Contact Info
            </h2>
            <div className="grid grid-cols-1 gap-8">
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
      <section className="w-full px-4 pb-10 pt-0 sm:px-6 lg:px-8">
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
