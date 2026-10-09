"use client";

import { Sparkles } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import {
  Color,
  type InstancedMesh,
  LatheGeometry,
  Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector2,
  Vector3,
} from "three";
import type { SceneProps } from "@/components/3d/SceneDirector";
import { useDisposable } from "@/hooks/useDisposable";
import { usePbrTextures } from "@/hooks/usePbrTextures";
import { at, merge, slab } from "@/lib/geometry";
import { useExperience } from "@/lib/experience-store";
import { City } from "@/scenes/shared/City";
import { LightShafts, type ShaftSource } from "@/scenes/shared/LightShafts";
import { Model } from "@/scenes/shared/Model";
import { Passage } from "@/scenes/shared/Passage";
import { SkyDome } from "@/scenes/shared/SkyDome";
import { SpiralStair } from "./SpiralStair";

/** Emprise du loft (mètres). */
const X0 = -8;
const X1 = 8;
const Z0 = -12;
const Z1 = 7;
const H = 9;
const MEZZ = { x1: -3.5, z1: 1, top: 4.5, thickness: 0.32 };
const SUN: [number, number, number] = [30, 11, 6];
const MID_Z = (Z0 + Z1) / 2;

/** Verrière : trame de 1,2 m × 1,5 m, sur toute la façade est. */
const BAYS_Z = 16;
const BAYS_Y = 6;

const SHAFTS: ShaftSource[] = [-9, -4.2, 0.6, 5].map((z) => ({
  center: [X1, 4.6, z],
  halfWidth: 1.5,
  halfHeight: 3.6,
}));

function useLoftMaterials() {
  const brick = usePbrTextures("brick", 1.25);
  const concrete = usePbrTextures("concrete", 4);
  const oak = usePbrTextures("oak", 1.2);
  const darkOak = usePbrTextures("oak", 1.6, Math.PI / 2);

  return useDisposable(() => {
    return {
      brick: new MeshStandardMaterial({ ...brick, color: new Color("#c9b9ae"), roughness: 1 }),
      floor: new MeshPhysicalMaterial({
        map: concrete.map,
        normalMap: concrete.normalMap,
        color: new Color("#9a948d"),
        roughness: 0.5,
        normalScale: new Vector2(0.1, 0.1),
        clearcoat: 0.25,
        clearcoatRoughness: 0.3,
        envMapIntensity: 0.6,
      }),
      walls: new MeshStandardMaterial({ ...concrete, color: new Color("#a7a29b"), roughness: 1 }),
      oak: new MeshStandardMaterial({ ...oak, color: new Color("#e8cfb0"), roughness: 0.75 }),
      ceiling: new MeshStandardMaterial({ ...darkOak, color: new Color("#6b4c36"), roughness: 0.9 }),
      steel: new MeshStandardMaterial({ color: new Color("#16171a"), metalness: 0.75, roughness: 0.42 }),
      blackSteel: new MeshStandardMaterial({ color: new Color("#0f1012"), metalness: 0.5, roughness: 0.55 }),
      glass: new MeshPhysicalMaterial({
        color: new Color("#f2efe8"),
        roughness: 0.05,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      }),
      passage: new MeshStandardMaterial({ ...darkOak, color: new Color("#3d2c22"), roughness: 0.75 }),
      rug: new MeshStandardMaterial({ color: new Color("#6d5a49"), roughness: 1 }),
    };
  }, [brick, concrete, oak, darkOak]);
}

type LoftMaterials = ReturnType<typeof useLoftMaterials>;

