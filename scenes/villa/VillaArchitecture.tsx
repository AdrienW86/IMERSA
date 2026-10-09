"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  type InstancedMesh,
  Matrix4,
  type Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { at, merge, slab } from "@/lib/geometry";
import { useExperience } from "@/lib/experience-store";
import { Water } from "@/scenes/shared/Water";
import { EXIT_DOOR, ROOM, SUN_DIRECTION } from "./constants";
import type { VillaMaterials } from "./useVillaMaterials";

const { minX, maxX, minZ, maxZ, height: H } = ROOM;
const DEPTH = maxZ - minZ;
const MID_Z = (maxZ + minZ) / 2;
/** Débord de toiture au-dessus de la terrasse. */
const EAVE = 1.4;

/** Flammes procédurales du foyer (bruit animé, rendu additif). */
function FireSlot({ width, height }: { width: number; height: number }) {
  const reduced = useExperience((s) => s.reducedMotion);
  const geometry = useDisposable(() => new PlaneGeometry(width, height), [width, height]);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: { uTime: { value: 0 }, uColor: { value: new Color("#ff8a3a") } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
            return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
          void main() {
            vec2 p = vec2(vUv.x * 9.0, vUv.y * 2.0 - uTime * 1.6);
            float f = n(p) * 0.6 + n(p * 2.3 + 3.1) * 0.3 + n(p * 5.1) * 0.1;
            float shape = smoothstep(1.0, 0.0, vUv.y) * smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
            float flame = smoothstep(0.35, 0.9, f * shape + (1.0 - vUv.y) * 0.35);
            vec3 col = mix(uColor, vec3(1.0, 0.86, 0.55), flame * flame) * flame * 2.4;
            gl_FragColor = vec4(col, flame);
          }
        `,
      }),
    [],
  );
  const mesh = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
  useFrame((_, delta) => {
    if (!reduced && mesh.current) mesh.current.material.uniforms.uTime.value += Math.min(delta, 0.05);
  });
  return <mesh ref={mesh} geometry={geometry} material={material} />;
}

/** Plafond à lames de chêne (instanciées) sur fond acoustique sombre. */
function SlatCeiling({ m }: { m: VillaMaterials }) {
  const ref = useRef<InstancedMesh>(null);
  const spacing = 0.11;
  const count = Math.floor((maxX - minX) / spacing);
  const geometry = useDisposable(() => slab(0.045, 0.07, DEPTH), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, matrix.setPosition(minX + spacing / 2 + i * spacing, H - 0.035, MID_Z));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count]);
  return (
    <group>
      <instancedMesh ref={ref} args={[geometry, m.wood, count]} castShadow receiveShadow />
      <mesh material={m.acoustic} position={[0, H + 0.02, MID_Z]}>
        <boxGeometry args={[maxX - minX, 0.04, DEPTH]} />
      </mesh>
    </group>
  );
}

export function VillaArchitecture({ m, model }: { m: VillaMaterials; model: boolean }) {
  // Enveloppe intérieure : murs, sol, structure de la baie vitrée.
  const wallH = model ? 0.9 : H;
  const shell = useDisposable(() => {
    const doorL = EXIT_DOOR.x - EXIT_DOOR.width / 2;
    const doorR = EXIT_DOOR.x + EXIT_DOOR.width / 2;
    return {
      floor: slab(maxX - minX, 0.2, DEPTH),
      // En maquette (jumeau numérique), les murs face à la caméra sont coupés bas.
      rightWall: merge([
        { geometry: slab(0.3, wallH, DEPTH), matrix: at(maxX + 0.15, wallH / 2, MID_Z) },
        { geometry: slab(maxX - minX + 0.6, wallH, 0.3), matrix: at(0, wallH / 2, maxZ + 0.15) },
      ]),
      backWall: merge([
        { geometry: slab(doorL - minX, H, 0.4), matrix: at((minX + doorL) / 2, H / 2, minZ - 0.2) },
        { geometry: slab(maxX - doorR + 0.3, H, 0.4), matrix: at((doorR + maxX + 0.3) / 2, H / 2, minZ - 0.2) },
        {
          geometry: slab(EXIT_DOOR.width, H - EXIT_DOOR.height, 0.4),
          matrix: at(EXIT_DOOR.x, (H + EXIT_DOOR.height) / 2, minZ - 0.2),
        },
      ]),
      roof: merge([
        { geometry: slab(maxX - minX + EAVE, 0.45, DEPTH + 1.2), matrix: at(-EAVE / 2, H + 0.27, MID_Z) },
      ]),
      fascia: slab(0.08, 0.5, DEPTH + 1.2),
      doorFrame: merge([
        { geometry: slab(0.08, EXIT_DOOR.height, 0.5), matrix: at(doorL - 0.04, EXIT_DOOR.height / 2, minZ - 0.2) },
        { geometry: slab(0.08, EXIT_DOOR.height, 0.5), matrix: at(doorR + 0.04, EXIT_DOOR.height / 2, minZ - 0.2) },
        { geometry: slab(EXIT_DOOR.width + 0.16, 0.08, 0.5), matrix: at(EXIT_DOOR.x, EXIT_DOOR.height + 0.04, minZ - 0.2) },
      ]),
    };
  }, [wallH]);

  // Baie vitrée panoramique : montants acier fins et vitrages toute hauteur.
  const glazing = useDisposable(() => {
    const bays = 8;
    const step = DEPTH / bays;
    const parts = [];
    for (let i = 0; i <= bays; i++) {
      parts.push({ geometry: slab(0.12, H, 0.06, 0.005), matrix: at(minX, H / 2, minZ + i * step) });
    }
    parts.push({ geometry: slab(0.14, 0.08, DEPTH), matrix: at(minX, 0.04, MID_Z) });
    parts.push({ geometry: slab(0.14, 0.1, DEPTH), matrix: at(minX, H - 0.05, MID_Z) });
    return { frame: merge(parts), pane: new PlaneGeometry(DEPTH, H - 0.18).rotateY(Math.PI / 2) };
  }, []);

  // Monolithe en travertin : mur-cheminée autoportant, foyer horizontal.
  const monolith = useDisposable(() => {
    const x0 = -0.5;
    const x1 = 4.6;
    const z = -3.2;
    const d = 0.62;
    const slotL = 0.9;
    const slotR = 3.4;
    const slotB = 0.42;
    const slotT = 0.92;
    return merge([
      { geometry: slab(x1 - x0, slotB, d, 0.01), matrix: at((x0 + x1) / 2, slotB / 2, z) },
      { geometry: slab(x1 - x0, H - slotT, d, 0.01), matrix: at((x0 + x1) / 2, (H + slotT) / 2, z) },
      { geometry: slab(slotL - x0, slotT - slotB, d), matrix: at((x0 + slotL) / 2, (slotB + slotT) / 2, z) },
      { geometry: slab(x1 - slotR, slotT - slotB, d), matrix: at((slotR + x1) / 2, (slotB + slotT) / 2, z) },
      { geometry: slab(slotR - slotL, slotT - slotB, 0.12), matrix: at((slotL + slotR) / 2, (slotB + slotT) / 2, z - d / 2 + 0.06) },
    ]);
  }, []);

  // Cuisine : îlot monolithique et façade de rangements en chêne.
  const kitchen = useDisposable(
    () => ({
      island: merge([
        { geometry: slab(1.1, 0.06, 3.4, 0.01), matrix: at(4.6, 0.92, -6.6) },
        { geometry: slab(0.06, 0.92, 3.4, 0.005), matrix: at(4.08, 0.46, -6.6) },
        { geometry: slab(0.06, 0.92, 3.4, 0.005), matrix: at(5.12, 0.46, -6.6) },
        { geometry: slab(1.1, 0.92, 0.06, 0.005), matrix: at(4.6, 0.46, -4.93) },
        { geometry: slab(1.1, 0.92, 0.06, 0.005), matrix: at(4.6, 0.46, -8.27) },
      ]),
      cabinets: merge(
        Array.from({ length: 9 }, (_, i) => ({
          geometry: slab(0.62, H - 0.05, 0.74, 0.006),
          matrix: at(maxX - 0.31, (H - 0.05) / 2, -10.6 + i * 0.755 + 0.37),
        })),
      ),
    }),
    [],
  );

  // Terrasse en travertin, bassin à débordement.
  const terrace = useDisposable(() => {
    const t = 0.3;
    const y = -t / 2 - 0.02;
    return {
      deck: merge([
        { geometry: slab(9, t, 4.4), matrix: at(-11.5, y, 6.8) },
        { geometry: slab(9, t, 4), matrix: at(-11.5, y, -10) },
        { geometry: slab(2.5, t, 13), matrix: at(-8.25, y, -1.5) },
        { geometry: slab(0.9, t, 13), matrix: at(-15.55, y, -1.5) },
      ]),
      basin: merge([
        { geometry: slab(5.6, 0.1, 13), matrix: at(-12.3, -1.45, -1.5) },
        { geometry: slab(0.1, 1.4, 13), matrix: at(-9.55, -0.75, -1.5) },
        { geometry: slab(0.1, 1.4, 13), matrix: at(-15.05, -0.75, -1.5) },
        { geometry: slab(5.6, 1.4, 0.1), matrix: at(-12.3, -0.75, 4.95) },
        { geometry: slab(5.6, 1.4, 0.1), matrix: at(-12.3, -0.75, -7.95) },
      ]),
    };
  }, []);

  return (
    <group>
      {/* Sol intérieur en béton ciré */}
      <mesh geometry={shell.floor} material={m.floor} position={[0, -0.1, MID_Z]} receiveShadow />
      <mesh geometry={shell.rightWall} material={m.walls} receiveShadow castShadow />
      <mesh geometry={shell.backWall} material={m.stone} receiveShadow castShadow />
      <mesh geometry={shell.doorFrame} material={m.brass} />
      {!model && (
        <>
          <mesh geometry={shell.roof} material={m.walls} castShadow />
          <mesh geometry={shell.fascia} material={m.steel} position={[minX - EAVE, H + 0.27, MID_Z]} />
        </>
      )}
      {!model && <SlatCeiling m={m} />}

      <mesh geometry={glazing.frame} material={m.steel} castShadow />
      <mesh geometry={glazing.pane} material={m.glass} position={[minX, H / 2, MID_Z]} renderOrder={2} />

      <mesh geometry={monolith} material={m.stone} castShadow receiveShadow />
      <mesh position={[2.15, 0.44, -3.05]} material={m.ember}>
        <boxGeometry args={[2.4, 0.04, 0.3]} />
      </mesh>
      <group position={[2.15, 0.67, -3.0]}>
        <FireSlot width={2.4} height={0.46} />
      </group>

      <mesh geometry={kitchen.island} material={m.stone} castShadow receiveShadow />
      <mesh geometry={kitchen.cabinets} material={m.woodPanel} castShadow receiveShadow />

      <mesh geometry={terrace.deck} material={m.stoneOutdoor} receiveShadow castShadow />
      <mesh geometry={terrace.basin} material={m.poolTile} receiveShadow />
      <Water
        width={5.4}
        depth={12.8}
        position={[-12.3, -0.14, -1.5]}
        deep="#127a8a"
        shallow="#4fc1c8"
        sky="#d6e6ee"
        sunDirection={SUN_DIRECTION}
        waveScale={1.6}
        choppiness={0.35}
      />
    </group>
  );
}
