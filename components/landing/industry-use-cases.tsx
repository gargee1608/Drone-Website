import {
  Building2,
  Camera,
  Clapperboard,
  Search,
  Shield,
  Tractor,
} from "lucide-react";

const cases = [
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

export function IndustryUseCases() {
  return (
    <section
      id="industry-use-cases"
      className="border-b border-border/40 bg-background py-14 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center font-heading text-2xl font-bold tracking-tight text-foreground sm:mb-10 sm:text-3xl">
          Industry Use Cases
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {cases.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-lg border border-border bg-card p-4 shadow-sm ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md dark:ring-white/10 sm:p-5"
            >
              <div className="mb-3 text-[#008B8B]">
                <Icon className="size-6" strokeWidth={1.5} aria-hidden />
              </div>
              <h3 className="font-heading text-base font-bold leading-snug text-[#0f172a]">
                {title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
