import { BackSide, Color, MeshPhysicalMaterial, MeshStandardMaterial, type Texture, Vector2 } from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { usePbrTextures } from "@/hooks/usePbrTextures";

/** Marbres, pierre de taille, dorures et miroirs du château. */
export function useChateauMaterials(reflections: Texture) {
  const white = usePbrTextures("marble-white", 1.8);
  const black = usePbrTextures("marble-black", 1.8);
  const warm = usePbrTextures("marble-warm", 2.6);
  const stone = usePbrTextures("travertine", 3);
  const plaster = usePbrTextures("plaster", 3);

  return useDisposable(
    () => ({
      tileWhite: new MeshPhysicalMaterial({
        ...white,
        color: new Color("#f3efe8"),
        roughness: 1,
        clearcoat: 0.7,
        clearcoatRoughness: 0.06,
        envMap: reflections,
        envMapIntensity: 0.9,
      }),
      tileBlack: new MeshPhysicalMaterial({
        ...black,
        color: new Color("#d8d4cf"),
        roughness: 1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        envMap: reflections,
        envMapIntensity: 0.9,
      }),
      marble: new MeshStandardMaterial({ ...warm, color: new Color("#f2e7d8"), roughness: 0.9 }),
      stone: new MeshStandardMaterial({
        ...stone,
        color: new Color("#f1e6d4"),
        roughness: 1,
        normalScale: new Vector2(0.6, 0.6),
      }),
      vault: new MeshStandardMaterial({ ...plaster, color: new Color("#efe3cc"), roughness: 1, side: BackSide }),
      gold: new MeshStandardMaterial({ color: new Color("#d4ae6a"), metalness: 1, roughness: 0.26, envMap: reflections }),
      mirror: new MeshStandardMaterial({
        color: new Color("#d6cdbd"),
        metalness: 1,
        roughness: 0.04,
        envMap: reflections,
      }),
      glass: new MeshPhysicalMaterial({
        color: new Color("#f4f1ea"),
        roughness: 0.06,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
      crystal: new MeshPhysicalMaterial({
        color: new Color("#ffffff"),
        roughness: 0,
        metalness: 0,
        ior: 2,
        envMapIntensity: 3.5,
        emissive: new Color("#ffe2b0"),
        emissiveIntensity: 0.12,
      }),
      candle: new MeshStandardMaterial({ color: new Color("#f6efe2"), roughness: 0.6 }),
      flame: new MeshStandardMaterial({
        color: new Color("#000000"),
        emissive: new Color("#ffcf8a"),
        emissiveIntensity: 6,
        toneMapped: false,
      }),
      carpet: new MeshStandardMaterial({ color: new Color("#6e1720"), roughness: 1 }),
      passage: new MeshStandardMaterial({ ...stone, color: new Color("#8c7b66"), roughness: 1 }),
    }),
    [white, black, warm, stone, plaster, reflections],
  );
}

export type ChateauMaterials = ReturnType<typeof useChateauMaterials>;
