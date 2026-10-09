"use client";

import { useLayoutEffect, useRef } from "react";
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  type InstancedMesh,
  type Material,
  MeshStandardMaterial,
  Object3D,
  Shape,
  ShapeGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useDisposable } from "@/hooks/useDisposable";
import { at, lathe, merge, slab } from "@/lib/geometry";

/* ------------------------------------------------------------------ */
/* Canapé modulable (coussins arrondis)                                */
/* ------------------------------------------------------------------ */

export interface SofaModule {
  /** Position du module (centre au sol) et largeur. */
  x: number;
  z: number;
  width: number;
  depth?: number;
  rotation?: number;
  /** Module sans dossier (méridienne / pouf). */
  open?: boolean;
}

/** Canapé bas en modules, assises et dossiers généreusement arrondis. */
export function ModularSofa({
  modules,
  fabric,
  position = [0, 0, 0],
  rotation = 0,
}: {
  modules: SofaModule[];
  fabric: Material;
  position?: [number, number, number];
  rotation?: number;
}) {
  const geometry = useDisposable(() => {
    const parts = modules.flatMap((mod) => {
      const d = mod.depth ?? 1.05;
      const base = at(mod.x, 0, mod.z, mod.rotation ?? 0);
      const list = [
        { geometry: slab(mod.width, 0.24, d, 0.06), matrix: base.clone().multiply(at(0, 0.12, 0)) },
        { geometry: slab(mod.width - 0.04, 0.2, d - (mod.open ? 0.06 : 0.3), 0.09), matrix: base.clone().multiply(at(0, 0.33, mod.open ? 0 : 0.12)) },
      ];
      if (!mod.open) {
        list.push({ geometry: slab(mod.width - 0.06, 0.48, 0.26, 0.11), matrix: base.clone().multiply(at(0, 0.5, -d / 2 + 0.14, 0, -0.12)) });
      }
      return list;
    });
    return merge(parts);
  }, [JSON.stringify(modules)]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={geometry} material={fabric} castShadow receiveShadow />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Petits objets de table                                              */
/* ------------------------------------------------------------------ */

/** Coupe en céramique noire émaillée. */
export function Bowl({ position, radius = 0.17, color = "#1d1b1a" }: { position: [number, number, number]; radius?: number; color?: string }) {
  const g = useDisposable(
    () =>
      lathe(
        [
          [0.001, 0],
          [radius * 0.35, 0],
          [radius * 0.38, 0.012],
          [radius * 0.8, radius * 0.22],
          [radius, radius * 0.42],
          [radius * 0.96, radius * 0.44],
          [radius * 0.76, radius * 0.25],
          [radius * 0.3, radius * 0.1],
          [0.001, radius * 0.1],
        ],
        48,
      ),
    [radius],
  );
  const m = useDisposable(() => new MeshStandardMaterial({ color: new Color(color), roughness: 0.32, metalness: 0.05 }), [color]);
  return <mesh geometry={g} material={m} position={position} castShadow receiveShadow />;
}

/** Vase / jarre en céramique ou terre cuite. */
export function Vase({
  position,
  scale = 1,
  color = "#d8cbb8",
  roughness = 0.75,
  profile = "round",
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  roughness?: number;
  profile?: "round" | "jar" | "pitcher";
}) {
  const g = useDisposable(() => {
    const profiles: Record<string, [number, number][]> = {
      round: [
        [0.001, 0],
        [0.06, 0],
        [0.11, 0.06],
        [0.13, 0.14],
        [0.1, 0.24],
        [0.05, 0.29],
        [0.05, 0.33],
        [0.06, 0.34],
        [0.045, 0.34],
        [0.04, 0.3],
      ],
      jar: [
        [0.001, 0],
        [0.12, 0],
        [0.2, 0.12],
        [0.24, 0.32],
        [0.2, 0.5],
        [0.12, 0.58],
        [0.13, 0.62],
        [0.11, 0.62],
        [0.1, 0.58],
      ],
      pitcher: [
        [0.001, 0],
        [0.06, 0],
        [0.085, 0.05],
        [0.09, 0.12],
        [0.06, 0.2],
        [0.05, 0.25],
        [0.065, 0.29],
        [0.055, 0.29],
        [0.045, 0.26],
      ],
    };
    return lathe(profiles[profile], 48).scale(scale, scale, scale);
  }, [scale, profile]);
  const m = useDisposable(() => new MeshStandardMaterial({ color: new Color(color), roughness }), [color, roughness]);
  return <mesh geometry={g} material={m} position={position} castShadow receiveShadow />;
}

/** Pile de livres d'art. */
export function Books({
  position,
  rotation = 0,
  colors = ["#e8e1d4", "#2b2a28", "#b9a37f"],
}: {
  position: [number, number, number];
  rotation?: number;
  colors?: string[];
}) {
  const m = useDisposable(() => colors.map((c) => new MeshStandardMaterial({ color: new Color(c), roughness: 0.7 })), [colors.join()]);
  const g = useDisposable(() => colors.map((_, i) => slab(0.3 - i * 0.03, 0.035, 0.24 - i * 0.02, 0.004)), [colors.length]);
  return (
    <group position={position} rotation-y={rotation}>
      {g.map((geo, i) => (
        <mesh key={i} geometry={geo} material={m[i]} position={[0, 0.0175 + i * 0.036, 0]} rotation-y={i % 2 ? 0.08 : -0.05} castShadow receiveShadow />
      ))}
    </group>
  );
}

/** Suspension en céramique mate (dôme), câble textile. */
export function CeramicPendant({
  position,
  drop,
  radius = 0.22,
  color = "#e9dfd0",
}: {
  position: [number, number, number];
  drop: number;
  radius?: number;
  color?: string;
}) {
  const g = useDisposable(
    () => ({
      shade: lathe(
        [
          [0.012, radius * 0.9],
          [radius * 0.3, radius * 0.86],
          [radius * 0.72, radius * 0.6],
          [radius * 0.95, radius * 0.25],
          [radius, 0],
          [radius * 0.97, 0],
          [radius * 0.92, radius * 0.24],
          [radius * 0.69, radius * 0.56],
          [radius * 0.28, radius * 0.82],
          [0.01, radius * 0.86],
        ],
        48,
      ),
      cord: slab(0.006, drop, 0.006),
      bulb: lathe([[0.001, 0], [0.045, 0.02], [0.05, 0.06], [0.001, 0.08]], 16),
    }),
    [radius, drop],
  );
  const m = useDisposable(
    () => ({
      shade: new MeshStandardMaterial({ color: new Color(color), roughness: 0.85, side: DoubleSide }),
      cord: new MeshStandardMaterial({ color: new Color("#3a3430"), roughness: 1 }),
      bulb: new MeshStandardMaterial({ color: new Color("#000"), emissive: new Color("#ffd29a"), emissiveIntensity: 5, toneMapped: false }),
    }),
    [color],
  );
  return (
    <group position={position}>
      <mesh geometry={g.shade} material={m.shade} castShadow />
      <mesh geometry={g.bulb} material={m.bulb} position={[0, radius * 0.25, 0]} />
      <mesh geometry={g.cord} material={m.cord} position={[0, radius * 0.86 + drop / 2, 0]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Olivier en pot                                                      */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Olivier : troncs tortueux, feuillage argenté en bouquets (feuilles
 * instanciées). Présent dans les trois univers comme fil conducteur végétal.
 */
export function OliveTree({
  position,
  scale = 1,
  seed = 1,
  pot = true,
  potColor = "#cdbfa9",
  leaves = 2600,
}: {
  position: [number, number, number];
  scale?: number;
  seed?: number;
  pot?: boolean;
  potColor?: string;
  leaves?: number;
}) {
  const leafMesh = useRef<InstancedMesh>(null);
  const data = useDisposable(() => {
    const random = rng(seed);
    const tips: Vector3[] = [];
    const tubes = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + random();
      const pts = [new Vector3(0, 0, 0)];
      let p = new Vector3(0, 0, 0);
      for (let i = 1; i <= 5; i++) {
        p = p.clone().add(new Vector3(Math.cos(a + i * 0.6) * 0.09 * i * 0.4, 0.32, Math.sin(a + i * 0.5) * 0.09 * i * 0.4));
        pts.push(p);
      }
      tips.push(p.clone());
      tubes.push(new TubeGeometry(new CatmullRomCurve3(pts), 24, 0.035 - k * 0.006, 8, false));
      // Rameaux secondaires.
      for (let b = 0; b < 3; b++) {
        const start = pts[2 + b];
        const dir = new Vector3(random() - 0.5, 0.6 + random() * 0.4, random() - 0.5).normalize();
        const end = start.clone().addScaledVector(dir, 0.35 + random() * 0.3);
        tips.push(end);
        tubes.push(new TubeGeometry(new CatmullRomCurve3([start, start.clone().lerp(end, 0.5).add(new Vector3(0, 0.05, 0)), end]), 8, 0.012, 6, false));
      }
    }
    const trunk = mergeGeometries(tubes);
    tubes.forEach((t) => t.dispose());
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.012, 0.03, 0, 0.075);
    shape.quadraticCurveTo(-0.012, 0.03, 0, 0);
    const leaf = new ShapeGeometry(shape, 3);
    const potGeo = lathe(
      [
        [0.001, -0.02],
        [0.2, -0.02],
        [0.26, 0.1],
        [0.3, 0.3],
        [0.31, 0.42],
        [0.33, 0.44],
        [0.29, 0.44],
        [0.28, 0.4],
        [0.001, 0.4],
      ],
      40,
    );
    return {
      trunk: trunk!,
      leaf,
      potGeo,
      tips,
      dispose() {
        trunk?.dispose();
        leaf.dispose();
        potGeo.dispose();
      },
    };
  }, [seed]);
  const m = useDisposable(
    () => ({
      bark: new MeshStandardMaterial({ color: new Color("#6d6152"), roughness: 1 }),
      leaf: new MeshStandardMaterial({ color: new Color("#ffffff"), roughness: 0.75, side: DoubleSide }),
      pot: new MeshStandardMaterial({ color: new Color(potColor), roughness: 0.9 }),
    }),
    [potColor],
  );

  useLayoutEffect(() => {
    const mesh = leafMesh.current;
    if (!mesh) return;
    const random = rng(seed + 99);
    const dummy = new Object3D();
    const silver = new Color("#9aa384");
    const dark = new Color("#4f5a3a");
    const c = new Color();
    for (let i = 0; i < leaves; i++) {
      const tip = data.tips[i % data.tips.length];
      const r = 0.32 * Math.cbrt(random());
      const th = random() * Math.PI * 2;
      const ph = Math.acos(2 * random() - 1);
      dummy.position.set(
        tip.x + r * Math.sin(ph) * Math.cos(th),
        tip.y + r * Math.cos(ph) * 0.6 + 0.05,
        tip.z + r * Math.sin(ph) * Math.sin(th),
      );
      dummy.rotation.set(random() * 6.28, random() * 6.28, random() * 6.28);
      dummy.scale.setScalar(0.8 + random() * 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, c.copy(dark).lerp(silver, random()));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [data, leaves, seed]);

  const lift = pot ? 0.4 : 0;
  return (
    <group position={position} scale={scale}>
      {pot && <mesh geometry={data.potGeo} material={m.pot} castShadow receiveShadow />}
      <group position={[0, lift, 0]}>
        <mesh geometry={data.trunk} material={m.bark} castShadow />
        <instancedMesh ref={leafMesh} args={[data.leaf, m.leaf, leaves]} castShadow />
      </group>
    </group>
  );
}

/**
 * Chaise de repas en bois : version contemporaine (dossier plein galbé) ou
 * rustique à barreaux (« ladder-back ») avec assise paillée.
 */
export function DiningChair({
  position,
  rotation = 0,
  wood,
  seat,
  style = "modern",
}: {
  position: [number, number, number];
  rotation?: number;
  wood: Material;
  seat: Material;
  style?: "modern" | "ladder";
}) {
  const g = useDisposable(() => {
    const ladder = style === "ladder";
    const r = ladder ? 0.018 : 0.0175;
    const front = [
      [-0.2, 0.2],
      [0.2, 0.2],
    ].map(([x, z]) => ({ geometry: slab(r * 2, 0.45, r * 2, 0.008), matrix: at(x, 0.225, z) }));
    // Montants arrière : prolongés jusqu'au sommet du dossier pour la version rustique.
    const backH = ladder ? 1.02 : 0.45;
    const rear = [-0.2, 0.2].map((x) => ({ geometry: slab(r * 2, backH, r * 2, 0.008), matrix: at(x, backH / 2, -0.2, 0, ladder ? -0.06 : 0) }));
    const rungs = ladder
      ? [0.6, 0.75, 0.9].map((y) => ({ geometry: slab(0.4, 0.055, 0.018, 0.008), matrix: at(0, y, -0.2 - (y - 0.45) * 0.06) }))
      : [{ geometry: slab(0.46, 0.3, 0.05, 0.02), matrix: at(0, 0.72, -0.22, 0, -0.12) }];
    const stretchers = [0.15, 0.3].map((y) => ({ geometry: slab(0.4, 0.02, 0.02, 0.006), matrix: at(0, y, 0.2) }));
    return {
      frame: merge([...front, ...rear, ...rungs, ...(ladder ? stretchers : [])]),
      seat: slab(0.46, ladder ? 0.05 : 0.07, 0.44, ladder ? 0.015 : 0.03),
    };
  }, [style]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={g.frame} material={wood} castShadow />
      <mesh geometry={g.seat} material={seat} position={[0, 0.48, 0]} castShadow receiveShadow />
    </group>
  );
}

