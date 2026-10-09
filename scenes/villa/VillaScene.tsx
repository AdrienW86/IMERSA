"use client";

import { TorusGeometry } from "three";
import type { SceneProps } from "@/components/3d/SceneDirector";
import { useDisposable } from "@/hooks/useDisposable";
import { merge, at, slab } from "@/lib/geometry";
import { Artwork } from "@/scenes/shared/Artwork";
import { Model } from "@/scenes/shared/Model";
import { Passage } from "@/scenes/shared/Passage";
import { EXIT_DOOR, ROOM } from "./constants";
import { Landscape } from "./Landscape";
import { useVillaMaterials, type VillaMaterials } from "./useVillaMaterials";
import { VillaArchitecture } from "./VillaArchitecture";

/** Table de repas : plateau de chêne sur deux piétements en travertin. */
function DiningTable({ m }: { m: VillaMaterials }) {
  const parts = useDisposable(
    () => ({
      top: slab(1.05, 0.06, 2.9, 0.012),
      legs: merge([
        { geometry: slab(0.22, 0.71, 0.75, 0.01), matrix: at(0, 0.355, -0.9) },
        { geometry: slab(0.22, 0.71, 0.75, 0.01), matrix: at(0, 0.355, 0.9) },
      ]),
      ring: new TorusGeometry(0.42, 0.012, 10, 64).rotateX(Math.PI / 2),
    }),
    [],
  );
  return (
    <group position={[-4.4, 0, -7.4]}>
      <mesh geometry={parts.top} material={m.wood} position={[0, 0.74, 0]} castShadow receiveShadow />
      <mesh geometry={parts.legs} material={m.stone} castShadow receiveShadow />
      {[-0.9, 0, 0.9].map((z) => (
        <group key={z} position={[0, 2.25, z]}>
          <mesh geometry={parts.ring} material={m.brass} />
          <mesh geometry={parts.ring} scale={0.97} position={[0, -0.015, 0]}>
            <meshBasicMaterial color="#ffe2b8" toneMapped={false} />
          </mesh>
          <mesh position={[0, (4.2 - 2.25) / 2, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 4.2 - 2.25, 4]} />
            <meshBasicMaterial color="#222" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const SOFA_TINT = { GlamVelvetSofa_fabric_navy: { color: "#b8a389", sheenColor: "#f1e3cc" } };
const CHAIR_TINT = { "fabric Mystere Mango Velvet": { color: "#b0532c", sheenColor: "#f0a679" } };
const POUF_TINT = { "shot silk": { color: "#4b4f33" } };

function Furnishing({ m, settings, model }: { m: VillaMaterials; model: boolean } & SceneProps) {
  const pieces = useDisposable(
    () => ({
      coffee: slab(1.4, 0.32, 0.85, 0.06),
      credenza: slab(0.5, 0.62, 4.4, 0.01),
      rug: slab(3.8, 0.012, 4.6, 0.004),
      frame: slab(0.05, 1.8, 2.7, 0.006),
    }),
    [],
  );
  const lounge: [number, number, number] = [-3.2, 0, 2.6];
  return (
    <group>
      {/* Salon tourné vers la mer */}
      <mesh geometry={pieces.rug} material={m.rug} position={[lounge[0], 0.006, lounge[2]]} receiveShadow />
      <Model url="/models/glam-velvet-sofa.glb" tints={SOFA_TINT} position={[-1.05, 0, 2.6]} rotation-y={-Math.PI / 2} scale={1.08} />
      <Model url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-5.3, 0, 1.35]} rotation-y={Math.PI / 2 + 0.35} scale={1.05} />
      <Model url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-5.3, 0, 3.9]} rotation-y={Math.PI / 2 - 0.35} scale={1.05} />
      <mesh geometry={pieces.coffee} material={m.stone} position={[-3.2, 0.16, 2.6]} castShadow receiveShadow />
      <Model url="/models/specular-silk-pouf.glb" tints={POUF_TINT} position={[-2.7, 0, 4.75]} />
      {settings.transmission && (
        <Model url="/models/glass-hurricane-candle-holder.glb" position={[-3.45, 0.32, 2.45]} scale={1.1} castShadow={false} />
      )}

      {/* Rangement bas et œuvre sur le mur est */}
      <mesh geometry={pieces.credenza} material={m.woodPanel} position={[ROOM.maxX - 0.26, 0.31, 2.4]} castShadow receiveShadow />
      {!model && (
      <group position={[ROOM.maxX - 0.02, 2.05, 2.4]} rotation-y={-Math.PI / 2}>
        <mesh geometry={pieces.frame} material={m.darkWood} rotation-y={Math.PI / 2} position={[0, 0, -0.01]} />
        <group position={[0, 0, 0.02]}>
          <Artwork width={2.6} height={1.7} colors={["#c46a3c", "#e9d6b8", "#38423f"]} />
        </group>
      </group>
      )}
      {settings.transmission && (
        <Model url="/models/glass-vase-flowers.glb" position={[ROOM.maxX - 0.3, 0.62, 1.2]} scale={2} castShadow={false} />
      )}

      {/* Végétation intérieure */}
      <Model url="/models/diffuse-transmission-plant.glb" position={[-6.15, 0, 6.9]} scale={1.7} />
      <Model url="/models/diffuse-transmission-plant.glb" position={[6.1, 0, -10.1]} scale={1.9} rotation-y={1.2} />

      {/* Repas */}
      <DiningTable m={m} />
      {[-0.95, 0.95].flatMap((z) => [
        <Model key={`l${z}`} url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-5.25, 0, -7.4 + z]} rotation-y={Math.PI / 2} />,
        <Model key={`r${z}`} url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-3.55, 0, -7.4 + z]} rotation-y={-Math.PI / 2} />,
      ])}
      {settings.transmission && (
        <Model url="/models/glass-vase-flowers.glb" position={[-4.4, 0.77, -7.6]} scale={2.2} castShadow={false} />
      )}
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
