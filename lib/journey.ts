import { Color, Vector3 } from "three";
import { sceneDefinitions } from "@/scenes/config";
import type {
  ResolvedScene,
  SceneLighting,
  SceneTransition,
  Vec3,
} from "@/types/experience";

/* ------------------------------------------------------------------ */
/* Résolution du parcours : bornes de progression et origines monde    */
/* ------------------------------------------------------------------ */

function resolveScenes(): ResolvedScene[] {
  const total = sceneDefinitions.reduce((sum, s) => sum + s.weight, 0);
  let cursor = 0;
  let origin: Vec3 = [0, 0, 0];
  const resolved: ResolvedScene[] = [];

  sceneDefinitions.forEach((def, index) => {
    if (index > 0) {
      // Le seuil de sortie de la séquence précédente coïncide avec le premier
      // point de passage de celle-ci : on en déduit son origine monde.
      const prev = resolved[index - 1];
      const exit = prev.keyframes[prev.keyframes.length - 1].position;
      const entry = def.keyframes[0].position;
      origin = [
        prev.origin[0] + exit[0] - entry[0],
        prev.origin[1] + exit[1] - entry[1],
        prev.origin[2] + exit[2] - entry[2],
      ];
    }
    const start = cursor / total;
    cursor += def.weight;
    resolved.push({ ...def, index, start, end: cursor / total, origin });
  });
  return resolved;
}

export const scenes: readonly ResolvedScene[] = resolveScenes();

/* ------------------------------------------------------------------ */
/* Trajectoire caméra : spline d'Hermite paramétrée par le temps        */
/* ------------------------------------------------------------------ */

interface GlobalKey {
  time: number;
  position: Vector3;
  target: Vector3;
  fov: number;
  still: boolean;
}

function buildKeys(): GlobalKey[] {
  const keys: GlobalKey[] = [];
  for (const scene of scenes) {
    const [ox, oy, oz] = scene.origin;
    scene.keyframes.forEach((k, i) => {
      // Le premier point d'une séquence est déjà le dernier de la précédente.
      if (scene.index > 0 && i === 0) return;
      keys.push({
        time: scene.start + k.t * (scene.end - scene.start),
        position: new Vector3(k.position[0] + ox, k.position[1] + oy, k.position[2] + oz),
        target: new Vector3(k.target[0] + ox, k.target[1] + oy, k.target[2] + oz),
        fov: k.fov ?? 50,
        still: !!k.still,
      });
    });
  }
  return keys;
}

const keys = buildKeys();

/**
 * Tangente de Catmull-Rom non uniforme : vitesse continue au passage de
 * chaque point, quel que soit l'espacement temporel des points.
 */
function tangent<T extends Vector3 | number>(
  i: number,
  pick: (k: GlobalKey) => T,
  out?: Vector3,
): T {
  const prev = keys[Math.max(0, i - 1)];
  const next = keys[Math.min(keys.length - 1, i + 1)];
  // Départ et arrivée du parcours : vitesse nulle (mise en mouvement douce).
  // Raccords : temps suspendu sur l'objet repère.
  const atEdge = i === 0 || i === keys.length - 1 || keys[i].still;
  const dt = next.time - prev.time || 1;
  const a = pick(prev);
  const b = pick(next);
  if (typeof a === "number" && typeof b === "number") {
    return (atEdge ? 0 : (b - a) / dt) as T;
  }
  const v = out ?? new Vector3();
  if (atEdge) return v.set(0, 0, 0) as T;
  return v.subVectors(b as Vector3, a as Vector3).divideScalar(dt) as T;
}

const tanA = new Vector3();
const tanB = new Vector3();

function hermite(
  out: Vector3,
  p0: Vector3,
  m0: Vector3,
  p1: Vector3,
  m1: Vector3,
  s: number,
  h: number,
) {
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;
  return out
    .copy(p0)
    .multiplyScalar(h00)
    .addScaledVector(m0, h10 * h)
    .addScaledVector(p1, h01)
    .addScaledVector(m1, h11 * h);
}

