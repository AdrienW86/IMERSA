import type { QualityTier } from "@/types/experience";

export interface QualitySettings {
  /** Plafond du device pixel ratio. */
  maxDpr: number;
  shadows: boolean;
  shadowMapSize: number;
  postprocessing: boolean;
  /** Échantillons MSAA du compositeur. */
  multisampling: number;
  /** Sonde de réflexion temps réel (miroirs, dorures, marbres polis). */
  reflectionProbe: number;
  /** Matériaux à transmission (verre réfractif) : passe de rendu supplémentaire. */
  transmission: boolean;
  /** Rayons de lumière volumétriques simulés. */
  lightShafts: boolean;
  particles: number;
  cityBlocks: number;
  pointCloud: number;
  /** Facteur appliqué à l'anisotropie des textures. */
  anisotropy: number;
}

export const qualityPresets: Record<QualityTier, QualitySettings> = {
  high: {
    maxDpr: 1.75,
    shadows: true,
    shadowMapSize: 2048,
    postprocessing: true,
    multisampling: 4,
    reflectionProbe: 512,
    transmission: true,
    lightShafts: true,
    particles: 260,
    cityBlocks: 1400,
    pointCloud: 60000,
    anisotropy: 8,
  },
  medium: {
    maxDpr: 1.35,
    shadows: true,
    shadowMapSize: 1024,
    postprocessing: true,
    multisampling: 2,
    reflectionProbe: 256,
    transmission: false,
    lightShafts: true,
    particles: 140,
    cityBlocks: 900,
    pointCloud: 32000,
    anisotropy: 4,
  },
  low: {
    maxDpr: 1.2,
    shadows: false,
    shadowMapSize: 512,
    postprocessing: false,
    multisampling: 0,
    reflectionProbe: 128,
    transmission: false,
    lightShafts: false,
    particles: 60,
    cityBlocks: 500,
    pointCloud: 16000,
    anisotropy: 2,
  },
};

export interface CapabilityReport {
  webgl2: boolean;
  software: boolean;
  tier: QualityTier;
  renderer: string;
}

const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|software|basic render/i;
const MOBILE_GPUS = /adreno|mali|powervr|apple gpu|tegra|videocore/i;

/** Évalue les capacités de l'appareil (exécuté côté client uniquement). */
export function detectCapabilities(): CapabilityReport {
  let renderer = "";
  let webgl2 = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
    if (gl) {
      webgl2 = true;
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      renderer = String(
        info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      );
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webgl2 = false;
  }

  const software = SOFTWARE_RENDERERS.test(renderer);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const smallScreen = Math.min(window.screen.width, window.screen.height) < 820;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  let tier: QualityTier = "high";
  if ((coarse && smallScreen) || software) tier = "low";
  else if (coarse || MOBILE_GPUS.test(renderer) || cores <= 4 || memory <= 4) tier = "medium";

  return { webgl2, software, tier, renderer };
}

export function lowerTier(tier: QualityTier): QualityTier {
  return tier === "high" ? "medium" : "low";
}
