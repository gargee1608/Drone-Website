import heroDroneImg from "../../public/drone-hero1.webp";

/** Preload LCP hero image on home — works for first open and hard refresh. */
export function HeroImagePreload() {
  return (
    <link
      rel="preload"
      as="image"
      href={heroDroneImg.src}
      fetchPriority="high"
    />
  );
}

export { heroDroneImg };
