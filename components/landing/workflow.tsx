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
      className="overflow-hidden bg-background px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col items-center text-center md:mb-24">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-landing-headline)] text-xs font-bold tracking-[0.4em] text-[#008B8B] uppercase">
              The Workflow
            </h2>
            <p className="mt-4 font-[family-name:var(--font-landing-headline)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              How It Works?
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-6">
          <div
            className="pointer-events-none absolute top-16 left-[8%] right-[8%] hidden h-px bg-border md:block"
            aria-hidden
          />
          {steps.map((step) => (
            <div
              key={step.n}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div
                className={`relative mb-10 flex size-32 items-center justify-center rounded-full border-2 bg-card ${iconRingClass}`}
              >
                <step.icon
                  className={`size-14 ${iconColorClass}`}
                  strokeWidth={1.5}
                />
                <div className="absolute -top-1 -right-1 flex size-10 items-center justify-center rounded-full border border-border bg-card font-[family-name:var(--font-landing-headline)] text-xs font-bold text-foreground shadow-sm">
                  {step.n}
                </div>
              </div>
              <h4 className="mb-3 font-[family-name:var(--font-landing-headline)] text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
                {step.title}
              </h4>
              <p className="max-w-[260px] text-base leading-relaxed text-muted-foreground sm:text-lg">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
