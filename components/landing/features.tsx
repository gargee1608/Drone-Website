import { Building2, MapPin, Users } from "lucide-react";

const items = [
  {
    icon: Users,
    title: "2,500+",
    description: "Registered Pilots",
  },
  {
    icon: Building2,
    title: "12+",
    description: "Industries Served",
  },
  {
    icon: MapPin,
    title: "120+",
    description: "Cities Covered",
  },
] as const;

export function Features() {
  return (
    <section
      id="service-listing"
      className="border-b border-border/40 bg-white pt-4 pb-12 sm:pt-6 sm:pb-16 lg:pt-8 lg:pb-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-5 lg:gap-6">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={description}
              className="flex flex-col items-center text-center"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/90 text-blue-600 shadow-sm sm:size-11">
                <Icon className="size-5 sm:size-6" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#0f172a] sm:mt-4 sm:text-3xl">
                {title}
              </p>
              <p className="mt-1.5 text-[13px] font-medium leading-snug text-slate-500 sm:text-sm">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
