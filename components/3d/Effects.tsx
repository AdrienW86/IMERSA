"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode, type BloomEffect, type DepthOfFieldEffect } from "postprocessing";
import { useMemo, useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { experienceStore } from "@/lib/experience-store";
import {
  createLightingSample,
  focusAt,
  lightingAt,
  sampleCamera,
  type CameraSample,
  type FocusState,
} from "@/lib/journey";
import type { QualitySettings } from "@/lib/quality";

/**
 * Post-traitement : profondeur de champ pilotée par le parcours (légère en
 * plan large, très marquée en plan macro sur les objets repères), halo des
 * sources lumineuses, vignettage et tonemapping filmique.
 */
export function Effects({ settings }: { settings: QualitySettings }) {
  const bloom = useRef<BloomEffect>(null);
  const dof = useRef<DepthOfFieldEffect>(null);
  const state = useMemo(
    () => ({
      lighting: createLightingSample(),
      camera: { position: new Vector3(), target: new Vector3(), fov: 50 } as CameraSample,
      focus: { target: new Vector3(), macro: 0 } as FocusState,
      smoothed: new Vector3(),
    }),
    [],
  );

  useFrame(({ camera }, delta) => {
    const p = experienceStore.getState().progress;
    const l = lightingAt(p, state.lighting);
    if (bloom.current) bloom.current.intensity = l.bloom;
    const effect = dof.current;
    if (!effect) return;
    sampleCamera(p, state.camera);
    focusAt(p, state.camera.target, state.focus);
    // Mise au point lissée, comme un pointeur de mise au point.
    state.smoothed.lerp(state.focus.target, 1 - Math.exp(-Math.min(delta, 0.05) * 8));
    // Garde-fou : une valeur non finie figerait la mise au point (image noire).
    if (!Number.isFinite(state.smoothed.x + state.smoothed.y + state.smoothed.z)) state.smoothed.copy(state.focus.target);
    const distance = Math.max(0.02, camera.position.distanceTo(state.smoothed));
    effect.cocMaterial.focusDistance = distance;
    effect.cocMaterial.focusRange = MathUtils.lerp(Math.max(2.5, distance * 0.6), 0.12, state.focus.macro);
    effect.bokehScale = MathUtils.lerp(settings.depthOfField * 0.3, settings.depthOfField * 4.5, state.focus.macro);
  });

  return (
    <EffectComposer multisampling={settings.multisampling} enableNormalPass={false}>
      {settings.depthOfField > 0 ? (
        <DepthOfField ref={dof} focusDistance={3} focusRange={3} bokehScale={1} resolutionScale={0.5} />
      ) : (
        <></>
      )}
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.2} intensity={0.4} />
      <Vignette offset={0.3} darkness={0.48} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
