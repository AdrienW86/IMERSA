"use client";

import { Color, CylinderGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from "three";
import type { SceneProps } from "@/components/3d/SceneDirector";
import { useDisposable } from "@/hooks/useDisposable";
import { usePbrTextures } from "@/hooks/usePbrTextures";
import { at, lathe, merge, slab } from "@/lib/geometry";
import { GITE_FLAME, GITE_GLASS } from "@/scenes/anchors";
import { FireSlot } from "@/scenes/shared/Fire";
import { Books, Bowl, CeramicPendant, DiningChair, ModularSofa, OliveTree, Vase } from "@/scenes/shared/furniture";
import { Candle, FLAME_HEIGHT } from "@/scenes/shared/hero/Candle";
import { GLASS_BOWL_CENTER, WineGlass } from "@/scenes/shared/hero/WineGlass";
import { Model } from "@/scenes/shared/Model";
import { GiteLandscape } from "./GiteLandscape";

/** Emprise de la salle commune (mètres). */
const X0 = -6;
const X1 = 6;
const Z0 = -5;
const Z1 = 5;
const H = 4;
const WALL = 0.6;
/** Fenêtre côté vallée (mur ouest), centrée sur le verre de la table. */
const WINDOW = { z0: GITE_GLASS[2] - 0.85, z1: GITE_GLASS[2] + 0.85, sill: 0.85, top: 2.55 };
/** Cheminée sur le mur nord. */
const HEARTH = { x: 1.0, width: 1.5, height: 1.15, mantel: 1.45 };
/** Porte cintrée côté jardin (mur est). */
const DOOR = { z0: 1.2, z1: 2.6, top: 2.5 };
/** Géométrie dérivée de la fenêtre. */
const WIN = {
  w: WINDOW.z1 - WINDOW.z0,
  h: WINDOW.top - WINDOW.sill,
  cz: (WINDOW.z0 + WINDOW.z1) / 2,
  cy: (WINDOW.sill + WINDOW.top) / 2,
  x: X0 - WALL + 0.12,
};
const TABLE = { x: GITE_GLASS[0] - 0.33, z: GITE_GLASS[2] + 0.2, top: GITE_GLASS[1] - GLASS_BOWL_CENTER };

function useGiteMaterials() {
  const stone = usePbrTextures("stone", 3.2);
  const tiles = usePbrTextures("terracotta", 1.0);
  const beam = usePbrTextures("oldwood", 1.4);
  const beamAcross = usePbrTextures("oldwood", 1.4, Math.PI / 2);
  const plaster = usePbrTextures("plaster", 2);
  const linen = usePbrTextures("linen", 0.8);
  return useDisposable(
    () => ({
      stone: new MeshStandardMaterial({ ...stone, color: new Color("#f4ece0"), roughness: 1, normalScale: new Vector2(1.1, 1.1) }),
      floor: new MeshPhysicalMaterial({ ...tiles, color: new Color("#ffffff"), roughness: 1, clearcoat: 0.15, clearcoatRoughness: 0.5 }),
      beam: new MeshStandardMaterial({ ...beam, color: new Color("#ffffff"), roughness: 1 }),
      beamAcross: new MeshStandardMaterial({ ...beamAcross, color: new Color("#ffffff"), roughness: 1 }),
      lime: new MeshStandardMaterial({ ...plaster, color: new Color("#efe6d6"), roughness: 1 }),
      linen: new MeshStandardMaterial({ ...linen, color: new Color("#eadfcd"), roughness: 1 }),
      rug: new MeshStandardMaterial({ ...linen, color: new Color("#b7826a"), roughness: 1 }),
      seat: new MeshStandardMaterial({ ...linen, color: new Color("#c4a46a"), roughness: 1 }),
      iron: new MeshStandardMaterial({ color: new Color("#2a2724"), metalness: 0.6, roughness: 0.55 }),
      bottle: new MeshPhysicalMaterial({ color: new Color("#2f4a2a"), roughness: 0.08, metalness: 0, transparent: true, opacity: 0.85 }),
      soot: new MeshStandardMaterial({ color: new Color("#1b1714"), roughness: 1 }),
      glass: new MeshPhysicalMaterial({ color: new Color("#eef2ee"), roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false }),
      shutter: new MeshStandardMaterial({ ...beamAcross, color: new Color("#9bab9c"), roughness: 0.9 }),
    }),
    [stone, tiles, beam, beamAcross, plaster, linen],
  );
}

type GiteMaterials = ReturnType<typeof useGiteMaterials>;

/** Murs maçonnés : percements de la fenêtre, de la porte et de la cheminée. */
function Shell({ m }: { m: GiteMaterials }) {
  const g = useDisposable(() => {
    const t = WALL;
    const west = [
      { geometry: slab(t, H, WINDOW.z0 - Z0), matrix: at(X0 - t / 2, H / 2, (Z0 + WINDOW.z0) / 2) },
      { geometry: slab(t, H, Z1 - WINDOW.z1), matrix: at(X0 - t / 2, H / 2, (WINDOW.z1 + Z1) / 2) },
      { geometry: slab(t, WINDOW.sill, WINDOW.z1 - WINDOW.z0), matrix: at(X0 - t / 2, WINDOW.sill / 2, (WINDOW.z0 + WINDOW.z1) / 2) },
      { geometry: slab(t, H - WINDOW.top, WINDOW.z1 - WINDOW.z0), matrix: at(X0 - t / 2, (H + WINDOW.top) / 2, (WINDOW.z0 + WINDOW.z1) / 2) },
    ];
    const east = [
      { geometry: slab(t, H, DOOR.z0 - Z0), matrix: at(X1 + t / 2, H / 2, (Z0 + DOOR.z0) / 2) },
      { geometry: slab(t, H, Z1 - DOOR.z1), matrix: at(X1 + t / 2, H / 2, (DOOR.z1 + Z1) / 2) },
      { geometry: slab(t, H - DOOR.top, DOOR.z1 - DOOR.z0), matrix: at(X1 + t / 2, (H + DOOR.top) / 2, (DOOR.z0 + DOOR.z1) / 2) },
    ];
    const hx0 = HEARTH.x - HEARTH.width / 2;
    const hx1 = HEARTH.x + HEARTH.width / 2;
    const north = [
      { geometry: slab(hx0 - X0 + t, H, t), matrix: at((X0 - t + hx0) / 2, H / 2, Z0 - t / 2) },
      { geometry: slab(X1 + t - hx1, H, t), matrix: at((hx1 + X1 + t) / 2, H / 2, Z0 - t / 2) },
      { geometry: slab(HEARTH.width, H - HEARTH.height, t), matrix: at(HEARTH.x, (H + HEARTH.height) / 2, Z0 - t / 2) },
      { geometry: slab(HEARTH.width, HEARTH.height, 0.2), matrix: at(HEARTH.x, HEARTH.height / 2, Z0 - t + 0.1) },
    ];
    const south = [{ geometry: slab(X1 - X0 + 2 * t, H, t), matrix: at(0, H / 2, Z1 + t / 2) }];
    // Manteau de cheminée : jambages en pierre, linteau en chêne.
    const surround = merge([
      { geometry: slab(0.3, HEARTH.mantel - 0.1, 0.36), matrix: at(HEARTH.x - HEARTH.width / 2 - 0.15, (HEARTH.mantel - 0.1) / 2, Z0 + 0.18) },
      { geometry: slab(0.3, HEARTH.mantel - 0.1, 0.36), matrix: at(HEARTH.x + HEARTH.width / 2 + 0.15, (HEARTH.mantel - 0.1) / 2, Z0 + 0.18) },
      { geometry: slab(HEARTH.width + 0.6, HEARTH.mantel - HEARTH.height - 0.1, 0.36), matrix: at(HEARTH.x, (HEARTH.height + HEARTH.mantel - 0.1) / 2, Z0 + 0.18) },
      // Hotte en enduit au-dessus du manteau.
      { geometry: slab(HEARTH.width + 0.4, H - HEARTH.mantel, 0.16), matrix: at(HEARTH.x, (H + HEARTH.mantel) / 2, Z0 + 0.08) },
    ]);
    const mantel = slab(HEARTH.width + 0.9, 0.12, 0.42, 0.015);
    return {
      walls: merge([...west, ...east, ...north, ...south]),
      surround,
      mantel,
      floor: slab(X1 - X0 + 1.2, 0.2, Z1 - Z0 + 1.2),
      hearthFloor: slab(HEARTH.width + 0.9, 0.06, 0.7, 0.01),
    };
  }, []);

  // Charpente : deux poutres maîtresses, solives serrées, plafond chaulé.
  const roof = useDisposable(() => {
    const beams = [-1.7, 1.7].map((z) => ({ geometry: slab(X1 - X0 + 2 * WALL, 0.34, 0.3, 0.02), matrix: at(0, H - 0.6, z) }));
    const joists = [];
    for (let x = X0 + 0.3; x < X1; x += 0.62) {
      joists.push({ geometry: slab(0.13, 0.15, Z1 - Z0 + 2 * WALL, 0.01), matrix: at(x, H - 0.36, 0) });
    }
    return { beams: merge(beams), joists: merge(joists), ceiling: slab(X1 - X0 + 2 * WALL, 0.1, Z1 - Z0 + 2 * WALL) };
  }, []);

  // Fenêtre : cadre en chêne, vitrage à petits bois, volets intérieurs ouverts.
  const window = useDisposable(() => {
    const { w, h, cz, cy, x } = WIN;
    const frame = merge([
      { geometry: slab(0.08, h, 0.08), matrix: at(x, cy, WINDOW.z0 + 0.04) },
      { geometry: slab(0.08, h, 0.08), matrix: at(x, cy, WINDOW.z1 - 0.04) },
      { geometry: slab(0.08, 0.08, w), matrix: at(x, WINDOW.sill + 0.04, cz) },
      { geometry: slab(0.08, 0.08, w), matrix: at(x, WINDOW.top - 0.04, cz) },
      { geometry: slab(0.06, h, 0.05), matrix: at(x, cy, cz) },
      ...[0.33, 0.66].map((k) => ({ geometry: slab(0.05, 0.035, w), matrix: at(x, WINDOW.sill + h * k, cz) })),
    ]);
    const sill = slab(WALL + 0.15, 0.06, w + 0.2, 0.01);
    const shutter = slab(0.04, h - 0.05, w / 2 - 0.02, 0.005);
    const pane = slab(0.005, h - 0.1, w - 0.1);
    return { frame, sill, shutter, pane };
  }, []);

  return (
    <group>
      <mesh geometry={g.floor} material={m.floor} position={[0, -0.1, 0]} receiveShadow />
      <mesh geometry={g.walls} material={m.stone} castShadow receiveShadow />
      <mesh geometry={g.surround} material={m.stone} castShadow receiveShadow />
      <mesh geometry={g.mantel} material={m.beamAcross} position={[HEARTH.x, HEARTH.mantel - 0.06, Z0 + 0.21]} castShadow receiveShadow />
      <mesh geometry={g.hearthFloor} material={m.stone} position={[HEARTH.x, 0.03, Z0 + 0.35]} receiveShadow />
      <mesh geometry={roof.beams} material={m.beamAcross} castShadow receiveShadow />
      <mesh geometry={roof.joists} material={m.beam} castShadow receiveShadow />
      <mesh geometry={roof.ceiling} material={m.lime} position={[0, H - 0.23, 0]} />

      <mesh geometry={window.frame} material={m.beam} castShadow />
      <mesh geometry={window.pane} material={m.glass} position={[WIN.x, WIN.cy, WIN.cz]} renderOrder={2} />
      <mesh geometry={window.sill} material={m.beamAcross} position={[X0 - WALL / 2 + 0.07, WINDOW.sill, WIN.cz]} receiveShadow castShadow />
      <mesh geometry={window.shutter} material={m.shutter} position={[X0 + 0.25, WIN.cy, WINDOW.z0 - 0.38]} rotation-y={-1.2} castShadow />
      <mesh geometry={window.shutter} material={m.shutter} position={[X0 + 0.25, WIN.cy, WINDOW.z1 + 0.38]} rotation-y={1.2} castShadow />
    </group>
  );
}

/** Foyer : bûches, braises et flammes. */
function Hearth({ m }: { m: GiteMaterials }) {
  const logs = useDisposable(
    () =>
      merge([
        { geometry: new CylinderGeometry(0.07, 0.08, 0.8, 10).rotateZ(Math.PI / 2), matrix: at(0, 0.1, 0, 0.2) },
        { geometry: new CylinderGeometry(0.06, 0.07, 0.75, 10).rotateZ(Math.PI / 2), matrix: at(0.05, 0.1, 0.16, -0.25) },
        { geometry: new CylinderGeometry(0.055, 0.06, 0.7, 10).rotateZ(Math.PI / 2), matrix: at(0, 0.22, 0.08, 0.05) },
      ]),
    [],
  );
  return (
    <group position={[HEARTH.x, 0.06, Z0 - WALL + 0.38]}>
      <mesh geometry={logs} material={m.beam} castShadow />
      <mesh position={[0, 0.02, 0.08]} material={m.soot}>
        <boxGeometry args={[1.0, 0.02, 0.5]} />
      </mesh>
      <group position={[0, 0.36, 0.12]}>
        <FireSlot width={0.95} height={0.6} />
      </group>
    </group>
  );
}

/** Table de ferme en chêne massif, pieds tournés. */
function FarmTable({ m }: { m: GiteMaterials }) {
  const g = useDisposable(() => {
    const leg = lathe(
      [
        [0.001, 0],
        [0.045, 0],
        [0.04, 0.08],
        [0.05, 0.2],
        [0.035, 0.32],
        [0.05, 0.45],
        [0.045, 0.6],
        [0.055, TABLE.top - 0.08],
        [0.001, TABLE.top - 0.08],
      ],
      16,
    );
    return {
      top: slab(1.0, 0.08, 2.5, 0.015),
      apron: merge([
        { geometry: slab(0.84, 0.12, 0.05), matrix: at(0, TABLE.top - 0.14, -1.05) },
        { geometry: slab(0.84, 0.12, 0.05), matrix: at(0, TABLE.top - 0.14, 1.05) },
        { geometry: slab(0.05, 0.12, 2.1), matrix: at(-0.42, TABLE.top - 0.14, 0) },
        { geometry: slab(0.05, 0.12, 2.1), matrix: at(0.42, TABLE.top - 0.14, 0) },
      ]),
      legs: merge(
        [
          [-0.4, -1.05],
          [0.4, -1.05],
          [-0.4, 1.05],
          [0.4, 1.05],
        ].map(([x, z]) => ({ geometry: leg.clone(), matrix: at(x, 0, z) })),
      ),
      runner: slab(0.42, 0.006, 2.7, 0.002),
      bottle: lathe(
        [
          [0.001, 0],
          [0.037, 0],
          [0.038, 0.2],
          [0.03, 0.24],
          [0.014, 0.27],
          [0.013, 0.31],
          [0.016, 0.315],
          [0.001, 0.315],
        ],
        32,
      ),
      board: slab(0.32, 0.025, 0.22, 0.01),
    };
  }, []);
  return (
    <group>
      <group position={[TABLE.x, 0, TABLE.z]}>
        <mesh geometry={g.top} material={m.beamAcross} position={[0, TABLE.top - 0.04, 0]} castShadow receiveShadow />
        <mesh geometry={g.apron} material={m.beam} castShadow />
        <mesh geometry={g.legs} material={m.beam} castShadow />
        <mesh geometry={g.runner} material={m.linen} position={[0, TABLE.top + 0.003, 0]} receiveShadow />
        <mesh geometry={g.bottle} material={m.bottle} position={[-0.12, TABLE.top, -0.75]} castShadow />
        <mesh geometry={g.board} material={m.beam} position={[0.05, TABLE.top + 0.012, 0.75]} rotation-y={0.3} castShadow receiveShadow />
        <Vase position={[-0.2, TABLE.top, 0.15]} scale={0.9} color="#b9744d" roughness={0.8} profile="pitcher" />
        <Bowl position={[-0.08, TABLE.top, 0.48]} radius={0.15} color="#d6c6a8" />
      </group>
      <WineGlass position={[GITE_GLASS[0], TABLE.top, GITE_GLASS[2]]} />
      <CeramicPendant position={[TABLE.x, 2.15, TABLE.z]} drop={H - 0.6 - 2.15 - 0.2} radius={0.32} color="#b38b5e" />
      {[
        [TABLE.x - 0.75, TABLE.z - 0.6, Math.PI / 2],
        [TABLE.x - 0.75, TABLE.z + 0.6, Math.PI / 2],
        [TABLE.x + 0.75, TABLE.z - 1.0, -Math.PI / 2],
        [TABLE.x + 0.75, TABLE.z + 0.95, -Math.PI / 2],
      ].map(([x, z, r]) => (
        <DiningChair key={`${x}${z}`} position={[x, 0, z]} rotation={r} wood={m.beam} seat={m.seat} style="ladder" />
      ))}
    </group>
  );
}

/** Salle commune d'un mas provençal, en fin d'après-midi. */
export default function GiteScene({ settings }: SceneProps) {
  const m = useGiteMaterials();
  const candleBase = GITE_FLAME[1] - FLAME_HEIGHT;
  return (
    <group>
      <GiteLandscape />
      <Shell m={m} />
      <Hearth m={m} />
      <FarmTable m={m} />

      {/* Coin du feu */}
      <mesh material={m.rug} position={[HEARTH.x, 0.006, -2.6]} receiveShadow>
        <boxGeometry args={[3.2, 0.012, 2.2]} />
      </mesh>
      <Model url="/models/sheen-chair.glb" tints={ARMCHAIR_TINT} position={[-0.5, 0, -2.85]} rotation-y={Math.PI - 0.6} scale={1.08} />
      <Model url="/models/sheen-chair.glb" tints={ARMCHAIR_TINT} position={[2.9, 0, -2.85]} rotation-y={Math.PI + 0.6} scale={1.08} />
      <ModularSofa
        fabric={m.linen}
        modules={[
          { x: 4.9, z: -0.6, width: 1.1, rotation: -Math.PI / 2 },
          { x: 4.9, z: 0.5, width: 1.1, rotation: -Math.PI / 2 },
        ]}
      />

      {/* Manteau de cheminée : bougie (objet repère), pichets, livres */}
      <mesh material={m.iron} position={[GITE_FLAME[0], HEARTH.mantel + (candleBase - HEARTH.mantel) / 2, GITE_FLAME[2]]} castShadow>
        <cylinderGeometry args={[0.022, 0.04, candleBase - HEARTH.mantel, 20]} />
      </mesh>
      <Candle position={[GITE_FLAME[0], candleBase, GITE_FLAME[2]]} wax="#f1e6d2" />
      <Vase position={[0.25, HEARTH.mantel, Z0 + 0.2]} scale={1.1} color="#a8643f" profile="pitcher" />
      <Vase position={[0.62, HEARTH.mantel, Z0 + 0.22]} scale={0.7} color="#d6c9b2" />
      <Books position={[2.0, HEARTH.mantel, Z0 + 0.2]} rotation={0.1} colors={["#7d5a3c", "#c9b38f"]} />

      {/* Jarres et olivier près de la porte */}
      <Vase position={[5.2, 0, 3.9]} scale={1.6} color="#b8734a" profile="jar" />
      <Vase position={[4.5, 0, 4.3]} scale={1.1} color="#c58a5e" profile="jar" />
      <OliveTree position={[-5.0, 0, 3.9]} scale={1.35} seed={11} potColor="#b46f48" leaves={settings.particles > 100 ? 2400 : 1200} />
    </group>
  );
}

const ARMCHAIR_TINT = { "fabric Mystere Mango Velvet": { color: "#b49a7a", sheenColor: "#e8d8c0" } };
