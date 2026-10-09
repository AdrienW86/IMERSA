import type { CameraKeyframe, SceneDefinition } from "@/types/experience";
import {
  CHATEAU_CURTAIN,
  CHATEAU_FLAME,
  GITE_FLAME,
  GITE_GLASS,
  VILLA_CURTAIN,
  VILLA_GLASS,
  cutCamera,
  cutTarget,
  matchCuts,
  type MatchCut,
} from "./anchors";

/**
 * Configuration centralisée du parcours : trois univers reliés par trois
 * raccords sur objet (verre, flamme, voilage), puis le final.
 *
 * Coordonnées en mètres, dans le repère local de chaque scène. Le dernier
 * point de passage d'une scène et le premier de la suivante sont les mêmes
 * positions relatives à l'objet repère : l'origine monde de chaque scène en
 * est déduite (voir lib/journey.ts).
 */

const EYE = 1.62;

/** Point de passage « coupe » : caméra dans l'axe de l'objet repère. */
function cut(t: number, anchor: readonly [number, number, number], m: MatchCut): CameraKeyframe {
  return { t, position: cutCamera(anchor, m), target: cutTarget(anchor, m), fov: m.fov, still: true };
}

const SHARED_VILLA_LIGHT = {
  sun: { color: "#ffb06a", intensity: 4.6, position: [-30, 5.5, 7] as const, shadowRadius: 12 },
  hemisphere: { sky: "#a9bad0", ground: "#a4805e", intensity: 0.45 },
  environment: { file: "/hdri/venice_sunset_1k.hdr", intensity: 0.65, rotationY: 1.4 },
  fog: { color: "#efc9a2", density: 0.0012 },
};

