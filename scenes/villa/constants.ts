/** Soleil couchant sur la mer, face à la baie (cohérent avec le rig d'éclairage). */
export const SUN_DIRECTION: [number, number, number] = [-30, 5.5, 7];

/** Emprise du séjour, en mètres. */
export const ROOM = { minX: -7, maxX: 7, minZ: -11, maxZ: 8, height: 4.2 } as const;

/** Porte de service (fond du séjour). */
export const EXIT_DOOR = { x: 3.4, width: 1.6, height: 3.0 } as const;

/** Baie coulissante ouverte sur la terrasse (intervalle en Z dans la façade vitrée). */
export const TERRACE_DOOR = { z0: -0.9, z1: 1.9 } as const;
