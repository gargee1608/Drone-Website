export type ServiceCatalogBadgeVariant = "light" | "primary" | "priority";

export type ServiceCatalogItem = {
  slug: string;
  title: string;
  description: string;
  detailSections: string[];
  highlights: string[];
  image: string;
  imageAlt: string;
  topBadge: { text: string; variant: ServiceCatalogBadgeVariant };
};

export const serviceCatalogItems: ServiceCatalogItem[] = [
  {
    slug: "medical-logistics",
    title: "Medical Logistics",
    description:
      "Critical time-sensitive transport for medical cargo including specimens, organs, and pharmaceuticals.",
    detailSections: [
      "Our medical logistics network is built for cold-chain integrity, chain-of-custody documentation, and predictable handoffs between hospitals, labs, and distribution hubs.",
      "Flights are planned around weather, airspace, and hospital receiving windows so high-value payloads arrive within the window you specify—not “as soon as possible,” but when your clinicians need them.",
    ],
    highlights: [
      "Temperature-monitored payloads and audit-friendly logs",
      "Coordinated staging for urban cores and remote clinics",
      "Ops desk support for after-hours and surge scenarios",
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtsFwVqr906z9dXDXzI0vkAP2a3v1YciyF2keAPDg3zn28bql8XeQzZXPuB7aOhR8n-39zz67Fl9jkI7JR9TkOnfiRDGoOB0l8S0Xpi6vQmJ9zvp_IpMJlxenHVc2qgb7AppMMw-NjDE6Ogu7AuOwUuM2nQWucSMkC2Wja-62RTtY1x5kVIJAaQIOOFvTVdQaWEdZFK_ZuAHCL_Q5082OtZTpifdxVa7MU0Y6CrXK3hyL1Dpfohw2OtsC3FUtWtG0_La_Z0I7JFXR5",
    imageAlt: "Medical logistics drone carrying temperature-controlled cargo",
    topBadge: { text: "$49", variant: "light" },
  },
  {
    slug: "precision-surveillance",
    title: "Precision Surveillance",
    description:
      "High-definition 4K thermal imaging and multi-spectral sensors for real-time industrial monitoring.",
    detailSections: [
      "Surveillance missions combine stable hover platforms with sensors tuned for your site—perimeter patrols, flare-stack monitoring, or corridor mapping with repeatable flight paths.",
      "Live feeds and captured media are organized for security and compliance teams, with optional AI-assisted alerting on regions of interest you define.",
    ],
    highlights: [
      "4K visual and thermal packages",
      "Scheduled or on-demand patrol cadence",
      "Export-ready reporting for audits and insurers",
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYkARG15cGIRUduK78vb6ss3v46nsHIA2kV1doWb568G-PDaRk1ZOZ2-LT5Xl9k-9AXt4_AKPSPxHqsm1oxkawvzQuga1OXjpxiTAStZWL5w0pwmV1ksP_d8Hl16_5ogYstRVe-rl36QDHIAIpJDEuel6LaZH8oeCF8g_OY_ZIsD-Fc1Gb3wbow79Tb7KGOgNmiWsGK5-huucbeY7jRZDULRxp8QKV2GGVuCUUuYf6P8Naf7d5KmJvfoLL3TL3mz8AWGbZ2ec_hrrC",
    imageAlt: "Thermal surveillance view from a drone",
    topBadge: { text: "$120/h", variant: "light" },
  },
  {
    slug: "emergency-response",
    title: "Emergency Response",
    description:
      "Immediate deployment for disaster zone relay and communication bridging in critical scenarios.",
    detailSections: [
      "When roads are compromised or timelines are measured in minutes, emergency response airframes extend situational awareness and lightweight cargo delivery into places ground teams can’t reach quickly.",
      "Deployments prioritize pre-cleared corridors, redundant comms checks, and rapid re-tasking as incident command updates priorities.",
    ],
    highlights: [
      "Expedited dispatch and priority airspace coordination",
      "Relay payloads for comms and small critical supplies",
      "Built for SAR, wildfire support, and flood response patterns",
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC9_jtj-X27ArAqwVx9HdVzuAS7GUk5_-kAD2G5greai4z4NKlb1gUOnEp5u2QmmuEPcgCIyuBaYiOH68RMN18_4RTQaJtcJ0QXgPILd9skINzuDs2bZWpejCARaIGyMOacwr36ggitwfRE4UUsihC1ZPEVGDZJcuTUoFfRBRy7mrL3-PPZOVc9hCUaJg35DP7eihrbKnz9e2xDamgF-TlVbPzzSS9A-M0iS8aVlsRCm5IZs-9vsAmQAQUy2dZ-ie9rVLRsFIXIprqW",
    imageAlt: "Drone over emergency response zone",
    topBadge: { text: "$195/h", variant: "priority" },
  },
  {
    slug: "infrastructure",
    title: "Infrastructure",
    description:
      "Precision LiDAR scanning and AI-driven structural integrity reports for industrial facilities.",
    detailSections: [
      "Infrastructure programs blend dense LiDAR captures, orthomosaic mapping, and change detection so asset teams can compare this month’s survey to last quarter’s baseline.",
      "Deliverables are structured for engineering workflows—CAD-friendly exports, annotated defect galleries, and executive summaries where needed.",
    ],
    highlights: [
      "Wind, solar, transmission, and industrial site playbooks",
      "Repeatable flight grids for year-over-year comparison",
      "Optional AI-assisted crack and hotspot highlighting",
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeuHk9S-q_53Ot7cr4g3DQg50VuIUM1sKoO9hUERwedcTQb_OzkVmmaszym4TCRRAkFF8Mbk7ocBPHLeXkmT46HTGmnIRgywqqkrr-GDKJFOTytihDZiAbGpCXd44BEfNqDaC_Y1SqSflvAvlhhUMbRXS8PG8Sau4oJqPjrXaCVeQT3SHODelkAS8DS8QfzTyhsVp2ha3mNYJSowYgcABiIT3RgfI2IG54RpbXrsH1UgyZeXLJ1-mFGsr4kVwN7yJBXb5foakBrnzO",
    imageAlt: "Drone inspecting industrial infrastructure",
    topBadge: { text: "$350/site", variant: "light" },
  },
];

const bySlug = new Map(
  serviceCatalogItems.map((item) => [item.slug, item] as const)
);

export function getServiceBySlug(slug: string): ServiceCatalogItem | undefined {
  return bySlug.get(slug);
}

export function serviceCatalogBadgeClasses(
  variant: ServiceCatalogBadgeVariant
): string {
  if (variant === "priority") {
    return "bg-[#0058bc]/90 text-white";
  }
  if (variant === "primary") {
    return "bg-[#0058bc] text-white";
  }
  return "bg-white/90 text-[#0058bc] shadow-sm backdrop-blur-md";
}
