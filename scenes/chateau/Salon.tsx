"use client";

import {
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  PlaneGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { useDisposable } from "@/hooks/useDisposable";
import { usePbrTextures } from "@/hooks/usePbrTextures";
import { at, lathe, merge, slab } from "@/lib/geometry";
import { CHATEAU_FLAME } from "@/scenes/anchors";
import { Candle, FLAME_HEIGHT } from "@/scenes/shared/hero/Candle";
import { SheerCurtain } from "@/scenes/shared/hero/SheerCurtain";
import { Model } from "@/scenes/shared/Model";
import { Chandelier, type useChandelierGeometry } from "./Chandelier";
import type { ChateauMaterials } from "./useChateauMaterials";

/** Salon d'apparat, dans l'enfilade de la galerie (repère de la scène château). */
export const SALON = { x0: 11, x1: 25, z0: -6, z1: 6, height: 7.5 } as const;
const MANTEL_TOP = 1.245;
const FIRE_X = 18;
const WINDOWS_X = [14.8, 21.2];

/** Cadres de boiseries : moulures dorées rectangulaires le long d'un mur. */
function panelFrames(axis: "x" | "z", fixed: number, from: number, to: number, count: number, y0: number, y1: number) {
  const parts = [];
  const span = (to - from) / count;
  const h = y1 - y0;
  const put = (along: number, y: number, sx: number, sy: number) =>
    axis === "x"
      ? { geometry: slab(sx, sy, 0.035, 0.01), matrix: at(along, y, fixed) }
      : { geometry: slab(0.035, sy, sx, 0.01), matrix: at(fixed, y, along) };
  for (let i = 0; i < count; i++) {
    const a = from + span * i + 0.18;
    const b = from + span * (i + 1) - 0.18;
    const w = b - a;
    parts.push(put((a + b) / 2, y0, w, 0.035), put((a + b) / 2, y1, w, 0.035), put(a, y0 + h / 2, 0.035, h), put(b, y0 + h / 2, 0.035, h));
  }
  return parts;
}

export function Salon({
  m,
  chandelier,
}: {
  m: ChateauMaterials;
  chandelier: ReturnType<typeof useChandelierGeometry>;
}) {
  const { x0, x1, z0, z1, height: H } = SALON;
  const parquet = usePbrTextures("oak", 0.9, Math.PI / 4);
  const local = useDisposable(
    () => ({
      parquet: new MeshStandardMaterial({ ...parquet, color: new Color("#b08060"), roughness: 0.55 }),
      boiserie: new MeshStandardMaterial({ color: new Color("#ddd2bf"), roughness: 0.85 }),
      velvet: new MeshStandardMaterial({ color: new Color("#5a1320"), roughness: 0.9, side: DoubleSide }),
      rug: new MeshStandardMaterial({ color: new Color("#6b2a2c"), roughness: 1 }),
      rugBorder: new MeshStandardMaterial({ color: new Color("#c7a36a"), roughness: 1 }),
      sky: new MeshStandardMaterial({ color: new Color("#000"), emissive: new Color("#ffe1b6"), emissiveIntensity: 2.2, toneMapped: false }),
    }),
    [parquet],
  );

  const g = useDisposable(() => {
    const t = 0.5;
    // Murs : façade sud percée de deux fenêtres, autres murs pleins.
    const south = [];
    let cursor = x0 - t;
    for (const wx of WINDOWS_X) {
      const a = wx - 1.1;
      south.push({ geometry: slab(a - cursor, H, t), matrix: at((cursor + a) / 2, H / 2, z1 + t / 2) });
      south.push({ geometry: slab(2.2, 0.6, t), matrix: at(wx, 0.3, z1 + t / 2) });
      south.push({ geometry: slab(2.2, H - 5.4, t), matrix: at(wx, (H + 5.4) / 2, z1 + t / 2) });
      cursor = wx + 1.1;
    }
    south.push({ geometry: slab(x1 + t - cursor, H, t), matrix: at((cursor + x1 + t) / 2, H / 2, z1 + t / 2) });
    // Cheminée : manteau de marbre, foyer sombre.
    const fireplace = merge([
      { geometry: slab(0.28, MANTEL_TOP - 0.08, 0.38, 0.02), matrix: at(FIRE_X - 0.95, (MANTEL_TOP - 0.08) / 2, z0 + 0.19) },
      { geometry: slab(0.28, MANTEL_TOP - 0.08, 0.38, 0.02), matrix: at(FIRE_X + 0.95, (MANTEL_TOP - 0.08) / 2, z0 + 0.19) },
      { geometry: slab(2.18, 0.32, 0.38, 0.02), matrix: at(FIRE_X, MANTEL_TOP - 0.24, z0 + 0.19) },
      { geometry: slab(2.5, 0.08, 0.52, 0.02), matrix: at(FIRE_X, MANTEL_TOP - 0.04, z0 + 0.26) },
    ]);
    const firebox = slab(1.62, 0.84, 0.05);
    // Miroir doré au-dessus de la cheminée (cintré).
    const mirrorShape = merge([
      { geometry: new PlaneGeometry(1.9, 2.6), matrix: at(0, 1.3, 0) },
      { geometry: new CircleGeometry(0.95, 32, 0, Math.PI), matrix: at(0, 2.6, 0) },
    ]);
    const mirrorFrame = merge([
      { geometry: slab(0.12, 2.7, 0.08, 0.02), matrix: at(-1.0, 1.3, 0) },
      { geometry: slab(0.12, 2.7, 0.08, 0.02), matrix: at(1.0, 1.3, 0) },
      { geometry: slab(2.12, 0.12, 0.08, 0.02), matrix: at(0, -0.02, 0) },
      { geometry: slab(0.5, 0.36, 0.1, 0.04), matrix: at(0, 3.62, 0.02) },
    ]);
    const arch = new TubeGeometry(
      new CatmullRomCurve3(
        Array.from({ length: 17 }, (_, i) => {
          const a = (i / 16) * Math.PI;
          return new Vector3(Math.cos(a) * 1.0, 2.6 + Math.sin(a) * 1.0, 0);
        }),
      ),
      48,
      0.06,
      8,
      false,
    );
    // Candélabre doré à trois bras.
    const candelabra = merge([
      { geometry: lathe([[0.001, 0], [0.09, 0], [0.08, 0.03], [0.03, 0.06], [0.025, 0.25], [0.04, 0.3], [0.02, 0.36], [0.02, 0.4], [0.001, 0.4]], 24), matrix: at(0, 0, 0) },
      { geometry: new TubeGeometry(new CatmullRomCurve3([new Vector3(-0.17, 0.4, 0), new Vector3(-0.12, 0.3, 0), new Vector3(0, 0.29, 0), new Vector3(0.12, 0.3, 0), new Vector3(0.17, 0.4, 0)]), 24, 0.012, 6), matrix: at(0, 0, 0) },
      ...[-0.17, 0, 0.17].map((x) => ({ geometry: lathe([[0.001, 0], [0.03, 0], [0.034, 0.02], [0.018, 0.022], [0.001, 0.02]], 16), matrix: at(x, 0.4, 0) })),
    ]);
    // Corniche et plafond.
    const cornice = merge([
      { geometry: slab(x1 - x0, 0.35, 0.3, 0.05), matrix: at((x0 + x1) / 2, H - 0.18, z0 + 0.15) },
      { geometry: slab(x1 - x0, 0.35, 0.3, 0.05), matrix: at((x0 + x1) / 2, H - 0.18, z1 - 0.15) },
      { geometry: slab(0.3, 0.35, z1 - z0, 0.05), matrix: at(x1 - 0.15, H - 0.18, 0) },
      { geometry: slab(0.3, 0.35, z1 - z0, 0.05), matrix: at(x0 + 0.15, H - 0.18, 0) },
    ]);
    const dado = merge([
      { geometry: slab(x1 - x0, 0.08, 0.06, 0.01), matrix: at((x0 + x1) / 2, 0.95, z0 + 0.03) },
      { geometry: slab(0.06, 0.08, z1 - z0, 0.01), matrix: at(x1 - 0.03, 0.95, 0) },
      { geometry: slab(x1 - x0, 0.18, 0.04, 0.01), matrix: at((x0 + x1) / 2, 0.09, z0 + 0.02) },
      { geometry: slab(0.04, 0.18, z1 - z0, 0.01), matrix: at(x1 - 0.02, 0.09, 0) },
    ]);
    const frames = merge([
      ...panelFrames("x", z0 + 0.03, x0, FIRE_X - 1.4, 2, 1.3, H - 0.7),
      ...panelFrames("x", z0 + 0.03, FIRE_X + 1.4, x1, 2, 1.3, H - 0.7),
      ...panelFrames("z", x1 - 0.03, z0, z1, 3, 1.3, H - 0.7),
      ...panelFrames("x", z0 + 0.03, x0, x1, 5, 0.25, 0.8),
    ]);
    // Rideaux de velours drapés (plis) de part et d'autre des fenêtres.
    const drape = new PlaneGeometry(0.9, 5.6, 36, 1);
    const pos = drape.getAttribute("position");
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 22) * 0.05);
    drape.computeVertexNormals();
    return {
      walls: merge([
        ...south,
        { geometry: slab(x1 - x0 + 2 * t, H, t), matrix: at((x0 + x1) / 2, H / 2, z0 - t / 2) },
        { geometry: slab(t, H, z1 - z0 + 2 * t), matrix: at(x1 + t / 2, H / 2, 0) },
      ]),
      floor: slab(x1 - x0, 0.1, z1 - z0),
      ceiling: slab(x1 - x0 + 1, 0.3, z1 - z0 + 1),
      fireplace,
      firebox,
      mirrorShape,
      mirrorFrame,
      arch,
      candelabra,
      cornice,
      dado,
      frames,
      drape,
      rug: slab(5.4, 0.012, 3.8, 0.004),
      rugBorder: slab(5.7, 0.008, 4.1, 0.004),
      windowGlow: new PlaneGeometry(2.2, 4.8),
    };
  }, []);

  const candleBase = CHATEAU_FLAME[1] - FLAME_HEIGHT;
  const candelabraBase = candleBase - 0.42;

  return (
    <group>
      <mesh geometry={g.floor} material={local.parquet} position={[(x0 + x1) / 2, -0.05, 0]} receiveShadow />
      <mesh geometry={g.walls} material={local.boiserie} castShadow receiveShadow />
      <mesh geometry={g.ceiling} material={local.boiserie} position={[(x0 + x1) / 2, H + 0.15, 0]} />
      <mesh geometry={g.cornice} material={local.boiserie} castShadow />
      <mesh geometry={g.dado} material={m.gold} />
      <mesh geometry={g.frames} material={m.gold} />

      <mesh geometry={g.fireplace} material={m.tileWhite} castShadow receiveShadow />
      <mesh geometry={g.firebox} position={[FIRE_X, 0.42, z0 + 0.03]}>
        <meshStandardMaterial color="#0d0b0a" roughness={1} />
      </mesh>
      <group position={[FIRE_X, MANTEL_TOP + 0.35, z0 + 0.06]}>
        <mesh geometry={g.mirrorShape} material={m.mirror} position={[0, 0, 0.01]} />
        <mesh geometry={g.mirrorFrame} material={m.gold} />
        <mesh geometry={g.arch} material={m.gold} />
      </group>

      {/* Candélabres : la bougie de gauche est l'objet repère du raccord. */}
      {[CHATEAU_FLAME[0] + 0.17, FIRE_X * 2 - CHATEAU_FLAME[0] - 0.17].map((x) => (
        <group key={x} position={[x, candelabraBase, CHATEAU_FLAME[2]]}>
          <mesh geometry={g.candelabra} material={m.gold} castShadow />
          {[-0.17, 0, 0.17].map((dx) => (
            <Candle key={dx} position={[dx, 0.42, 0]} wax="#f6efe2" />
          ))}
        </group>
      ))}

      {/* Fenêtres : lumière du couchant, voilages et velours */}
      {WINDOWS_X.map((wx) => (
        <group key={wx}>
          <mesh geometry={g.windowGlow} material={local.sky} position={[wx, 3.0, SALON.z1 + 0.45]} rotation-y={Math.PI} />
          <SheerCurtain position={[wx, 3.0, SALON.z1 - 0.12]} width={2.1} height={5.0} rotationY={Math.PI / 2} backlight="#ffd9ab" glow={0.85} />
          <mesh geometry={g.drape} material={local.velvet} position={[wx - 1.35, 2.95, SALON.z1 - 0.2]} rotation-y={Math.PI} castShadow />
          <mesh geometry={g.drape} material={local.velvet} position={[wx + 1.35, 2.95, SALON.z1 - 0.2]} rotation-y={Math.PI} castShadow />
        </group>
      ))}

      <Chandelier geometry={chandelier} m={m} position={[FIRE_X, H - 3.6, 0]} />

      <mesh geometry={g.rugBorder} material={local.rugBorder} position={[FIRE_X, 0.004, -0.6]} receiveShadow />
      <mesh geometry={g.rug} material={local.rug} position={[FIRE_X, 0.01, -0.6]} receiveShadow />
      <Model url="/models/glam-velvet-sofa.glb" tints={SOFA_TINT} position={[FIRE_X, 0, 0.9]} rotation-y={Math.PI} scale={1.12} />
      <Model url="/models/chair-damask-purplegold.glb" position={[FIRE_X - 2.3, 0, -3.3]} rotation-y={Math.PI / 2 - 0.4} scale={1.15} />
      <Model url="/models/chair-damask-purplegold.glb" position={[FIRE_X + 2.3, 0, -3.3]} rotation-y={-Math.PI / 2 + 0.4} scale={1.15} />
      <group position={[FIRE_X + 3.2, 0, -2.4]}>
        <mesh material={m.marble} position={[0, 0.34, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.04, 40]} />
        </mesh>
        <mesh material={m.gold} position={[0, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.08, 0.32, 16]} />
        </mesh>
        <Model url="/models/diffuse-transmission-teacup.glb" position={[0.05, 0.36, 0.04]} scale={1.1} />
      </group>
      <Model url="/models/glass-vase-flowers.glb" position={[SALON.x1 - 0.6, 0.92, 0]} scale={2.6} castShadow={false} />
      <mesh material={m.marble} position={[SALON.x1 - 0.45, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.9, 1.8]} />
      </mesh>
    </group>
  );
}

const SOFA_TINT = { GlamVelvetSofa_fabric_navy: { color: "#22382c", sheenColor: "#6f8f72" } };

