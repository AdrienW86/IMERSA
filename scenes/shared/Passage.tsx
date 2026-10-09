"use client";

import type { Material } from "three";
import { slab } from "@/lib/geometry";
import { useDisposable } from "@/hooks/useDisposable";

interface PassageProps {
  /** Centre du sol du passage (repère local de la séquence). */
  position: [number, number, number];
  width?: number;
  height?: number;
  length?: number;
  material: Material;
  /** Couleur du filet lumineux qui guide le regard dans la pénombre. */
  glow?: string;
}

/**
 * Passage sombre servant de seuil entre deux environnements.
 * Il est reproduit à l'identique de part et d'autre de la bascule :
 * la caméra ne quitte jamais un espace construit.
 */
export function Passage({
  position,
  width = 1.7,
  height = 3.1,
  length = 6,
  material,
  glow = "#ffd9a8",
}: PassageProps) {
  const [floor, wall, ceiling, strip] = useDisposable(
    () => [
      slab(width + 0.4, 0.1, length),
      slab(0.2, height, length),
      slab(width + 0.4, 0.2, length),
      slab(0.02, 0.012, length * 0.96),
    ],
    [width, height, length],
  );
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      <mesh geometry={floor} material={material} position={[0, -0.05, 0]} receiveShadow />
      <mesh geometry={ceiling} material={material} position={[0, height + 0.1, 0]} />
      <mesh geometry={wall} material={material} position={[-width / 2 - 0.1, height / 2, 0]} receiveShadow />
      <mesh geometry={wall} material={material} position={[width / 2 + 0.1, height / 2, 0]} receiveShadow />
      <mesh geometry={strip} position={[-width / 2 + 0.03, 0.03, 0]}>
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
      <mesh geometry={strip} position={[width / 2 - 0.03, 0.03, 0]}>
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
    </group>
  );
}
