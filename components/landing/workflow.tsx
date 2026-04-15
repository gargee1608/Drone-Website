import { Package, Plane, Rocket } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Request",
    description:
      "Create your pilot profile & add your drones.",
    icon: Package,
  },
  {
    n: "02",
    title: "Get Matched",
    description:
      "Industries find and hire you for projects.",
    icon: Rocket,
  },
  {
    n: "03",
    title: "Fly & Earn",
    description:
      "Complete missions and get paid securely.",
    icon: Plane,
  },
] as const;

export function Workflow() {
  return (
    <section
      id="onboarding"
      className="border-b border-border/40 bg-white py-14 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How It Works?
          </h2>
        </div>

        <div className="relative mx-auto">
          <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-5 lg:gap-6">
            {steps.map((step) => (
              <li
                key={step.n}
                className="flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white shadow-md shadow-blue-500/5 ring-1 ring-border/40 transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 sm:size-[3.75rem]">
                  <step.icon className="size-6 text-blue-600" aria-hidden />
                </div>
                <span className="mt-2.5 inline-flex min-w-[2rem] items-center justify-center rounded-full border border-border bg-white px-2 py-0.5 text-[11px] font-bold text-foreground shadow-sm sm:text-xs">
                  {step.n}
                </span>
                <h3 className="mt-3 font-heading text-base font-semibold leading-snug text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-muted-foreground sm:max-w-xs sm:text-sm">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
