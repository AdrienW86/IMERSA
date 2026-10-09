"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  CubeCamera,
  type Group,
  type Mesh,
  type MeshPhysicalMaterial,
  type Object3D,
  SRGBColorSpace,
  UnsignedByteType,
  WebGLCubeRenderTarget,
} from "three";
import { useDisposable } from "@/hooks/useDisposable";

/**
 * Instants de capture (secondes d'affichage) : une première capture immédiate,
 * puis deux autres une fois l'éclairage de la séquence stabilisé.
 */
const CAPTURE_AT = [0, 1.5, 4];

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
    () =>
      // Capture en 8 bits (encodée sRGB) : une valeur non finie produite par un
      // shader dans la capture devient du noir local, au lieu de se propager à
      // l'image entière via le halo lumineux du post-traitement.
      new WebGLCubeRenderTarget(resolution, {
        type: UnsignedByteType,
        colorSpace: SRGBColorSpace,
        generateMipmaps: true,
      }),
    [resolution],
  );
}

/**
 * Sonde de réflexion : capture l'environnement réel de la séquence (cube
 * map) dès qu'elle est affichée, puis l'actualise une fois la lumière stabilisée. Miroirs et marbres reflètent
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
  const probe = useRef<{ camera: CubeCamera; captures: number; shownFor: number } | null>(null);

  useEffect(() => {
    probe.current = { camera: new CubeCamera(0.05, 400, target), captures: 0, shownFor: 0 };
    return () => {
      probe.current = null;
    };
  }, [target]);

  useFrame(({ gl, scene }, delta) => {
    const p = probe.current;
    if (!p || p.captures >= CAPTURE_AT.length || !anchor.current || !isDisplayed(anchor.current)) return;
    p.shownFor += delta;
    if (p.shownFor < CAPTURE_AT[p.captures]) return;
    anchor.current.updateWorldMatrix(true, false);
    p.camera.position.setFromMatrixPosition(anchor.current.matrixWorld);
    // Les matériaux à transmission ne sont pas rendus dans la capture cubique
    // (passe de transmission incompatible) : ils sont masqués le temps de la capture.
    const hidden: Object3D[] = [];
    scene.traverseVisible((obj) => {
      const mat = (obj as Mesh).material as MeshPhysicalMaterial | undefined;
      if ((obj as Mesh).isMesh && mat && (mat.transmission ?? 0) > 0) hidden.push(obj);
    });
    hidden.forEach((o) => (o.visible = false));
    p.camera.update(gl, scene);
    hidden.forEach((o) => (o.visible = true));
    p.camera.renderTarget.texture.needsPMREMUpdate = true;
    p.captures++;
  });

  return <group ref={anchor} position={position} />;
}
