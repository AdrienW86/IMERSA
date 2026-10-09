"use client";

import { useEffect, useRef } from "react";
import { chapterLabels } from "@/content/narrative";
import { experienceStore, requestJump, useExperience } from "@/lib/experience-store";
import { scenes, stops } from "@/lib/journey";

/** Premier point d'arrêt d'une séquence : destination des raccourcis. */
function entryOf(index: number) {
  const s = scenes[index];
  return stops.find((p) => p >= s.start && p < s.end) ?? s.start + 0.01;
}

/**
 * Indicateur de progression : une graduation par environnement.
 * Chaque graduation est un bouton accessible au clavier.
 */
export function ProgressRail() {
  const active = useExperience((s) => s.sceneIndex);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (p: number) => {
      if (fill.current) fill.current.style.transform = `scaleY(${p.toFixed(4)})`;
    };
    apply(experienceStore.getState().progress);
    return experienceStore.subscribe((s, prev) => {
      if (s.progress !== prev.progress) apply(s.progress);
    });
  }, []);

  return (
    <nav
      aria-label="Séquences de l’expérience"
      className="pointer-events-auto absolute right-4 top-1/2 z-40 hidden -translate-y-1/2 md:right-8 md:block"
    >
      <div className="relative flex flex-col gap-7 pl-5">
        <div className="absolute bottom-1 left-0 top-1 w-px bg-bone/20">
          <div ref={fill} className="h-full w-px origin-top bg-bone/80" style={{ transform: "scaleY(0)" }} />
        </div>
        {scenes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => requestJump(entryOf(s.index))}
            aria-current={active === s.index ? "step" : undefined}
            aria-label={`Aller à la séquence ${chapterLabels[s.id]}`}
            className="group flex items-center gap-3 text-left text-[0.62rem] font-medium uppercase tracking-[0.32em] text-bone/55 transition-colors hover:text-bone aria-[current=step]:text-bone"
          >
            <span className="tabular-nums">{String(s.index + 1).padStart(2, "0")}</span>
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-500 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:opacity-100 group-aria-[current=step]:max-w-40 group-aria-[current=step]:opacity-100">
              {chapterLabels[s.id]}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/** Barre de progression horizontale (mobile). */
export function ProgressBar() {
  const fill = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const apply = (p: number) => {
      if (fill.current) fill.current.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    apply(experienceStore.getState().progress);
    return experienceStore.subscribe((s, prev) => {
      if (s.progress !== prev.progress) apply(s.progress);
    });
  }, []);
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 z-40 h-[2px] bg-bone/15 md:hidden">
      <div ref={fill} className="h-full origin-left bg-bone/80" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}

export function SkipIntro() {
  const finale = entryOf(scenes.length - 1);
  return (
    <button
      type="button"
      onClick={() => requestJump(finale)}
      className="pointer-events-auto absolute bottom-6 right-5 z-40 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-bone/70 underline-offset-8 transition-colors hover:text-bone hover:underline md:bottom-10 md:right-10"
    >
      Passer l’introduction
    </button>
  );
}

export function ScrollCue() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const apply = (p: number) => {
      if (ref.current) ref.current.style.opacity = String(Math.max(0, 1 - p * 60));
    };
    return experienceStore.subscribe((s, prev) => {
      if (s.progress !== prev.progress) apply(s.progress);
    });
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3 md:bottom-10"
    >
      <span className="text-[0.6rem] font-medium uppercase tracking-[0.4em] text-bone/70">Faites défiler</span>
      <span className="scroll-cue-line block h-10 w-px overflow-hidden bg-bone/20" />
    </div>
  );
}

export function LoadingNotice() {
  const waiting = useExperience((s) => s.waiting);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute left-1/2 top-24 z-40 -translate-x-1/2 text-[0.62rem] uppercase tracking-[0.35em] text-bone/80 transition-opacity duration-500 ${
        waiting ? "opacity-100" : "opacity-0"
      }`}
    >
      {waiting ? "Chargement de l’environnement suivant…" : ""}
    </div>
  );
}
