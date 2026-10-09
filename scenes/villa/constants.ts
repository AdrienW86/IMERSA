/** Direction du soleil de fin d'après-midi (cohérente avec le rig d'éclairage). */
export const SUN_DIRECTION: [number, number, number] = [-18, 14, 22];

/** Emprise du séjour, en mètres. */
export const ROOM = { minX: -7, maxX: 7, minZ: -11, maxZ: 8, height: 4.2 } as const;

/** Porte vers le passage menant au loft. */
export const EXIT_DOOR = { x: 3.4, width: 1.6, height: 3.0 } as const;
