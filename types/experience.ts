export type SceneId = "villa" | "gite" | "chateau" | "finale";

export type Vec3 = readonly [number, number, number];

export type QualityTier = "low" | "medium" | "high";

/** Point de passage de caméra, exprimé dans le repère local de la scène. */
export interface CameraKeyframe {
  /** Position locale dans la séquence, de 0 à 1. */
  t: number;
  position: Vec3;
  target: Vec3;
  /** Champ de vision vertical (degrés), pensé pour un écran 16:9. */
  fov?: number;
  /** Point d'arrêt lisible en mode « mouvements réduits ». */
  stop?: boolean;
  /** Vitesse nulle au passage (temps suspendu sur l'objet repère d'un raccord). */
  still?: boolean;
}

/** Éclairage global appliqué au rig de lumières pendant une séquence. */
export interface SceneLighting {
  sun: { color: string; intensity: number; position: Vec3; shadowRadius: number };
  hemisphere: { sky: string; ground: string; intensity: number };
  practicals: readonly [PracticalLight, PracticalLight];
  environment: { file: string; intensity: number; rotationY: number };
  fog: { color: string; density: number };
  bloom: number;
}

export interface PracticalLight {
  position: Vec3;
  color: string;
  intensity: number;
  distance: number;
}

export type TransitionKind = "threshold" | "light" | "dissolve" | "match";

export interface SceneTransition {
  kind: TransitionKind;
  /** Demi-largeur de la fenêtre de transition, en progression globale. */
  halfWidth: number;
  /** Couleur du voile (DOM) au point de bascule. */
  veil: string;
  /** Opacité maximale du voile au point de bascule. */
  veilPeak: number;
  /** Raccord sur objet : repère dans la scène quittée et dans la scène suivante. */
  match?: { cut: "verre" | "flamme" | "rideau"; from: Vec3; to: Vec3 };
}

export interface SceneDefinition {
  id: SceneId;
  /** Poids relatif dans la longueur totale du parcours. */
  weight: number;
  label: string;
  keyframes: readonly CameraKeyframe[];
  lighting: SceneLighting;
  /** Transition vers la séquence suivante. */
  exit?: SceneTransition;
  /** Assets lourds, préchargés avant l'entrée dans la séquence. */
  assets: { models: readonly string[]; textures: readonly string[] };
}

/** Séquence résolue dans le repère monde du parcours. */
export interface ResolvedScene extends SceneDefinition {
  index: number;
  start: number;
  end: number;
  origin: Vec3;
}

export interface NarrativeLine {
  kind: "eyebrow" | "title" | "lead" | "brand";
  text: string;
}

export interface NarrativeBlock {
  id: string;
  scene: SceneId;
  /** Fenêtre d'apparition, en progression locale de la séquence. */
  enter: number;
  exit: number;
  align: "left" | "right" | "center";
  lines: readonly NarrativeLine[];
  /** Affiche les appels à l'action de la révélation finale. */
  cta?: boolean;
}
