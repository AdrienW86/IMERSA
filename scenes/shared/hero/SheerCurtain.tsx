"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, DoubleSide, type Mesh, PlaneGeometry, ShaderMaterial } from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { useExperience } from "@/lib/experience-store";

/**
 * Voilage de lin rétroéclairé : plis réguliers, ondulation lente due à l'air,
 * lumière qui traverse la toile. Objet repère du troisième raccord : le même
 * voilage ferme la grande baie du château et la baie de la villa.
 * Le plan du voilage est orienté selon l'axe Z local (normale +X).
 */
export function SheerCurtain({
  position,
  width,
  height,
  backlight = "#ffd2a0",
  glow = 1,
  rotationY = 0,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  backlight?: string;
  glow?: number;
  /** Rotation du plan (par défaut, normale +X). */
  rotationY?: number;
}) {
  const reduced = useExperience((s) => s.reducedMotion);
  const mesh = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
  const geometry = useDisposable(
    () => new PlaneGeometry(width, height, Math.ceil(width * 60), Math.ceil(height * 14)).rotateY(Math.PI / 2),
    [width, height],
  );
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        fog: true,
        uniforms: {
          uTime: { value: 0 },
          uBack: { value: new Color(backlight) },
          uGlow: { value: glow },
          uHeight: { value: height },
          fogColor: { value: new Color() },
          fogDensity: { value: 0 },
          fogNear: { value: 1 },
          fogFar: { value: 1000 },
        },
        vertexShader: /* glsl */ `
          #include <fog_pars_vertex>
          uniform float uTime, uHeight;
          varying vec2 vUv;
          varying float vFold;
          void main() {
            vUv = uv;
            vec3 p = position;
            float s = p.z;                    // abscisse le long du voilage
            float hang = 1.0 - uv.y;          // 0 en haut (tringle), 1 en bas
            float pleats = sin(s * 34.0) * 0.035 + sin(s * 13.0 + 1.3) * 0.02;
            float breeze = sin(uTime * 0.7 + s * 2.2 + uv.y * 2.5) * 0.05 + sin(uTime * 1.3 + s * 5.1) * 0.015;
            p.x += pleats + breeze * hang * hang;
            vFold = cos(s * 34.0) * 0.5 + 0.5;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }
        `,
        fragmentShader: /* glsl */ `
          #include <fog_pars_fragment>
          uniform vec3 uBack; uniform float uGlow, uTime;
          varying vec2 vUv; varying float vFold;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
          void main() {
            // Trame de lin et fils irréguliers.
            vec2 q = vUv * vec2(900.0, 1400.0);
            float weave = 0.85 + 0.15 * (sin(q.x) * sin(q.y));
            float slub = 0.9 + 0.1 * h(floor(vec2(vUv.x * 300.0, vUv.y * 9.0)));
            vec3 linen = vec3(0.93, 0.89, 0.82) * weave * slub;
            // La lumière traverse davantage les zones tendues entre deux plis.
            float through = mix(0.55, 1.0, vFold) * uGlow;
            vec3 col = linen * 0.35 + uBack * through * (0.9 + 0.1 * weave);
            float hem = smoothstep(0.0, 0.015, vUv.y);
            gl_FragColor = vec4(col, 0.9 * hem);
            #include <fog_fragment>
          }
        `,
      }),
    [backlight, glow, height],
  );

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (m && !reduced) m.material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <mesh ref={mesh} geometry={geometry} material={material} position={position} rotation-y={rotationY} renderOrder={6} />;
}
