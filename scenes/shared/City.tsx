"use client";

import { useLayoutEffect, useRef } from "react";
import {
  BoxGeometry,
  Color,
  type InstancedMesh,
  Matrix4,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  type Texture,
  Vector3,
} from "three";
import { useTexture } from "@react-three/drei";
import { useDisposable } from "@/hooks/useDisposable";

interface CityProps {
  /** Niveau du sol de la ville dans le repère de la séquence. */
  ground: number;
  center: [number, number];
  innerRadius: number;
  outerRadius: number;
  count: number;
  minHeight: number;
  maxHeight: number;
  /** Secteur angulaire occupé (radians), centré sur `direction`. */
  spread?: number;
  direction?: number;
  sunDirection: [number, number, number];
  sunColor: string;
  ambient: string;
  /** Intensité des fenêtres éclairées (crépuscule / nuit). */
  windowGlow: number;
  seed?: number;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Ville procédurale : tours instanciées (un seul draw call) avec un shader
 * dédié — façades texturées, fenêtres éclairées, brume atmosphérique.
 */
export function City({
  ground,
  center,
  innerRadius,
  outerRadius,
  count,
  minHeight,
  maxHeight,
  spread = Math.PI * 2,
  direction = 0,
  sunDirection,
  sunColor,
  ambient,
  windowGlow,
  seed = 1,
}: CityProps) {
  const ref = useRef<InstancedMesh>(null);
  const [albedo, emissive] = useTexture(["/textures/facade_albedo.webp", "/textures/facade_emissive.webp"]) as Texture[];

  const geometry = useDisposable(() => new BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const material = useDisposable(() => {
    const textures = [albedo.clone(), emissive.clone()];
    textures.forEach((t) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.colorSpace = SRGBColorSpace;
      t.needsUpdate = true;
    });
    const material = new ShaderMaterial({
      fog: true,
      uniforms: {
        uAlbedo: { value: textures[0] },
        uEmissive: { value: textures[1] },
        uSunDir: { value: new Vector3(...sunDirection).normalize() },
        uSunColor: { value: new Color(sunColor) },
        uAmbient: { value: new Color(ambient) },
        uGlow: { value: windowGlow },
        fogColor: { value: new Color() },
        fogDensity: { value: 0 },
        fogNear: { value: 1 },
        fogFar: { value: 1000 },
      },
      vertexShader: /* glsl */ `
        #include <fog_pars_vertex>
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float vSeed;
        varying float vRoof;
        void main() {
          vec3 scale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vec3 p = position * scale;
          // UV métriques : une trame de 32 étages × 16 travées couvre 56 m × 28 m.
          if (abs(normal.x) > 0.5) vUv = vec2(p.z, p.y);
          else if (abs(normal.z) > 0.5) vUv = vec2(p.x, p.y);
          else vUv = vec2(p.x, p.z);
          vUv /= vec2(28.0, 56.0);
          vSeed = fract(sin(float(gl_InstanceID) * 12.9898) * 43758.5453);
          vUv += vec2(vSeed * 7.0, floor(vSeed * 13.0) / 32.0);
          vRoof = step(0.5, normal.y);
          vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
          vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }
      `,
      fragmentShader: /* glsl */ `
        #include <fog_pars_fragment>
        uniform sampler2D uAlbedo, uEmissive;
        uniform vec3 uSunDir, uSunColor, uAmbient;
        uniform float uGlow;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float vSeed;
        varying float vRoof;
        void main() {
          vec3 base = texture2D(uAlbedo, vUv).rgb;
          base *= mix(vec3(0.85, 0.88, 0.95), vec3(1.05, 0.98, 0.9), vSeed);
          base = mix(base * 0.7, vec3(0.06), vRoof * 0.8);
          float diffuse = max(dot(normalize(vNormal), uSunDir), 0.0);
          vec3 col = base * (uAmbient + uSunColor * diffuse);
          vec3 glow = texture2D(uEmissive, vUv).rgb * uGlow * (1.0 - vRoof);
          // Tous les immeubles ne sont pas éclairés, ni avec la même intensité.
          float occupancy = step(0.35, fract(vSeed * 31.0)) * (0.35 + 0.65 * fract(vSeed * 97.0));
          col += glow * occupancy;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }
      `,
    });
    material.addEventListener("dispose", () => textures.forEach((t) => t.dispose()));
    return material;
  }, [albedo, emissive, sunColor, ambient, windowGlow, ...sunDirection]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const random = rng(seed);
    const m = new Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = direction + (random() - 0.5) * spread;
      // Densité plus forte près du centre, tours plus hautes au loin.
      const r = innerRadius + Math.pow(random(), 0.8) * (outerRadius - innerRadius);
      const w = 14 + random() * 26;
      const d = 14 + random() * 26;
      const tall = Math.pow(random(), 2.2);
      const h = minHeight + tall * (maxHeight - minHeight) * (0.6 + 0.4 * (r / outerRadius));
      m.makeRotationY(Math.round(random() * 4) * (Math.PI / 2) + (random() - 0.5) * 0.1);
      m.scale(new Vector3(w, h, d));
      m.setPosition(center[0] + Math.cos(angle) * r, ground, center[1] + Math.sin(angle) * r);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count, seed, center, innerRadius, outerRadius, minHeight, maxHeight, spread, direction, ground]);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}
