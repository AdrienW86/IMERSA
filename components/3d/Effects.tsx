"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode, type BloomEffect } from "postprocessing";
import { useMemo, useRef } from "react";
import { experienceStore } from "@/lib/experience-store";
import { createLightingSample, lightingAt } from "@/lib/journey";
import type { QualitySettings } from "@/lib/quality";

/**
 * Post-traitement : halo lumineux sur les sources émissives (intensité
 * propre à chaque séquence), vignettage discret et tonemapping filmique.
 */
export function Effects({ settings }: { settings: QualitySettings }) {
  const bloom = useRef<BloomEffect>(null);
  const sample = useMemo(() => createLightingSample(), []);

  useFrame(() => {
    const l = lightingAt(experienceStore.getState().progress, sample);
    if (bloom.current) bloom.current.intensity = l.bloom;
  });

  return (
    <EffectComposer multisampling={settings.multisampling} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.2} intensity={0.4} />
      <Vignette offset={0.32} darkness={0.42} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
