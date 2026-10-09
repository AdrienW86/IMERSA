"use client";

import { Color, PlaneGeometry, ShaderMaterial } from "three";
import { useDisposable } from "@/hooks/useDisposable";

/** Œuvre abstraite originale (champs colorés), peinte en shader. */
export function Artwork({
  width,
  height,
  colors,
}: {
  width: number;
  height: number;
  colors: [string, string, string];
}) {
  const geometry = useDisposable(() => new PlaneGeometry(width, height), [width, height]);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        uniforms: {
          uA: { value: new Color(colors[0]) },
          uB: { value: new Color(colors[1]) },
          uC: { value: new Color(colors[2]) },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uA, uB, uC; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
          void main(){
            vec2 p = vUv;
            float grain = h(floor(p * 900.0)) * 0.05;
            float band = smoothstep(0.52, 0.5 + 0.02 * sin(p.x * 9.0), p.y);
            vec3 col = mix(uB, uA, band * smoothstep(0.08, 0.12, p.x) * smoothstep(0.92, 0.88, p.x));
            float block = step(0.14, p.y) * step(p.y, 0.32) * step(0.1, p.x) * step(p.x, 0.62);
            col = mix(col, uC, block * 0.92);
            gl_FragColor = vec4(col * (0.94 + grain), 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [...colors],
  );
  return <mesh geometry={geometry} material={material} />;
}

