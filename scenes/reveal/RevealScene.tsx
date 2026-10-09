"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  type Group,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  Plane,
  PlaneGeometry,
  Points,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import type { SceneProps } from "@/components/3d/SceneDirector";
import { useDisposable } from "@/hooks/useDisposable";
import { experienceStore } from "@/lib/experience-store";
import { localProgress, scenes } from "@/lib/journey";
import { VillaContent } from "@/scenes/villa/VillaScene";

const INDEX = scenes.findIndex((s) => s.id === "reveal");
/** Les plans de découpe sont exprimés dans le repère monde. */
const ORIGIN_Y = scenes[INDEX].origin[1];
/** Emprise du jumeau numérique (villa + terrasse). */
const FOOTPRINT = { minX: -17, maxX: 8, minZ: -13, maxZ: 10 };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Hauteur du balayage : le relevé (nuage de points) devient matière. */
function scanHeight(t: number) {
  return -0.6 + 6 * smooth(0.06, 0.64, t);
}

/** Sol de studio : trame millimétrée qui s'estompe avec la distance. */
function StudioFloor() {
  const geometry = useDisposable(() => new PlaneGeometry(400, 400).rotateX(-Math.PI / 2), []);
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new Color("#7fb6d9") } },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; varying vec3 vWorld;
          float grid(vec2 p, float size, float width) {
            vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
            return 1.0 - min(min(g.x, g.y) / width, 1.0);
          }
          void main() {
            float d = length(vWorld.xz - vec2(-4.0, -1.5));
            float fade = 1.0 - smoothstep(12.0, 70.0, d);
            float lines = grid(vWorld.xz, 1.0, 1.0) * 0.18 + grid(vWorld.xz, 5.0, 1.2) * 0.35;
            gl_FragColor = vec4(uColor * lines, lines * fade * 0.55);
          }
        `,
      }),
    [],
  );
  return <mesh geometry={geometry} material={material} position={[0, -1.62, 0]} renderOrder={-1} />;
}

/** Plan laser du balayage, limité à l'emprise du bien. */
function ScanSheet({ sheet }: { sheet: React.RefObject<Mesh | null> }) {
  const geometry = useDisposable(
    () =>
      new PlaneGeometry(FOOTPRINT.maxX - FOOTPRINT.minX + 2, FOOTPRINT.maxZ - FOOTPRINT.minZ + 2)
        .rotateX(-Math.PI / 2)
        .translate((FOOTPRINT.minX + FOOTPRINT.maxX) / 2, 0, (FOOTPRINT.minZ + FOOTPRINT.maxZ) / 2),
    [],
  );
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: 2,
        toneMapped: false,
        uniforms: { uOpacity: { value: 0 }, uColor: { value: new Color("#9fe0ff") } },
        vertexShader: /* glsl */ `varying vec3 vWorld; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uOpacity; uniform vec3 uColor; varying vec3 vWorld;
          void main(){
            vec2 g = abs(fract(vWorld.xz * 0.5) - 0.5);
            float line = smoothstep(0.47, 0.5, max(g.x, g.y));
            float a = (0.05 + line * 0.25) * uOpacity;
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
      }),
    [],
  );
  return <mesh ref={sheet} geometry={geometry} material={material} renderOrder={6} />;
}

