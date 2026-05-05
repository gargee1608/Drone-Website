import {
  Building2,
  Clapperboard,
  HardHat,
  Heart,
  Map,
  Radar,
  ScanLine,
  Tractor,
  Weight,
} from "lucide-react";

const cases = [
  {
    icon: Radar,
    title: "Defence & Surveillance",
    description: "Perimeter patrols, reconnaissance & tactical overwatch.",
  },
  {
    icon: Tractor,
    title: "Agriculture & Spraying",
    description: "Crop health, precision spraying & field mapping.",
  },
  {
    icon: Clapperboard,
    title: "Filming & Cinematography",
    description: "Commercial spots, TV & cinematic aerial sequences.",
  },
  {
    icon: Weight,
    title: "Heavy Lifting & Industry Work",
    description: "Industrial payloads, logistics & on-site aerial lifts.",
  },
  {
    icon: Building2,
    title: "Real Estate & Property Shoots",
    description: "Listings, developments & polished property marketing.",
  },
  {
    icon: Heart,
    title: "Weddings & Events",
    description: "Ceremonies, venues & live celebrations from above.",
  },
  {
    icon: Map,
    title: "Surveying & Mapping",
    description: "Topographic surveys, orthomosaics & GIS-ready outputs.",
  },
  {
    icon: ScanLine,
    title: "Inspection (Solar, Tower, Infra)",
    description: "Solar arrays, towers & critical infrastructure checks.",
  },
  {
    icon: HardHat,
    title: "Construction Progress Tracking",
    description: "Site documentation, milestones & stakeholder updates.",
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
