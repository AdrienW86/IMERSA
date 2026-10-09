"use client";

import {
  BufferAttribute,
  IcosahedronGeometry,
  Color,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
} from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useDisposable } from "@/hooks/useDisposable";
import { SkyDome } from "@/scenes/shared/SkyDome";
import { Water } from "@/scenes/shared/Water";
import { SUN_DIRECTION } from "./constants";

const noise = new ImprovedNoise();

function fbm(x: number, y: number, octaves = 5) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += noise.noise(x * freq, y * freq, 0.37 * i) * amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum;
}

/**
 * Promontoire côtier : relief bruité modelé par un masque elliptique,
 * coloré du maquis (vert olive) à la roche claire.
 */
function headland(width: number, depth: number, height: number, seed: number) {
  const geo = new PlaneGeometry(width, depth, 120, 60).rotateX(-Math.PI / 2);
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const scrub = new Color("#5d6a3c");
  const dry = new Color("#a39466");
  const rock = new Color("#c9b99a");
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = x / (width / 2);
    const nz = z / (depth / 2);
    const mask = Math.max(0, 1 - Math.pow(nx * nx + nz * nz * 1.6, 0.8));
    const n = fbm(x * 0.006 + seed, z * 0.006 - seed, 6) * 0.6 + 0.5;
    const h = Math.pow(mask, 1.4) * height * (0.55 + n * 0.75) - 6;
    pos.setY(i, h);
    const slope = fbm(x * 0.03 + seed, z * 0.03, 3);
    c.copy(scrub).lerp(dry, Math.min(1, Math.max(0, 0.4 + slope)));
    if (h < 6) c.lerp(rock, 0.7);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Haie de romarin taillée : volume arrondi au contour irrégulier. */
function hedgeGeometry(length: number) {
  const geo = new IcosahedronGeometry(1, 4);
  const pos = geo.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 1 + noise.noise(v.x * 4.3, v.y * 4.3, v.z * 4.3) * 0.12;
    pos.setXYZ(i, v.x * 0.42 * k, Math.max(v.y, -0.2) * 0.5 * k, v.z * (length / 2) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

export function Landscape() {
  const [hillA, hillB, island] = useDisposable(
    () => [headland(900, 420, 150, 1.3), headland(1100, 520, 210, 7.1), headland(380, 180, 60, 3.7)],
    [],
  );
  const hillMaterial = useDisposable(
    () => new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }),
    [],
  );
  // Jardinières en travertin le long de la terrasse, plantées de haies basses.
  const hedges = useDisposable(() => {
    const merged = mergeGeometries([
      hedgeGeometry(3.6).applyMatrix4(new Matrix4().setPosition(-15.55, 0.42, 7.2)),
      hedgeGeometry(3.2).applyMatrix4(new Matrix4().setPosition(-15.55, 0.42, -10.2)),
      hedgeGeometry(2.4).applyMatrix4(new Matrix4().makeRotationY(Math.PI / 2).setPosition(-12.6, 0.42, 8.6)),
    ]);
    if (!merged) throw new Error("Géométrie de végétation invalide");
    return merged;
  }, []);

  return (
    <group>
      <SkyDome
        top="#2f6aac"
        horizon="#ecd2ae"
        bottom="#6f97b5"
        sunDirection={SUN_DIRECTION}
        sunColor="#ffd7a0"
        sunStrength={1.2}
      />
      <Water
        width={8000}
        depth={8000}
        position={[0, -32, 0]}
        deep="#08304a"
        shallow="#145c78"
        sky="#86a9c4"
        sunDirection={SUN_DIRECTION}
        waveScale={9}
        choppiness={0.5}
      />
      <mesh geometry={hillA} material={hillMaterial} position={[-760, -32, -520]} rotation-y={0.5} />
      <mesh geometry={hillB} material={hillMaterial} position={[-1150, -32, 520]} rotation-y={-0.35} />
      <mesh geometry={island} material={hillMaterial} position={[-1500, -32, -40]} />
      {/* Falaise sous la terrasse */}
      <mesh position={[-14, -16.3, -1.5]}>
        <boxGeometry args={[18, 32, 30]} />
        <meshStandardMaterial color="#b7a184" roughness={1} />
      </mesh>
      <mesh geometry={hedges} castShadow receiveShadow>
        <meshStandardMaterial color="#47552f" roughness={0.95} />
      </mesh>

    </group>
  );
}
