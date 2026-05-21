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
    description:
      "Pilots and operators with credentials, experience, and fleet details you can trust before you book.",
  },
  {
    icon: MapPinned,
    title: "Location-Based Search",
    description:
      "Filter by city, region, and mission type to find the right pilot close to your job site.",
  },
  {
    icon: CalendarClock,
    title: "Instant Booking or Quotes",
    description:
      "Confirm availability fast or request tailored quotes for complex, multi-day aerial work.",
  },
] as const;

const industryUseCaseRows = [
  items.slice(0, 3),
  items.slice(3, 6),
  items.slice(6, 9),
];

export function Features() {
  return (
    <section
      id="industry-use-cases"
      className="relative overflow-hidden bg-gradient-to-b from-white via-[#f5fbfb] to-white px-3 pt-12 pb-16 sm:px-8 sm:pt-20 sm:pb-32"
    >
      <div
        className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-[#008B8B]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/2 size-80 rounded-full bg-[#0D9488]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-20">
          <h2 className="font-[family-name:var(--font-landing-headline)] text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            Industry Use Cases
          </h2>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6 lg:gap-7">
          {industryUseCaseRows.map((row, rowIndex) => {
            const rowZoomClass =
              rowIndex % 2 === 0
                ? "industry-card-zoom-in"
                : "industry-card-zoom-out";

            return (
              <div
                key={`industry-row-${rowIndex}`}
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7 ${rowZoomClass}`}
              >
                {row.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="group relative flex h-full min-h-[180px] flex-col overflow-hidden rounded-3xl border border-[#008B8B]/15 bg-white/90 p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#008B8B]/35 hover:shadow-[0_24px_60px_rgba(0,139,139,0.16)] sm:min-h-[210px] sm:p-7"
                  >
                    <div
                      className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-transparent via-[#008B8B] to-transparent opacity-60"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-[#008B8B]/10 transition-transform duration-300 group-hover:scale-125"
                      aria-hidden
                    />
                    <div className="relative mb-5 flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#008B8B]/20 bg-[#f4fbfb] shadow-sm transition-transform duration-300 group-hover:scale-105 sm:mb-6 sm:size-16">
                      <Icon
                        className="size-8 text-[#008B8B] sm:size-9"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </div>
                    <h3 className="relative mb-3 font-[family-name:var(--font-landing-headline)] text-lg font-bold leading-snug tracking-tight text-slate-900 sm:text-xl">
                      {title}
                    </h3>
                    <p className="relative mb-6 flex-1 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
                      {description}
                    </p>
                    <div className="relative mt-auto flex items-center gap-3">
                      <div className="landing-telemetry-line flex-1 opacity-90" />
                      <span className="size-2 rounded-full bg-[#008B8B] shadow-[0_0_0_5px_rgba(0,139,139,0.12)]" />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div
          id="why-hire-a-drone"
          className="relative mx-auto mt-14 max-w-6xl sm:mt-20"
        >
          <div
            className="pointer-events-none absolute inset-x-8 -top-6 h-24 rounded-full bg-[#008B8B]/8 blur-3xl"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-[#008B8B]/15 bg-gradient-to-br from-white via-[#f6fcfc] to-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.07)] sm:p-10 lg:p-12">
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#0D9488]/10 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 size-56 rounded-full bg-[#008B8B]/8 blur-3xl"
              aria-hidden
            />

            <div className="relative mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center rounded-full border border-[#008B8B]/20 bg-white px-4 py-1.5 font-[family-name:var(--font-landing-headline)] text-[10px] font-bold uppercase tracking-[0.22em] text-[#008B8B] shadow-sm">
                Core Values
              </span>
              <h3 className="mt-5 font-[family-name:var(--font-landing-headline)] text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Why Hire A Drone
              </h3>
              <p className="mt-4 font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-slate-600 sm:text-lg">
                Our mission is to seamlessly connect skilled drone pilots with
                real-world missions, enabling efficient, reliable, and scalable
                aerial operations across industries.
              </p>
            </div>

            <ul className="relative mx-auto mt-10 grid max-w-5xl list-none grid-cols-1 gap-5 p-0 sm:mt-12 sm:grid-cols-3 sm:gap-6">
              {coreValueHighlights.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="group flex h-full flex-col rounded-2xl border border-[#008B8B]/12 bg-white/90 p-6 text-center shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#008B8B]/30 hover:shadow-[0_20px_48px_rgba(0,139,139,0.14)] sm:p-7"
                >
                  <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-[#008B8B]/20 bg-gradient-to-br from-[#f0fafa] to-white shadow-inner transition-transform duration-300 group-hover:scale-105 sm:size-[4.5rem]">
                    <Icon
                      className="size-8 text-[#008B8B] sm:size-9"
                      strokeWidth={1.6}
                      aria-hidden
                    />
                  </div>
                  <h4 className="font-[family-name:var(--font-landing-headline)] text-base font-bold leading-snug tracking-tight text-slate-900 sm:text-lg">
                    {title}
                  </h4>
                  <p className="mt-3 flex-1 font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-slate-600">
                    {description}
                  </p>
                  <div className="mx-auto mt-5 flex w-full max-w-[8rem] items-center gap-2">
                    <div className="landing-telemetry-line flex-1 opacity-80" />
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-[#008B8B]"
                      aria-hidden
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