function Shell({ m }: { m: LoftMaterials }) {
  const g = useDisposable(() => {
    const doorW = 1.7;
    const doorH = 3.1;
    const exitX = -5.6;
    const exitW = 1.7;
    const exitB = MEZZ.top;
    const exitT = MEZZ.top + 3.1;
    return {
      floor: slab(X1 - X0, 0.3, Z1 - Z0),
      leftWall: slab(0.4, H, Z1 - Z0),
      backWall: merge([
        { geometry: slab(exitX - exitW / 2 - X0 + 0.4, H, 0.4), matrix: at((X0 - 0.4 + exitX - exitW / 2) / 2, H / 2, Z0 - 0.2) },
        { geometry: slab(X1 - (exitX + exitW / 2), H, 0.4), matrix: at((X1 + exitX + exitW / 2) / 2, H / 2, Z0 - 0.2) },
        { geometry: slab(exitW, exitB, 0.4), matrix: at(exitX, exitB / 2, Z0 - 0.2) },
        { geometry: slab(exitW, H - exitT, 0.4), matrix: at(exitX, (H + exitT) / 2, Z0 - 0.2) },
      ]),
      frontWall: merge([
        { geometry: slab(-doorW / 2 - X0 + 0.4, H, 0.4), matrix: at((X0 - 0.4 - doorW / 2) / 2, H / 2, Z1 + 0.2) },
        { geometry: slab(X1 - doorW / 2 + 0.4, H, 0.4), matrix: at((X1 + 0.4 + doorW / 2) / 2, H / 2, Z1 + 0.2) },
        { geometry: slab(doorW, H - doorH, 0.4), matrix: at(0, (H + doorH) / 2, Z1 + 0.2) },
      ]),
      ceiling: slab(X1 - X0 + 0.8, 0.25, Z1 - Z0 + 0.8),
      beams: merge(
        Array.from({ length: 7 }, (_, i) => ({
          geometry: slab(X1 - X0, 0.42, 0.22),
          matrix: at(0, H - 0.21, Z0 + 1.4 + i * 2.75),
        })),
      ),
      mezzanine: merge([
        { geometry: slab(MEZZ.x1 - X0, MEZZ.thickness, MEZZ.z1 - Z0), matrix: at((X0 + MEZZ.x1) / 2, MEZZ.top - MEZZ.thickness / 2, (Z0 + MEZZ.z1) / 2) },
      ]),
      mezzEdge: merge([
        { geometry: slab(0.08, 0.46, MEZZ.z1 - Z0), matrix: at(MEZZ.x1 + 0.04, MEZZ.top - 0.2, (Z0 + MEZZ.z1) / 2) },
        { geometry: slab(MEZZ.x1 - X0, 0.46, 0.08), matrix: at((X0 + MEZZ.x1) / 2, MEZZ.top - 0.2, MEZZ.z1 + 0.04) },
        // Poteaux acier sous la mezzanine.
        { geometry: slab(0.22, MEZZ.top - 0.4, 0.22), matrix: at(MEZZ.x1 + 0.12, (MEZZ.top - 0.4) / 2, 0.7) },
        { geometry: slab(0.22, MEZZ.top - 0.4, 0.22), matrix: at(MEZZ.x1 + 0.12, (MEZZ.top - 0.4) / 2, -8.6) },
      ]),
      // Garde-corps vitré, ouvert à l'arrivée de l'escalier.
      balustrade: merge([
        { geometry: slab(0.02, 1.05, MEZZ.z1 - -3.1), matrix: at(MEZZ.x1 + 0.02, MEZZ.top + 0.53, (MEZZ.z1 + -3.1) / 2) },
        { geometry: slab(0.02, 1.05, -4.9 - Z0), matrix: at(MEZZ.x1 + 0.02, MEZZ.top + 0.53, (-4.9 + Z0) / 2) },
        { geometry: slab(MEZZ.x1 - X0, 1.05, 0.02), matrix: at((X0 + MEZZ.x1) / 2, MEZZ.top + 0.53, MEZZ.z1 + 0.02) },
      ]),
      handrail: merge([
        { geometry: slab(0.05, 0.04, MEZZ.z1 - -3.1), matrix: at(MEZZ.x1 + 0.02, MEZZ.top + 1.07, (MEZZ.z1 + -3.1) / 2) },
        { geometry: slab(0.05, 0.04, -4.9 - Z0), matrix: at(MEZZ.x1 + 0.02, MEZZ.top + 1.07, (-4.9 + Z0) / 2) },
        { geometry: slab(MEZZ.x1 - X0, 0.04, 0.05), matrix: at((X0 + MEZZ.x1) / 2, MEZZ.top + 1.07, MEZZ.z1 + 0.02) },
      ]),
    };
  }, []);

  return (
    <group>
      <mesh geometry={g.floor} material={m.floor} position={[0, -0.15, MID_Z]} receiveShadow />
      <mesh geometry={g.leftWall} material={m.brick} position={[X0 - 0.2, H / 2, MID_Z]} receiveShadow castShadow />
      <mesh geometry={g.backWall} material={m.brick} receiveShadow castShadow />
      <mesh geometry={g.frontWall} material={m.walls} receiveShadow castShadow />
      <mesh geometry={g.ceiling} material={m.ceiling} position={[0, H + 0.125, MID_Z]} castShadow />
      <mesh geometry={g.beams} material={m.steel} castShadow receiveShadow />
      <mesh geometry={g.mezzanine} material={m.oak} castShadow receiveShadow />
      <mesh geometry={g.mezzEdge} material={m.steel} castShadow />
      <mesh geometry={g.balustrade} material={m.glass} renderOrder={2} />
      <mesh geometry={g.handrail} material={m.steel} />
    </group>
  );
}

