import { Color, MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { usePbrTextures } from "@/hooks/usePbrTextures";

/** Palette de matériaux nobles de la villa : béton ciré, travertin, chêne, enduit. */
export function useVillaMaterials() {
  const travertine = usePbrTextures("travertine", 2.4);
  const oak = usePbrTextures("oak", 1.4);
  const oakVertical = usePbrTextures("oak", 1.4, Math.PI / 2);
  const plaster = usePbrTextures("plaster", 2.5);
  const boucle = usePbrTextures("boucle", 0.6);
  const linen = usePbrTextures("linen", 0.8);
  const travertineFloor = usePbrTextures("marble-warm", 2.2);

  return useDisposable(() => {
    // Béton ciré : satiné uniforme, le relief vient de la texture et du vernis.
    // Sol en pierre calcaire adoucie : teinte miel, léger lustre.
    const floor = new MeshPhysicalMaterial({
      map: travertineFloor.map,
      normalMap: travertineFloor.normalMap,
      roughnessMap: travertineFloor.roughnessMap,
      color: new Color("#f3e4cf"),
      roughness: 0.9,
      normalScale: new Vector2(0.35, 0.35),
      clearcoat: 0.25,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.6,
    });
    const fabric = new MeshStandardMaterial({ ...boucle, color: new Color("#f3ebde"), roughness: 1 });
    const linenFabric = new MeshStandardMaterial({ ...linen, color: new Color("#e9dcc8"), roughness: 1 });
    const ceramicDark = new MeshStandardMaterial({ color: new Color("#2a2724"), roughness: 0.4 });
    const chairSeat = new MeshStandardMaterial({ ...linen, color: new Color("#c9b49a"), roughness: 1 });
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
    const rug = new MeshStandardMaterial({ ...linen, color: new Color("#d8c9b2"), roughness: 1 });
    const poolTile = new MeshStandardMaterial({ color: new Color("#7fc3c9"), roughness: 0.35 });
    const ember = new MeshStandardMaterial({ color: new Color("#2a2522"), roughness: 1 });
    return {
      floor,
      stone,
      stoneOutdoor,
      wood,
      woodPanel,
      darkWood,
      walls,
      steel,
      brass,
      glass,
      acoustic,
      rug,
      poolTile,
      ember,
      fabric,
      linenFabric,
      ceramicDark,
      chairSeat,
    };
  }, [travertine, oak, oakVertical, plaster, boucle, linen, travertineFloor]);
}

export type VillaMaterials = ReturnType<typeof useVillaMaterials>;
