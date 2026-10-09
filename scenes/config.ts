import type { SceneDefinition } from "@/types/experience";

/**
 * Configuration centralisée du parcours.
 *
 * Toutes les coordonnées sont exprimées en mètres, dans le repère local de
 * chaque séquence (Y vers le haut). Le dernier point de passage d'une séquence
 * et le premier de la suivante désignent le même lieu physique : le passage
 * (seuil) où s'opère la bascule. L'origine de chaque séquence dans le monde est
 * calculée à partir de cette contrainte (voir lib/journey.ts).
 */

const EYE = 1.62;

export const sceneDefinitions: readonly SceneDefinition[] = [
  {
    id: "villa",
    label: "Villa contemporaine",
    weight: 1.25,
    keyframes: [
      { t: 0, position: [2.6, EYE, 5.6], target: [-6.5, 1.2, 0.6], fov: 52, stop: true },
      { t: 0.2, position: [1.7, EYE, 2.8], target: [-6.8, 1.25, -1.8], fov: 52 },
      { t: 0.42, position: [0.1, EYE, -1.3], target: [-4.5, 1.5, -9.5], fov: 54 },
      { t: 0.6, position: [-2.1, EYE, -4.7], target: [2.0, 1.45, -9.0], fov: 54, stop: true },
      { t: 0.82, position: [1.2, EYE, -8.1], target: [3.4, 1.6, -13.5], fov: 52 },
      { t: 1, position: [3.4, EYE, -13.4], target: [3.4, 1.62, -20], fov: 54 },
    ],
    lighting: {
      sun: { color: "#ffdcb0", intensity: 5.2, position: [-18, 14, 22], shadowRadius: 14 },
      hemisphere: { sky: "#cfe0f0", ground: "#a88b6c", intensity: 0.35 },
      practicals: [
        { position: [2.6, 0.6, -2.5], color: "#ff9a4a", intensity: 4, distance: 6 },
        { position: [-4.4, 2.6, -7.4], color: "#ffcf96", intensity: 3, distance: 6 },
      ],
      environment: { file: "/hdri/venice_sunset_1k.hdr", intensity: 0.6, rotationY: 1.4 },
      fog: { color: "#e6dccd", density: 0.0008 },
      bloom: 0.35,
    },
    exit: { kind: "threshold", halfWidth: 0.022, veil: "#07080a", veilPeak: 1 },
    assets: {
      models: [
        "/models/glam-velvet-sofa.glb",
        "/models/sheen-chair.glb",
        "/models/specular-silk-pouf.glb",
        "/models/glass-vase-flowers.glb",
        "/models/diffuse-transmission-plant.glb",
        "/models/glass-hurricane-candle-holder.glb",
      ],
      textures: ["concrete", "travertine", "oak", "plaster"],
    },
  },
  {
    id: "loft",
    label: "Loft urbain",
    weight: 1.15,
    keyframes: [
      { t: 0, position: [0, EYE, 9.6], target: [0, 1.62, 3], fov: 54 },
      { t: 0.16, position: [0.4, EYE, 4.6], target: [2.4, 3.6, -6], fov: 56 },
      { t: 0.36, position: [3.9, 1.7, -0.6], target: [-2.2, 3.2, -5.2], fov: 56, stop: true },
      { t: 0.55, position: [2.3, 2.3, -7.4], target: [-2.4, 3.8, -3.0], fov: 56 },
      { t: 0.72, position: [0.3, 4.4, -5.9], target: [-4.6, 6.0, -4.6], fov: 56 },
      { t: 0.86, position: [-4.2, 4.5 + EYE, -4.3], target: [-5.6, 6.1, -12], fov: 54 },
      { t: 1, position: [-5.6, 4.5 + EYE, -14.4], target: [-5.6, 6.12, -22], fov: 54 },
    ],
    lighting: {
      sun: { color: "#ffb36b", intensity: 3.8, position: [30, 11, 6], shadowRadius: 16 },
      hemisphere: { sky: "#b4c3d4", ground: "#6a5040", intensity: 0.65 },
      practicals: [
        { position: [5.2, 2.6, -6], color: "#ffbf7a", intensity: 6, distance: 7 },
        { position: [-6, 3, 3.5], color: "#ffb070", intensity: 3, distance: 6 },
      ],
      environment: { file: "/hdri/empty_warehouse_01_1k.hdr", intensity: 0.8, rotationY: 0 },
      fog: { color: "#c9a888", density: 0.004 },
      bloom: 0.45,
    },
    exit: { kind: "threshold", halfWidth: 0.022, veil: "#07080a", veilPeak: 1 },
    assets: {
      models: [
        "/models/sheen-wood-leather-sofa.glb",
        "/models/sheen-chair.glb",
        "/models/diffuse-transmission-plant.glb",
      ],
      textures: ["brick", "concrete", "oak", "facade"],
    },
  },
  {
    id: "penthouse",
    label: "Penthouse panoramique",
    weight: 1.05,
    keyframes: [
      { t: 0, position: [-6, EYE, 6.6], target: [-6, 1.62, 0], fov: 54 },
      { t: 0.2, position: [-5.3, EYE, 1.0], target: [0.5, 1.4, -12], fov: 54 },
      { t: 0.45, position: [-1.6, EYE, -4.6], target: [6.5, 1.2, -14], fov: 52 },
      { t: 0.68, position: [3.3, 1.6, -9.2], target: [9.5, 0.2, -32], fov: 46, stop: true },
      { t: 0.84, position: [4.6, 1.6, -10.8], target: [11, 0.6, -42], fov: 42 },
      { t: 1, position: [5.4, 1.75, -14.6], target: [9, 1.8, -42], fov: 46 },
    ],
    lighting: {
      sun: { color: "#ff9e6b", intensity: 1.6, position: [-8, 5, -40], shadowRadius: 14 },
      hemisphere: { sky: "#8296bf", ground: "#4a4048", intensity: 0.8 },
      practicals: [
        { position: [-6.4, 2.5, -4], color: "#ffcf9a", intensity: 9, distance: 11 },
        { position: [6, 2.5, -4.5], color: "#ffd6a8", intensity: 9, distance: 11 },
      ],
      environment: { file: "/hdri/potsdamer_platz_1k.hdr", intensity: 0.45, rotationY: 0 },
      fog: { color: "#6c7392", density: 0.0011 },
      bloom: 0.8,
    },
    exit: { kind: "light", halfWidth: 0.026, veil: "#f6ecdf", veilPeak: 1 },
    assets: {
      models: ["/models/glam-velvet-sofa.glb", "/models/sheen-chair.glb", "/models/specular-silk-pouf.glb"],
      textures: ["marble-warm", "plaster", "oak", "facade"],
    },
  },
  {
    id: "chateau",
    label: "Château",
    weight: 1.5,
    keyframes: [
      { t: 0, position: [0, EYE, 13.5], target: [0, 2.4, 0], fov: 56 },
      { t: 0.14, position: [0.5, EYE, 4.5], target: [0, 4.2, -20], fov: 56 },
      { t: 0.34, position: [-1.4, EYE, -11], target: [1, 8.2, -30], fov: 60, stop: true },
      { t: 0.55, position: [1, EYE, -29], target: [0, 3.8, -62], fov: 54 },
      { t: 0.72, position: [0, 1.9, -47], target: [0, 6.2, -78], fov: 58, stop: true },
      { t: 0.87, position: [0, 2 + EYE, -64], target: [0, 7.4, -84], fov: 58 },
      { t: 1, position: [0, 4 + EYE, -70.5], target: [0, 9.5, -84], fov: 62 },
    ],
    lighting: {
      sun: { color: "#ffe6c4", intensity: 3.6, position: [-30, 24, -8], shadowRadius: 22 },
      hemisphere: { sky: "#e8dccb", ground: "#6b5640", intensity: 0.45 },
      practicals: [
        { position: [0, 7.4, -15], color: "#ffc27a", intensity: 18, distance: 18 },
        { position: [0, 7.4, -35], color: "#ffc27a", intensity: 18, distance: 18 },
      ],
      environment: { file: "/hdri/venice_sunset_1k.hdr", intensity: 0.55, rotationY: 0 },
      fog: { color: "#d9c7ae", density: 0.006 },
      bloom: 0.7,
    },
    exit: { kind: "dissolve", halfWidth: 0.026, veil: "#0a0c10", veilPeak: 1 },
    assets: {
      models: ["/models/chair-damask-purplegold.glb"],
      textures: ["marble-white", "marble-black", "marble-warm", "travertine", "plaster"],
    },
  },
  {
    id: "reveal",
    label: "Révélation IMERSA",
    weight: 1.05,
    keyframes: [
      { t: 0, position: [0.6, EYE, 0.8], target: [-6.5, 1.3, -1.2], fov: 54 },
      { t: 0.24, position: [1.6, 3.8, 4.6], target: [-3, 0.9, -2.5], fov: 54 },
      { t: 0.55, position: [12, 11, 19], target: [-3.5, 0, -2], fov: 46 },
      { t: 0.82, position: [21, 15.5, 27], target: [-4.2, -0.5, -1.8], fov: 42, stop: true },
      { t: 1, position: [22, 16, 28.5], target: [-4.2, -0.4, -1.8], fov: 42 },
    ],
    lighting: {
      sun: { color: "#fff1e0", intensity: 2.4, position: [-18, 30, 14], shadowRadius: 24 },
      hemisphere: { sky: "#9fb4d6", ground: "#1b1d22", intensity: 0.5 },
      practicals: [
        { position: [-3, 6, -2], color: "#8fd0ff", intensity: 0, distance: 1 },
        { position: [6, 4, 8], color: "#ffd2a0", intensity: 0, distance: 1 },
      ],
      environment: { file: "/hdri/venice_sunset_1k.hdr", intensity: 0.6, rotationY: 1.4 },
      fog: { color: "#0b0e13", density: 0.006 },
      bloom: 0.6,
    },
    assets: {
      models: [
        "/models/glam-velvet-sofa.glb",
        "/models/sheen-chair.glb",
        "/models/specular-silk-pouf.glb",
        "/models/diffuse-transmission-plant.glb",
      ],
      textures: ["concrete", "travertine", "oak", "plaster"],
    },
  },
];
