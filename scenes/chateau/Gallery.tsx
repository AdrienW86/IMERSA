"use client";

import { useLayoutEffect, useRef } from "react";
import {
  CircleGeometry,
  Color,
  CylinderGeometry,
  type InstancedMesh,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
} from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { archedPanel, archRing, at, merge, molding, slab } from "@/lib/geometry";
import { GALLERY, BAY, HALL, bayCenters, pilasterPositions } from "./constants";
import type { ChateauMaterials } from "./useChateauMaterials";

const { halfWidth: W, z0: GZ0, z1: GZ1, wallHeight: WH } = GALLERY;
const GLEN = GZ0 - GZ1;
const GMID = (GZ0 + GZ1) / 2;

/** Profil de corniche (projection vers l'intérieur, hauteur). */
const CORNICE: [number, number][] = [
  [0, 0],
  [0.1, 0],
  [0.1, 0.1],
  [0.2, 0.16],
  [0.2, 0.3],
  [0.32, 0.36],
  [0.36, 0.5],
  [0.62, 0.56],
  [0.62, 0.7],
  [0, 0.7],
];

/** Dallage en damier posé en diagonale (deux maillages instanciés). */
function Checkerboard({ m }: { m: ChateauMaterials }) {
  const white = useRef<InstancedMesh>(null);
  const black = useRef<InstancedMesh>(null);
  const size = 0.95;
  const n = Math.ceil((GZ0 - HALL.z1 + HALL.halfWidth * 2) / size);
  const capacity = n * n;
  const tile = useDisposable(() => slab(size - 0.006, 0.05, size - 0.006, 0.004), []);

  useLayoutEffect(() => {
    const mw = white.current;
    const mb = black.current;
    if (!mw || !mb) return;
    const mat = new Matrix4();
    const k = size / Math.SQRT2;
    let iw = 0;
    let ib = 0;
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        // Repère du damier tourné de 45° par rapport à l'axe de la galerie.
        const x = (i - j) * k;
        const z = GZ0 - (i + j) * k;
        const inGallery = Math.abs(x) < W + 0.7 && z < GZ0 + 0.7 && z > GZ1 - 0.7;
        const inHall = Math.abs(x) < HALL.halfWidth + 0.7 && z <= GZ1 + 0.7 && z > HALL.z1 - 0.7;
        if (!inGallery && !inHall) continue;
        mat.makeRotationY(Math.PI / 4).setPosition(x, -0.025, z);
        if ((((i + j) % 2) + 2) % 2 === 0) {
          if (iw < capacity) mw.setMatrixAt(iw++, mat);
        } else if (ib < capacity) mb.setMatrixAt(ib++, mat);
      }
    }
    mw.count = iw;
    mb.count = ib;
    mw.instanceMatrix.needsUpdate = true;
    mb.instanceMatrix.needsUpdate = true;
    mw.computeBoundingSphere();
    mb.computeBoundingSphere();
  }, [n, capacity]);

  return (
    <group>
      <instancedMesh ref={white} args={[tile, m.tileWhite, capacity]} receiveShadow />
      <instancedMesh ref={black} args={[tile, m.tileBlack, capacity]} receiveShadow />
      <mesh material={m.stone} position={[0, -0.1, (GZ0 + HALL.z1) / 2]}>
        <boxGeometry args={[HALL.halfWidth * 2 + 2, 0.1, GZ0 - HALL.z1 + 2]} />
      </mesh>
    </group>
  );
}

