"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { Component, useEffect, type ReactNode } from "react";
import { enterFallback, experienceStore, requestJump, useExperience } from "@/lib/experience-store";
import { detectCapabilities } from "@/lib/quality";
import { registerJourneyTrigger } from "@/lib/scroll";
import { LoadingScreen } from "./LoadingScreen";
import { NarrativeOverlay } from "./NarrativeOverlay";
import { LoadingNotice, ProgressBar, ProgressRail, ScrollCue, SkipIntro } from "./ProgressRail";
import { StaticJourney } from "./StaticJourney";
import { Veils } from "./Veils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Le moteur WebGL n'est jamais rendu côté serveur et vit dans son propre bundle.
const Stage = dynamic(() => import("@/components/3d/Stage"), { ssr: false });

class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[IMERSA] Erreur du moteur 3D", error);
    enterFallback("runtime");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Racine client de l'expérience : détection des capacités, liaison au scroll,
 * moteur 3D et interface superposée.
 */
export function ExperienceRoot({ sectionId }: { sectionId: string }) {
  const status = useExperience((s) => s.status);
  const reason = useExperience((s) => s.fallbackReason);
  const villaReady = useExperience((s) => !!s.ready.villa);
  const mobile = useExperience((s) => s.mobile);

  // Détection des capacités et préférences de l'appareil.
  useEffect(() => {
    const report = detectCapabilities();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    experienceStore.setState({
      mobile: window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900,
    });
    if (!report.webgl2) {
      enterFallback("webgl");
      return;
    }
    // Outils de diagnostic : ?quality=low|medium|high force un niveau de qualité.
    const params = new URLSearchParams(window.location.search);
    // Captures automatisées (rendu logiciel très lent) : pas de lissage des retards GSAP.
    if (params.has("capture")) {
      gsap.ticker.lagSmoothing(0);
      (window as unknown as { __imersa: typeof experienceStore }).__imersa = experienceStore;
    }
    const forced = params.get("quality");
    const tier = forced === "low" || forced === "medium" || forced === "high" ? forced : report.tier;
    experienceStore.setState({
      status: "loading",
      quality: tier,
      reducedMotion: reduced.matches,
      debug: params.has("stats"),
      qualityLocked: tier === forced,
    });
    const onChange = () => experienceStore.setState({ reducedMotion: reduced.matches });
    reduced.addEventListener("change", onChange);
    return () => reduced.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (villaReady && experienceStore.getState().status === "loading") {
      experienceStore.setState({ status: "running" });
      // Diagnostic : ?p=0.42 ouvre directement le parcours à cette progression.
      const start = Number(new URLSearchParams(window.location.search).get("p"));
      if (start > 0 && start <= 1) requestJump(start);
    }
  }, [villaReady]);

  // Liaison scroll → progression demandée.
  useGSAP(
    () => {
      if (status === "fallback") return;
      const section = document.getElementById(sectionId);
      if (!section) return;
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => experienceStore.setState({ target: self.progress }),
        onRefresh: (self) => experienceStore.setState({ target: self.progress }),
      });
      registerJourneyTrigger(trigger);
      const observer = new IntersectionObserver(([entry]) =>
        experienceStore.setState({ inView: entry.isIntersecting }),
      );
      observer.observe(section);
      return () => {
        observer.disconnect();
        registerJourneyTrigger(null);
        trigger.kill();
      };
    },
    { dependencies: [status, sectionId] },
  );

  // Le parcours est verrouillé en haut de page pendant le chargement initial.
  useEffect(() => {
    if (status !== "loading" && status !== "detecting") return;
    if (window.scrollY > 0) return;
    document.documentElement.classList.add("is-loading");
    return () => document.documentElement.classList.remove("is-loading");
  }, [status]);

  // En mode alternatif, la section reprend une hauteur naturelle.
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (section) section.dataset.mode = status === "fallback" ? "static" : "immersive";
  }, [status, sectionId]);

  if (status === "fallback") {
    return <StaticJourney reason={reason} />;
  }

  return (
    <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
      <StageBoundary>{status !== "detecting" && <Stage mobile={mobile} />}</StageBoundary>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[55%] bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-40 bg-gradient-to-b from-black/45 to-transparent" />
      <Veils />
      <NarrativeOverlay />
      <ProgressRail />
      <ProgressBar />
      <ScrollCue />
      <SkipIntro />
      <LoadingNotice />
      <LoadingScreen />
    </div>
  );
}
