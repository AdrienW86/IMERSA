"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, Color, type Mesh, PlaneGeometry, ShaderMaterial } from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { useExperience } from "@/lib/experience-store";

/** Flammes procédurales du foyer (bruit animé, rendu additif). */
export function FireSlot({ width, height }: { width: number; height: number }) {
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

