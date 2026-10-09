import type { NarrativeBlock, SceneId } from "@/types/experience";

/**
 * Couche éditoriale de l'expérience.
 * Indépendante des composants 3D : les fenêtres `enter` / `exit` sont
 * exprimées en progression locale de chaque séquence. Les textes laissent
 * l'image seule pendant les raccords sur objet.
 */
export const narrative: readonly NarrativeBlock[] = [
  {
    id: "hero",
    scene: "villa",
    enter: -1,
    exit: 0.3,
    align: "left",
    lines: [
      { kind: "brand", text: "IMERSA" },
      { kind: "title", text: "L’immobilier prend une nouvelle dimension." },
      { kind: "lead", text: "Transformez chaque propriété en une expérience immersive." },
    ],
  },
  {
    id: "gite",
    scene: "gite",
    enter: 0.26,
    exit: 0.6,
    align: "right",
    lines: [
      { kind: "eyebrow", text: "02 — Le mas" },
      { kind: "title", text: "Chaque lieu raconte une histoire." },
      { kind: "lead", text: "Offrez à vos clients la liberté de la découvrir." },
    ],
  },
  {
    id: "chateau",
    scene: "chateau",
    enter: 0.5,
    exit: 0.76,
    align: "center",
    lines: [
      { kind: "eyebrow", text: "03 — Le château" },
      { kind: "title", text: "Aucune limite à l’exploration." },
      { kind: "lead", text: "Du plus petit appartement aux propriétés d’exception." },
    ],
  },
  {
    id: "finale",
    scene: "finale",
    enter: 0.55,
    exit: 2,
    align: "left",
    cta: true,
    lines: [
      { kind: "eyebrow", text: "IMERSA" },
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
  gite: "Mas",
  chateau: "Château",
  finale: "IMERSA",
};
