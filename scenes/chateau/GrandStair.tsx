"use client";

import { useLayoutEffect, useRef } from "react";
import { Color, type InstancedMesh, Matrix4, PlaneGeometry, ShaderMaterial } from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { archedPanel, at, lathe, merge, slab } from "@/lib/geometry";
import { GALLERY, HALL, STAIR } from "./constants";
import type { ChateauMaterials } from "./useChateauMaterials";

const { halfWidth: HW, z1: HZ1, height: HH } = HALL;
const GZ1 = GALLERY.z1;
const HMID = (GZ1 + HZ1) / 2;
const HLEN = GZ1 - HZ1;
const TOTAL_RISE = STAIR.steps * STAIR.rise;

/** Profil de balustre tourné. */
const BALUSTER: [number, number][] = [
  [0.001, 0],
  [0.07, 0],
  [0.07, 0.06],
  [0.05, 0.09],
  [0.045, 0.16],
  [0.085, 0.36],
  [0.06, 0.52],
  [0.035, 0.6],
  [0.05, 0.66],
  [0.065, 0.7],
  [0.065, 0.76],
  [0.001, 0.76],
];

/** Une rampe : suite de balustres le long d'un segment (éventuellement incliné). */
interface Rail {
  from: [number, number, number];
  to: [number, number, number];
}

const RAILS: Rail[] = (() => {
  const { start, run, landing, side, upper } = STAIR;
  const end = start - STAIR.steps * run;
  const halfW = STAIR.width / 2;
  const rails: Rail[] = [];
  for (const s of [-1, 1]) {
    // Volée centrale (rampes inclinées).
    rails.push({ from: [s * (halfW + 0.15), 0.25, start], to: [s * (halfW + 0.15), TOTAL_RISE, end] });
    // Volées latérales, en retour vers la galerie.
    rails.push({ from: [s * (side.inner - 0.15), TOTAL_RISE, landing.z0], to: [s * (side.inner - 0.15), upper, landing.z0 + STAIR.steps * run] });
    // Bord du palier, de part et d'autre de la volée centrale.
    rails.push({ from: [s * (halfW + 0.15), TOTAL_RISE, end], to: [s * (side.inner - 0.15), TOTAL_RISE, end] });
    // Galeries hautes, le long des murs latéraux.
    rails.push({ from: [s * (side.outer + 0.15), upper, landing.z0 + STAIR.steps * run], to: [s * (side.outer + 0.15), upper, GZ1 - 0.8] });
  }
  return rails;
})();

