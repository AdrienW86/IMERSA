"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { experienceStore } from "@/lib/experience-store";
import { sceneIndexAt, scenes, veilAt, type VeilState } from "@/lib/journey";
import { scrollToProgress } from "@/lib/scroll";

/**
 * Voiles de transition :
 * - le voile de parcours accompagne les passages entre environnements ;
 * - le voile de raccord masque les sauts de chapitre (navigation, mouvements réduits).
 */
export function Veils() {
  const journeyVeil = useRef<HTMLDivElement>(null);
  const cutVeil = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state: VeilState = { color: "#000", opacity: 0 };
    const apply = (p: number) => {
      const el = journeyVeil.current;
      if (!el) return;
      veilAt(p, state);
      el.style.opacity = state.opacity.toFixed(3);
      el.style.backgroundColor = state.color;
    };
    apply(experienceStore.getState().progress);
    return experienceStore.subscribe((s, prev) => {
      if (s.progress !== prev.progress) apply(s.progress);
    });
  }, []);

  useEffect(() => {
    const el = cutVeil.current;
    if (!el) return;
    return experienceStore.subscribe((s, prev) => {
      const jump = s.jump;
      if (!jump || (prev.jump && prev.jump.phase === jump.phase)) {
        // Phase d'attente : on bascule dès que la destination est prête.
        if (jump?.phase === "hold" && s.ready[scenes[sceneIndexAt(jump.to)].id]) {
          experienceStore.setState({ cut: s.cut + 1, jump: { ...jump, phase: "in" } });
        }
        return;
      }
      if (jump.phase === "out") {
        gsap.to(el, {
          opacity: 1,
          duration: jump.source === "motion" ? 0.28 : 0.4,
          ease: "power2.inOut",
          onComplete: () => {
            if (jump.source === "nav") scrollToProgress(jump.to);
            const st = experienceStore.getState();
            const ready = st.ready[scenes[sceneIndexAt(jump.to)].id];
            experienceStore.setState(
              ready
                ? { cut: st.cut + 1, jump: { ...jump, phase: "in" } }
                : { jump: { ...jump, phase: "hold" } },
            );
          },
        });
      } else if (jump.phase === "in") {
        gsap.to(el, {
          opacity: 0,
          duration: jump.source === "motion" ? 0.5 : 0.8,
          ease: "power2.out",
          delay: 0.05,
          onComplete: () => experienceStore.setState({ jump: null }),
        });
      }
    });
  }, []);

  return (
    <>
      <div ref={journeyVeil} aria-hidden className="pointer-events-none absolute inset-0 z-10 opacity-0" />
      <div ref={cutVeil} aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-ink opacity-0" />
    </>
  );
}
