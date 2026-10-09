"use client";

import {
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import type { SceneProps } from "@/components/3d/SceneDirector";
import { useDisposable } from "@/hooks/useDisposable";
import { usePbrTextures } from "@/hooks/usePbrTextures";
import { at, merge, slab } from "@/lib/geometry";
import { Artwork } from "@/scenes/shared/Artwork";
import { City } from "@/scenes/shared/City";
import { Model } from "@/scenes/shared/Model";
import { Passage } from "@/scenes/shared/Passage";
import { SkyDome } from "@/scenes/shared/SkyDome";

const X0 = -10;
const X1 = 10;
const Z0 = -12;
const Z1 = 4;
const H = 3.5;
const MID_X = (X0 + X1) / 2;
const MID_Z = (Z0 + Z1) / 2;
/** Le penthouse domine la ville de 120 m. */
const STREET = -120;
const SUN: [number, number, number] = [-8, 4, -40];
const DOOR = { x0: 4.3, x1: 6.7 };

function usePenthouseMaterials() {
  const marble = usePbrTextures("marble-warm", 3.2);
  const plaster = usePbrTextures("plaster", 2.5);
  const oak = usePbrTextures("oak", 1.3, Math.PI / 2);
  const dark = usePbrTextures("marble-black", 2.2);
  return useDisposable(
    () => ({
      floor: new MeshPhysicalMaterial({
        ...marble,
        color: new Color("#f4ece2"),
        roughness: 1,
        clearcoat: 0.6,
        clearcoatRoughness: 0.08,
        envMapIntensity: 0.8,
      }),
      terrace: new MeshStandardMaterial({ ...marble, color: new Color("#cfc6bb"), roughness: 0.9 }),
      walls: new MeshStandardMaterial({ ...plaster, color: new Color("#f3efe9"), roughness: 1 }),
      oak: new MeshStandardMaterial({ ...oak, color: new Color("#c9a986"), roughness: 0.7 }),
      blackMarble: new MeshPhysicalMaterial({ ...dark, roughness: 1, clearcoat: 0.8, clearcoatRoughness: 0.06 }),
      frame: new MeshStandardMaterial({ color: new Color("#202124"), metalness: 0.8, roughness: 0.35 }),
      bronze: new MeshStandardMaterial({ color: new Color("#8d6a45"), metalness: 1, roughness: 0.3 }),
      glass: new MeshPhysicalMaterial({
        color: new Color("#dfe6ee"),
        roughness: 0.03,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        envMapIntensity: 1.4,
      }),
      passage: new MeshStandardMaterial({ ...oak, color: new Color("#4a3a2e"), roughness: 0.7 }),
      rug: new MeshStandardMaterial({ color: new Color("#b8ab9b"), roughness: 1 }),
      cove: new MeshStandardMaterial({ color: new Color("#000000"), emissive: new Color("#ffcf96"), emissiveIntensity: 3.2 }),
    }),
    [marble, plaster, oak, dark],
  );
}

type PenthouseMaterials = ReturnType<typeof usePenthouseMaterials>;

/** Trame de rues éclairées au pied des tours (vue plongeante de nuit). */
function StreetGrid() {
  const geometry = useDisposable(() => new PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), []);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        fog: true,
        uniforms: {
          fogColor: { value: new Color() },
          fogDensity: { value: 0 },
          fogNear: { value: 1 },
          fogFar: { value: 1000 },
        },
        vertexShader: /* glsl */ `
          #include <fog_pars_vertex>
          varying vec2 vP;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vP = w.xz;
            vec4 mvPosition = viewMatrix * w;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }
        `,
        fragmentShader: /* glsl */ `
          #include <fog_pars_fragment>
          varying vec2 vP;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          void main() {
            vec2 cell = vP / 74.0;
            vec2 g = abs(fract(cell) - 0.5);
            float street = smoothstep(0.47, 0.5, max(g.x, g.y));
            float avenue = smoothstep(0.485, 0.5, abs(fract(vP.x / 370.0) - 0.5)) ;
            float lamps = step(0.6, h(floor(vP / 9.0)));
            vec3 col = vec3(0.02, 0.022, 0.03);
            col += vec3(1.0, 0.62, 0.3) * street * (0.35 + lamps * 0.65) * 0.9;
            col += vec3(1.0, 0.75, 0.45) * avenue * 1.2;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }
        `,
      }),
    [],
  );
  return <mesh geometry={geometry} material={material} position={[0, STREET + 0.5, 0]} />;
}

