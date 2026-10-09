"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, type Material, type Mesh, type MeshPhysicalMaterial } from "three";
import { registerModel } from "@/lib/assets";

export interface MaterialTint {
  color?: string;
  sheenColor?: string;
  roughness?: number;
}

type ModelProps = ThreeElements["group"] & {
  url: string;
  /** Recoloration de certains matériaux (par nom), pour accorder les modèles à la palette. */
  tints?: Record<string, MaterialTint>;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

/**
 * Instance d'un modèle glTF optimisé (Meshopt + WebP).
 * Les instances partagent géométries et textures ; seuls les matériaux
 * recolorés sont dupliqués.
 */
export function Model({ url, tints, castShadow = true, receiveShadow = true, ...props }: ModelProps) {
  const gltf = useGLTF(url);
  useEffect(() => registerModel(url, gltf.scene), [url, gltf.scene]);

  const { object, owned } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const replaced = new Map<Material, Material>();
    root.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      const material = mesh.material as Material;
      const tint = tints?.[material.name];
      if (!tint) return;
      let copy = replaced.get(material);
      if (!copy) {
        const m = material.clone() as MeshPhysicalMaterial;
        if (tint.color) m.color = new Color(tint.color);
        if (tint.sheenColor && "sheenColor" in m) m.sheenColor = new Color(tint.sheenColor);
        if (tint.roughness !== undefined) m.roughness = tint.roughness;
        copy = m;
        replaced.set(material, copy);
      }
      mesh.material = copy;
    });
    return { object: root, owned: [...replaced.values()] };
  }, [gltf.scene, tints, castShadow, receiveShadow]);

  useEffect(() => () => owned.forEach((m) => m.dispose()), [owned]);

  return (
    <group {...props}>
      <primitive object={object} />
    </group>
  );
}
