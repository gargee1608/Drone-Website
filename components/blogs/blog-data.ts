/** Flight Log posts — used by listing and `/blogs/[slug]`. */
export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: "Technology" | "Logistics" | "Regulations" | "Company News";
  author: string;
  image: string;
  imageAlt: string;
  /** Tag pill text color / style hint */
  tagTone: "emerald" | "primary" | "slate";
  body: string[];
};

export const FEATURED_SLUG = "autonomous-urban-delivery";

export const featuredHero = {
  slug: FEATURED_SLUG,
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDD4XFjqBxJirwDdlsYS4Nxb8-fBjE4XPAsaRv_u-d4v15o2MR5Od8zuPPCXMwgeiaiPMoAIKOgSbImRmjmuWMEgVt3vwOe2qcuUapHpnzIIMzK29HRyLw1ShUJ3Obcg3cV_bJ-4EDrqIpRD5TgwhJC2BFycoxIZQCdRXaPWperw3CmJk3B4gjvnwuOMvJhjlNrte1_AE7EEdC5xaNwnsGwT5X0aI2VFQ6AJwofKkqrbYCl62YIprFBOuPSHIvmelD0yS6Ne_64g36M",
  imageAlt: "Futuristic autonomous delivery drone flying between glass skyscrapers at dusk",
  headlineLead: "The Future of",
  headlineGradient: "Autonomous Urban Delivery",
  subhead:
    "Exploring the technological shift and regulatory framework required to scale last-mile drone logistics across global megacities.",
} as const;

export const blogPosts: BlogPost[] = [
  {
    slug: "swarm-intelligence",
    category: "Technology",
    title: "Implementing Swarm Intelligence in Fleet Ops",
    excerpt:
      "How our proprietary AeroLink protocol allows 500+ drones to communicate and avoid collisions without centralized ground control.",
    date: "Oct 24, 2023",
    author: "Sarah Chen",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA68QBE_wDvjlVME2n3XNYnU-nPViItmCf13T-zY1MYOhC1H5oTS2T799z76lpPeMGwijnC-aGa-jc3j3i78p4z-wK8j7YHuEep1lpOkHDZQ3-ayHe-AzANPN1WIvHiGcNeqnLLDs51paJ4uqj_-2r_VoDGss97na3VO5b5FmeqfhqRYHaIZVybYryVzYNjeDNd-X2nW8FiGseIr_VKN4FZk_G-eM0aARdTir2BqiNqaNDBynCJveBTMhV2c1nPpIFEvZnkSVbe2vN0",
    imageAlt: "Engineers working with drone components in a modern lab",
    tagTone: "emerald",
    body: [
      "Swarm coordination depends on peer-to-peer state sync with bounded latency. AeroLink shards traffic by corridor so no single node becomes a choke point.",
      "Collision avoidance uses predictive cones fed by onboard sensors; ground control receives summaries, not per-drone heartbeats.",
    ],
  },
  {
    slug: "last-mile-energy",
    category: "Logistics",
    title: "Optimizing Last-Mile Energy Consumption",
    excerpt:
      "A detailed analysis of how wind-resistance modeling reduced fleet energy consumption by 22% during peak seasonal delivery windows.",
    date: "Oct 18, 2023",
    author: "Marcus Thorne",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAKaVx-lPoNgf5JoXs31e1kFyjY7lCIA6gKlSPgp3F4C-0EHzAirqzZ2fs5ySoLRjgMKDlxx6H8nu17tL5jdbLmI0CK4GxRwyMO7oQxNtxc2QYUSEsIhxjCmEsPvZDR2WnHF7QYvX4pJO6hrhv9agbSJ8XEs98pUwjm2W-RcStKQPVxwufP6ZfFWGOOXsnrB93z5Gec4j09zzJkPZ6pNY6_QbnngkTGjuOJqgLuMJ4czaq1SstY5XvTnP-c8LJMM5g3ZmPFH3meg4_k",
    imageAlt: "Drone at a logistics hub with cargo containers",
    tagTone: "primary",
    body: [
      "Wind-resistance tables are recomputed nightly from mesoscale forecasts and historical telemetry so routes pick altitude bands that trade time for joules.",
      "Peak-season windows get denser hub staging to shorten hover time near customers—the dominant hidden cost.",
    ],
  },
  {
    slug: "easa-part-u",
    category: "Regulations",
    title: "Navigating the New EASA Part-U Standards",
    excerpt:
      "What the latest European drone regulations mean for autonomous operations and how AeroLaminar is ensuring day-one compliance.",
    date: "Oct 12, 2023",
    author: "Elena Rossi",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCyRCFggEvhDW7zJ0rj9gZDVI6bWiCb61tmLYzAnjGtEVt-NAUwQ3csYPi3UHuuqt9WKfHqd96tQzV2UgMCV1TVJ0fKdz5z1sVnEleylgvQcjFosIAmEkffsPcVTyM9RIJHFo9zN8muTFhQdz97aIx4xbgVVAY0UF4VuIvNkWIu0nA5eteQCz4ed4VV8UyVoXxyD_0Kg2jFpeux2oZP54-yXL_pmZofBGvU2z-TRhAjXHuefHMvUY15pgFtsoLDikI0bqka914-vK9-",
    imageAlt: "Digital map of city flight paths and corridors",
    tagTone: "slate",
    body: [
      "Part-U introduces explicit operational categories; our manifests auto-tag flights with the evidence pack each authority expects.",
      "Cross-border lanes inherit the strictest rule set along the path so planners never have to guess which regime applies mid-route.",
    ],
  },
  {
    slug: FEATURED_SLUG,
    category: "Technology",
    title:
      "The Future of Autonomous Urban Delivery",
    excerpt: featuredHero.subhead,
    date: "Oct 30, 2023",
    author: "Drone Hire Editorial",
    image: featuredHero.image,
    imageAlt: featuredHero.imageAlt,
    tagTone: "primary",
    body: [
      "Megacity logistics will split into vertical lanes: riverside corridors for heavy cargo, roof-to-roof hops for parcels, and tethered hover for regulated handoffs.",
      "Regulators are converging on audit trails that mirror aviation—our flight logs export in that shape by default, with redaction for PII.",
      "Scaling requires simulation at city scale: we replay entire days of traffic with injected failures before a route graduates to production.",
    ],
  },
];

export const postsBySlug = Object.fromEntries(
  blogPosts.map((p) => [p.slug, p])
) as Record<string, BlogPost>;

/** Listing grid — excludes the featured long-form hero article. */
export const gridPosts = blogPosts.filter((p) => p.slug !== FEATURED_SLUG);
