"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, type Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from "three";
import { useDisposable } from "@/hooks/useDisposable";

interface WaterProps {
  width: number;
  depth: number;
  position: [number, number, number];
  deep: string;
  shallow: string;
  sky: string;
  sunDirection: [number, number, number];
  sunColor?: string;
  /** Échelle des vagues (mètres). */
  waveScale?: number;
  /** Intensité du relief des vagues. */
  choppiness?: number;
  animate?: boolean;
}

/**
 * Surface d'eau procédurale : vagues animées, réflexion de Fresnel du ciel
 * et scintillement du soleil. Utilisée pour la mer et la piscine.
 */
export function Water({
  width,
  depth,
  position,
  deep,
  shallow,
  sky,
  sunDirection,
  sunColor = "#fff2d6",
  waveScale = 6,
  choppiness = 0.6,
  animate = true,
}: WaterProps) {
  const geometry = useDisposable(() => new PlaneGeometry(width, depth, 1, 1).rotateX(-Math.PI / 2), [width, depth]);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        fog: true,
        uniforms: {
          uTime: { value: 0 },
          uDeep: { value: new Color(deep) },
          uShallow: { value: new Color(shallow) },
          uSky: { value: new Color(sky) },
          uSunDir: { value: new Vector3(...sunDirection).normalize() },
          uSunColor: { value: new Color(sunColor) },
          uScale: { value: waveScale },
          uChop: { value: choppiness },
          fogColor: { value: new Color() },
          fogDensity: { value: 0 },
          fogNear: { value: 1 },
          fogFar: { value: 1000 },
        },
        vertexShader: /* glsl */ `
          #include <fog_pars_vertex>
          varying vec3 vWorld;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            vec4 mvPosition = viewMatrix * world;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }
        `,
        fragmentShader: /* glsl */ `
          #include <fog_pars_fragment>
          uniform float uTime, uScale, uChop;
          uniform vec3 uDeep, uShallow, uSky, uSunDir, uSunColor;
          varying vec3 vWorld;

          vec2 hash(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
          }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
                       mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
          }
          float height(vec2 p) {
            float t = uTime;
            float h = noise(p / uScale + vec2(t * 0.05, t * 0.03)) * 0.6;
            h += noise(p / (uScale * 0.45) - vec2(t * 0.07, -t * 0.04)) * 0.3;
            h += noise(p / (uScale * 0.18) + vec2(-t * 0.11, t * 0.09)) * 0.12;
            return h;
          }
          void main() {
            vec2 p = vWorld.xz;
            float e = 0.05 * uScale;
            float h = height(p);
            vec3 n = normalize(vec3((height(p - vec2(e, 0.0)) - h) * uChop / e * uScale * 0.1,
                                    1.0,
                                    (height(p - vec2(0.0, e)) - h) * uChop / e * uScale * 0.1));
            vec3 view = normalize(cameraPosition - vWorld);
            float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(n, view), 0.0), 5.0);
            vec3 r = reflect(-view, n);
            float sun = pow(max(dot(r, uSunDir), 0.0), 900.0) * 60.0 + pow(max(dot(r, uSunDir), 0.0), 60.0) * 0.6;
            float depthMix = clamp(h * 0.8 + 0.5, 0.0, 1.0);
            vec3 water = mix(uDeep, uShallow, depthMix * 0.35 + (1.0 - abs(view.y)) * 0.15);
            vec3 col = mix(water, uSky, fresnel) + uSunColor * sun;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }
        `,
      }),
    [deep, shallow, sky, sunColor, waveScale, choppiness, ...sunDirection],
  );

  const mesh = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
  useFrame((_, delta) => {
    if (animate && mesh.current) mesh.current.material.uniforms.uTime.value += Math.min(delta, 0.05);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} position={position} />;
}
