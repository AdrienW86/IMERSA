"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  PointLight,
  Vector3,
} from "three";
import { experienceStore } from "@/lib/experience-store";
import { createLightingSample, lightingAt } from "@/lib/journey";
import type { QualitySettings } from "@/lib/quality";

const focus = new Vector3();
const forward = new Vector3();

/**
 * Rig d'éclairage global, commun à toutes les séquences.
 *
 * Le nombre et le type de lumières restent constants pendant tout le
 * parcours : les shaders ne sont jamais recompilés lors d'une transition.
 * Seuls les paramètres (couleurs, intensités, positions) sont interpolés.
 */
export function LightingRig({ settings }: { settings: QualitySettings }) {
  const get = useThree((s) => s.get);
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const p0 = useRef<PointLight>(null);
  const p1 = useRef<PointLight>(null);
  const sample = useRef(createLightingSample());

  useEffect(() => {
    const scene = get().scene;
    scene.fog = new FogExp2("#000000", 0);
    scene.background = new Color("#08090b");
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [get]);

  useEffect(() => {
    const light = sun.current;
    if (!light) return;
    const scene = get().scene;
    scene.add(light.target);
    return () => {
      scene.remove(light.target);
    };
  }, [get]);

  useFrame(({ scene, camera }) => {
    const p = experienceStore.getState().progress;
    const l = lightingAt(p, sample.current);
    const s = sun.current;
    if (s) {
      s.color.copy(l.sunColor);
      s.intensity = l.sunIntensity;
      // L'ombre portée suit la zone regardée ; le cadrage est aligné sur la
      // grille de texels pour éviter le scintillement des ombres.
      camera.getWorldDirection(forward);
      focus.copy(camera.position).addScaledVector(forward, l.shadowRadius * 0.55);
      const texel = (l.shadowRadius * 2) / settings.shadowMapSize;
      focus.set(
        Math.round(focus.x / texel) * texel,
        Math.round(focus.y / texel) * texel,
        Math.round(focus.z / texel) * texel,
      );
      s.position.copy(focus).add(l.sunOffset);
      s.target.position.copy(focus);
      s.target.updateMatrixWorld();
      const cam = s.shadow.camera;
      const r = l.shadowRadius;
      if (cam.right !== r) {
        cam.left = -r;
        cam.right = r;
        cam.top = r;
        cam.bottom = -r;
        cam.far = l.sunOffset.length() + r * 2;
        cam.updateProjectionMatrix();
      }
    }
    if (hemi.current) {
      hemi.current.color.copy(l.hemiSky);
      hemi.current.groundColor.copy(l.hemiGround);
      hemi.current.intensity = l.hemiIntensity;
    }
    [p0.current, p1.current].forEach((light, i) => {
      if (!light) return;
      const src = l.practicals[i];
      light.position.copy(src.position);
      light.color.copy(src.color);
      light.intensity = src.intensity;
      light.distance = src.distance;
    });
    const fog = scene.fog as FogExp2 | null;
    if (fog) {
      fog.color.copy(l.fogColor);
      fog.density = l.fogDensity;
    }
  }, -5);

  return (
    <>
      <directionalLight
        ref={sun}
        castShadow={settings.shadows}
        shadow-mapSize={[settings.shadowMapSize, settings.shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
      <hemisphereLight ref={hemi} />
      <pointLight ref={p0} decay={2} />
      <pointLight ref={p1} decay={2} />
    </>
  );
}
