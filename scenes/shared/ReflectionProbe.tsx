"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { CubeCamera, type Group, HalfFloatType, type Object3D, WebGLCubeRenderTarget } from "three";
import { useDisposable } from "@/hooks/useDisposable";

function isDisplayed(object: Object3D | null) {
  let o = object;
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}

/** Cible cubique de la sonde : à fournir aux matériaux réfléchissants dès leur création. */
export function useProbeTarget(resolution: number) {
  return useDisposable(
    () => new WebGLCubeRenderTarget(resolution, { type: HalfFloatType, generateMipmaps: true }),
    [resolution],
  );
}

/**
 * Sonde de réflexion : capture une seule fois l'environnement réel de la
 * séquence (cube map) dès qu'elle est affichée. Miroirs et marbres reflètent
 * ainsi le décor lui-même plutôt qu'une image d'environnement générique.
 */
export function ReflectionProbe({
  position,
  target,
}: {
  position: [number, number, number];
  target: WebGLCubeRenderTarget;
}) {
  const anchor = useRef<Group>(null);
  const probe = useRef<{ camera: CubeCamera; captured: boolean } | null>(null);

  useEffect(() => {
    probe.current = { camera: new CubeCamera(0.05, 400, target), captured: false };
    return () => {
      probe.current = null;
    };
  }, [target]);

  useFrame(({ gl, scene }) => {
    const p = probe.current;
    if (!p || p.captured || !anchor.current || !isDisplayed(anchor.current)) return;
    anchor.current.updateWorldMatrix(true, false);
    p.camera.position.setFromMatrixPosition(anchor.current.matrixWorld);
    p.camera.update(gl, scene);
    p.camera.renderTarget.texture.needsPMREMUpdate = true;
    p.captured = true;
  });

  return <group ref={anchor} position={position} />;
}