function Shell({ m }: { m: PenthouseMaterials }) {
  const g = useDisposable(() => {
    const mullionsFront = [];
    for (let x = X0; x <= X1 + 0.01; x += 2.5) {
      if (x > DOOR.x0 + 0.1 && x < DOOR.x1 - 0.1) continue;
      mullionsFront.push({ geometry: slab(0.06, H, 0.1), matrix: at(x, H / 2, Z0) });
    }
    const mullionsSide = [];
    for (let z = Z0 + 2.5; z <= Z1; z += 2.5) {
      mullionsSide.push({ geometry: slab(0.1, H, 0.06), matrix: at(X1, H / 2, z) });
    }
    return {
      floor: slab(X1 - X0, 0.3, Z1 - Z0),
      ceiling: slab(X1 - X0 + 0.4, 0.3, Z1 - Z0 + 0.4),
      backWall: merge([
        { geometry: slab(-6 - 0.85 - X0 + 0.3, H, 0.3), matrix: at((X0 - 0.3 + -6.85) / 2, H / 2, Z1 + 0.15) },
        { geometry: slab(X1 - -5.15, H, 0.3), matrix: at((X1 + -5.15) / 2, H / 2, Z1 + 0.15) },
        { geometry: slab(1.7, H - 3.1, 0.3), matrix: at(-6, (H + 3.1) / 2, Z1 + 0.15) },
      ]),
      leftWall: slab(0.3, H, Z1 - Z0),
      oakWall: slab(0.06, H - 0.4, 9),
      frames: merge([
        ...mullionsFront,
        ...mullionsSide,
        { geometry: slab(X1 - X0, 0.12, 0.12), matrix: at(MID_X, H - 0.06, Z0) },
        { geometry: slab(0.12, 0.12, Z1 - Z0), matrix: at(X1, H - 0.06, MID_Z) },
        { geometry: slab(X1 - X0, 0.05, 0.12), matrix: at(MID_X, 0.025, Z0) },
        { geometry: slab(0.12, 0.05, Z1 - Z0), matrix: at(X1, 0.025, MID_Z) },
      ]),
      frontPaneL: new PlaneGeometry(DOOR.x0 - X0, H),
      frontPaneR: new PlaneGeometry(X1 - DOOR.x1, H),
      sidePane: new PlaneGeometry(Z1 - Z0, H).rotateY(-Math.PI / 2),
      cove: merge([
        { geometry: slab(X1 - X0 - 0.4, 0.03, 0.12), matrix: at(MID_X, H - 0.18, Z0 + 0.35) },
        { geometry: slab(0.12, 0.03, Z1 - Z0 - 0.4), matrix: at(X1 - 0.35, H - 0.18, MID_Z) },
      ]),
      terrace: slab(X1 - X0 + 2.5, 0.3, 6.5),
      balustrade: merge([
        { geometry: slab(X1 - X0 + 2.5, 1.1, 0.02), matrix: at(MID_X + 1.25, 0.55, Z0 - 6.5) },
        { geometry: slab(0.02, 1.1, 6.5 + Z1 - Z0), matrix: at(X1 + 2.5, 0.55, (Z0 - 6.5 + Z1) / 2) },
      ]),
      railCap: merge([
        { geometry: slab(X1 - X0 + 2.5, 0.04, 0.06), matrix: at(MID_X + 1.25, 1.12, Z0 - 6.5) },
        { geometry: slab(0.06, 0.04, 6.5 + Z1 - Z0), matrix: at(X1 + 2.5, 1.12, (Z0 - 6.5 + Z1) / 2) },
      ]),
      sideTerrace: slab(2.5, 0.3, Z1 - Z0),
      // Volume extérieur de l'immeuble (dalle de rive et façade sous le penthouse).
      tower: slab(X1 - X0 + 2.5, 40, Z1 - Z0 + 6.5),
    };
  }, []);

  return (
    <group>
      <mesh geometry={g.floor} material={m.floor} position={[MID_X, -0.15, MID_Z]} receiveShadow />
      <mesh geometry={g.ceiling} material={m.walls} position={[MID_X, H + 0.15, MID_Z]} />
      <mesh geometry={g.backWall} material={m.walls} receiveShadow castShadow />
      <mesh geometry={g.leftWall} material={m.walls} position={[X0 - 0.15, H / 2, MID_Z]} receiveShadow />
      <mesh geometry={g.oakWall} material={m.oak} position={[X0 + 0.03, H / 2 - 0.2, -5.5]} receiveShadow />
      <mesh geometry={g.frames} material={m.frame} castShadow />
      <mesh geometry={g.frontPaneL} material={m.glass} position={[(X0 + DOOR.x0) / 2, H / 2, Z0]} renderOrder={2} />
      <mesh geometry={g.frontPaneR} material={m.glass} position={[(DOOR.x1 + X1) / 2, H / 2, Z0]} renderOrder={2} />
      <mesh geometry={g.sidePane} material={m.glass} position={[X1, H / 2, MID_Z]} renderOrder={2} />
      <mesh geometry={g.cove} material={m.cove} />
      <mesh geometry={g.terrace} material={m.terrace} position={[MID_X + 1.25, -0.17, Z0 - 3.25]} receiveShadow />
      <mesh geometry={g.sideTerrace} material={m.terrace} position={[X1 + 1.25, -0.17, MID_Z]} receiveShadow />
      <mesh geometry={g.balustrade} material={m.glass} renderOrder={2} />
      <mesh geometry={g.railCap} material={m.frame} />
      <mesh geometry={g.tower} material={m.frame} position={[MID_X + 1.25, -20.35, (Z0 - 6.5 + Z1) / 2]} />
    </group>
  );
}

