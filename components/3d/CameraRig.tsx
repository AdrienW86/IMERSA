"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector2, Vector3 } from "three";
import { experienceStore, requestJump } from "@/lib/experience-store";
import {
  boundaries,
  sampleCamera,
  sceneIndexAt,
  scenes,
  stops,
  type CameraSample,
} from "@/lib/journey";

/** Vitesse maximale de la caméra, en progression globale par seconde. */
const MAX_SPEED = 0.16;

/** Arrêt le plus proche (mode « mouvements réduits »). */
function nearestStop(p: number) {
  let best = stops[0];
  for (const s of stops) if (Math.abs(s - p) < Math.abs(best - p)) best = s;
  return best;
}

/**
 * Ne laisse pas la caméra franchir un seuil tant que la séquence de l'autre
 * côté n'est pas prête : aucune scène n'apparaît vide.
 */
function gate(current: number, desired: number, ready: Record<string, boolean | undefined>) {
  for (const b of boundaries) {
    const margin = b.transition.halfWidth * 0.6;
    const nextId = scenes[b.to].id;
    const prevId = scenes[b.from].id;
    if (current <= b.at && desired > b.at - margin && !ready[nextId]) {
      return { value: Math.min(desired, b.at - margin), waiting: true };
    }
    if (current >= b.at && desired < b.at + margin && !ready[prevId]) {
      return { value: Math.max(desired, b.at + margin), waiting: true };
    }
  }
  return { value: desired, waiting: false };
}

/**
 * Contrôleur unique de la caméra. Il lit la progression demandée par le
 * scroll, la lisse, échantillonne la trajectoire et publie la progression
 * effective — utilisée ensuite par le texte, le voile et l'éclairage.
 */
export function CameraRig({ mobile }: { mobile: boolean }) {
  const progress = useRef(experienceStore.getState().progress);
  const lastCut = useRef(experienceStore.getState().cut);
  const sample = useRef<CameraSample>({ position: new Vector3(), target: new Vector3(), fov: 50 });
  const pointer = useRef(new Vector2());
  const sway = useRef(new Vector2());
  const lookAt = useRef(new Vector3());

  useEffect(() => {
    if (mobile) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mobile]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 20);
    const camera = state.camera as PerspectiveCamera;
    const st = experienceStore.getState();
    let p = progress.current;

    if (st.cut !== lastCut.current) {
      // Raccord demandé (saut de chapitre) : masqué par le voile.
      lastCut.current = st.cut;
      p = st.jump?.to ?? st.target;
    } else if (st.reducedMotion) {
      const stop = nearestStop(st.target);
      if (Math.abs(stop - p) > 1e-4 && !st.jump) {
        requestJump(stop, "motion");
      }
    } else if (!st.jump) {
      const { value, waiting } = gate(p, st.target, st.ready);
      if (waiting !== st.waiting) experienceStore.setState({ waiting });
      // Amortissement exponentiel + vitesse plafonnée : travelling sans à-coups.
      const lambda = mobile ? 3.2 : 2.6;
      const eased = MathUtils.damp(p, value, lambda, delta);
      const maxStep = MAX_SPEED * delta;
      p = p + MathUtils.clamp(eased - p, -maxStep, maxStep);
      if (Math.abs(value - p) < 1e-5) p = value;
    }
    progress.current = p;

    const s = sampleCamera(p, sample.current);

    // Respiration très légère et parallaxe au pointeur (désactivées si mouvements réduits).
    const t = state.clock.elapsedTime;
    const still = st.reducedMotion;
    if (!still) sway.current.lerp(pointer.current, 1 - Math.exp(-delta * 2));
    lookAt.current.copy(s.target);
    if (!still) {
      lookAt.current.x += Math.sin(t * 0.21) * 0.03 + sway.current.x * 0.28;
      lookAt.current.y += Math.sin(t * 0.17 + 1.3) * 0.025 - sway.current.y * 0.16;
    }

    camera.position.copy(s.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(lookAt.current);

    // Cadrage adapté au format : en portrait, on élargit le champ vertical
    // pour conserver une partie de la largeur de l'architecture.
    const aspect = state.size.width / Math.max(1, state.size.height);
    let fov = s.fov;
    if (aspect < 1.5) {
      const hfov = 2 * Math.atan(Math.tan(MathUtils.degToRad(s.fov) / 2) * 1.6);
      const needed = MathUtils.radToDeg(2 * Math.atan(Math.tan(hfov / 2) / aspect));
      fov = MathUtils.clamp(MathUtils.lerp(s.fov, needed, 0.6), s.fov, 82);
    }
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    const sceneIndex = sceneIndexAt(p);
    if (p !== st.progress || sceneIndex !== st.sceneIndex) {
      experienceStore.setState({ progress: p, sceneIndex });
    }
  }, -10);

  return null;
}
