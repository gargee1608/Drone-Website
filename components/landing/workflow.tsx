import { Handshake, Plane, UserPlus } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Register",
    description: "Create your pilot profile & add your drones.",
    icon: UserPlus,
  },
  {
    n: "02",
    title: "Get Matched",
    description: "Industries find and hire you for projects.",
    icon: Handshake,
  },
  {
    n: "03",
    title: "Fly & Earn",
    description: "Complete missions and get paid securely.",
    icon: Plane,
  },
] as const;

const iconRingClass =
  "border-[#008B8B]/35 shadow-[0_1px_2px_rgba(0,139,139,0.12)]";
const iconColorClass = "text-[#008B8B]";

export function Workflow() {
  return (
    <section
      id="onboarding"
      className="relative overflow-hidden bg-gradient-to-b from-white via-[#f5fbfb] to-white px-4 py-24 sm:px-8 sm:py-32"
    >
      <div
        className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-[#008B8B]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-12 size-80 rounded-full bg-[#0D9488]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col items-center text-center md:mb-24">
          <div className="max-w-2xl">
            <h2 className="inline-flex rounded-full border border-[#008B8B]/20 bg-white px-4 py-2 font-[family-name:var(--font-landing-headline)] text-xs font-bold uppercase tracking-[0.35em] text-[#008B8B] shadow-sm">
              The Workflow
            </h2>
            <p className="mt-5 font-[family-name:var(--font-landing-headline)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              How It Works?
            </p>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              From profile setup to paid missions, every step is designed to
              move pilots faster with confidence.
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-7">
          <div
            className="pointer-events-none absolute left-[14%] right-[14%] top-20 hidden h-1 rounded-full bg-gradient-to-r from-[#008B8B]/15 via-[#008B8B]/50 to-[#008B8B]/15 md:block"
            aria-hidden
          />
          {steps.map((step, index) => {
            const slideClass =
              index % 2 === 0
                ? "workflow-slide-from-left"
                : "workflow-slide-from-right";

            return (
              <div
                key={step.n}
                className={`group relative z-10 overflow-hidden rounded-3xl border border-[#008B8B]/15 bg-white/90 p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#008B8B]/35 hover:shadow-[0_24px_60px_rgba(0,139,139,0.16)] sm:p-8 ${slideClass}`}
              >
                <div
                  className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-transparent via-[#008B8B] to-transparent opacity-60"
                  aria-hidden
                />
                <div
                  className={`relative mx-auto mb-7 flex size-28 items-center justify-center rounded-3xl border bg-[#f4fbfb] transition-transform duration-300 group-hover:scale-105 ${iconRingClass}`}
                >
                  <step.icon
                    className={`size-12 ${iconColorClass}`}
                    strokeWidth={1.5}
                  />
                  <div className="absolute -right-3 -top-3 flex size-11 items-center justify-center rounded-2xl border border-white bg-[#008B8B] font-[family-name:var(--font-landing-headline)] text-xs font-bold text-white shadow-lg shadow-[#008B8B]/25">
                    {step.n}
                  </div>
                </div>
                <h4 className="mb-3 font-[family-name:var(--font-landing-headline)] text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
                  {step.title}
                </h4>
                <p className="mx-auto max-w-[260px] text-base leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
