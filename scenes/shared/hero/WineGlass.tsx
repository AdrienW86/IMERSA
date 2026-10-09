"use client";

import { Color, DoubleSide, MeshPhysicalMaterial } from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { lathe } from "@/lib/geometry";

/** Hauteur du centre du calice au-dessus de la base (centre de cadrage du raccord). */
export const GLASS_BOWL_CENTER = 0.128;

/** Profil du verre à pied : pied, jambe, calice (paroi épaisse de 1,5 mm). */
const OUTER: [number, number][] = [
  [0.001, 0],
  [0.036, 0],
  [0.038, 0.002],
  [0.034, 0.004],
  [0.008, 0.009],
  [0.0045, 0.02],
  [0.004, 0.075],
  [0.006, 0.086],
  [0.02, 0.095],
  [0.036, 0.11],
  [0.043, 0.135],
  [0.042, 0.165],
  [0.037, 0.19],
  [0.034, 0.205],
];
const INNER: [number, number][] = [
  [0.0325, 0.205],
  [0.0355, 0.19],
  [0.0405, 0.165],
  [0.0415, 0.135],
  [0.0345, 0.111],
  [0.019, 0.097],
  [0.001, 0.092],
];
/** Vin : volume du calice jusqu'au niveau de remplissage. */
const WINE: [number, number][] = [
  [0.001, 0.0925],
  [0.019, 0.0975],
  [0.0343, 0.1115],
  [0.0412, 0.135],
  [0.0412, 0.142],
  [0.001, 0.142],
];

/**
 * Verre de rosé. Objet repère du premier raccord : identique dans la villa
 * et dans le mas.
 */
export function WineGlass({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const g = useDisposable(
    () => ({ glass: lathe([...OUTER, ...INNER], 64), wine: lathe(WINE, 64) }),
    [],
  );
  // Verre sans passe de transmission : la transmission physique entre en conflit
  // avec la sonde de réflexion du château. Reflets, clearcoat et transparence
  // suffisent à la lecture du verre en plan macro.
  const m = useDisposable(
    () => ({
      glass: new MeshPhysicalMaterial({
        color: new Color("#ffffff"),
        metalness: 0,
        roughness: 0.02,
        transparent: true,
        opacity: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 3,
        side: DoubleSide,
        depthWrite: false,
      }),
      wine: new MeshPhysicalMaterial({
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        color: new Color("#f09a7a"),
        roughness: 0.04,
        transparent: true,
        opacity: 0.86,
        emissive: new Color("#c4502e"),
        emissiveIntensity: 0.22,
        envMapIntensity: 1.6,
      }),
    }),
    [],
  );
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={g.wine} material={m.wine} renderOrder={3} />
      <mesh geometry={g.glass} material={m.glass} renderOrder={4} castShadow />
    </group>
  );
}
