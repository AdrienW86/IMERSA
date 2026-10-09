import type { NarrativeBlock, SceneId } from "@/types/experience";

/**
 * Couche éditoriale de l'expérience.
 * Indépendante des composants 3D : les fenêtres `enter` / `exit` sont
 * exprimées en progression locale de chaque séquence.
 */
export const narrative: readonly NarrativeBlock[] = [
  {
    id: "hero",
    scene: "villa",
    enter: -1,
    exit: 0.24,
    align: "left",
    lines: [
      { kind: "brand", text: "IMERSA" },
      { kind: "title", text: "L’immobilier prend une nouvelle dimension." },
      { kind: "lead", text: "Transformez chaque propriété en une expérience immersive." },
    ],
  },
  {
    id: "loft",
    scene: "loft",
    enter: 0.12,
    exit: 0.72,
    align: "right",
    lines: [
      { kind: "eyebrow", text: "02 — Le loft" },
      { kind: "title", text: "Chaque espace raconte une histoire." },
      { kind: "lead", text: "Offrez à vos clients la liberté de la découvrir." },
    ],
  },
  {
    id: "penthouse",
    scene: "penthouse",
    enter: 0.34,
    exit: 0.86,
    align: "left",
    lines: [
      { kind: "eyebrow", text: "03 — Le penthouse" },
      { kind: "title", text: "Explorez au-delà des images." },
      { kind: "lead", text: "Une nouvelle façon de découvrir, ressentir et présenter les lieux." },
    ],
  },
  {
    id: "chateau",
    scene: "chateau",
    enter: 0.18,
    exit: 0.78,
    align: "center",
    lines: [
      { kind: "eyebrow", text: "04 — Le château" },
      { kind: "title", text: "Aucune limite à l’exploration." },
      { kind: "lead", text: "Du plus petit appartement aux propriétés d’exception." },
    ],
  },
  {
    id: "reveal",
    scene: "reveal",
    enter: 0.5,
    exit: 2,
    align: "left",
    cta: true,
    lines: [
      { kind: "eyebrow", text: "05 — IMERSA" },
      { kind: "title", text: "Créez des expériences immobilières extraordinaires." },
      {
        kind: "lead",
        text: "La nouvelle génération de visites virtuelles 3D pour les professionnels de l’immobilier.",
      },
    ],
  },
];

export const chapterLabels: Record<SceneId, string> = {
  villa: "Villa",
  loft: "Loft",
  penthouse: "Penthouse",
  chateau: "Château",
  reveal: "IMERSA",
};
