/**
 * Générateur de textures PBR procédurales (albedo / rugosité / normales).
 *
 * Toutes les textures d'IMERSA sont produites par ce script : elles sont
 * originales, sans licence tierce, et répétables (tileables).
 *
 * Usage : node scripts/generate-textures.mjs [taille=1024]
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SIZE = Number(process.argv[2] ?? 1024);
const OUT = path.resolve("public/textures");
await fs.mkdir(OUT, { recursive: true });

/* ------------------------------------------------------------------ */
/* Bruit tileable                                                      */
/* ------------------------------------------------------------------ */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mod = (a, p) => ((a % p) + p) % p;

/** Bruit de gradient périodique de période p (en unités de cellule). */
function perlin(x, y, p, seed = 0) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const g = (ix, iy, dx, dy) => {
    const a = hash2(mod(ix, p), mod(iy, p), seed) * Math.PI * 2;
    return Math.cos(a) * dx + Math.sin(a) * dy;
  };
  const u = fade(fx);
  const v = fade(fy);
  const n00 = g(x0, y0, fx, fy);
  const n10 = g(x0 + 1, y0, fx - 1, fy);
  const n01 = g(x0, y0 + 1, fx, fy - 1);
  const n11 = g(x0 + 1, y0 + 1, fx - 1, fy - 1);
  const nx0 = n00 + (n10 - n00) * u;
  const nx1 = n01 + (n11 - n01) * u;
  return (nx0 + (nx1 - nx0) * v) * 1.414;
}

/** fBm périodique ; (u, v) ∈ [0, 1). */
function fbm(u, v, period, octaves, seed = 0, gain = 0.5) {
  let sum = 0;
  let amp = 0.5;
  let p = period;
  for (let o = 0; o < octaves; o++) {
    sum += amp * perlin(u * p, v * p, p, seed + o * 31);
    p *= 2;
    amp *= gain;
  }
  return sum;
}

/* ------------------------------------------------------------------ */
/* Utilitaires d'image                                                 */
/* ------------------------------------------------------------------ */

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** Couleur sRGB hexadécimale → composantes linéaires. */
const hex = (h) => [1, 3, 5].map((o) => Math.pow(parseInt(h.slice(o, o + 2), 16) / 255, 2.2));

function makeMaps(size) {
  return {
    albedo: new Float32Array(size * size * 3),
    rough: new Float32Array(size * size),
    height: new Float32Array(size * size),
    emissive: null,
  };
}

function forEachPixel(size, fn) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      fn(x, y, x / size, y / size, y * size + x);
    }
  }
}

async function writeRGB(name, data, size, quality = 86) {
  const buf = Buffer.alloc(size * size * 3);
  for (let i = 0; i < data.length; i++) {
    // Albedo stocké en sRGB : on applique la courbe gamma.
    buf[i] = Math.round(Math.pow(clamp01(data[i]), 1 / 2.2) * 255);
  }
  await sharp(buf, { raw: { width: size, height: size, channels: 3 } })
    .webp({ quality })
    .toFile(path.join(OUT, `${name}.webp`));
}

async function writeLinearRGB(name, data, size, quality = 90) {
  const buf = Buffer.alloc(size * size * 3);
  for (let i = 0; i < data.length; i++) buf[i] = Math.round(clamp01(data[i]) * 255);
  await sharp(buf, { raw: { width: size, height: size, channels: 3 } })
    .webp({ quality })
    .toFile(path.join(OUT, `${name}.webp`));
}

async function writeGray(name, data, size, quality = 86) {
  // Encodé en RGB pour une compatibilité maximale des décodeurs WebP.
  const rgb = new Float32Array(size * size * 3);
  for (let i = 0; i < data.length; i++) {
    rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = data[i];
  }
  await writeLinearRGB(name, rgb, size, quality);
}

