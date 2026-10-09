"use client";

import type { SceneProps } from "@/components/3d/SceneDirector";
import { useExperience } from "@/lib/experience-store";
import { LightShafts, type ShaftSource } from "@/scenes/shared/LightShafts";
import { Model } from "@/scenes/shared/Model";
import { CHATEAU_CURTAIN } from "@/scenes/anchors";
import { DustMotes } from "@/scenes/shared/DustMotes";
import { SheerCurtain } from "@/scenes/shared/hero/SheerCurtain";
import {
  ReflectionProbe,
  useProbeTarget,
} from "@/scenes/shared/ReflectionProbe";
import { Chandelier, useChandelierGeometry } from "./Chandelier";
import { BAY, GALLERY, HALL, STAIR, bayCenters } from "./constants";
import { Gallery } from "./Gallery";
import { GrandStair } from "./GrandStair";
import { Salon } from "./Salon";
import { useChateauMaterials } from "./useChateauMaterials";

/** Soleil d'après-midi entrant par les baies côté jardin. */
const SUN: [number, number, number] = [-30, 24, -8];

const WINDOW_SHAFTS: ShaftSource[] = bayCenters.map((z) => ({
  center: [
    -GALLERY.halfWidth - 0.3,
    (BAY.window.sill + BAY.window.spring) / 2 + 0.4,
    z,
  ],
  halfWidth: BAY.window.width / 2 - 0.1,
  halfHeight: (BAY.window.spring - BAY.window.sill) / 2,
}));

const HALL_SHAFT: ShaftSource[] = [
  { center: [0, 10, HALL.z1 - 0.2], halfWidth: 3.2, halfHeight: 5.5 },
];

const CHANDELIERS = bayCenters
  .filter((_, i) => i % 2 === 1)
  .map((z) => [0, GALLERY.wallHeight - 1.2, z] as [number, number, number]);

export default function ChateauScene({ settings }: SceneProps) {
  const probe = useProbeTarget(settings.reflectionProbe);
  const m = useChateauMaterials(probe.texture);
  const chandelier = useChandelierGeometry(1);
  const grandChandelier = useChandelierGeometry(1.8);
  const reduced = useExperience((s) => s.reducedMotion);
  const midZ = (GALLERY.z0 + GALLERY.z1) / 2;

  return (
    <group>
      <Salon m={m} chandelier={chandelier} />
      {/* Voilage de la grande baie : objet repère du dernier raccord. */}
      <SheerCurtain
        position={[CHATEAU_CURTAIN[0], 10, CHATEAU_CURTAIN[2]]}
        width={7.2}
        height={12}
        backlight="#ffd9ad"
      />
      {/* La galerie et le hall d'honneur sont construits le long de -Z puis pivotés dans l'enfilade du salon. */}
      <group rotation-y={Math.PI / 2}>
        <ReflectionProbe position={[0, 3.2, midZ]} target={probe} />
        <Gallery m={m} />
        <GrandStair m={m} />
        {CHANDELIERS.map((p) => (
          <Chandelier key={p[2]} geometry={chandelier} m={m} position={p} />
        ))}
        <Chandelier
          geometry={grandChandelier}
          m={m}
          position={[0, 12.5, (STAIR.start + STAIR.landing.z0) / 2]}
        />

        {[-12.5, -32.5].flatMap((z) => [
          <Model
            key={`a${z}`}
            url="/models/chair-damask-purplegold.glb"
            position={[GALLERY.halfWidth - 0.8, 0, z - 0.8]}
            rotation-y={-Math.PI / 2}
            scale={1.1}
          />,
          <Model
            key={`b${z}`}
            url="/models/chair-damask-purplegold.glb"
            position={[GALLERY.halfWidth - 0.8, 0, z + 0.8]}
            rotation-y={-Math.PI / 2}
            scale={1.1}
          />,
        ])}

        {settings.lightShafts && (
          <>
            <LightShafts
              sources={WINDOW_SHAFTS}
              right={[0, 0, 1]}
              up={[0, 1, 0]}
              direction={[-SUN[0], -SUN[1], -SUN[2]]}
              length={16}
              color="#ffe4bd"
              intensity={0.09}
            />
            <LightShafts
              sources={HALL_SHAFT}
              right={[1, 0, 0]}
              up={[0, 1, 0]}
              direction={[0, -0.45, 1]}
              length={22}
              color="#fff0d8"
              intensity={0.1}
            />
          </>
        )}
        {!reduced && settings.particles > 0 && (
          <DustMotes count={settings.particles} size={[11, 8, 60]} position={[0, 4, midZ]} />
        )}
      </group>
    </group>
  );
}
