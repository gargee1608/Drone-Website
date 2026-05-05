import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Clapperboard,
  HardHat,
  Heart,
  Map,
  MapPinned,
  Radar,
  ScanLine,
  Tractor,
  Weight,
} from "lucide-react";

const items = [
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

const coreValueHighlights = [
  {
    icon: BadgeCheck,
    title: "Verified Profiles",
  },
  {
    icon: MapPinned,
    title: "Locations-Based Search",
  },
  {
    icon: CalendarClock,
    title: "Instant Booking or Quotes",
  },
] as const;

export function Features() {
  return (
    <section
      id="industry-use-cases"
      className="relative bg-background px-4 pt-16 pb-24 sm:px-8 sm:pt-20 sm:pb-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center sm:mb-20">
          <h2 className="font-[family-name:var(--font-landing-headline)] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
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
                  className="size-9 text-[#008B8B]"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>
              <h3 className="mb-2 font-[family-name:var(--font-landing-headline)] text-lg font-bold leading-snug tracking-tight text-foreground">
                {title}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                {description}
              </p>
              <div className="landing-telemetry-line mt-auto opacity-90" />
            </div>
          ))}
        </div>
        <div
          className="mx-auto mt-12 h-px max-w-6xl bg-slate-200 sm:mt-16"
          aria-hidden
        />
        <div className="mx-auto mt-10 max-w-3xl text-center sm:mt-12">
          <p className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Core Values
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-landing-headline)] text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Why Drone Hire
          </h3>
          <p className="mt-4 font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-muted-foreground sm:text-lg">
            We bridge the gap between complex drone technology and your
            operational needs with a focus on trust and speed.
          </p>
          <ul className="mx-auto mt-10 grid max-w-4xl list-none grid-cols-1 gap-0 divide-y divide-border p-0 sm:mt-12 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-border">
            {coreValueHighlights.map(({ icon: Icon, title }) => (
              <li
                key={title}
                className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-6 sm:py-6"
              >
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                  <Icon
                    className="size-8 text-[#008B8B]"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
                <span className="font-[family-name:var(--font-landing-headline)] text-sm font-bold leading-snug tracking-tight text-foreground sm:text-[0.9375rem]">
                  {title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