function heightToNormal(height, size, strength) {
  const out = new Float32Array(size * size * 3);
  const h = (x, y) => height[mod(y, size) * size + mod(x, size)];
  forEachPixel(size, (x, y, _u, _v, i) => {
    const dx = (h(x + 1, y) - h(x - 1, y)) * 0.5 * strength;
    const dy = (h(x, y + 1) - h(x, y - 1)) * 0.5 * strength;
    // Convention OpenGL (Y+), lignes d'image orientées vers le bas.
    let nx = -dx;
    let ny = dy;
    let nz = 1;
    const l = Math.hypot(nx, ny, nz);
    nx /= l;
    ny /= l;
    nz /= l;
    out[i * 3] = nx * 0.5 + 0.5;
    out[i * 3 + 1] = ny * 0.5 + 0.5;
    out[i * 3 + 2] = nz * 0.5 + 0.5;
  });
  return out;
}

async function save(name, maps, size, normalStrength) {
  await writeRGB(`${name}_albedo`, maps.albedo, size);
  await writeGray(`${name}_rough`, maps.rough, size);
  await writeLinearRGB(`${name}_normal`, heightToNormal(maps.height, size, normalStrength), size);
  if (maps.emissive) await writeRGB(`${name}_emissive`, maps.emissive, size);
  console.log(`✓ ${name}`);
}

/* ------------------------------------------------------------------ */
/* Matériaux                                                           */
/* ------------------------------------------------------------------ */

/** Parquet de chêne clair, lames larges à joints décalés. */
function oak(size) {
  const m = makeMaps(size);
  const rows = 6;
  const rnd = mulberry32(7);
  const rowOffsets = Array.from({ length: rows }, () => rnd());
  const rowSplits = Array.from({ length: rows }, () => 0.35 + rnd() * 0.3);
  const plankTone = Array.from({ length: rows * 3 }, () => rnd());
  const light = hex("#c09466");
  const dark = hex("#7b5233");
  forEachPixel(size, (_x, _y, u, v, i) => {
    const row = Math.floor(v * rows);
    const rv = v * rows - row;
    const uu = mod(u + rowOffsets[row], 1);
    const seg = uu < rowSplits[row] ? 0 : 1;
    const segStart = seg === 0 ? 0 : rowSplits[row];
    const segLen = seg === 0 ? rowSplits[row] : 1 - rowSplits[row];
    const su = (uu - segStart) / segLen;
    const id = row * 3 + seg;
    const tone = plankTone[id];
    // Veinage : bandes déformées étirées le long de la lame.
    const warp = fbm(uu * 0.5, v, 2, 4, 11 + id);
    const lines = Math.sin((rv * 22 + warp * 2.2 + tone * 13) * Math.PI * 2) * 0.5 + 0.5;
    const rings = Math.pow(lines, 3);
    const grain = fbm(uu * 0.5, v * 2, 32, 4, 3 + id) * 0.5 + 0.5;
    const fine = fbm(u, v * 4, 256, 1, 5) * 0.5 + 0.5;
    let t = 0.55 - 0.3 * rings + (grain - 0.5) * 0.35 + (tone - 0.5) * 0.4 + (fine - 0.5) * 0.15;
    t = clamp01(t);
    const c = mix3(dark, light, t);
    // Joints entre lames.
    const edgeV = Math.min(rv, 1 - rv) * rows * size;
    const edgeU = Math.min(su * segLen, (1 - su) * segLen) * size;
    const gap = smooth(0.4, 1.6, Math.min(edgeV / rows, edgeU));
    const k = lerp(0.35, 1, gap);
    m.albedo[i * 3] = c[0] * k;
    m.albedo[i * 3 + 1] = c[1] * k;
    m.albedo[i * 3 + 2] = c[2] * k;
    m.rough[i] = clamp01(0.42 + (1 - t) * 0.18 + (1 - gap) * 0.4);
    m.height[i] = gap * 0.25 - rings * 0.004 + fine * 0.004;
  });
  return m;
}

/** Travertin beige à strates horizontales et alvéoles. */
function travertine(size) {
  const m = makeMaps(size);
  const base = hex("#d8c9b0");
  const warm = hex("#c2ab88");
  const pale = hex("#ebe1cf");
  forEachPixel(size, (_x, _y, u, v, i) => {
    const strata = fbm(u * 0.5, v * 6, 2, 5, 21) ;
    const band = Math.sin((v * 8 + strata * 3.5) * Math.PI) * 0.5 + 0.5;
    const cloud = fbm(u, v, 3, 5, 22) * 0.5 + 0.5;
    let c = mix3(warm, base, clamp01(band * 0.45 + cloud * 0.55));
    c = mix3(c, pale, smooth(0.55, 0.8, cloud) * 0.6);
    // Alvéoles allongées typiques du travertin.
    const pits = fbm(u * 0.35, v * 3, 24, 3, 23);
    const pit = smooth(0.22, 0.34, pits);
    c = mix3(c, mix3(c, warm, 0.6), pit * 0.8);
    m.albedo.set([c[0] * (1 - pit * 0.25), c[1] * (1 - pit * 0.25), c[2] * (1 - pit * 0.25)], i * 3);
    m.rough[i] = clamp01(0.55 + pit * 0.35 + (1 - band) * 0.08);
    m.height[i] = -pit * 0.12 + cloud * 0.004;
  });
  return m;
}