function Balustrades({ m }: { m: ChateauMaterials }) {
  const ref = useRef<InstancedMesh>(null);
  const spacing = 0.26;
  const counts = RAILS.map((r) => Math.max(2, Math.round(Math.hypot(r.to[0] - r.from[0], r.to[2] - r.from[2]) / spacing)));
  const total = counts.reduce((a, b) => a + b, 0);
  const g = useDisposable(() => {
    const handrails = RAILS.map((r) => {
      const dx = r.to[0] - r.from[0];
      const dy = r.to[1] - r.from[1];
      const dz = r.to[2] - r.from[2];
      const len = Math.hypot(dx, dy, dz);
      const yaw = Math.atan2(dx, dz);
      const pitch = -Math.atan2(dy, Math.hypot(dx, dz));
      return {
        geometry: slab(0.26, 0.12, len, 0.02),
        matrix: at((r.from[0] + r.to[0]) / 2, (r.from[1] + r.to[1]) / 2 + 0.82, (r.from[2] + r.to[2]) / 2, yaw, pitch),
      };
    });
    return { baluster: lathe(BALUSTER, 16), handrails: merge(handrails) };
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const mat = new Matrix4();
    let i = 0;
    RAILS.forEach((r, k) => {
      const n = counts[k];
      for (let j = 0; j < n; j++) {
        const t = (j + 0.5) / n;
        mat.makeTranslation(
          r.from[0] + (r.to[0] - r.from[0]) * t,
          r.from[1] + (r.to[1] - r.from[1]) * t,
          r.from[2] + (r.to[2] - r.from[2]) * t,
        );
        mesh.setMatrixAt(i++, mat);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [counts]);

  return (
    <group>
      <instancedMesh ref={ref} args={[g.baluster, m.marble, total]} castShadow receiveShadow />
      <mesh geometry={g.handrails} material={m.marble} castShadow receiveShadow />
    </group>
  );
}

/** Lumière du jour à travers la grande baie (fond surexposé). */
function WindowLight({ width, height }: { width: number; height: number }) {
  const geometry = useDisposable(() => new PlaneGeometry(width, height), [width, height]);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        toneMapped: false,
        fog: false,
        uniforms: { uColor: { value: new Color("#fff4e2") } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; varying vec2 vUv;
          void main(){ gl_FragColor = vec4(uColor * (2.2 + vUv.y * 1.2), 1.0); }
        `,
      }),
    [],
  );
  return <mesh geometry={geometry} material={material} />;
}

export function GrandStair({ m }: { m: ChateauMaterials }) {
  const g = useDisposable(() => {
    const { start, run, rise, steps, landing, side, upper } = STAIR;
    const treads = [];
    const carpet = [];
    for (let i = 0; i < steps; i++) {
      const z = start - i * run - run / 2;
      const y = (i + 1) * rise;
      // Volée centrale : marches massives (nez de marche arrondi).
      treads.push({ geometry: slab(STAIR.width, y, run + 0.04, 0.02), matrix: at(0, y / 2, z) });
      carpet.push({ geometry: slab(STAIR.width * 0.6, 0.012, run), matrix: at(0, y + 0.006, z) });
      carpet.push({ geometry: slab(STAIR.width * 0.6, rise, 0.012), matrix: at(0, y - rise / 2, z + run / 2 + 0.006) });
      // Volées latérales : marches portées par un limon rampant (dessous dégagé).
      for (const s of [-1, 1]) {
        const zs = landing.z0 + i * run + run / 2;
        const ys = TOTAL_RISE + (i + 1) * rise;
        treads.push({
          geometry: slab(side.outer - side.inner, rise + 0.08, run + 0.04, 0.02),
          matrix: at(s * (side.inner + side.outer) / 2, ys - (rise + 0.08) / 2, zs),
        });
      }
    }
    const flightLen = Math.hypot(steps * run, steps * rise);
    const pitch = Math.atan2(steps * rise, steps * run);
    for (const s of [-1, 1]) {
      treads.push({
        geometry: slab(side.outer - side.inner, 0.55, flightLen, 0.02),
        matrix: at(s * (side.inner + side.outer) / 2, TOTAL_RISE + (steps * rise) / 2 - 0.42, landing.z0 + (steps * run) / 2, 0, -pitch),
      });
    }
    // Palier intermédiaire et galeries hautes.
    treads.push({ geometry: slab(landing.halfWidth * 2, TOTAL_RISE, landing.z0 - landing.z1), matrix: at(0, TOTAL_RISE / 2, (landing.z0 + landing.z1) / 2) });
    const upperLen = landing.z1 - (GZ1 - 0.8);
    for (const s of [-1, 1]) {
      treads.push({ geometry: slab(HW - side.outer + 0.2, 0.5, -upperLen), matrix: at(s * (side.outer + HW) / 2, upper - 0.25, (landing.z1 + GZ1 - 0.8) / 2) });
    }

    // Murs du hall : façade vers la galerie (grande arcade), murs latéraux, mur du fond avec baie.
    const front = archedPanel(HW * 2 + 1, HH, 1.2, { width: GALLERY.halfWidth * 2, sill: 0, spring: GALLERY.wallHeight + 0.7 }, -0.5);
    const back = archedPanel(HW * 2 + 1, HH, 1.2, { width: 7, sill: 5, spring: 13 });
    const sides = merge([
      { geometry: slab(1, HH, HLEN), matrix: at(-HW - 0.5, HH / 2, HMID) },
      { geometry: slab(1, HH, HLEN), matrix: at(HW + 0.5, HH / 2, HMID) },
    ]);
    // Plafond à caissons.
    const beams = [];
    for (let x = -HW; x <= HW + 0.01; x += 3) beams.push({ geometry: slab(0.4, 0.6, HLEN), matrix: at(x, HH - 0.3, HMID) });
    for (let z = HZ1; z <= GZ1 + 0.01; z += 3) beams.push({ geometry: slab(HW * 2, 0.6, 0.4), matrix: at(0, HH - 0.3, z) });
    // Colonnes jumelées de part et d'autre de l'arcade.
    const columns = [];
    const capitals = [];
    const shaftH = GALLERY.wallHeight - 1.4;
    for (const x of [-8.4, -7.2, 7.2, 8.4]) {
      const z = GZ1 - 1.4;
      columns.push({ geometry: lathe([[0.001, 0], [0.48, 0], [0.48, 0.22], [0.42, 0.3], [0.44, 0.42], [0.36, 0.55], [0.001, 0.55]], 32), matrix: at(x, 0, z) });
      columns.push({ geometry: lathe([[0.36, 0], [0.32, shaftH], [0.001, shaftH]], 32), matrix: at(x, 0.55, z) });
      capitals.push({ geometry: lathe([[0.001, 0], [0.34, 0], [0.42, 0.25], [0.55, 0.55], [0.6, 0.62], [0.6, 0.85], [0.001, 0.85]], 32), matrix: at(x, 0.55 + shaftH, z) });
    }
    return {
      treads: merge(treads),
      carpet: merge(carpet),
      front,
      back,
      sides,
      ceiling: slab(HW * 2 + 1, 0.5, HLEN + 1),
      beams: merge(beams),
      columns: merge(columns),
      capitals: merge(capitals),
      windowFrame: merge([
        { geometry: slab(0.08, 8, 0.12), matrix: at(-1.2, 9, 0) },
        { geometry: slab(0.08, 8, 0.12), matrix: at(1.2, 9, 0) },
        ...[6.6, 8.2, 9.8, 11.4].map((y) => ({ geometry: slab(7, 0.07, 0.12), matrix: at(0, y, 0) })),
      ]),
    };
  }, []);

  return (
    <group>
      <mesh geometry={g.treads} material={m.marble} castShadow receiveShadow />
      <mesh geometry={g.carpet} material={m.carpet} receiveShadow />
      <Balustrades m={m} />
      <mesh geometry={g.front} material={m.stone} position={[0, 0, GZ1 - 0.6]} castShadow receiveShadow />
      <mesh geometry={g.back} material={m.stone} position={[0, 0, HZ1 - 0.6]} castShadow receiveShadow />
      <mesh geometry={g.sides} material={m.stone} receiveShadow />
      <mesh geometry={g.ceiling} material={m.stone} position={[0, HH + 0.25, HMID]} />
      <mesh geometry={g.beams} material={m.gold} />
      <mesh geometry={g.columns} material={m.marble} castShadow receiveShadow />
      <mesh geometry={g.capitals} material={m.gold} castShadow />
      <group position={[0, 0, HZ1 - 0.75]}>
        <mesh geometry={g.windowFrame} material={m.gold} />
        <group position={[0, 10.5, -0.6]}>
          <WindowLight width={8} height={12} />
        </group>
      </group>
    </group>
  );
}
