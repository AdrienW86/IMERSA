/**
 * Pipeline d'optimisation des modèles glTF.
 *
 * Usage : node scripts/optimize-models.mjs <dossier-source>
 * Le dossier source doit contenir les .glb d'origine listés dans SOURCES
 * (téléchargés depuis KhronosGroup/glTF-Sample-Assets, voir ASSETS.md).
 *
 * Étapes : suppression des lumières embarquées (l'éclairage est piloté par
 * la scène), dédoublonnage, soudure, quantification, compression Meshopt,
 * textures redimensionnées à 1024 px et converties en WebP.
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRLightsPunctual, KHRMaterialsVariants } from "@gltf-transform/extensions";
import {
  dedup,
  meshopt,
  prune,
  quantize,
  resample,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

const SOURCES = {
  GlamVelvetSofa: "glam-velvet-sofa",
  SheenChair: "sheen-chair",
  ChairDamaskPurplegold: "chair-damask-purplegold",
  GlassVaseFlowers: "glass-vase-flowers",
  DiffuseTransmissionTeacup: "diffuse-transmission-teacup",
};

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("Usage : node scripts/optimize-models.mjs <dossier-source>");
  process.exit(1);
}
const outDir = path.resolve("public/models");
await fs.mkdir(outDir, { recursive: true });
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });

for (const [name, slug] of Object.entries(SOURCES)) {
  const input = path.join(srcDir, `${name}.glb`);
  const doc = await io.read(input);
  const root = doc.getRoot();

  // L'éclairage est entièrement contrôlé par le rig de l'expérience.
  for (const ext of root.listExtensionsUsed()) {
    if (ext.extensionName === KHRLightsPunctual.EXTENSION_NAME) ext.dispose();
    // Une seule variante de matériau est utilisée : on garde celle par défaut.
    if (ext.extensionName === KHRMaterialsVariants.EXTENSION_NAME) ext.dispose();
  }

  await doc.transform(
    dedup(),
    weld(),
    resample(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 82 }),
    quantize(),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );

  const output = path.join(outDir, `${slug}.glb`);
  await io.write(output, doc);
  const { size } = await fs.stat(output);
  console.log(`${slug}.glb  ${(size / 1024).toFixed(0)} Ko`);
}