function segmentAt(p: number) {
  const t = Math.min(Math.max(p, 0), 1);
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1].time < t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const h = b.time - a.time || 1;
  return { i, s: Math.min(Math.max((t - a.time) / h, 0), 1), h };
}

export interface CameraSample {
  position: Vector3;
  target: Vector3;
  fov: number;
}

/** Échantillonne la caméra à une progression globale donnée. */
export function sampleCamera(p: number, out: CameraSample): CameraSample {
  const { i, s, h } = segmentAt(p);
  const a = keys[i];
  const b = keys[i + 1];
  hermite(
    out.position,
    a.position,
    tangent(i, (k) => k.position, tanA),
    b.position,
    tangent(i + 1, (k) => k.position, tanB),
    s,
    h,
  );
  hermite(
    out.target,
    a.target,
    tangent(i, (k) => k.target, tanA),
    b.target,
    tangent(i + 1, (k) => k.target, tanB),
    s,
    h,
  );
  const s2 = s * s;
  const s3 = s2 * s;
  out.fov =
    (2 * s3 - 3 * s2 + 1) * a.fov +
    (s3 - 2 * s2 + s) * h * tangent(i, (k) => k.fov) +
    (-2 * s3 + 3 * s2) * b.fov +
    (s3 - s2) * h * tangent(i + 1, (k) => k.fov);
  return out;
}

/* ------------------------------------------------------------------ */
/* Séquences, transitions et points d'arrêt                            */
/* ------------------------------------------------------------------ */

export function sceneIndexAt(p: number): number {
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (p >= scenes[i].start) return i;
  }
  return 0;
}

export function localProgress(p: number, index: number): number {
  const s = scenes[index];
  return (p - s.start) / (s.end - s.start);
}

/** Frontières entre séquences (progression globale de la bascule). */
export const boundaries = scenes.slice(0, -1).map((s) => ({
  at: s.end,
  from: s.index,
  to: s.index + 1,
  transition: s.exit as SceneTransition,
}));

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

export interface VeilState {
  color: string;
  opacity: number;
}

/** Voile de transition (DOM) : masque le changement d'environnement. */
export function veilAt(p: number, out: VeilState): VeilState {
  out.opacity = 0;
  for (const b of boundaries) {
    const d = Math.abs(p - b.at);
    const w = b.transition.halfWidth;
    if (d > w) continue;
    const k = 1 - smoothstep(0, w, d);
    // Courbe plus ou moins tendue selon la nature de la transition.
    const shape = b.transition.kind === "threshold" ? Math.pow(k, 1.6) : Math.pow(k, 1.2);
    out.opacity = shape * b.transition.veilPeak;
    out.color = b.transition.veil;
  }
  return out;
}

/** Progression globale des points d'arrêt (mode « mouvements réduits »). */
export const stops: readonly number[] = scenes.flatMap((s) =>
  s.keyframes.filter((k) => k.stop).map((k) => s.start + k.t * (s.end - s.start)),
);

/* ------------------------------------------------------------------ */
/* Éclairage interpolé                                                 */
/* ------------------------------------------------------------------ */

export interface LightingSample {
  sunColor: Color;
  sunIntensity: number;
  sunOffset: Vector3;
  shadowRadius: number;
  hemiSky: Color;
  hemiGround: Color;
  hemiIntensity: number;
  practicals: { position: Vector3; color: Color; intensity: number; distance: number }[];
  envIntensity: number;
  envRotationY: number;
  envFile: string;
  fogColor: Color;
  fogDensity: number;
  bloom: number;
}

export function createLightingSample(): LightingSample {
  return {
    sunColor: new Color(),
    sunIntensity: 0,
    sunOffset: new Vector3(),
    shadowRadius: 10,
    hemiSky: new Color(),
    hemiGround: new Color(),
    hemiIntensity: 0,
    practicals: [0, 1].map(() => ({
      position: new Vector3(),
      color: new Color(),
      intensity: 0,
      distance: 1,
    })),
    envIntensity: 1,
    envRotationY: 0,
    envFile: scenes[0].lighting.environment.file,
    fogColor: new Color(),
    fogDensity: 0,
    bloom: 0,
  };
}

