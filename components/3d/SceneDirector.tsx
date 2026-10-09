"use client";

import { useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { Group, Material, Mesh, Object3D, Texture } from "three";
import { preloadScene, releaseAssets, retainAssets, sceneAssetUrls } from "@/lib/assets";
import {
  enterFallback,
  experienceStore,
  markSceneReady,
  markSceneReleased,
} from "@/lib/experience-store";
import { sceneIndexAt, scenes } from "@/lib/journey";
import type { QualitySettings } from "@/lib/quality";
import type { ResolvedScene, SceneId } from "@/types/experience";
import { loadEnvironment, releaseEnvironments } from "./EnvironmentManager";

export interface SceneProps {
  settings: QualitySettings;
}

/** Chaque environnement est un module chargé à la demande. */
const registry: Record<SceneId, ComponentType<SceneProps>> = {
  villa: lazy(() => import("@/scenes/villa/VillaScene")),
  gite: lazy(() => import("@/scenes/gite/GiteScene")),
  chateau: lazy(() => import("@/scenes/chateau/ChateauScene")),
  finale: lazy(() => import("@/scenes/finale/FinaleScene")),
};

/** Marges de montage, en progression globale. */
const MOUNT_AHEAD = 0.09;
const KEEP_BEHIND = 0.035;
const PRELOAD_AHEAD = 0.2;

function desiredScenes(): number[] {
  const { progress, target, jump } = experienceStore.getState();
  const set = new Set<number>();
  for (const s of scenes) {
    if (progress >= s.start - MOUNT_AHEAD && progress <= s.end + KEEP_BEHIND) set.add(s.index);
  }
  set.add(sceneIndexAt(progress));
  if (jump) set.add(sceneIndexAt(jump.to));
  // Scroll rapide : on commence à charger la destination sans attendre la caméra.
  if (Math.abs(target - progress) > 0.05) set.add(sceneIndexAt(target));
  return [...set].sort((a, b) => a - b);
}

/** Téléverse les textures et compile les shaders avant l'affichage. */
function ReadySignal({ scene }: { scene: ResolvedScene }) {
  const get = useThree((s) => s.get);
  const anchor = useRef<Object3D>(null);

  useEffect(() => {
    // Le groupe de la séquence est le parent direct de ce repère.
    const g = anchor.current?.parent;
    if (!g) return;
    const { gl, camera, scene: root } = get();
    let cancelled = false;
    g.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[];
      for (const mat of mats) {
        for (const value of Object.values(mat)) {
          if (value && typeof value === "object" && (value as Texture).isTexture) {
            gl.initTexture(value as Texture);
          }
        }
      }
    });
    const visible = g.visible;
    g.visible = true;
    const compiled = gl.compileAsync(g, camera, root);
    g.visible = visible;
    Promise.all([compiled, loadEnvironment(gl, scene.lighting.environment.file)])
      .catch((error: unknown) => console.error(`[IMERSA] Préparation de « ${scene.id} »`, error))
      .finally(() => {
        if (!cancelled) markSceneReady(scene.id);
      });
    return () => {
      cancelled = true;
    };
  }, [get, scene]);

  return <object3D ref={anchor} />;
}

class SlotBoundary extends Component<{ id: SceneId; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[IMERSA] Échec du chargement de la séquence « ${this.props.id} »`, error);
    enterFallback("asset");
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function SceneSlot({ scene, settings }: { scene: ResolvedScene; settings: QualitySettings }) {
  const group = useRef<Group>(null);
  const SceneComponent = registry[scene.id];

  useEffect(() => {
    const urls = sceneAssetUrls(scene);
    retainAssets(urls);
    return () => {
      releaseAssets(urls);
      markSceneReleased(scene.id);
    };
  }, [scene]);

  // La visibilité bascule exactement à l'image où la caméra franchit le seuil.
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const st = experienceStore.getState();
    g.visible = sceneIndexAt(st.progress) === scene.index && !!st.ready[scene.id];
  }, -3);

  return (
    <group ref={group} position={scene.origin} visible={false}>
      <SlotBoundary id={scene.id}>
        <Suspense fallback={null}>
          <SceneComponent settings={settings} />
          <ReadySignal scene={scene} />
        </Suspense>
      </SlotBoundary>
    </group>
  );
}

export function SceneDirector({ settings }: { settings: QualitySettings }) {
  const [mounted, setMounted] = useState<number[]>(() => desiredScenes());
  const key = useRef(mounted.join(","));
  const preloaded = useRef(new Set<number>());

  useFrame(() => {
    const next = desiredScenes();
    const k = next.join(",");
    if (k !== key.current) {
      key.current = k;
      setMounted(next);
    }
    const p = experienceStore.getState().progress;
    for (const s of scenes) {
      if (!preloaded.current.has(s.index) && p >= s.start - PRELOAD_AHEAD && p < s.end) {
        preloaded.current.add(s.index);
        preloadScene(s);
      }
    }
  });

  useEffect(() => {
    const keep = new Set(mounted.map((i) => scenes[i].lighting.environment.file));
    const timer = setTimeout(() => releaseEnvironments(keep), 5000);
    return () => clearTimeout(timer);
  }, [mounted]);

  return (
    <>
      {mounted.map((i) => (
        <SceneSlot key={scenes[i].id} scene={scenes[i]} settings={settings} />
      ))}
    </>
  );
}
