"use client";

import { PerformanceMonitor, StatsGl } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useState } from "react";
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from "three";
import { enterFallback, experienceStore, useExperience } from "@/lib/experience-store";
import { lowerTier, qualityPresets } from "@/lib/quality";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { EnvironmentManager } from "./EnvironmentManager";
import { LightingRig } from "./LightingRig";
import { SceneDirector } from "./SceneDirector";

/**
 * Moteur de rendu WebGL de l'expérience.
 * Un seul canvas, une seule caméra, un seul contrôleur de progression.
 */
export default function Stage({ mobile }: { mobile: boolean }) {
  const tier = useExperience((s) => s.quality);
  const inView = useExperience((s) => s.inView);
  const debug = useExperience((s) => s.debug);
  const locked = useExperience((s) => s.qualityLocked);
  const settings = qualityPresets[tier];
  const [dpr, setDpr] = useState(() => Math.min(settings.maxDpr, typeof window === "undefined" ? 1 : window.devicePixelRatio));

  // Adaptation dynamique : on réduit d'abord la résolution, puis le niveau de qualité.
  const onDecline = useCallback(() => {
    setDpr((current) => {
      if (current > 1.01) return Math.max(1, current - 0.25);
      const { quality } = experienceStore.getState();
      if (quality !== "low") experienceStore.setState({ quality: lowerTier(quality) });
      return current;
    });
  }, []);

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={Math.min(dpr, settings.maxDpr)}
      frameloop={inView ? "always" : "never"}
      shadows={settings.shadows ? { enabled: true, type: PCFShadowMap } : false}
      camera={{ fov: 52, near: 0.05, far: 4000, position: [0, 1.62, 0] }}
      gl={{
        antialias: !settings.postprocessing,
        alpha: false,
        stencil: false,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        outputColorSpace: SRGBColorSpace,
      }}
      onCreated={({ gl }) => {
        // Découpe par plan du jumeau numérique (séquence de révélation).
        gl.localClippingEnabled = true;
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          enterFallback("context-lost");
        });
      }}
      aria-hidden
    >
      {!locked && <PerformanceMonitor onDecline={onDecline} flipflops={3} />}
      <CameraRig mobile={mobile} />
      <LightingRig settings={settings} />
      <EnvironmentManager />
      <SceneDirector settings={settings} />
      {settings.postprocessing && <Effects settings={settings} />}
      {debug && <StatsGl className="!left-auto !right-2 !top-20" />}
    </Canvas>
  );
}