/** Nuage de points issu des surfaces du modèle (relevé 3D simulé). */
function buildPointCloud(root: Group, count: number) {
  const meshes: { mesh: Mesh; area: number; sampler: MeshSurfaceSampler }[] = [];
  const scale = new Vector3();
  root.updateWorldMatrix(true, true);
  const rootInverse = root.matrixWorld.clone().invert();
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || (mesh as unknown as { isInstancedMesh?: boolean }).isInstancedMesh) return;
    const geometry = mesh.geometry as BufferGeometry;
    if (!geometry.getAttribute("position") || (mesh.material as Material).transparent) return;
    const sampler = new MeshSurfaceSampler(mesh).build();
    const distribution = (sampler as unknown as { distribution: Float32Array }).distribution;
    mesh.matrixWorld.decompose(new Vector3(), new Quaternion(), scale);
    const area = (distribution?.[distribution.length - 1] ?? 0) * scale.x * scale.z;
    if (area > 0) meshes.push({ mesh, area, sampler });
  });
  const total = meshes.reduce((s, m) => s + m.area, 0) || 1;
  const positions: number[] = [];
  const colors: number[] = [];
  const p = new Vector3();
  const c = new Color();
  const tint = new Color("#bfe6ff");
  for (const { mesh, area, sampler } of meshes) {
    const n = Math.max(8, Math.round((area / total) * count));
    const base = (mesh.material as MeshStandardMaterial).color ?? tint;
    for (let i = 0; i < n; i++) {
      sampler.sample(p);
      p.applyMatrix4(mesh.matrixWorld).applyMatrix4(rootInverse);
      positions.push(p.x, p.y, p.z);
      c.copy(base).lerp(tint, 0.55);
      colors.push(c.r, c.g, c.b);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

function createPointMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    vertexColors: true,
    uniforms: { uScan: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uScan, uTime, uPixelRatio;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float above = smoothstep(uScan - 0.05, uScan + 0.25, position.y);
        float band = 1.0 - smoothstep(0.0, 0.35, abs(position.y - uScan));
        float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + position.x * 3.1 + position.z * 2.3);
        vAlpha = (above * 0.8 * twinkle + band);
        vColor = color + band * vec3(0.4, 0.6, 0.7);
        gl_PointSize = (2.4 + band * 3.0) * uPixelRatio * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5 || vAlpha < 0.01) discard;
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
  });
}

/**
 * Révélation : la villa du début réapparaît sous forme de jumeau numérique.
 * Un balayage transforme le relevé (nuage de points) en espace 3D, puis la
 * caméra s'éloigne pour révéler la maquette entière.
 */
export default function RevealScene({ settings }: SceneProps) {
  const twin = useRef<Group>(null);
  const cloud = useRef<Points | null>(null);
  const sheet = useRef<Mesh>(null);
  const clip = useRef(new Plane(new Vector3(0, -1, 0), 0));
  const pointMaterial = useDisposable(() => createPointMaterial(), []);

  // Matériaux propres au jumeau, tous découpés par le plan de balayage.
  useLayoutEffect(() => {
    const root = twin.current;
    if (!root) return;
    const owned: Material[] = [];
    const replaced = new Map<Material, Material>();
    root.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const source = mesh.material as Material;
      let copy = replaced.get(source);
      if (!copy) {
        copy = source.clone();
        copy.clippingPlanes = [clip.current];
        replaced.set(source, copy);
        owned.push(copy);
      }
      mesh.material = copy;
    });

    const geometry = buildPointCloud(root, settings.pointCloud);
    const points = new Points(geometry, pointMaterial);
    points.frustumCulled = false;
    root.parent?.add(points);
    cloud.current = points;
    return () => {
      points.removeFromParent();
      geometry.dispose();
      owned.forEach((m) => m.dispose());
      cloud.current = null;
    };
  }, [settings.pointCloud, pointMaterial]);

  useFrame(({ clock, gl }) => {
    const t = localProgress(experienceStore.getState().progress, INDEX);
    const h = scanHeight(t);
    clip.current.constant = h + ORIGIN_Y;
    const points = cloud.current;
    if (points) {
      const u = (points.material as ShaderMaterial).uniforms;
      u.uScan.value = h;
      u.uTime.value = clock.elapsedTime;
      u.uPixelRatio.value = gl.getPixelRatio();
    }
    const s = sheet.current;
    if (s) {
      s.position.y = h;
      (s.material as ShaderMaterial).uniforms.uOpacity.value = 1 - smooth(0.6, 0.7, t);
    }
  });

  return (
    <group>
      <StudioFloor />
      <group ref={twin}>
        <VillaContent settings={{ ...settings, transmission: false }} model />
      </group>
      <ScanSheet sheet={sheet} />
    </group>
  );
}
