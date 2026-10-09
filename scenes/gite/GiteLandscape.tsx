"use client";

import { useLayoutEffect, useRef } from "react";
import {
  Color,
  type InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { useDisposable } from "@/hooks/useDisposable";
import { lathe } from "@/lib/geometry";
import { SkyDome } from "@/scenes/shared/SkyDome";
import { headland } from "@/scenes/villa/Landscape";

export const GITE_SUN: [number, number, number] = [-30, 7, -9];
const noise = new ImprovedNoise();

/** Cyprès de Provence : colonne effilée au feuillage irrégulier. */
function cypressGeometry() {
  const profile: [number, number][] = [[0.001, 0], [0.12, 0], [0.12, 0.5]];
  for (let i = 1; i <= 26; i++) {
    const t = i / 26;
    const r = 0.18 + Math.sin(Math.pow(t, 0.55) * Math.PI) * 0.62 * (1 - t * 0.55);
    profile.push([Math.max(0.02, r), 0.5 + t * 9]);
  }
  profile.push([0.001, 9.7]);
  const geo = lathe(profile, 18);
  const pos = geo.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y < 0.6) continue;
    const k = 1 + noise.noise(v.x * 3.3, v.y * 1.7, v.z * 3.3) * 0.3 + noise.noise(v.x * 11, v.y * 9, v.z * 11) * 0.1;
    pos.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Champs : rangs de lavande et prairie dorée, estompés par la brume. */
function Fields() {
  const geometry = useDisposable(() => new PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2), []);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        fog: true,
        uniforms: {
          fogColor: { value: new Color() },
          fogDensity: { value: 0 },
          fogNear: { value: 1 },
          fogFar: { value: 1000 },
        },
        vertexShader: /* glsl */ `
          #include <fog_pars_vertex>
          varying vec2 vP;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vP = w.xz;
            vec4 mvPosition = viewMatrix * w;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }
        `,
        fragmentShader: /* glsl */ `
          #include <fog_pars_fragment>
          varying vec2 vP;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
          void main() {
            float parcel = n(vP / 90.0);
            vec3 grass = mix(vec3(0.42, 0.45, 0.22), vec3(0.72, 0.6, 0.32), n(vP / 25.0));
            float rows = smoothstep(0.35, 0.65, sin(vP.y * 2.4) * 0.5 + 0.5);
            vec3 lavender = mix(vec3(0.28, 0.24, 0.42), vec3(0.5, 0.42, 0.66), rows);
            vec3 col = mix(grass, lavender, smoothstep(0.55, 0.6, parcel) * step(vP.x, -40.0));
            col *= 0.85 + 0.15 * n(vP * 0.7);
            gl_FragColor = vec4(col * 0.9, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }
        `,
      }),
    [],
  );
  return <mesh geometry={geometry} material={material} position={[0, -1.2, 0]} />;
}

/** Vallée provençale vue depuis la fenêtre du gîte, en fin de journée. */
export function GiteLandscape() {
  const cypresses = useRef<InstancedMesh>(null);
  const g = useDisposable(
    () => ({
      cypress: cypressGeometry(),
      hillA: headland(700, 300, 90, 4.2, ["#5f6b38", "#a8925d", "#b9a77e"]),
      hillB: headland(1200, 500, 160, 9.1, ["#55633a", "#8f8a5a", "#a89a7a"]),
    }),
    [],
  );
  const m = useDisposable(
    () => ({
      hill: new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
      cypress: new MeshStandardMaterial({ color: new Color("#2a3a20"), roughness: 0.9 }),
    }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = cypresses.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const spots: [number, number, number][] = [
      [-16, -5, 0.9],
      [-17.5, -3.6, 1.05],
      [-19, 4.5, 0.85],
      [-34, -14, 1.2],
      [-36, -11.5, 1.0],
      [-48, 9, 1.3],
      [-52, 12, 1.1],
      [-70, -30, 1.4],
      [-75, -26, 1.2],
      [-110, 20, 1.5],
      [-118, 26, 1.3],
      [-150, -40, 1.6],
    ];
    spots.forEach(([x, z, s], i) => {
      dummy.position.set(x, -1.2, z);
      dummy.scale.set(s, s * (0.9 + (i % 3) * 0.1), s);
      dummy.rotation.y = i;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  return (
    <group>
      <SkyDome
        top="#6f8fb2"
        horizon="#f2c58f"
        bottom="#b9a98e"
        sunDirection={GITE_SUN}
        sunColor="#ffb873"
        sunFocus={600}
        sunStrength={1.4}
        gradient={0.45}
      />
      <Fields />
      <mesh geometry={g.hillA} material={m.hill} position={[-420, -8, -120]} rotation-y={0.4} />
      <mesh geometry={g.hillB} material={m.hill} position={[-820, -14, 260]} rotation-y={-0.3} />
      <instancedMesh ref={cypresses} args={[g.cypress, m.cypress, 12]} castShadow />
    </group>
  );
}
