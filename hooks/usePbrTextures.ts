import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { qualityPresets } from "@/lib/quality";
import { useExperience } from "@/lib/experience-store";

export type TextureSetName =
  | "oak"
  | "travertine"
  | "concrete"
  | "brick"
  | "marble-white"
  | "marble-black"
  | "marble-warm"
  | "plaster"
  | "facade";

export const textureUrls = (name: TextureSetName) => {
  const base = `/textures/${name}`;
  const urls = [`${base}_albedo.webp`, `${base}_rough.webp`, `${base}_normal.webp`];
  if (name === "facade") urls.push(`${base}_emissive.webp`);
  return urls;
};

export interface PbrSet {
  map: Texture;
  roughnessMap: Texture;
  normalMap: Texture;
  emissiveMap?: Texture;
}

/**
 * Charge un jeu de textures PBR et le configure pour une taille de motif
 * donnée en mètres (les géométries utilisent des UV métriques).
 */
export function usePbrTextures(name: TextureSetName, tileMeters: number, rotation = 0): PbrSet {
  const source = useTexture(textureUrls(name));
  const tier = useExperience((s) => s.quality);
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  const set = useMemo(() => {
    const anisotropy = Math.min(maxAnisotropy, qualityPresets[tier].anisotropy);
    const configure = (tex: Texture, srgb: boolean) => {
      const t = tex.clone();
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(1 / tileMeters, 1 / tileMeters);
      t.rotation = rotation;
      t.anisotropy = anisotropy;
      t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
      t.needsUpdate = true;
      return t;
    };
    const result: PbrSet = {
      map: configure(source[0], true),
      roughnessMap: configure(source[1], false),
      normalMap: configure(source[2], false),
    };
    if (source[3]) result.emissiveMap = configure(source[3], true);
    return result;
  }, [source, tileMeters, rotation, tier, maxAnisotropy]);

  useEffect(
    () => () => {
      set.map.dispose();
      set.roughnessMap.dispose();
      set.normalMap.dispose();
      set.emissiveMap?.dispose();
    },
    [set],
  );
  return set;
}