/** Ciel lumineux derrière les baies (surexposé : la lumière « déborde »). */
function DaylightBackdrop() {
  const geometry = useDisposable(() => new PlaneGeometry(GLEN + 10, 22).rotateY(Math.PI / 2), []);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        toneMapped: false,
        fog: false,
        uniforms: { uLow: { value: new Color("#fff1dc") }, uHigh: { value: new Color("#cfe0f2") } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uLow, uHigh; varying vec2 vUv;
          void main(){
            vec3 col = mix(uLow * 2.4, uHigh * 1.5, smoothstep(0.2, 0.9, vUv.y));
            // Silhouette lointaine d'arbres taillés (parterres à la française).
            float hedge = step(vUv.y, 0.12 + 0.015 * sin(vUv.x * 160.0) * sin(vUv.x * 23.0));
            col = mix(col, vec3(0.55, 0.6, 0.45), hedge * 0.55);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [],
  );
  return <mesh geometry={geometry} material={material} position={[-W - 4, 8, GMID]} />;
}

/** Fenêtres : petits-bois dorés et vitrage dans chaque baie. */
function windowGrid(opening: { width: number; sill: number; spring: number }) {
  const parts = [];
  const r = opening.width / 2;
  for (const x of [-r / 2.0, 0, r / 2.0]) {
    parts.push({ geometry: slab(0.05, opening.spring - opening.sill, 0.06), matrix: at(x, (opening.spring + opening.sill) / 2, 0) });
  }
  for (let y = opening.sill + 1.1; y < opening.spring; y += 1.1) {
    parts.push({ geometry: slab(opening.width, 0.05, 0.06), matrix: at(0, y, 0) });
  }
  return parts;
}

export function Gallery({ m }: { m: ChateauMaterials }) {
  const g = useDisposable(() => {
    const leftBays = [];
    const rightBays = [];
    const frames = [];
    const mirrors = [];
    for (const z of bayCenters) {
      leftBays.push({ geometry: archedPanel(BAY.width, WH, 0.9, BAY.window), matrix: at(-W - 0.45, 0, z, Math.PI / 2) });
      rightBays.push({ geometry: archedPanel(BAY.width, WH, 0.9, BAY.mirror), matrix: at(W + 0.45, 0, z, Math.PI / 2) });
      for (const part of windowGrid(BAY.window)) {
        frames.push({ geometry: part.geometry, matrix: at(-W - 0.3, 0, z, Math.PI / 2).multiply(part.matrix) });
      }
      for (const part of windowGrid(BAY.mirror)) {
        frames.push({ geometry: part.geometry.clone(), matrix: at(W - 0.02, 0, z, Math.PI / 2).multiply(part.matrix) });
      }
      // Miroir : plan cintré (forme de la baie).
      mirrors.push({ geometry: archedFill(BAY.mirror), matrix: at(W + 0.02, 0, z, -Math.PI / 2) });
    }

    // Pilastres : base, fût, chapiteau doré.
    const pilasters = [];
    const capitals = [];
    for (const z of pilasterPositions) {
      for (const side of [-1, 1]) {
        const x = side * (W - 0.14);
        pilasters.push({ geometry: slab(0.3, 0.7, 1.15, 0.01), matrix: at(x, 0.35, z) });
        pilasters.push({ geometry: slab(0.24, WH - 1.35, 0.9, 0.01), matrix: at(x, 0.7 + (WH - 1.35) / 2, z) });
        capitals.push({ geometry: slab(0.34, 0.5, 1.15, 0.03), matrix: at(x, WH - 0.4, z) });
        capitals.push({ geometry: slab(0.3, 0.08, 1.0, 0.01), matrix: at(x, WH - 0.7, z) });
      }
    }

    const corniceL = molding(CORNICE, GLEN);
    const corniceR = molding(CORNICE, GLEN).scale(-1, 1, 1);

    // Voûte en berceau et arcs doubleaux.
    const vault = new CylinderGeometry(W, W, GLEN, 64, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2);
    const ribs = [];
    for (const z of pilasterPositions) ribs.push({ geometry: archRing(W - 0.32, 0.32, 0.6, 48), matrix: at(0, WH + 0.7, z) });
    const longRibs = [];
    for (let k = 1; k < 8; k++) {
      const a = (k / 8) * Math.PI;
      const x = Math.cos(a) * (W - 0.1);
      const y = Math.sin(a) * (W - 0.1);
      longRibs.push({ geometry: slab(0.12, 0.16, GLEN), matrix: at(x, WH + 0.7 + y, GMID, 0, 0, a - Math.PI / 2) });
    }
    const rosettes = [];
    for (const z of bayCenters) {
      for (let k = 1; k < 8; k += 2) {
        const a = ((k + 0.0) / 8) * Math.PI;
        rosettes.push({
          geometry: new SphereGeometry(0.22, 16, 8).scale(1, 0.35, 1),
          matrix: at(Math.cos(a) * (W - 0.12), WH + 0.7 + Math.sin(a) * (W - 0.12), z, 0, 0, a - Math.PI / 2),
        });
      }
    }

    // Mur d'entrée et porte monumentale.
    const entry = archedPanel(W * 2 + 2, WH + W + 1.2, 1, { width: 3.2, sill: 0, spring: 4.6 }, -0.5);

    return {
      leftBays: merge(leftBays),
      rightBays: merge(rightBays),
      frames: merge(frames),
      mirrors: merge(mirrors),
      pilasters: merge(pilasters),
      capitals: merge(capitals),
      corniceL,
      corniceR,
      vault,
      ribs: merge(ribs),
      longRibs: merge(longRibs),
      rosettes: merge(rosettes),
      entry,
      windowGlass: new PlaneGeometry(GLEN, WH).rotateY(Math.PI / 2),
    };
  }, []);

  return (
    <group>
      <Checkerboard m={m} />
      <DaylightBackdrop />
      <mesh geometry={g.leftBays} material={m.stone} castShadow receiveShadow />
      <mesh geometry={g.rightBays} material={m.stone} castShadow receiveShadow />
      <mesh geometry={g.frames} material={m.gold} castShadow />
      <mesh geometry={g.mirrors} material={m.mirror} />
      <mesh geometry={g.windowGlass} material={m.glass} position={[-W - 0.3, WH / 2, GMID]} renderOrder={2} />
      <mesh geometry={g.pilasters} material={m.marble} castShadow receiveShadow />
      <mesh geometry={g.capitals} material={m.gold} castShadow />
      <mesh geometry={g.corniceL} material={m.stone} position={[-W, WH, GMID]} castShadow receiveShadow />
      <mesh geometry={g.corniceR} material={m.stone} position={[W, WH, GMID]} castShadow receiveShadow />
      <mesh geometry={g.vault} material={m.vault} position={[0, WH + 0.7, GMID]} receiveShadow />
      <mesh geometry={g.ribs} material={m.gold} castShadow />
      <mesh geometry={g.longRibs} material={m.gold} />
      <mesh geometry={g.rosettes} material={m.gold} />
      <mesh geometry={g.entry} material={m.stone} position={[0, 0, GZ0 + 0.5]} castShadow receiveShadow />
    </group>
  );
}

/** Surface pleine en forme de baie cintrée (miroirs). */
function archedFill(opening: { width: number; sill: number; spring: number }) {
  const r = opening.width / 2;
  const h = opening.spring - opening.sill;
  return merge([
    { geometry: new PlaneGeometry(opening.width, h), matrix: at(0, opening.sill + h / 2, 0) },
    { geometry: new CircleGeometry(r, 32, 0, Math.PI), matrix: at(0, opening.spring, 0) },
  ]);
}
