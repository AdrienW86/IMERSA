"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  type Group,
  type Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { lathe } from "@/lib/geometry";
import { useExperience } from "@/lib/experience-store";

/** Hauteur du centre de la flamme au-dessus du pied d'une bougie de 20 cm. */
export const FLAME_HEIGHT = 0.225;

const FLAME_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Billboard cylindrique : la flamme reste verticale et fait face à la caméra.
    vec3 center = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 toCam = normalize(vec3(cameraPosition.x - center.x, 0.0, cameraPosition.z - center.z));
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
    float sway = sin(uTime * 2.3) * 0.0012 + sin(uTime * 7.1) * 0.0005;
    vec3 world = center + right * position.x + vec3(0.0, position.y, 0.0) + right * sway * (position.y + 0.012) * 40.0;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const FLAME_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  void main() {
    vec2 p = vUv * 2.0 - 1.0;          // x ∈ [-1,1], y ∈ [-1,1]
    float y = vUv.y;
    float flick = n(vec2(y * 3.0 - uTime * 4.0, uTime * 0.7)) * 0.12;
    // Silhouette en goutte : large en bas, effilée en haut.
    float width = mix(0.55, 0.02, pow(y, 1.25)) * (1.0 - smoothstep(0.0, 0.18, 0.18 - y) * 0.5) + flick * y;
    float d = abs(p.x) / max(width, 0.001);
    float body = smoothstep(1.0, 0.55, d) * smoothstep(0.0, 0.08, y) * smoothstep(1.0, 0.82, y);
    float core = smoothstep(0.75, 0.0, d) * smoothstep(0.05, 0.25, y) * smoothstep(0.7, 0.3, y);
    vec3 col = mix(vec3(1.0, 0.42, 0.08), vec3(1.0, 0.78, 0.38), body);
    col = mix(col, vec3(1.0, 0.97, 0.88), core);
    float blue = smoothstep(0.22, 0.05, y) * smoothstep(1.0, 0.3, d) * 0.6;
    col = mix(col, vec3(0.35, 0.45, 1.0), blue * 0.5);
    float a = clamp(body * 0.95 + blue * 0.3, 0.0, 1.0);
    // La flamme écrit sa profondeur là où elle est dense : la mise au point la garde nette.
    if (a < 0.12) discard;
    gl_FragColor = vec4(col * (1.6 + core * 1.2) * a, a);
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(max(1.0 - d, 0.0), 3.0) * 0.12;
    gl_FragColor = vec4(vec3(1.0, 0.7, 0.4) * a, a);
  }
`;

/**
 * Bougie à flamme vivante (shader animé, halo additif). Objet repère du
 * deuxième raccord : la même bougie brûle dans le gîte et sur le candélabre
 * du château.
 */
export function Candle({
  position,
  wax = "#f3ece0",
  height = 0.2,
}: {
  position: [number, number, number];
  wax?: string;
  height?: number;
}) {
  const reduced = useExperience((s) => s.reducedMotion);
  const group = useRef<Group>(null);
  const flame = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

  const g = useDisposable(
    () => ({
      // Bougie : cire légèrement creusée au sommet par la fonte.
      body: lathe(
        [
          [0.001, 0],
          [0.0115, 0],
          [0.0115, height - 0.004],
          [0.0105, height],
          [0.006, height - 0.002],
          [0.001, height - 0.003],
        ],
        32,
      ),
      wick: new CylinderGeometry(0.0007, 0.0009, 0.012, 6).translate(0, height + 0.004, 0),
      flame: new PlaneGeometry(0.016, 0.042).translate(0, 0.021, 0),
      halo: new PlaneGeometry(0.09, 0.09),
    }),
    [height],
  );
  const m = useDisposable(
    () => ({
      wax: new MeshStandardMaterial({ color: new Color(wax), roughness: 0.55, emissive: new Color("#ff9b4a"), emissiveIntensity: 0.06 }),
      wick: new MeshStandardMaterial({ color: new Color("#1a1410"), roughness: 1 }),
      flame: new ShaderMaterial({
        transparent: true,
        depthWrite: true,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: FLAME_VERTEX,
        fragmentShader: FLAME_FRAGMENT,
      }),
      halo: new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
        vertexShader: FLAME_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        uniforms: { uTime: { value: 0 } },
      }),
    }),
    [wax],
  );

  useFrame(({ clock }) => {
    const f = flame.current;
    if (f && !reduced) f.material.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group ref={group} position={position}>
      <mesh geometry={g.body} material={m.wax} castShadow />
      <mesh geometry={g.wick} material={m.wick} />
      <mesh ref={flame} geometry={g.flame} material={m.flame} position={[0, height + 0.004, 0]} renderOrder={8} frustumCulled={false} />
      <mesh geometry={g.halo} material={m.halo} position={[0, height + 0.02, 0]} renderOrder={7} frustumCulled={false} />
    </group>
  );
}
