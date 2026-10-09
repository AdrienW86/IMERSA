import type { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Lien entre la progression du parcours et la position de scroll.
 * Le déclencheur est enregistré par l'expérience au montage.
 */
let trigger: ScrollTrigger | null = null;

export function registerJourneyTrigger(t: ScrollTrigger | null) {
  trigger = t;
}

/** Position de scroll (px) correspondant à une progression du parcours. */
export function scrollTopFor(progress: number): number | null {
  if (!trigger) return null;
  return trigger.start + (trigger.end - trigger.start) * progress;
}

export function scrollToProgress(progress: number) {
  const top = scrollTopFor(progress);
  if (top !== null) window.scrollTo({ top, behavior: "instant" });
}