/** Lampadaire en arc : socle en marbre, tige cintrée, diffuseur opalin. */
function ArcLamp({ m }: { m: PenthouseMaterials }) {
  const g = useDisposable(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0.1, 0),
      new Vector3(0, 1.4, 0),
      new Vector3(0.25, 2.1, 0),
      new Vector3(0.9, 2.35, 0),
      new Vector3(1.6, 2.1, 0),
      new Vector3(1.85, 1.75, 0),
    ]);
    return {
      arc: new TubeGeometry(curve, 64, 0.014, 8, false),
      base: new CylinderGeometry(0.22, 0.24, 0.1, 32),
      shade: new SphereGeometry(0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    };
  }, []);
  return (
    <group position={[4.4, 0, -1.6]} rotation-y={-2.2}>
      <mesh geometry={g.base} material={m.blackMarble} position={[0, 0.05, 0]} castShadow />
      <mesh geometry={g.arc} material={m.bronze} castShadow />
      <group position={[1.85, 1.72, 0]}>
        <mesh geometry={g.shade} material={m.bronze} />
        <mesh position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.1, 16, 10]} />
          <meshBasicMaterial color="#ffe3bd" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

const SOFA_TINT = { GlamVelvetSofa_fabric_navy: { color: "#3b3732", sheenColor: "#bfae98" } };
const CHAIR_TINT = { "fabric Mystere Mango Velvet": { color: "#e2d7c7", sheenColor: "#ffffff" } };
const POUF_TINT = { "shot silk": { color: "#7b5a3a" } };