/** Béton ciré lissé à la taloche. */
function concrete(size) {
  const m = makeMaps(size);
  const a = hex("#b3aea6");
  const b = hex("#8f8a83");
  forEachPixel(size, (_x, _y, u, v, i) => {
    const cloud = fbm(u, v, 2, 6, 31) * 0.5 + 0.5;
    const trowel = fbm(u + fbm(u, v, 3, 2, 34) * 0.15, v, 6, 3, 32);
    const swirl = Math.sin((trowel * 4 + u * 3) * Math.PI) * 0.5 + 0.5;
    const speck = fbm(u, v, 200, 1, 33);
    let t = clamp01(cloud * 0.8 + swirl * 0.12 + speck * 0.08);
    const c = mix3(b, a, t);
    m.albedo.set(c, i * 3);
    m.rough[i] = clamp01(0.32 + (1 - swirl) * 0.18 + (1 - cloud) * 0.15);
    m.height[i] = swirl * 0.002 + speck * 0.0008;
  });
  return m;
}

/** Marbre à veines (domain warping). */
function marble(size, { base, vein, veinStrength, seed, scale = 2 }) {
  const m = makeMaps(size);
  const b = hex(base);
  const vcol = hex(vein);
  forEachPixel(size, (_x, _y, u, v, i) => {
    const wx = fbm(u, v, scale, 5, seed) * 1.6;
    const wy = fbm(u, v, scale, 5, seed + 7) * 1.6;
    const q = fbm(mod(u + wx * 0.25, 1), mod(v + wy * 0.25, 1), scale, 6, seed + 13);
    const veins = Math.pow(1 - Math.abs(Math.sin((u + v + q * 1.4) * Math.PI * 2)), 7);
    const thin = Math.pow(1 - Math.abs(Math.sin((u * 2 - v + q * 2.4) * Math.PI * 3)), 36);
    const cloud = fbm(u, v, scale * 2, 4, seed + 17) * 0.5 + 0.5;
    const t = clamp01(veins * veinStrength * 0.55 + thin * veinStrength * 0.8);
    let c = mix3(b, mix3(b, vcol, 0.35), cloud * 0.5);
    c = mix3(c, vcol, t);
    m.albedo.set(c, i * 3);
    m.rough[i] = clamp01(0.1 + t * 0.08 + cloud * 0.05);
    m.height[i] = t * 0.01;
  });
  return m;
}

/** Enduit à la chaux, très légèrement nuagé. */
function plaster(size) {
  const m = makeMaps(size);
  const a = hex("#efebe4");
  const b = hex("#ddd6cb");
  forEachPixel(size, (_x, _y, u, v, i) => {
    const cloud = fbm(u, v, 2, 6, 51) * 0.5 + 0.5;
    const trowel = fbm(u, v, 12, 3, 52) * 0.5 + 0.5;
    const c = mix3(b, a, clamp01(cloud * 0.7 + trowel * 0.3));
    m.albedo.set(c, i * 3);
    m.rough[i] = clamp01(0.78 + trowel * 0.15);
    m.height[i] = trowel * 0.004 + fbm(u, v, 96, 2, 53) * 0.0015;
  });
  return m;
}

