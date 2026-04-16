import {
  Building2,
  Camera,
  Clapperboard,
  Search,
  Shield,
  Tractor,
} from "lucide-react";

const items = [
  {
    icon: Tractor,
    title: "Agriculture",
    description: "Crop monitoring, spraying & field mapping.",
  },
  {
    icon: Building2,
    title: "Real Estate",
    description: "Aerial photography & property surveys.",
  },
  {
    icon: Clapperboard,
    title: "Filming",
    description: "Cinematic drone videography.",
  },
  {
    icon: Search,
    title: "Surveying",
    description: "Land surveying & topographic mapping.",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Surveillance & perimeter monitoring.",
  },
  {
    icon: Camera,
    title: "Infrastructure",
    description: "Bridge, tower & pipeline inspections.",
  },
] as const;

export function Features() {
  return (
    <section
      id="industry-use-cases"
      className="relative bg-white px-4 pt-16 pb-24 sm:px-8 sm:pt-20 sm:pb-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center sm:mb-20">
          <h2 className="font-[family-name:var(--font-landing-headline)] text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Industry Use Cases
          </h2>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex h-full flex-col rounded-xl border border-slate-200/90 bg-white p-5 text-left shadow-sm transition-shadow duration-300 hover:border-slate-300/90 hover:shadow-md sm:p-6"
            >
              <div className="mb-4 flex size-14 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 transition-transform duration-300 group-hover:scale-[1.03]">
                <Icon
                  className="size-9 text-blue-600"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>
              <h3 className="mb-2 font-[family-name:var(--font-landing-headline)] text-lg font-bold leading-snug tracking-tight text-slate-900">
                {title}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
                {description}
              </p>
              <div className="landing-telemetry-line mt-auto opacity-90" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
