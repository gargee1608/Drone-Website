import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarClock,
  Clapperboard,
  CloudRain,
  Droplets,
  Factory,
  Flame,
  HardHat,
  Heart,
  HeartPulse,
  Home,
  Layers,
  LifeBuoy,
  Map,
  MapPinned,
  Megaphone,
  Package,
  Radar,
  Radio,
  ScanLine,
  Search,
  Sprout,
  Sun,
  Tractor,
  Truck,
  Video,
  Weight,
  Zap,
  type LucideIcon,
} from "lucide-react";

type DescriptionListItem = string | { text: string; icon: LucideIcon };

type IndustryUseCase = {
  icon: LucideIcon;
  title: string;
  description: string | DescriptionListItem[];
};

function isIconListItem(
  item: DescriptionListItem,
): item is { text: string; icon: LucideIcon } {
  return typeof item === "object";
}

const cases: IndustryUseCase[] = [
  {
    icon: Radar,
    title: "Defence & Surveillance",
    description: "Perimeter patrols, reconnaissance & tactical overwatch.",
  },
  {
    icon: Tractor,
    title: "Agriculture & Spraying",
    description: [
      { text: "Crop monitoring", icon: Sprout },
      { text: "Spraying pesticides and fertilizers", icon: Droplets },
      { text: "Irrigation management", icon: CloudRain },
      { text: "Yield analysis", icon: BarChart3 },
    ],
  },
  {
    icon: Clapperboard,
    title: "Media & Film Production",
    description: [
      { text: "Aerial videography", icon: Video },
      { text: "Movie production", icon: Clapperboard },
      { text: "Event coverage", icon: CalendarClock },
      { text: "Tourism promotion", icon: MapPinned },
      { text: "Weddings & Events Shoots", icon: Heart },
    ],
  },
  {
    icon: LifeBuoy,
    title: "Search & Rescue",
    description: [
      { text: "Disaster assessment", icon: AlertTriangle },
      { text: "Missing person searches", icon: Search },
      { text: "Fire monitoring", icon: Flame },
      { text: "Emergency response", icon: Zap },
    ],
  },
  {
    icon: Building2,
    title: "Real Estate & Property Shoots",
    description: [
      { text: "Property showcases", icon: Home },
      { text: "Virtual tours", icon: Video },
      { text: "Land visualization", icon: Layers },
      { text: "Marketing content", icon: Megaphone },
    ],
  },
  {
    icon: Truck,
    title: "Delivery & Logistics",
    description: [
      { text: "Parcel delivery", icon: Package },
      { text: "Medical supply transport", icon: HeartPulse },
      { text: "Emergency deliveries", icon: Zap },
      { text: "Last-mile logistics", icon: Truck },
    ],
  },
  {
    icon: Map,
    title: "Surveying & Mapping",
    description: "Topographic surveys, orthomosaics & GIS-ready outputs.",
  },
  {
    icon: ScanLine,
    title: "Inspection (Solar, Tower, Infra)",
    description: [
      { text: "Solar Panel Inspection", icon: Sun },
      { text: "Telecom Tower Inspection", icon: Radio },
      { text: "Power Line Inspection", icon: Zap },
      { text: "Bridge & Infrastructure Inspection", icon: Building2 },
      { text: "Industrial Facility Inspection", icon: Factory },
    ],
  },
  {
    icon: HardHat,
    title: "Construction Monitoring",
    description: [
      { text: "Site inspections", icon: ScanLine },
      { text: "Progress tracking", icon: BarChart3 },
      { text: "Safety monitoring", icon: HardHat },
      { text: "Volume measurements", icon: Layers },
    ],
  },
];

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
              {Array.isArray(description) ? (
                <ul className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
                  {description.map((item) => {
                    if (isIconListItem(item)) {
                      const ItemIcon = item.icon;

                      return (
                        <li
                          key={item.text}
                          className="flex items-start gap-2"
                        >
                          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-[#008B8B]/20 bg-[#f4fbfb]">
                            <ItemIcon
                              className="size-3 text-[#008B8B]"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                          </div>
                          <span>{item.text}</span>
                        </li>
                      );
                    }

                    return (
                      <li key={item} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#008B8B]"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
                  {description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
