import {
  BoxGeometry,
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Matrix4,
  Shape,
  Vector2,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Projection « box mapping » : les UV sont exprimées en mètres selon l'axe
 * dominant de chaque normale. Combinée à `texture.repeat = 1 / taille`, elle
 * garantit une densité de texture constante sur toutes les surfaces.
 */
export function applyBoxUV(geometry: BufferGeometry, offset: [number, number, number] = [0, 0, 0]) {
  const pos = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  if (!normal) geometry.computeVertexNormals();
  const n = geometry.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + offset[0];
    const y = pos.getY(i) + offset[1];
    const z = pos.getZ(i) + offset[2];
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) {
      uv[i * 2] = x;
      uv[i * 2 + 1] = z;
    } else if (ax >= az) {
      uv[i * 2] = z;
      uv[i * 2 + 1] = y;
    } else {
      uv[i * 2] = x;
      uv[i * 2 + 1] = y;
    }
  }
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return geometry;
}

/** Volume parallélépipédique, chanfreiné si `radius` > 0, UV en mètres. */
export function slab(w: number, h: number, d: number, radius = 0) {
  const geo =
    radius > 0
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, Math.min(w, h, d) / 2 - 1e-4))
      : new BoxGeometry(w, h, d);
  return applyBoxUV(geo);
}

/** Positionne et fusionne une liste de géométries (un seul draw call). */
export function merge(parts: { geometry: BufferGeometry; matrix: Matrix4 }[]) {
  const transformed = parts.map(({ geometry, matrix }) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.applyMatrix4(matrix);
    for (const name of Object.keys(g.attributes)) {
      if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
    }
    return g;
  });
  const merged = mergeGeometries(transformed, false);
  transformed.forEach((g) => g.dispose());
  parts.forEach(({ geometry }) => geometry.dispose());
  if (!merged) throw new Error("Fusion de géométries impossible");
  return merged;
}

const m4 = new Matrix4();
/** Matrice de placement compacte. */
export function at(x: number, y: number, z: number, rotY = 0, rotX = 0, rotZ = 0) {
  return new Matrix4()
    .makeRotationY(rotY)
    .multiply(m4.makeRotationX(rotX))
    .multiply(new Matrix4().makeRotationZ(rotZ))
    .setPosition(x, y, z);
}

/** Profil de moulure extrudé en ligne droite le long de l'axe Z local. */
export function molding(profile: [number, number][], length: number) {
  const shape = new Shape(profile.map(([x, y]) => new Vector2(x, y)));
  const geo = new ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, steps: 1 });
  geo.translate(0, 0, -length / 2);
  return applyBoxUV(geo);
}

/** Pièce de révolution (colonnes, balustres, vases…). */
export function lathe(profile: [number, number][], segments = 32) {
  const geo = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r, y)),
    segments,
  );
  geo.computeVertexNormals();
  return geo;
}

/** Panneau rectangulaire percé d'une baie cintrée, extrudé (épaisseur `depth`). */
export function archedPanel(
  width: number,
  height: number,
  depth: number,
  opening: { width: number; sill: number; spring: number },
  bottom = 0,
) {
  const shape = new Shape();
  shape.moveTo(-width / 2, bottom);
  shape.lineTo(width / 2, bottom);
  shape.lineTo(width / 2, height);
  shape.lineTo(-width / 2, height);
  shape.closePath();

  const r = opening.width / 2;
  const hole = new Shape();
  hole.moveTo(-r, opening.sill);
  hole.lineTo(r, opening.sill);
  hole.lineTo(r, opening.spring);
  hole.absarc(0, opening.spring, r, 0, Math.PI, false);
  hole.lineTo(-r, opening.sill);
  shape.holes.push(hole);

  const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
  geo.translate(0, 0, -depth / 2);
  return applyBoxUV(geo);
}

/** Arc plein (anneau extrudé), pour les arcs doubleaux et encadrements. */
export function archRing(radius: number, thickness: number, depth: number, segments = 32) {
  const shape = new Shape();
  shape.absarc(0, 0, radius + thickness, 0, Math.PI, false);
  shape.absarc(0, 0, radius, Math.PI, 0, true);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segments });
  geo.translate(0, 0, -depth / 2);
  return applyBoxUV(geo);
}