function Furnishing({ m }: { m: PenthouseMaterials }) {
  const g = useDisposable(
    () => ({
      table: new CylinderGeometry(0.62, 0.62, 0.34, 64),
      island: slab(3.4, 0.95, 1.1, 0.01),
      plinth: slab(0.5, 1.05, 0.5, 0.004),
      sculpture: merge([
        { geometry: new SphereGeometry(0.2, 32, 20).scale(1.3, 0.55, 1), matrix: at(0, 0.11, 0) },
        { geometry: new SphereGeometry(0.15, 32, 20).scale(1.2, 0.6, 1), matrix: at(0.03, 0.29, 0, 0.5) },
        { geometry: new SphereGeometry(0.1, 32, 20).scale(1.2, 0.65, 1), matrix: at(-0.02, 0.42, 0, 1.2) },
      ]),
      rug: slab(4.4, 0.012, 3.6, 0.004),
      dining: slab(1.1, 0.05, 2.6, 0.01),
      diningBase: slab(0.35, 0.68, 1.4, 0.01),
    }),
    [],
  );
  return (
    <group>
      {/* Salon tourné vers l'angle vitré */}
      <group position={[7, 0, -4.3]} rotation-y={-Math.PI / 4}>
        <mesh geometry={g.rug} material={m.rug} position={[0, 0.006, 0]} receiveShadow />
        <Model url="/models/glam-velvet-sofa.glb" tints={SOFA_TINT} position={[0, 0, 1.4]} rotation-y={Math.PI} scale={1.1} />
        <mesh geometry={g.table} material={m.blackMarble} position={[0, 0.17, -0.2]} castShadow receiveShadow />
        <Model url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-1.9, 0, -0.6]} rotation-y={Math.PI / 2 + 0.4} />
        <Model url="/models/specular-silk-pouf.glb" tints={POUF_TINT} position={[1.7, 0, -0.9]} />
      </group>
      <ArcLamp m={m} />

      {/* Cuisine et table de repas */}
      <mesh geometry={g.island} material={m.blackMarble} position={[-7.3, 0.475, -0.8]} castShadow receiveShadow />
      <mesh geometry={g.dining} material={m.oak} position={[-6.6, 0.74, -6.6]} castShadow receiveShadow />
      <mesh geometry={g.diningBase} material={m.blackMarble} position={[-6.6, 0.36, -6.6]} castShadow />
      <Model url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-7.6, 0, -6.6]} rotation-y={Math.PI / 2} />
      <Model url="/models/sheen-chair.glb" tints={CHAIR_TINT} position={[-5.6, 0, -6.6]} rotation-y={-Math.PI / 2} />
      <mesh geometry={g.plinth} material={m.walls} position={[-1.3, 0.525, -10.9]} castShadow receiveShadow />
      <mesh geometry={g.sculpture} material={m.bronze} position={[-1.3, 1.05, -10.9]} castShadow />

      <group position={[2.5, 1.75, Z1 - 0.02]} rotation-y={Math.PI}>
        <Artwork width={3.2} height={2} colors={["#5b6f86", "#d9cfc1", "#2b2a2d"]} />
      </group>
    </group>
  );
}

export default function PenthouseScene({ settings }: SceneProps) {
  const m = usePenthouseMaterials();
  return (
    <group>
      <SkyDome
        top="#14254d"
        horizon="#94645f"
        bottom="#151a28"
        sunDirection={SUN}
        sunColor="#ff7a45"
        sunFocus={180}
        sunStrength={0.7}
        gradient={0.22}
      />
      <StreetGrid />
      <City
        ground={STREET}
        center={[0, 0]}
        innerRadius={70}
        outerRadius={1800}
        count={settings.cityBlocks}
        minHeight={18}
        maxHeight={96}
        sunDirection={SUN}
        sunColor="#ff9c6a"
        ambient="#28324a"
        windowGlow={1.1}
        seed={11}
      />
      <Shell m={m} />
      <Furnishing m={m} />
      <Passage position={[-6, 0, Z1 + 3]} material={m.passage} />
    </group>
  );
}
