"use client";

import { BackSide, Color, ShaderMaterial, SphereGeometry, Vector3 } from "three";
import { useDisposable } from "@/hooks/useDisposable";

export interface SkyProps {
  top: string;
  horizon: string;
  bottom: string;
  sunDirection: [number, number, number];
  sunColor: string;
  /** Concentration du halo solaire (plus élevé = plus serré). */
  sunFocus?: number;
  sunStrength?: number;
  /** Rapidité de la transition horizon → zénith (plus petit = horizon plus fin). */
  gradient?: number;
  radius?: number;
}

/**
 * Ciel procédural (dégradé atmosphérique + halo solaire), rendu sur une
 * sphère inversée qui enveloppe la séquence.
 */
export function SkyDome({
  top,
  horizon,
  bottom,
  sunDirection,
  sunColor,
  sunFocus = 400,
  sunStrength = 1.5,
  gradient = 0.55,
  radius = 1800,
}: SkyProps) {
  const geometry = useDisposable(() => new SphereGeometry(radius, 48, 24), [radius]);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new Color(top) },
          uHorizon: { value: new Color(horizon) },
          uBottom: { value: new Color(bottom) },
          uSunDir: { value: new Vector3(...sunDirection).normalize() },
          uSunColor: { value: new Color(sunColor) },
          uSunFocus: { value: sunFocus },
          uSunStrength: { value: sunStrength },
          uGradient: { value: gradient },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop, uHorizon, uBottom, uSunDir, uSunColor;
          uniform float uSunFocus, uSunStrength, uGradient;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 1.0, h), uGradient));
            col = mix(col, uBottom, smoothstep(0.0, -0.25, h));
            float s = max(dot(d, uSunDir), 0.0);
            col += uSunColor * (pow(s, uSunFocus) * 8.0 + pow(s, 24.0) * 0.35 + pow(s, 4.0) * 0.12) * uSunStrength;
            // Brume près de l'horizon.
            col = mix(col, uHorizon * 1.05, exp(-abs(h) * 9.0) * 0.45);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [top, horizon, bottom, sunColor, sunFocus, sunStrength, gradient, ...sunDirection],
  );
  return <mesh geometry={geometry} material={material} renderOrder={-10} frustumCulled={false} />;
}
