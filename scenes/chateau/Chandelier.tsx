"use client";

import {
  CatmullRomCurve3,
  CylinderGeometry,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { at, lathe, merge } from "@/lib/geometry";
import type { ChateauMaterials } from "./useChateauMaterials";

/**
 * Lustre à pampilles : fût tourné doré, deux couronnes de bras, bougies et
 * guirlandes de cristaux. Toutes les pièces d'un même matériau sont
 * fusionnées : quatre appels de rendu par lustre.
 */
export function useChandelierGeometry(scale = 1) {
  return useDisposable(() => {
    const gold = [];
    const candles = [];
    const flames = [];
    const crystals = [];

    gold.push({
      geometry: lathe(
        [
          [0.001, 0],
          [0.09, 0.05],
          [0.14, 0.2],
          [0.06, 0.4],
          [0.05, 0.9],
          [0.11, 1.05],
          [0.05, 1.2],
          [0.04, 1.9],
          [0.08, 2.0],
          [0.02, 2.1],
          [0.02, 3.4],
        ],
        24,
      ),
      matrix: at(0, 0, 0),
    });

    const tiers = [
      { y: 0.55, radius: 1.05, arms: 10, drop: 0.25 },
      { y: 1.35, radius: 0.62, arms: 6, drop: 0.18 },
    ];
    for (const tier of tiers) {
      gold.push({
        geometry: new TorusGeometry(tier.radius * 0.92, 0.018, 8, 64).rotateX(Math.PI / 2),
        matrix: at(0, tier.y - 0.05, 0),
      });
      for (let i = 0; i < tier.arms; i++) {
        const a = (i / tier.arms) * Math.PI * 2;
        const dir = new Vector3(Math.cos(a), 0, Math.sin(a));
        const curve = new CatmullRomCurve3([
          new Vector3(0, tier.y + 0.15, 0),
          dir.clone().multiplyScalar(tier.radius * 0.35).setY(tier.y - 0.12),
          dir.clone().multiplyScalar(tier.radius * 0.8).setY(tier.y - 0.08),
          dir.clone().multiplyScalar(tier.radius).setY(tier.y + 0.1),
        ]);
        gold.push({ geometry: new TubeGeometry(curve, 16, 0.018, 6, false), matrix: at(0, 0, 0) });
        const tip = dir.clone().multiplyScalar(tier.radius);
        gold.push({ geometry: new CylinderGeometry(0.05, 0.03, 0.05, 12), matrix: at(tip.x, tier.y + 0.12, tip.z) });
        candles.push({ geometry: new CylinderGeometry(0.018, 0.018, 0.16, 8), matrix: at(tip.x, tier.y + 0.22, tip.z) });
        flames.push({ geometry: new SphereGeometry(0.022, 8, 6).scale(1, 1.8, 1), matrix: at(tip.x, tier.y + 0.33, tip.z) });
        // Guirlande de pampilles entre deux bras.
        const b = ((i + 0.5) / tier.arms) * Math.PI * 2;
        for (let k = 0; k < 7; k++) {
          const t = k / 6;
          const ang = a + (b - a) * t * 2;
          const sag = Math.sin(t * Math.PI) * tier.drop;
          const r = tier.radius * 0.9;
          crystals.push({
            geometry: new OctahedronGeometry(0.026, 0).scale(1, 1.6, 1),
            matrix: at(Math.cos(ang) * r, tier.y - 0.02 - sag, Math.sin(ang) * r),
          });
        }
        crystals.push({
          geometry: new OctahedronGeometry(0.04, 0).scale(1, 2.2, 1),
          matrix: at(tip.x * 0.92, tier.y - 0.12, tip.z * 0.92),
        });
      }
    }
    // Cascade centrale et boule terminale.
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      for (let j = 0; j < 5; j++) {
        crystals.push({
          geometry: new OctahedronGeometry(0.022, 0).scale(1, 1.6, 1),
          matrix: at(Math.cos(a) * 0.28, 0.42 - j * 0.09, Math.sin(a) * 0.28),
        });
      }
    }
    crystals.push({ geometry: new SphereGeometry(0.09, 16, 12), matrix: at(0, -0.08, 0) });

    const s = (parts: { geometry: import("three").BufferGeometry; matrix: import("three").Matrix4 }[]) =>
      merge(parts).scale(scale, scale, scale);
    return { gold: s(gold), candles: s(candles), flames: s(flames), crystals: s(crystals) };
  }, [scale]);
}

export function Chandelier({
  geometry,
  m,
  position,
}: {
  geometry: ReturnType<typeof useChandelierGeometry>;
  m: ChateauMaterials;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh geometry={geometry.gold} material={m.gold} />
      <mesh geometry={geometry.candles} material={m.candle} />
      <mesh geometry={geometry.flames} material={m.flame} />
      <mesh geometry={geometry.crystals} material={m.crystal} />
    </group>
  );
}
