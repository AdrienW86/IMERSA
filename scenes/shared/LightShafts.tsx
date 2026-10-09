"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  type Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { useExperience } from "@/lib/experience-store";

export interface ShaftSource {
  /** Centre de l'ouverture. */
  center: [number, number, number];
  /** Demi-dimensions de l'ouverture dans son plan (axes `right` et `up`). */
  halfWidth: number;
  halfHeight: number;
}

interface LightShaftsProps {
  sources: ShaftSource[];
  /** Axes du plan des ouvertures. */
  right: [number, number, number];
  up: [number, number, number];
  /** Direction de propagation de la lumière (vers l'intérieur). */
  direction: [number, number, number];
  length: number;
  color: string;
  intensity: number;
}

/**
 * Rayons de lumière volumétriques simulés : chaque ouverture est extrudée
 * le long de la direction du soleil ; un shader additif atténue le volume
 * avec la distance, sur les bords, et l'anime d'une poussière lente.
 */
export function LightShafts({ sources, right, up, direction, length, color, intensity }: LightShaftsProps) {
  const reduced = useExperience((s) => s.reducedMotion);
  const mesh = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);

  const geometry = useDisposable(() => {
    const r = new Vector3(...right);
    const u = new Vector3(...up);
    const d = new Vector3(...direction).normalize().multiplyScalar(length);
    const positions: number[] = [];
    const coords: number[] = [];
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
    const v = new Vector3();
    for (const s of sources) {
      const c = new Vector3(...s.center);
      const ring = corners.map(([a, b]) =>
        v.copy(c).addScaledVector(r, a * s.halfWidth).addScaledVector(u, b * s.halfHeight).clone(),
      );
      // Quatre faces latérales du prisme : (x = position sur le bord, y = distance).
      for (let i = 0; i < 4; i++) {
        const a0 = ring[i];
        const a1 = ring[(i + 1) % 4];
        const b0 = a0.clone().add(d);
        const b1 = a1.clone().add(d);
        positions.push(...a0.toArray(), ...a1.toArray(), ...b1.toArray(), ...a0.toArray(), ...b1.toArray(), ...b0.toArray());
        coords.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    g.setAttribute("aCoord", new Float32BufferAttribute(coords, 2));
    return g;
  }, [sources, length, ...right, ...up, ...direction]);

  const material = useDisposable(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        toneMapped: false,
        fog: false,
        uniforms: {
          uColor: { value: new Color(color) },
          uIntensity: { value: intensity },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          attribute vec2 aCoord;
          varying vec2 vCoord;
          varying vec3 vWorld;
          void main() {
            vCoord = aCoord;
            vec4 w = modelMatrix * vec4(position, 1.0);
            vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uIntensity; uniform float uTime;
          varying vec2 vCoord; varying vec3 vWorld;
          float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
          float n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x), mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x), f.y),
                       mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x), mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x), f.y), f.z); }
          void main() {
            float along = pow(1.0 - vCoord.y, 1.6) * smoothstep(0.0, 0.08, vCoord.y);
            float edge = smoothstep(0.0, 0.35, vCoord.x) * smoothstep(1.0, 0.65, vCoord.x);
            float dust = 0.75 + 0.25 * n(vWorld * 1.4 + vec3(0.0, uTime * 0.08, uTime * 0.05));
            float a = along * edge * dust * uIntensity;
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
      }),
    [color, intensity],
  );

  useFrame((_, delta) => {
    if (!reduced && mesh.current) mesh.current.material.uniforms.uTime.value += Math.min(delta, 0.05);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={5} frustumCulled={false} />;
}
