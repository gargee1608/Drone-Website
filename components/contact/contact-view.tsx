"use client";

import Image from "next/image";
import {
  AtSign,
  Clock,
  MapPin,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { landingFontClassName } from "@/components/landing/landing-fonts";
import { appendContactInquiry } from "@/lib/contact-inquiries";
import { apiUrl } from "@/lib/api-url";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

/** Brand primary aligned with contact mock (#006a6e) */
const primary = "#006a6e";

const HERO_DRONE_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAd5Qx2LlWCZ9-TzvqoK7pqHmclSOHr17jAUqBID_gAtDBlz_woxh40RL0aYje_8Pq7fnTA43RQqObbP3Lut9zNeEcMA4UQPajuTicEqNLx4o65RfGnI1sjRz2gImY-2ybKjGr4pDw1vrJOoUzQ5ZohOV9HMGVTO09zg0gRB643966yyC2Adzdh-B1mV7TLLU1-YuPT5SOwLWrDWlE4FDEmzGVueL-k35aZm5SyMzREfwlNJJiBKjNXvn_ZhEjJYPbewfjqAxkP4X_7";

export function ContactView() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleInquirySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim() || undefined;
    const message = String(fd.get("message") ?? "").trim();
    if (!fullName || !email || !message) return;

    setSubmitting(true);
    setSubmitted(false);
    try {
      const res = await fetch(apiUrl("/api/submit-inquiry"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          message,
        }),
      });

      let payload: { error?: string; message?: string } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        // ignore non-JSON response
      }

      if (!res.ok) {
        alert(payload.error || payload.message || "Could not submit inquiry.");
        return;
      }

      // Keep existing local dashboard widgets in sync.
      appendContactInquiry({
        fullName,
        email,
        phone,
        message,
      });

      setSubmitted(true);
      form.reset();
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend. Please ensure the API is running.");
    } finally {
      setSubmitting(false);
    }
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
            <h1 className={cn("mb-4", ADMIN_PAGE_TITLE_CLASS, "text-black")}>
              Get in Touch with Us
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
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
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
                  disabled={submitting}
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg border-2 border-[#006a6e] bg-transparent px-5 py-2.5 font-[family-name:var(--font-landing-headline)] text-xs font-bold uppercase tracking-wider text-[#006a6e] transition hover:bg-[#006a6e]/10 sm:ml-auto",
                    submitting && "cursor-not-allowed opacity-60"
                  )}
                >
                  {submitting ? "Submitting..." : "Submit inquiry"}
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
                    7th Floor, Samanvay Silver Complex,
                    <br />
                    Vadodara, Gujarat 390020
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
                    Mon-Fri, 10 AM - 7 PM
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
                    Email Us
                  </p>
                  <p className="text-sm font-semibold leading-snug text-[#1a2027] sm:text-base">
                    <a
                      href="mailto:info@dronehire.com"
                      className="hover:underline"
                      style={{ color: primary }}
                    >
                      info@dronehire.com
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
    </div>
  );
}
