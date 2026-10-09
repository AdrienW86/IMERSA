"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, type Points, ShaderMaterial } from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { useExperience } from "@/lib/experience-store";

/**
 * Poussières en suspension dans la lumière. Shader volontairement sans
 * division : aucune valeur infinie ne peut atteindre le post-traitement
 * (profondeur de champ, halo).
 */
export function DustMotes({
  count,
  size,
  position,
  color = "#ffe9c9",
  opacity = 0.35,
}: {
  count: number;
  size: [number, number, number];
  position: [number, number, number];
  color?: string;
  opacity?: number;
}) {
  const reduced = useExperience((s) => s.reducedMotion);
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
  const geometry = useDisposable(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    let a = 12345;
    const rnd = () => ((a = (a * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * size[0];
      pos[i * 3 + 1] = (rnd() - 0.5) * size[1];
      pos[i * 3 + 2] = (rnd() - 0.5) * size[2];
      seed[i] = rnd();
    }
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new Float32BufferAttribute(seed, 1));
    return g;
  }, [count, ...size]);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uHeight: { value: size[1] } },
        vertexShader: /* glsl */ `
          uniform float uTime, uHeight;
          attribute float aSeed;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            p.y = mod(p.y + uTime * (0.02 + aSeed * 0.04) + uHeight * 0.5, uHeight) - uHeight * 0.5;
            p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.15;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float depth = max(-mv.z, 0.5);
            gl_PointSize = clamp((1.5 + aSeed * 2.5) * 6.0 / depth, 1.0, 6.0);
            vAlpha = 0.4 + 0.6 * sin(uTime * (0.5 + aSeed) + aSeed * 20.0) * 0.5 + 0.3;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float a = clamp(1.0 - d, 0.0, 1.0);
            a = a * a * uOpacity * clamp(vAlpha, 0.0, 1.0);
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
      }),
    [color, opacity, size[1]],
  );
  useFrame(({ clock }) => {
    const p = points.current;
    if (p && !reduced) p.material.uniforms.uTime.value = clock.elapsedTime;
  });
  return <points ref={points} geometry={geometry} material={material} position={position} frustumCulled={false} />;
}