export const sceneDefinitions: readonly SceneDefinition[] = [
  {
    id: "villa",
    label: "Villa méditerranéenne",
    weight: 1.15,
    keyframes: [
      { t: 0, position: [2.2, 1.6, 6.2], target: [-6.5, 1.2, 1.2], fov: 52, stop: true },
      { t: 0.3, position: [0.7, 1.5, 4.9], target: [-6, 1.05, 1.4], fov: 50 },
      { t: 0.58, position: [-0.3, 1.15, 1.6], target: [-3.0, 0.55, 2.4], fov: 44, stop: true },
      { t: 0.82, position: [-1.7, 0.62, 2.36], target: VILLA_GLASS, fov: 36 },
      cut(1, VILLA_GLASS, matchCuts.verre),
    ],
    lighting: {
      ...SHARED_VILLA_LIGHT,
      practicals: [
        { position: [2.15, 0.7, -2.9], color: "#ff9a4a", intensity: 4, distance: 6 },
        { position: [-4.4, 1.9, -7.4], color: "#ffd29a", intensity: 4, distance: 6 },
      ],
      bloom: 0.55,
    },
    exit: {
      kind: "match",
      halfWidth: 0.012,
      veil: "#000000",
      veilPeak: 0,
      match: { cut: "verre", from: VILLA_GLASS, to: GITE_GLASS },
    },
    assets: {
      models: ["/models/sheen-chair.glb"],
      textures: ["travertine", "oak", "plaster", "boucle", "linen"],
    },
  },
  {
    id: "gite",
    label: "Mas provençal",
    weight: 1.25,
    keyframes: [
      cut(0, GITE_GLASS, matchCuts.verre),
      { t: 0.2, position: [-0.5, 1.25, 0.7], target: [-3.6, 1.05, -0.5], fov: 44 },
      { t: 0.42, position: [2.4, EYE, 2.7], target: [-1.8, 1.25, -1.4], fov: 52, stop: true },
      { t: 0.66, position: [2.5, 1.66, 0.6], target: [1.3, 1.45, -4.6], fov: 46 },
      { t: 0.84, position: [1.66, 1.74, -3.5], target: GITE_FLAME, fov: 36 },
      cut(1, GITE_FLAME, matchCuts.flamme),
    ],
    lighting: {
      sun: { color: "#ffaa66", intensity: 6.5, position: [-30, 7, -9], shadowRadius: 9 },
      hemisphere: { sky: "#b8a58c", ground: "#5e4330", intensity: 0.22 },
      practicals: [
        { position: [1.0, 0.5, -4.3], color: "#ff8a3a", intensity: 6, distance: 5 },
        { position: [GITE_FLAME[0], GITE_FLAME[1] + 0.1, GITE_FLAME[2] + 0.9], color: "#ffb36a", intensity: 0.6, distance: 3 },
      ],
      environment: { file: "/hdri/lebombo_1k.hdr", intensity: 0.32, rotationY: 0 },
      fog: { color: "#e6c49c", density: 0.0025 },
      bloom: 0.7,
    },
    exit: {
      kind: "match",
      halfWidth: 0.012,
      veil: "#000000",
      veilPeak: 0,
      match: { cut: "flamme", from: GITE_FLAME, to: CHATEAU_FLAME },
    },
    assets: {
      models: ["/models/sheen-chair.glb"],
      textures: ["stone", "terracotta", "oldwood", "plaster", "linen"],
    },
  },
  {
    id: "chateau",
    label: "Château",
    weight: 1.6,
    keyframes: [
      cut(0, CHATEAU_FLAME, matchCuts.flamme),
      { t: 0.1, position: [16.95, 1.95, -4.35], target: [17.6, 2.25, -6.2], fov: 40 },
      { t: 0.24, position: [20.8, 2.15, 2.6], target: [16.8, 2.0, -5.2], fov: 52, stop: true },
      { t: 0.37, position: [15.0, 1.7, 1.6], target: [6, 2.2, 0], fov: 52 },
      { t: 0.47, position: [9.0, 1.65, 0.2], target: [-20, 3.2, 0], fov: 56 },
      { t: 0.64, position: [-14, 1.65, -1.0], target: [-32, 7.2, 1.0], fov: 60, stop: true },
      { t: 0.8, position: [-47, 1.8, 0], target: [-76, 6.0, 0], fov: 56 },
      { t: 0.9, position: [-64, 2 + EYE, 0], target: [-84, 6.4, 0], fov: 52 },
      cut(1, CHATEAU_CURTAIN, matchCuts.rideau),
    ],
    lighting: {
      sun: { color: "#ffd2a0", intensity: 2.8, position: [-8, 24, 30], shadowRadius: 18 },
      hemisphere: { sky: "#e6d6c0", ground: "#5e4a36", intensity: 0.3 },
      practicals: [
        { position: [17.6, 2.2, -4.2], color: "#ffb36a", intensity: 0.8, distance: 3 },
        { position: [18, 3.6, 0], color: "#ffd29a", intensity: 6, distance: 9 },
      ],
      environment: { file: "/hdri/lebombo_1k.hdr", intensity: 0.42, rotationY: 0 },
      fog: { color: "#e2cdb0", density: 0.004 },
      bloom: 0.75,
    },
    exit: {
      kind: "match",
      halfWidth: 0.012,
      veil: "#000000",
      veilPeak: 0,
      match: { cut: "rideau", from: CHATEAU_CURTAIN, to: VILLA_CURTAIN },
    },
    assets: {
      models: [
        "/models/chair-damask-purplegold.glb",
        "/models/glam-velvet-sofa.glb",
        "/models/diffuse-transmission-teacup.glb",
        "/models/glass-vase-flowers.glb",
      ],
      textures: ["marble-white", "marble-black", "marble-warm", "travertine", "plaster", "oak"],
    },
  },
  {
    id: "finale",
    label: "IMERSA",
    weight: 0.75,
    keyframes: [
      cut(0, VILLA_CURTAIN, matchCuts.rideau),
      { t: 0.28, position: [-6.15, EYE, 1.75], target: [-14, 1.3, 1.0], fov: 44 },
      { t: 0.52, position: [-8.1, 1.6, 0.9], target: [-40, 0.8, -3], fov: 46 },
      { t: 0.8, position: [-9.0, EYE, 0.5], target: [-90, 1.0, -14], fov: 42, stop: true },
      { t: 1, position: [-9.15, 1.66, 0.6], target: [-90, 1.2, -15], fov: 41 },
    ],
    lighting: {
      ...SHARED_VILLA_LIGHT,
      practicals: [
        { position: [2.15, 0.7, -2.9], color: "#ff9a4a", intensity: 4, distance: 6 },
        { position: [-4.4, 1.9, -7.4], color: "#ffd29a", intensity: 4, distance: 6 },
      ],
      bloom: 0.6,
    },
    assets: {
      models: ["/models/sheen-chair.glb"],
      textures: ["travertine", "oak", "plaster", "boucle", "linen"],
    },
  },
];
