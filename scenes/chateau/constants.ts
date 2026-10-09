/** Galerie : 12 m de large, 64 m de long, voûte en berceau culminant à 15,7 m. */
export const GALLERY = { halfWidth: 6, z0: 10, z1: -54, wallHeight: 9 } as const;

/** Travées de 5 m : baies cintrées côté jardin, miroirs côté cour. */
export const BAY = {
  width: 5,
  window: { width: 2.8, sill: 0.55, spring: 6.3 },
  mirror: { width: 2.8, sill: 0.55, spring: 6.3 },
} as const;

/** Hall de l'escalier d'honneur. */
export const HALL = { halfWidth: 12, z1: -84, height: 21 } as const;

export const bayCenters = Array.from({ length: 12 }, (_, i) => 5 - i * 5);
export const pilasterPositions = Array.from({ length: 13 }, (_, i) => 7.5 - i * 5);

/** Escalier impérial : volée centrale puis deux volées en retour. */
export const STAIR = {
  width: 6,
  start: -60,
  steps: 16,
  rise: 0.25,
  run: 0.5,
  landing: { z0: -68, z1: -74, halfWidth: 10 },
  side: { inner: 6.6, outer: 9.6 },
  upper: 8,
} as const;
