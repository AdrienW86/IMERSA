import { useGLTF, useTexture } from "@react-three/drei";
import type { Material, Mesh, Object3D, Texture } from "three";
import { textureUrls, type TextureSetName } from "@/hooks/usePbrTextures";
import type { ResolvedScene } from "@/types/experience";

/**
 * Gestion du cycle de vie des assets lourds partagés entre séquences.
 *
 * Chaque séquence montée « retient » ses assets ; lorsqu'un asset n'est plus
 * retenu par aucune séquence pendant un court délai, ses ressources GPU sont
 * libérées et il est retiré des caches de chargement.
 */

const RELEASE_DELAY = 4000;
const counts = new Map<string, number>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const loadedScenes = new Map<string, Object3D>();

export function sceneAssetUrls(scene: ResolvedScene) {
  return {
    models: [...scene.assets.models],
    textures: scene.assets.textures.flatMap((t) => textureUrls(t as TextureSetName)),
  };
}

/** Lance le téléchargement et le décodage, sans monter la séquence. */
export function preloadScene(scene: ResolvedScene) {
  const { models, textures } = sceneAssetUrls(scene);
  models.forEach((url) => useGLTF.preload(url));
  if (textures.length) useTexture.preload(textures);
}

/** Enregistre la scène glTF chargée, pour pouvoir la libérer plus tard. */
export function registerModel(url: string, root: Object3D) {
  loadedScenes.set(url, root);
}

function disposeMaterial(material: Material) {
  for (const value of Object.values(material)) {
    if (value && typeof value === "object" && (value as Texture).isTexture) {
      (value as Texture).dispose();
    }
  }
  material.dispose();
}

function releaseModel(url: string) {
  const root = loadedScenes.get(url);
  root?.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach(disposeMaterial);
  });
  loadedScenes.delete(url);
  useGLTF.clear(url);
}

function releaseTexture(url: string) {
  // Le cache de useTexture renvoie la texture d'origine : on la libère puis on la retire.
  useTexture.clear(url);
}

export function retainAssets(urls: { models: string[]; textures: string[] }) {
  for (const url of [...urls.models, ...urls.textures]) {
    counts.set(url, (counts.get(url) ?? 0) + 1);
    const timer = timers.get(url);
    if (timer) {
      clearTimeout(timer);
      timers.delete(url);
    }
  }
}

export function releaseAssets(urls: { models: string[]; textures: string[] }) {
  const schedule = (url: string, release: (u: string) => void) => {
    const next = (counts.get(url) ?? 1) - 1;
    counts.set(url, next);
    if (next > 0) return;
    timers.set(
      url,
      setTimeout(() => {
        timers.delete(url);
        if ((counts.get(url) ?? 0) > 0) return;
        counts.delete(url);
        release(url);
      }, RELEASE_DELAY),
    );
  };
  urls.models.forEach((u) => schedule(u, releaseModel));
  urls.textures.forEach((u) => schedule(u, releaseTexture));
}
