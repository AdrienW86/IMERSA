"use client";

import {
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  type Material,
  Shape,
  TubeGeometry,
  Vector3,
} from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { applyBoxUV, at, merge } from "@/lib/geometry";

interface SpiralStairProps {
  center: [number, number];
  height: number;
  radius: number;
  steps: number;
  /** Angle (radians, plan XZ) de la dernière marche : orientée vers l'arrivée. */
  endAngle: number;
  turns: number;
  tread: Material;
  metal: Material;
}

/** Point de l'hélice à un angle et une hauteur donnés. */
function helix(cx: number, cz: number, r: number, angle: number, y: number) {
  return new Vector3(cx + Math.cos(angle) * r, y, cz + Math.sin(angle) * r);
}

/**
 * Escalier hélicoïdal sculptural : marches en chêne massif en porte-à-faux
 * autour d'un fût central, limon et main courante en acier cintré.
 */
export function SpiralStair({ center, height, radius, steps, endAngle, turns, tread, metal }: SpiralStairProps) {
  const [cx, cz] = center;
  const sweep = turns * Math.PI * 2;
  const startAngle = endAngle - sweep;
  const rise = height / steps;
  const stepAngle = sweep / steps;

  const parts = useDisposable(() => {
    // Marche : secteur annulaire extrudé (repère local, centré sur l'axe).
    const inner = 0.14;
    const shape = new Shape();
    shape.absarc(0, 0, radius, -stepAngle * 0.56, stepAngle * 0.56, false);
    shape.absarc(0, 0, inner, stepAngle * 0.56, -stepAngle * 0.56, true);
    shape.closePath();
    const treadGeo = new ExtrudeGeometry(shape, {
      depth: 0.065,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
      curveSegments: 10,
    });
    treadGeo.rotateX(Math.PI / 2);
    applyBoxUV(treadGeo);

    const treads = merge(
      Array.from({ length: steps }, (_, i) => {
        const a = startAngle + (i + 0.5) * stepAngle;
        // Rotation autour de Y : l'axe X local suit la direction de la marche.
        return { geometry: treadGeo.clone(), matrix: at(cx, (i + 1) * rise, cz, -a) };
      }),
    );
    treadGeo.dispose();

    const railPoints: Vector3[] = [];
    const stringerPoints: Vector3[] = [];
    const samples = steps * 4;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const a = startAngle + t * sweep;
      railPoints.push(helix(cx, cz, radius - 0.04, a, t * height + 0.95));
      stringerPoints.push(helix(cx, cz, radius + 0.02, a, t * height - 0.08));
    }
    const rail = new TubeGeometry(new CatmullRomCurve3(railPoints), samples * 2, 0.022, 10, false);
    const stringer = new TubeGeometry(new CatmullRomCurve3(stringerPoints), samples * 2, 0.045, 10, false);

    const balusterGeo = new CylinderGeometry(0.008, 0.008, 0.95, 6);
    const balusters = merge(
      Array.from({ length: steps }, (_, i) => {
        const a = startAngle + (i + 0.5) * stepAngle;
        const p = helix(cx, cz, radius - 0.05, a, (i + 1) * rise + 0.475);
        return { geometry: balusterGeo.clone(), matrix: at(p.x, p.y, p.z) };
      }),
    );
    balusterGeo.dispose();

    const pole = new CylinderGeometry(0.11, 0.11, height + 1, 24).translate(cx, (height + 1) / 2, cz);
    return { treads, rail, stringer, balusters, pole };
  }, [cx, cz, height, radius, steps, startAngle, stepAngle, rise, sweep]);

  return (
    <group>
      <mesh geometry={parts.treads} material={tread} castShadow receiveShadow />
      <mesh geometry={parts.rail} material={metal} castShadow />
      <mesh geometry={parts.stringer} material={metal} castShadow />
      <mesh geometry={parts.balusters} material={metal} />
      <mesh geometry={parts.pole} material={metal} castShadow />
    </group>
  );
}
