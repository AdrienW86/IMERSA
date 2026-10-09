import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { narrative } from "@/content/narrative";
import { scenes } from "@/lib/journey";

gsap.registerPlugin(SplitText);

/** Durées exprimées en progression globale du parcours (timeline de durée 1). */
const IN = 0.016;
const OUT = 0.012;
const STAGGER = 0.0016;

function toGlobal(sceneId: string, local: number) {
  const s = scenes.find((sc) => sc.id === sceneId);
  if (!s) return 0;
  return s.start + local * (s.end - s.start);
}

/**
 * Construit la timeline typographique synchronisée sur la progression de la
 * caméra : chaque bloc apparaît mot à mot (masque), puis se dissipe.
 * La timeline est pilotée par `progress()` — donc parfaitement réversible.
 */
export function buildNarrativeTimeline(root: HTMLElement) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  const splits: SplitText[] = [];

  for (const block of narrative) {
    const el = root.querySelector<HTMLElement>(`[data-block="${block.id}"]`);
    if (!el) continue;
    const enter = toGlobal(block.scene, block.enter);
    const exit = toGlobal(block.scene, block.exit);
    const titles = el.querySelectorAll<HTMLElement>("[data-split]");
    const words = [...titles].flatMap((t) => {
      const split = SplitText.create(t, { type: "words", mask: "words", wordsClass: "word" });
      splits.push(split);
      return split.words as HTMLElement[];
    });
    const fades = el.querySelectorAll<HTMLElement>("[data-fade]");

    if (block.enter >= 0) {
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.002 }, enter);
      tl.fromTo(
        words,
        { yPercent: 115, rotate: 2 },
        { yPercent: 0, rotate: 0, duration: IN, stagger: STAGGER, ease: "power3.out" },
        enter,
      );
      tl.fromTo(
        fades,
        { autoAlpha: 0, y: 18, filter: "blur(6px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: IN, stagger: IN * 0.35, ease: "power2.out" },
        enter + IN * 0.4,
      );
    }
    if (block.exit <= 1) {
      tl.to(
        el,
        { autoAlpha: 0, y: -24, filter: "blur(8px)", duration: OUT, ease: "power1.in" },
        exit - OUT,
      );
    }
  }
  // La timeline couvre exactement toute la progression.
  tl.set({}, {}, 1);
  return {
    timeline: tl,
    revert: () => {
      tl.kill();
      splits.forEach((s) => s.revert());
    },
  };
}
