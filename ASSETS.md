# Ressources et licences

Toutes les ressources intégrées sont utilisables commercialement. Les attributions requises (CC BY 4.0) sont
affichées sur la page `/credits` du site (source : `content/credits.ts`).

## Créations originales (aucune licence tierce)

| Ressource | Origine |
| --- | --- |
| Architectures des cinq environnements (murs, baies, voûte, escaliers, moulures, colonnes, lustres, ville, paysage) | Modélisées par code (`scenes/`) |
| Textures PBR `public/textures/*.webp` (chêne, travertin, béton ciré, brique, marbres blanc / noir / chaud, enduit, façade) | Générées par `scripts/generate-textures.mjs` (bruit procédural) |
| Shaders (eau, ciel, flammes, rayons de lumière, ville, rues, nuage de points, œuvres abstraites) | Code original |
| Logotype et identité IMERSA | Création originale |
| Images `public/images/journey-*.webp`, `og.jpg` | Captures du rendu temps réel du site |

## Modèles 3D (`public/models`)

Source : [KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets), licences lues dans le
`metadata.json` de chaque modèle.

| Fichier | Modèle d’origine | Auteur / propriétaire | Licence |
| --- | --- | --- | --- |
| `glam-velvet-sofa.glb` | GlamVelvetSofa | Eric Chadwick — Wayfair, LLC | CC BY 4.0 |
| `sheen-chair.glb` | SheenChair | Eric Chadwick — Wayfair, LLC | CC0 1.0 |
| `sheen-wood-leather-sofa.glb` | SheenWoodLeatherSofa | Fran Calvente (modèle, CC0) ; Eric Chadwick — Darmstadt Graphics Group (améliorations, CC BY 4.0) | CC BY 4.0 / CC0 1.0 |
| `chair-damask-purplegold.glb` | ChairDamaskPurplegold | Eric Chadwick — Wayfair | CC BY 4.0 |
| `specular-silk-pouf.glb` | SpecularSilkPouf | Eric Chadwick — Wayfair, LLC | CC BY 4.0 |
| `glass-vase-flowers.glb` | GlassVaseFlowers | Eric Chadwick (vase), Rico Cilliers (fleurs) | CC0 1.0 |
| `diffuse-transmission-plant.glb` | DiffuseTransmissionPlant | Rico Cilliers (modèle, CC0) ; Eric Chadwick — Darmstadt Graphics Group (matériaux, CC BY 4.0) | CC BY 4.0 / CC0 1.0 |
| `glass-hurricane-candle-holder.glb` | GlassHurricaneCandleHolder | Eric Chadwick — Wayfair, LLC | CC BY 4.0 |

Modèle écarté : *Sponza* (Crytek), distribué sous licence CRYENGINE, incompatible avec un usage commercial libre.

### Pipeline d’optimisation

`scripts/optimize-models.mjs` (glTF-Transform 4, Meshoptimizer, Sharp) : suppression des lumières embarquées et des
variantes de matériaux, dédoublonnage, soudure, quantification, compression **Meshopt**, textures redimensionnées à
1024 px et converties en **WebP**. Poids total : ~5,8 Mo (contre ~42 Mo pour les fichiers d’origine).

Pour régénérer : télécharger les `.glb` d’origine (variante *glTF-Binary*) dans un dossier, puis
`npm run assets:models -- <dossier>`.

Les meubles sont recolorés dans le code (`tints`) pour s’accorder aux palettes des environnements.

## Cartes d’environnement HDR (`public/hdri`)

| Fichier | Source | Licence |
| --- | --- | --- |
| `venice_sunset_1k.hdr` | Poly Haven — « Venice Sunset » | CC0 1.0 |
| `potsdamer_platz_1k.hdr` | Poly Haven — « Potsdamer Platz » | CC0 1.0 |
| `empty_warehouse_01_1k.hdr` | Poly Haven — « Empty Warehouse 01 » | CC0 1.0 |

Fichiers obtenus via le miroir [pmndrs/drei-assets](https://github.com/pmndrs/drei-assets) (copie des HDRI Poly Haven
utilisées par les préréglages de Drei). Elles servent uniquement à l’éclairage indirect et aux reflets ; elles ne sont
jamais affichées comme décor.

## Polices

Instrument Serif et Inter Tight (Google Fonts, SIL Open Font License), auto-hébergées par `next/font`.
