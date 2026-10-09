"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { EquirectangularReflectionMapping, PMREMGenerator, type Texture, type WebGLRenderer } from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { experienceStore } from "@/lib/experience-store";
import { createLightingSample, lightingAt } from "@/lib/journey";

/**
 * Cartes d'environnement (HDRI → PMREM) chargées à la demande.
 * Elles fournissent l'éclairage indirect et les reflets des matériaux.
 */

const cache = new Map<string, Promise<Texture>>();
const resolved = new Map<string, Texture>();
let pmrem: PMREMGenerator | null = null;
let pmremOwner: WebGLRenderer | null = null;

export function loadEnvironment(gl: WebGLRenderer, file: string): Promise<Texture> {
  const existing = cache.get(file);
  if (existing) return existing;
  if (!pmrem || pmremOwner !== gl) {
    pmrem?.dispose();
    pmrem = new PMREMGenerator(gl);
    pmremOwner = gl;
  }
  const generator = pmrem;
  const promise = new HDRLoader().loadAsync(file).then((hdr) => {
    hdr.mapping = EquirectangularReflectionMapping;
    const env = generator.fromEquirectangular(hdr).texture;
    hdr.dispose();
    resolved.set(file, env);
    return env;
  });
  promise.catch(() => cache.delete(file));
  cache.set(file, promise);
  return promise;
}

/** Libère les environnements qui ne sont plus utilisés par les séquences montées. */
export function releaseEnvironments(keep: Set<string>) {
  for (const [file, tex] of resolved) {
    if (keep.has(file)) continue;
    tex.dispose();
    resolved.delete(file);
    cache.delete(file);
  }
}

export function EnvironmentManager() {
  const get = useThree((s) => s.get);
  const sample = useMemo(() => createLightingSample(), []);

  useEffect(
    () => () => {
      get().scene.environment = null;
      resolved.forEach((t) => t.dispose());
      resolved.clear();
      cache.clear();
      pmrem?.dispose();
      pmrem = null;
      pmremOwner = null;
    },
    [get],
  );

  useFrame(({ gl, scene }) => {
    const l = lightingAt(experienceStore.getState().progress, sample);
    const env = resolved.get(l.envFile);
    if (env && scene.environment !== env) scene.environment = env;
    else if (!env) void loadEnvironment(gl, l.envFile);
    scene.environmentIntensity = l.envIntensity;
    scene.environmentRotation.y = l.envRotationY;
  }, -4);

  return null;
}
