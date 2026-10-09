import { createStore, useStore } from "zustand";
import type { QualityTier, SceneId } from "@/types/experience";

export type ExperienceStatus = "detecting" | "loading" | "running" | "fallback";

export interface ExperienceState {
  /** Progression demandée par le scroll (0 → 1). */
  target: number;
  /** Progression effective, lissée par le contrôleur de caméra. */
  progress: number;
  /** Index de la séquence affichée. */
  sceneIndex: number;
  /** Séquences dont les assets sont chargés et les shaders compilés. */
  ready: Partial<Record<SceneId, boolean>>;
  status: ExperienceStatus;
  quality: QualityTier;
  reducedMotion: boolean;
  /** Affiche les statistiques de rendu (?stats). */
  debug: boolean;
  /** Qualité imposée : l'adaptation automatique est désactivée. */
  qualityLocked: boolean;
  /** Appareil tactile à petit écran : cadrages et rythme adaptés. */
  mobile: boolean;
  /** Le canvas est visible à l'écran (sinon le rendu est suspendu). */
  inView: boolean;
  /** Incrémenté pour demander un raccord instantané (saut de chapitre). */
  cut: number;
  /** Saut masqué par un voile : sortie, attente du chargement, entrée. */
  jump: { to: number; phase: "out" | "hold" | "in"; source: "nav" | "motion" } | null;
  /** La caméra attend le chargement de la séquence suivante. */
  waiting: boolean;
  fallbackReason: string | null;
}

export const experienceStore = createStore<ExperienceState>(() => ({
  target: 0,
  progress: 0,
  sceneIndex: 0,
  ready: {},
  status: "detecting",
  quality: "high",
  reducedMotion: false,
  mobile: false,
  debug: false,
  qualityLocked: false,
  inView: true,
  cut: 0,
  jump: null,
  waiting: false,
  fallbackReason: null,
}));

/** Demande un raccord masqué vers une progression donnée. */
export function requestJump(to: number, source: "nav" | "motion" = "nav") {
  const { jump } = experienceStore.getState();
  if (jump) return;
  experienceStore.setState({ jump: { to: Math.min(Math.max(to, 0), 1), phase: "out", source } });
}

export function useExperience<T>(selector: (state: ExperienceState) => T): T {
  return useStore(experienceStore, selector);
}

export function markSceneReady(id: SceneId) {
  experienceStore.setState((s) => (s.ready[id] ? s : { ready: { ...s.ready, [id]: true } }));
}

export function markSceneReleased(id: SceneId) {
  experienceStore.setState((s) => {
    if (!s.ready[id]) return s;
    const ready = { ...s.ready };
    delete ready[id];
    return { ready };
  });
}

export function enterFallback(reason: string) {
  experienceStore.setState({ status: "fallback", fallbackReason: reason });
}