function Verriere({ m }: { m: LoftMaterials }) {
  const g = useDisposable(() => {
    const parts = [];
    const stepZ = (Z1 - Z0) / BAYS_Z;
    const stepY = H / BAYS_Y;
    for (let i = 0; i <= BAYS_Z; i++) {
      const major = i % 4 === 0;
      parts.push({ geometry: slab(major ? 0.16 : 0.07, H, major ? 0.12 : 0.05), matrix: at(X1, H / 2, Z0 + i * stepZ) });
    }
    for (let j = 0; j <= BAYS_Y; j++) {
      parts.push({ geometry: slab(0.08, 0.06, Z1 - Z0), matrix: at(X1, j * stepY, MID_Z) });
    }
    return { frame: merge(parts), pane: new PlaneGeometry(Z1 - Z0, H).rotateY(-Math.PI / 2) };
  }, []);
  return (
    <group>
      <mesh geometry={g.frame} material={m.blackSteel} castShadow />
      <mesh geometry={g.pane} material={m.glass} position={[X1 + 0.02, H / 2, MID_Z]} renderOrder={2} />
    </group>
  );
}

/** Bibliothèque de mezzanine : étagères acier, livres instanciés. */
function Library({ m }: { m: LoftMaterials }) {
  const books = useRef<InstancedMesh>(null);
  const count = 340;
  const g = useDisposable(
    () => ({
      shelves: merge(
        Array.from({ length: 5 }, (_, i) => ({
          geometry: slab(0.38, 0.03, 11),
          matrix: at(X0 + 0.22, MEZZ.top + 0.35 + i * 0.78, -5.6),
        })),
      ),
      book: slab(0.24, 1, 1),
      bookMaterial: new MeshStandardMaterial({ roughness: 0.8 }),
    }),
    [],
  );
  useLayoutEffect(() => {
    const mesh = books.current;
    if (!mesh) return;
    const mat = new Matrix4();
    const palette = ["#8b7d6b", "#3e3a35", "#b9a88f", "#5c3b2a", "#2f3a3d", "#d8cdb9", "#704a32"].map((c) => new Color(c));
    let shelf = 0;
    let z = -11;
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const w = 0.025 + random() * 0.04;
      const h = 0.22 + random() * 0.14;
      if (z + w > -0.2) {
        shelf++;
        z = -11 + random() * 0.4;
      }
      const gap = random() < 0.06 ? 0.25 : 0;
      z += gap;
      const tilt = random() < 0.04 ? 0.18 : 0;
      mat.makeRotationX(tilt).scale(new Vector3(1, h, w)).setPosition(X0 + 0.22, MEZZ.top + 0.365 + (shelf % 5) * 0.78 + h / 2, z + w / 2);
      mesh.setMatrixAt(i, mat);
      mesh.setColorAt(i, palette[Math.floor(random() * palette.length)]);
      z += w + 0.003;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return (
    <group>
      <mesh geometry={g.shelves} material={m.steel} castShadow />
      <instancedMesh ref={books} args={[g.book, g.bookMaterial, count]} castShadow receiveShadow />
    </group>
  );
}

/** Suspensions industrielles au-dessus de la grande table. */
function Pendants({ m }: { m: LoftMaterials }) {
  const g = useDisposable(() => {
    const shade = new LatheGeometry(
      [
        [0.02, 0.32],
        [0.05, 0.3],
        [0.07, 0.2],
        [0.26, 0.04],
        [0.27, 0],
      ].map(([x, y]) => new Vector2(x, y)),
      40,
    );
    return { shade, cable: slab(0.006, 6.3, 0.006), table: slab(1.1, 0.06, 4.2, 0.01), legs: merge([
      { geometry: slab(0.9, 0.7, 0.06), matrix: at(0, 0.35, -1.6) },
      { geometry: slab(0.9, 0.7, 0.06), matrix: at(0, 0.35, 1.6) },
    ]) };
  }, []);
  return (
    <group position={[5.2, 0, -6]}>
      <mesh geometry={g.table} material={m.oak} position={[0, 0.73, 0]} castShadow receiveShadow />
      <mesh geometry={g.legs} material={m.blackSteel} castShadow />
      {[-1.4, 0, 1.4].map((z) => (
        <group key={z} position={[0, 2.35, z]}>
          <mesh geometry={g.shade} material={m.blackSteel} castShadow />
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
          </mesh>
          <mesh geometry={g.cable} material={m.blackSteel} position={[0, 3.45, 0]} />
        </group>
      ))}
    </group>
  );
}

const SOFA_POSITION: [number, number, number] = [-5.5, 0, 3.7];

export default function LoftScene({ settings }: SceneProps) {
  const m = useLoftMaterials();
  const reduced = useExperience((s) => s.reducedMotion);
  return (
    <group>
      <SkyDome
        top="#3d5f8a"
        horizon="#f3b27a"
        bottom="#6a5a55"
        sunDirection={SUN}
        sunColor="#ffb469"
        sunFocus={260}
        sunStrength={2}
      />
      <City
        ground={-14}
        center={[60, 0]}
        innerRadius={30}
        outerRadius={900}
        count={settings.cityBlocks}
        minHeight={14}
        maxHeight={140}
        direction={0}
        spread={Math.PI * 1.2}
        sunDirection={SUN}
        sunColor="#ffb06a"
        ambient="#4a5a75"
        windowGlow={0.35}
        seed={3}
      />
      <Shell m={m} />
      <Verriere m={m} />
      <SpiralStair
        center={[-1.8, -4]}
        height={MEZZ.top}
        radius={1.5}
        steps={20}
        endAngle={Math.PI}
        turns={1.1}
        tread={m.oak}
        metal={m.steel}
      />
      <Library m={m} />
      <Pendants m={m} />

      <mesh material={m.rug} position={[-5.4, 0.006, 3.6]} receiveShadow>
        <boxGeometry args={[3.4, 0.012, 4.6]} />
      </mesh>
      <Model url="/models/sheen-wood-leather-sofa.glb" position={SOFA_POSITION} rotation-y={Math.PI / 2} />
      <mesh position={[-3.9, 0.2, 3.6]} castShadow receiveShadow material={m.walls}>
        <boxGeometry args={[0.9, 0.4, 1.4]} />
      </mesh>
      <Model url="/models/diffuse-transmission-plant.glb" position={[6.9, 0, 5.6]} scale={2.2} rotation-y={0.6} />
      <Model url="/models/diffuse-transmission-plant.glb" position={[-7.2, MEZZ.top, 0.2]} scale={1.6} />

      {settings.lightShafts && (
        <LightShafts
          sources={SHAFTS}
          right={[0, 0, 1]}
          up={[0, 1, 0]}
          direction={[-SUN[0], -SUN[1], -SUN[2]]}
          length={15}
          color="#ffb877"
          intensity={0.12}
        />
      )}
      {!reduced && settings.particles > 0 && (
        <Sparkles count={settings.particles} scale={[12, 7, 18]} position={[1, 3.5, MID_Z]} size={1.1} speed={0.15} opacity={0.35} color="#ffd9b0" noise={0.6} />
      )}

      <Passage position={[0, 0, Z1 + 3]} material={m.passage} />
      <Passage position={[-5.6, MEZZ.top, Z0 - 3]} material={m.passage} />
    </group>
  );
}
