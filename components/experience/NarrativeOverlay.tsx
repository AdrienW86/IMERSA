"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import Link from "next/link";
import { useRef } from "react";
import { buildNarrativeTimeline } from "@/animations/narrativeTimeline";
import { narrative } from "@/content/narrative";
import { experienceStore, useExperience } from "@/lib/experience-store";
import type { NarrativeBlock } from "@/types/experience";

gsap.registerPlugin(useGSAP);

const alignClass: Record<NarrativeBlock["align"], string> = {
  left: "items-start text-left md:pl-[7vw] md:pr-[40vw]",
  right: "items-end text-right md:pr-[9vw] md:pl-[42vw]",
  center: "items-center text-center md:px-[18vw]",
};

function Block({ block }: { block: NarrativeBlock }) {
  const hero = block.id === "hero";
  return (
    <div
      data-block={block.id}
      className={`narrative-block absolute inset-x-0 flex flex-col gap-5 px-6 ${alignClass[block.align]} ${
        hero ? "bottom-[16svh] md:bottom-[18svh]" : "bottom-[14svh] md:bottom-[16svh]"
      }`}
      style={{ visibility: block.enter < 0 ? "visible" : "hidden" }}
    >
      {block.lines.map((line) => {
        switch (line.kind) {
          case "brand":
            return (
              <p key={line.text} data-fade className="text-[0.7rem] font-medium uppercase tracking-[0.55em] text-bone/80">
                {line.text}
              </p>
            );
          case "eyebrow":
            return (
              <p key={line.text} data-fade className="text-[0.68rem] font-medium uppercase tracking-[0.4em] text-bone/70">
                {line.text}
              </p>
            );
          case "title":
            return hero ? (
              <h1 key={line.text} data-split className="display max-w-[15ch] text-[2.6rem] leading-[0.98] md:text-[5.2rem]">
                {line.text}
              </h1>
            ) : (
              <h2 key={line.text} data-split className="display max-w-[16ch] text-[2.2rem] leading-[1] md:text-[4.4rem]">
                {line.text}
              </h2>
            );
          case "lead":
            return (
              <p key={line.text} data-fade className="max-w-[34ch] text-[0.98rem] leading-relaxed text-bone/85 md:text-[1.12rem]">
                « {line.text} »
              </p>
            );
        }
      })}
      {block.cta && (
        <div data-fade className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Link href="/plateforme" className="btn btn-solid">
            Découvrir IMERSA
          </Link>
          <Link href="/demo" className="btn btn-ghost">
            Demander une démonstration
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Textes narratifs superposés à la scène. Leur apparition est pilotée par la
 * progression effective de la caméra : texte et image restent synchronisés.
 */
export function NarrativeOverlay() {
  const root = useRef<HTMLDivElement>(null);
  const status = useExperience((s) => s.status);
  const introPlayed = useRef(false);

  useGSAP(
    () => {
      if (!root.current || status === "fallback") return;
      const { timeline, revert } = buildNarrativeTimeline(root.current);
      timeline.progress(experienceStore.getState().progress);

      // Ouverture : la signature se révèle une fois la villa prête.
      const hero = root.current.querySelector<HTMLElement>('[data-block="hero"]');
      if (hero && status === "running" && !introPlayed.current) {
        introPlayed.current = true;
        if (!experienceStore.getState().reducedMotion) {
          gsap.from(hero.querySelectorAll(".word"), {
            yPercent: 115,
            duration: 1.5,
            stagger: 0.07,
            ease: "expo.out",
            delay: 0.35,
          });
          gsap.from(hero.querySelectorAll("[data-fade]"), {
            autoAlpha: 0,
            y: 14,
            duration: 1.4,
            stagger: 0.2,
            ease: "power2.out",
            delay: 0.15,
          });
        }
      }
      const unsubscribe = experienceStore.subscribe((s, prev) => {
        if (s.progress !== prev.progress) timeline.progress(s.progress);
      });
      return () => {
        unsubscribe();
        revert();
      };
    },
    { scope: root, dependencies: [status] },
  );

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 z-20 text-bone [&_a]:pointer-events-auto">
      {narrative.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  );
}