/** Voronoï périodique : distance aux deux germes les plus proches. */
function voronoi(u, v, cells, seed, stretch = 1) {
  const x = u * cells;
  const y = v * cells;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  let d1 = 1e9;
  let d2 = 1e9;
  let id = 0;
  for (let j = -2; j <= 2; j++) {
    for (let i = -2; i <= 2; i++) {
      const gx = cx + i;
      const gy = cy + j;
      const wx = mod(gx, cells);
      const wy = mod(gy, cells);
      const px = gx + 0.15 + 0.7 * hash2(wx, wy, seed);
      const py = gy + 0.15 + 0.7 * hash2(wx, wy, seed + 17);
      const dx = (px - x) * stretch;
      const dy = py - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = wy * cells + wx;
      } else if (d < d2) d2 = d;
    }
  }
  return { edge: d2 - d1, id };
}

/** Mur de pierre provençal : moellons irréguliers, joints à la chaux. */
function stone(size) {
  const m = makeMaps(size);
  const tones = ["#c4a983", "#a98d6b", "#d3bf9b", "#9a8166", "#bba07a", "#8f7c66", "#cdb895", "#b39472"].map(hex);
  const mortar = hex("#cfc3ad");
  forEachPixel(size, (_x, _y, u, v, i) => {
    const w = fbm(u, v, 4, 3, 101) * 0.05;
    const { edge, id } = voronoi(mod(u + w, 1), mod(v + w * 0.7, 1), 8, 102, 0.42);
    const tone = tones[id % tones.length];
    const n = fbm(u, v, 16, 5, 103) * 0.5 + 0.5;
    const pits = smooth(0.62, 0.75, fbm(u, v, 48, 2, 104) * 0.5 + 0.5);
    const face = smooth(0.02, 0.09, edge + (n - 0.5) * 0.04);
    const bulge = smooth(0.0, 0.35, edge);
    const grainy = fbm(u, v, 96, 2, 107) * 0.5 + 0.5;
    let c = mix3(tone, mix3(tone, [0.05, 0.04, 0.03], 0.45), (1 - n) * 0.55 + pits * 0.3 + (1 - grainy) * 0.15);
    c = mix3(c, mix3(c, [1, 0.97, 0.9], 0.3), bulge * 0.25);
    const lichen = smooth(0.7, 0.85, fbm(u, v, 6, 3, 105) * 0.5 + 0.5) * 0.25;
    c = mix3(c, hex("#8a8a64"), lichen);
    const mort = mix3(mortar, mix3(mortar, [0.12, 0.1, 0.08], 0.75), fbm(u, v, 64, 2, 106) * 0.4 + 0.45);
    const ao = smooth(0.0, 0.2, edge);
    const col = mix3(mort, c, face);
    const shade = 0.72 + 0.28 * ao;
    m.albedo.set([col[0] * shade, col[1] * shade, col[2] * shade], i * 3);
    m.rough[i] = clamp01(0.88 + (1 - face) * 0.08);
    m.height[i] = face * 0.5 + bulge * 0.45 + n * 0.1 - pits * 0.06;
  });
  return m;
}

/** Tomettes carrées en terre cuite, patinées. */
function terracotta(size) {
  const m = makeMaps(size);
  const n = 4;
  const rnd = mulberry32(201);
  const tones = Array.from({ length: n * n }, () => rnd());
  const light = hex("#c98a5e");
  const dark = hex("#8f4a2e");
  forEachPixel(size, (_x, _y, u, v, i) => {
    const cx = Math.floor(u * n);
    const cy = Math.floor(v * n);
    const lx = u * n - cx;
    const ly = v * n - cy;
    const t = tones[cy * n + cx];
    const chip = fbm(u, v, 32, 3, 202) * 0.06;
    const edge = Math.min(lx, 1 - lx, ly, 1 - ly) + chip;
    const tile = smooth(0.012, 0.035, edge);
    const cloud = fbm(u, v, 8, 5, 203) * 0.5 + 0.5;
    const wear = smooth(0.55, 0.8, fbm(u, v, 3, 4, 204) * 0.5 + 0.5);
    let c = mix3(dark, light, clamp01(t * 0.7 + cloud * 0.4 - 0.1));
    c = mix3(c, hex("#d9b48e"), wear * 0.35);
    const grout = hex("#7a6a58");
    m.albedo.set(mix3(grout, c, tile), i * 3);
    m.rough[i] = clamp01(0.55 + (1 - wear) * 0.25 + (1 - tile) * 0.2 - cloud * 0.1);
    m.height[i] = tile * 0.3 + cloud * 0.01;
  });
  return m;
}