const ca = new Color();
const cb = new Color();
const va = new Vector3();

function lerpLighting(
  out: LightingSample,
  a: SceneLighting,
  b: SceneLighting,
  aOrigin: Vec3,
  bOrigin: Vec3,
  t: number,
) {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  out.sunColor.copy(ca.set(a.sun.color)).lerp(cb.set(b.sun.color), t);
  out.sunIntensity = lerp(a.sun.intensity, b.sun.intensity);
  out.sunOffset.set(...a.sun.position).lerp(va.set(...b.sun.position), t);
  out.shadowRadius = lerp(a.sun.shadowRadius, b.sun.shadowRadius);
  out.hemiSky.copy(ca.set(a.hemisphere.sky)).lerp(cb.set(b.hemisphere.sky), t);
  out.hemiGround.copy(ca.set(a.hemisphere.ground)).lerp(cb.set(b.hemisphere.ground), t);
  out.hemiIntensity = lerp(a.hemisphere.intensity, b.hemisphere.intensity);
  out.practicals.forEach((pl, i) => {
    const pa = a.practicals[i];
    const pb = b.practicals[i];
    // Les lumières d'appoint ne voyagent pas : elles s'éteignent puis se rallument.
    const src = t < 0.5 ? pa : pb;
    const origin = t < 0.5 ? aOrigin : bOrigin;
    const fade = t < 0.5 ? 1 - smoothstep(0, 0.5, t) : smoothstep(0.5, 1, t);
    pl.position.set(src.position[0] + origin[0], src.position[1] + origin[1], src.position[2] + origin[2]);
    pl.color.set(src.color);
    pl.intensity = src.intensity * fade;
    pl.distance = src.distance;
  });
  out.envIntensity = lerp(a.environment.intensity, b.environment.intensity);
  out.envRotationY = t < 0.5 ? a.environment.rotationY : b.environment.rotationY;
  out.envFile = t < 0.5 ? a.environment.file : b.environment.file;
  out.fogColor.copy(ca.set(a.fog.color)).lerp(cb.set(b.fog.color), t);
  out.fogDensity = lerp(a.fog.density, b.fog.density);
  out.bloom = lerp(a.bloom, b.bloom);
}

export function lightingAt(p: number, out: LightingSample): LightingSample {
  const index = sceneIndexAt(p);
  const scene = scenes[index];
  let a = scene;
  let b = scene;
  let t = 0;
  for (const boundary of boundaries) {
    const w = boundary.transition.halfWidth;
    if (p > boundary.at - w && p < boundary.at + w) {
      a = scenes[boundary.from];
      b = scenes[boundary.to];
      t = smoothstep(boundary.at - w, boundary.at + w, p);
    }
  }
  lerpLighting(out, a.lighting, b.lighting, a.origin, b.origin, t);
  return out;
}

/* ------------------------------------------------------------------ */
/* Mise au point (profondeur de champ)                                 */
/* ------------------------------------------------------------------ */

/** Repères monde des raccords sur objet. */
const matchAnchors = boundaries
  .filter((b) => b.transition.match)
  .map((b) => {
    const from = scenes[b.from];
    const m = b.transition.match!;
    return {
      at: b.at,
      window: 0.045,
      anchor: new Vector3(m.from[0] + from.origin[0], m.from[1] + from.origin[1], m.from[2] + from.origin[2]),
    };
  });

export interface FocusState {
  target: Vector3;
  /** 0 : plan large ; 1 : plan macro sur l'objet repère. */
  macro: number;
}

/**
 * Point de netteté : la cible de visée en plan large, l'objet repère à
 * l'approche d'un raccord (le décor se fond alors dans le flou).
 */
export function focusAt(p: number, lookTarget: Vector3, out: FocusState): FocusState {
  out.target.copy(lookTarget);
  out.macro = 0;
  for (const a of matchAnchors) {
    const d = Math.abs(p - a.at);
    if (d > a.window) continue;
    const k = 1 - smoothstep(0, a.window, d);
    out.macro = k;
    out.target.lerp(a.anchor, smoothstep(0, 0.35, k));
  }
  return out;
}
