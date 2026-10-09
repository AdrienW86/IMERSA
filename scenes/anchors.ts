import type { Vec3 } from "@/types/experience";

/**
 * Objets repères des raccords cinématographiques.
 *
 * Chaque transition relie deux objets semblables placés dans deux lieux.
 * Au moment de la coupe, la caméra occupe exactement la même position par
 * rapport à l'objet dans les deux scènes : l'objet reste immobile à l'écran
 * pendant que le décor change autour de lui (raccord dans l'axe).
 * Les positions sont exprimées dans le repère local de chaque scène.
 */

export interface MatchAnchor {
  /** Centre de l'objet repère (ce que la mise au point suit). */
  position: Vec3;
}

export interface MatchCut {
  id: "verre" | "flamme" | "rideau";
  label: string;
  /** Position de la caméra au moment de la coupe, relative à l'objet. */
  offset: Vec3;
  /** Champ de vision au moment de la coupe (cadrage serré, effet macro). */
  fov: number;
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const matchCuts = {
  verre: { id: "verre", label: "Du verre à l'autre lieu", offset: [0.21, 0.03, 0], fov: 30 },
  flamme: { id: "flamme", label: "Par la flamme", offset: [0, -0.004, 0.13], fov: 28 },
  rideau: { id: "rideau", label: "La lumière comme lien", offset: [0.32, 0, 0], fov: 40 },
} as const satisfies Record<string, MatchCut>;

/** Villa — verre de rosé sur la table basse en travertin. */
export const VILLA_GLASS: Vec3 = [-2.62, 0.468, 2.36];
/** Gîte — même verre, sur la table de ferme près de la fenêtre. */
export const GITE_GLASS: Vec3 = [-1.62, 0.908, -0.3];
/** Gîte — bougie sur le manteau de la cheminée en pierre. */
export const GITE_FLAME: Vec3 = [1.6, 1.728, -4.72];
/** Château — bougie du candélabre sur la cheminée de marbre du salon. */
export const CHATEAU_FLAME: Vec3 = [16.6, 1.89, -5.55];
/** Château — voilage de la grande baie, au sommet de l'escalier d'honneur. */
export const CHATEAU_CURTAIN: Vec3 = [-83.9, 5.62, 0];
/** Villa (final) — voilage de la baie ouverte sur la terrasse. */
export const VILLA_CURTAIN: Vec3 = [-6.75, 1.62, 0.2];

/** Position caméra au moment d'un raccord (repère local de la scène). */
export function cutCamera(anchor: Vec3, cut: MatchCut): Vec3 {
  return add(anchor, cut.offset);
}

/** Cible de visée au moment d'un raccord : dans l'axe caméra → objet, au-delà. */
export function cutTarget(anchor: Vec3, cut: MatchCut): Vec3 {
  const [ox, oy, oz] = cut.offset;
  const len = Math.hypot(ox, oy, oz) || 1;
  return [anchor[0] - (ox / len) * 2, anchor[1] - (oy / len) * 2, anchor[2] - (oz / len) * 2];
}