/** Vieux chêne de charpente : fil marqué, fentes de séchage. */
function oldwood(size) {
  const m = makeMaps(size);
  const light = hex("#6b4a33");
  const dark = hex("#2e1f16");
  forEachPixel(size, (_x, _y, u, v, i) => {
    const warp = fbm(u, v, 1, 3, 301) * 0.5 + fbm(u, v, 2, 2, 305) * 0.15;
    const grain = Math.pow(Math.sin((v * 34 + warp * 4) * Math.PI) * 0.5 + 0.5, 2);
    const fine = fbm(u * 0.1, v * 8, 128, 3, 302) * 0.5 + 0.5;
    const crack = smooth(0.985, 1, Math.sin((v * 7 + fbm(u, v, 3, 3, 303) * 2) * Math.PI * 2) * 0.5 + 0.5)
      * smooth(0.45, 0.6, fbm(u, v, 2, 2, 304) * 0.5 + 0.5);
    const t = clamp01(0.35 + grain * 0.3 + (fine - 0.5) * 0.4);
    const c = mix3(dark, light, t);
    const k = 1 - crack * 0.85;
    m.albedo.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
    m.rough[i] = clamp01(0.8 + (1 - t) * 0.12);
    m.height[i] = grain * 0.02 + fine * 0.02 - crack * 0.4;
  });
  return m;
}

/** Toile de lin : trame fine, irrégularités de fil. */
function linen(size) {
  const m = makeMaps(size);
  const base = hex("#e8dfd1");
  forEachPixel(size, (x, y, u, v, i) => {
    const warp = Math.sin((x / size) * Math.PI * 2 * 160 + fbm(u, v, 8, 2, 401) * 2) * 0.5 + 0.5;
    const weft = Math.sin((y / size) * Math.PI * 2 * 160 + fbm(u, v, 8, 2, 402) * 2) * 0.5 + 0.5;
    const slub = fbm(u * 0.05, v, 64, 2, 403) * 0.5 + 0.5;
    const weave = (x + y) % 2 ? warp : weft;
    const c = mix3(base, hex("#cfc3b0"), slub * 0.5 + (1 - weave) * 0.15);
    m.albedo.set(c, i * 3);
    m.rough[i] = 0.92;
    m.height[i] = weave * 0.08 + slub * 0.03;
  });
  return m;
}

/** Bouclette (bouclé) : boucles de laine serrées. */
function boucle(size) {
  const m = makeMaps(size);
  const base = hex("#efe7da");
  forEachPixel(size, (_x, _y, u, v, i) => {
    const { edge } = voronoi(u, v, 90, 501);
    const loops = smooth(0.0, 0.35, edge);
    const tone = fbm(u, v, 8, 3, 502) * 0.5 + 0.5;
    const c = mix3(hex("#d6cab8"), base, loops * 0.7 + tone * 0.3);
    m.albedo.set(c, i * 3);
    m.rough[i] = 0.95;
    m.height[i] = loops * 0.25;
  });
  return m;
}

const jobs = [
  ["oak", () => oak(SIZE), 6],
  ["travertine", () => travertine(SIZE), 14],
  ["concrete", () => concrete(SIZE), 30],
  ["stone", () => stone(SIZE), 8],
  ["terracotta", () => terracotta(SIZE), 6],
  ["oldwood", () => oldwood(SIZE), 6],
  ["linen", () => linen(SIZE), 3],
  ["boucle", () => boucle(SIZE), 6],
  [
    "marble-white",
    () => marble(SIZE, { base: "#eeebe6", vein: "#7d7a78", veinStrength: 0.85, seed: 71 }),
    1,
  ],
  [
    "marble-black",
    () => marble(SIZE, { base: "#111112", vein: "#d8d2c8", veinStrength: 0.9, seed: 81, scale: 3 }),
    1,
  ],
  [
    "marble-warm",
    () => marble(SIZE, { base: "#e6dccd", vein: "#a88c6a", veinStrength: 0.7, seed: 91 }),
    1,
  ],
  ["plaster", () => plaster(SIZE), 30],
];

const only = process.argv[3];
for (const [name, fn, normalStrength] of jobs) {
  if (only && only !== name) continue;
  const res = SIZE;
  await save(name, fn(), res, normalStrength);
}
