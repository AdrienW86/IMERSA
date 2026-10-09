import { Color, MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { usePbrTextures } from "@/hooks/usePbrTextures";

/** Palette de matériaux nobles de la villa : béton ciré, travertin, chêne, enduit. */
export function useVillaMaterials() {
  const concrete = usePbrTextures("concrete", 3.2);
  const travertine = usePbrTextures("travertine", 2.4);
  const oak = usePbrTextures("oak", 1.4);
  const oakVertical = usePbrTextures("oak", 1.4, Math.PI / 2);
  const plaster = usePbrTextures("plaster", 2.5);

  return useDisposable(() => {
    // Béton ciré : satiné uniforme, le relief vient de la texture et du vernis.
    const floor = new MeshPhysicalMaterial({
      map: concrete.map,
      normalMap: concrete.normalMap,
      color: new Color("#efe2cf"),
      roughness: 0.62,
      normalScale: new Vector2(0.1, 0.1),
      clearcoat: 0.12,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.55,
    });
    const stone = new MeshStandardMaterial({ ...travertine, color: new Color("#fbf3e6"), roughness: 1 });
    const stoneOutdoor = new MeshStandardMaterial({ ...travertine, color: new Color("#f3e9da"), roughness: 1 });
    const wood = new MeshStandardMaterial({ ...oak, color: new Color("#f0dcc4"), roughness: 0.9 });
    const woodPanel = new MeshStandardMaterial({ ...oakVertical, color: new Color("#e6cfb4"), roughness: 0.85 });
    const darkWood = new MeshStandardMaterial({ ...oakVertical, color: new Color("#4a3426"), roughness: 0.7 });
    const walls = new MeshStandardMaterial({ ...plaster, color: new Color("#f6f1ea"), roughness: 1 });
    const steel = new MeshStandardMaterial({ color: new Color("#1b1c1e"), metalness: 0.7, roughness: 0.38 });
    const brass = new MeshStandardMaterial({ color: new Color("#c9a46a"), metalness: 1, roughness: 0.28 });
    const glass = new MeshPhysicalMaterial({
      color: new Color("#eef4f6"),
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      envMapIntensity: 1.6,
    });
    const acoustic = new MeshStandardMaterial({ color: new Color("#1a1715"), roughness: 1 });
    const rug = new MeshStandardMaterial({
      normalMap: plaster.normalMap,
      color: new Color("#cdbfa9"),
      roughness: 1,
    });
    const poolTile = new MeshStandardMaterial({ color: new Color("#7fc3c9"), roughness: 0.35 });
    const ember = new MeshStandardMaterial({ color: new Color("#2a2522"), roughness: 1 });
    return { floor, stone, stoneOutdoor, wood, woodPanel, darkWood, walls, steel, brass, glass, acoustic, rug, poolTile, ember };
  }, [concrete, travertine, oak, oakVertical, plaster]);
}

export type VillaMaterials = ReturnType<typeof useVillaMaterials>;
