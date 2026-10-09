"use client";

import type { SceneProps } from "@/components/3d/SceneDirector";
import { VillaContent } from "@/scenes/villa/VillaScene";

/**
 * Final : le parcours revient à la villa, mais cette fois la caméra traverse
 * le voilage de la baie et sort sur la terrasse, face au soleil couchant.
 */
export default function FinaleScene({ settings }: SceneProps) {
  return <VillaContent settings={settings} />;
}
