"use client";

import type { SceneProps } from "@/components/3d/SceneDirector";
import { useDisposable } from "@/hooks/useDisposable";
import { merge, at, slab } from "@/lib/geometry";
import { Artwork } from "@/scenes/shared/Artwork";
import { GLASS_BOWL_CENTER, WineGlass } from "@/scenes/shared/hero/WineGlass";
import { SheerCurtain } from "@/scenes/shared/hero/SheerCurtain";
import { Books, Bowl, CeramicPendant, DiningChair, ModularSofa, OliveTree, Vase } from "@/scenes/shared/furniture";
import { Model } from "@/scenes/shared/Model";
import { VILLA_CURTAIN, VILLA_GLASS } from "@/scenes/anchors";
import { Passage } from "@/scenes/shared/Passage";
import { EXIT_DOOR, ROOM } from "./constants";
import { Landscape } from "./Landscape";
import { useVillaMaterials, type VillaMaterials } from "./useVillaMaterials";
import { VillaArchitecture } from "./VillaArchitecture";

/** Table de repas : plateau de chêne, piétement travertin, suspensions céramique. */
function DiningTable({ m }: { m: VillaMaterials }) {
  const parts = useDisposable(
    () => ({
      top: slab(1.1, 0.06, 3.0, 0.012),
      legs: merge([
        { geometry: slab(0.22, 0.71, 0.75, 0.01), matrix: at(0, 0.355, -0.95) },
        { geometry: slab(0.22, 0.71, 0.75, 0.01), matrix: at(0, 0.355, 0.95) },
      ]),
    }),
    [],
  );
  return (
    <group position={[-4.4, 0, -7.4]}>
      <mesh geometry={parts.top} material={m.wood} position={[0, 0.74, 0]} castShadow receiveShadow />
      <mesh geometry={parts.legs} material={m.stone} castShadow receiveShadow />
      {[-0.95, 0, 0.95].map((z) => (
        <CeramicPendant key={z} position={[0, 1.95, z]} drop={ROOM.height - 2.15} radius={0.24} />
      ))}
      {[-0.95, 0, 0.95].flatMap((z) => [
        <DiningChair key={`w${z}`} position={[-0.75, 0, z]} rotation={Math.PI / 2} wood={m.wood} seat={m.chairSeat} />,
        <DiningChair key={`e${z}`} position={[0.75, 0, z]} rotation={-Math.PI / 2} wood={m.wood} seat={m.chairSeat} />,
      ])}
      <Bowl position={[0, 0.77, 0.2]} radius={0.16} color="#d8cdbb" />
    </group>
  );
}

const CHAIR_TINT = { "fabric Mystere Mango Velvet": { color: "#e4d9c8", sheenColor: "#ffffff" } };

/** Mobilier du séjour, d'après le moodboard « villa ». */
function Furnishing({ m, settings, model }: { m: VillaMaterials; model: boolean } & SceneProps) {
  const pieces = useDisposable(
    () => ({
      coffee: slab(1.3, 0.34, 0.9, 0.05),
      credenza: slab(0.5, 0.62, 4.4, 0.01),
      rug: slab(4.4, 0.014, 4.8, 0.006),
      frame: slab(0.05, 1.8, 2.7, 0.006),
    }),
    [],
  );
  return (
    <group>
      {/* Salon bas tourné vers la mer */}
      <mesh geometry={pieces.rug} material={m.rug} position={[-3.1, 0.007, 3.4]} receiveShadow />
      <ModularSofa
        fabric={m.fabric}
        modules={[
          { x: -1.4, z: 3.15, width: 1.02, rotation: -Math.PI / 2 },
          { x: -1.4, z: 4.17, width: 1.02, rotation: -Math.PI / 2 },
          { x: -1.4, z: 5.19, width: 1.02, rotation: -Math.PI / 2 },
          { x: -2.45, z: 5.68, width: 1.05, rotation: Math.PI, open: true },
        ]}
      />
      <Model url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-5.0, 0, 2.1]} rotation-y={Math.PI / 2 + 0.3} scale={1.05} />
      <Model url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-5.0, 0, 3.7]} rotation-y={Math.PI / 2 - 0.3} scale={1.05} />
      <mesh geometry={pieces.coffee} material={m.stone} position={[-3.15, 0.17, 2.75]} castShadow receiveShadow />
      <Bowl position={[-3.4, 0.34, 2.95]} radius={0.18} />
      <Books position={[-3.55, 0.34, 2.5]} rotation={0.2} />
      <WineGlass position={[VILLA_GLASS[0], VILLA_GLASS[1] - GLASS_BOWL_CENTER, VILLA_GLASS[2]]} />
      <Vase position={[-2.85, 0.34, 3.05]} scale={0.7} color="#b9a58b" />

      {/* Rangement bas et œuvre sur le mur est */}
      <mesh geometry={pieces.credenza} material={m.woodPanel} position={[ROOM.maxX - 0.26, 0.31, 2.4]} castShadow receiveShadow />
      <Vase position={[ROOM.maxX - 0.3, 0.62, 1.1]} scale={1.3} color="#cfc2ad" />
      <Books position={[ROOM.maxX - 0.3, 0.62, 3.4]} rotation={1.6} colors={["#d9cfbf", "#8c7a63"]} />
      {!model && (
        <group position={[ROOM.maxX - 0.02, 2.05, 2.4]} rotation-y={-Math.PI / 2}>
          <mesh geometry={pieces.frame} material={m.darkWood} rotation-y={Math.PI / 2} position={[0, 0, -0.01]} />
          <group position={[0, 0, 0.02]}>
            <Artwork width={2.6} height={1.7} colors={["#b06a45", "#eadcc6", "#5d6248"]} />
          </group>
        </group>
      )}

      {/* Oliviers en pot */}
      <OliveTree position={[-6.1, 0, 6.3]} scale={1.5} seed={3} leaves={settings.particles > 100 ? 2800 : 1400} />
      <OliveTree position={[5.6, 0, -9.6]} scale={1.3} seed={8} leaves={settings.particles > 100 ? 2200 : 1100} />

      <DiningTable m={m} />

      {/* Voilage de la baie ouverte sur la terrasse */}
      <SheerCurtain position={[VILLA_CURTAIN[0], 2.05, VILLA_CURTAIN[2]]} width={1.8} height={4.0} backlight="#ffc58f" />
    </group>
  );
}

export function VillaContent({ settings, model = false }: SceneProps & { model?: boolean }) {
  const m = useVillaMaterials();
  return (
    <group>
      <VillaArchitecture m={m} model={model} />
      <Furnishing m={m} settings={settings} model={model} />
      {!model && (
        <>
          <Landscape />
          <Passage
            position={[EXIT_DOOR.x, 0, ROOM.minZ - 3.2]}
            width={EXIT_DOOR.width}
            height={EXIT_DOOR.height}
            length={6}
            material={m.darkWood}
            closed
          />
        </>
      )}
    </group>
  );
}

export default function VillaScene({ settings }: SceneProps) {
  return <VillaContent settings={settings} />;
}
