# Ressources et licences

Toutes les ressources intégrées sont utilisables commercialement. Les attributions requises (CC BY 4.0) sont
affichées sur la page `/credits` du site (source : `content/credits.ts`).

## Créations originales (aucune licence tierce)

| Ressource | Origine |
| --- | --- |
| Architectures des trois univers (villa, mas, château : murs, baies, charpente, cheminées, boiseries, escalier, lustres, paysages) et mobilier modélisé (canapé modulable, chaises, tables, suspensions, vases, livres, oliviers, verre à vin, bougie, voilages) | Modélisés par code (`scenes/`) |
| Textures PBR `public/textures/*.webp` (chêne, vieux chêne, travertin, béton ciré, pierre à joints beurrés, tomettes, lin, bouclette, marbres blanc / noir / chaud, enduit) | Générées par `scripts/generate-textures.mjs` (bruit procédural) |
| Shaders (eau, ciel, flammes et bougies, voilages rétroéclairés, rayons de lumière, poussière en suspension, œuvres abstraites) | Code original |
| Logotype et identité IMERSA | Création originale |
| Images `public/images/journey-*.webp`, `og.jpg` | Captures du rendu temps réel du site |

## Modèles 3D (`public/models`)

Source : [KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets), licences lues dans le
`metadata.json` de chaque modèle.

| Fichier | Modèle d’origine | Auteur / propriétaire | Licence |
| --- | --- | --- | --- |
| `glam-velvet-sofa.glb` | GlamVelvetSofa | Eric Chadwick — Wayfair, LLC | CC BY 4.0 |
| `sheen-chair.glb` | SheenChair | Eric Chadwick — Wayfair, LLC | CC0 1.0 |
| `chair-damask-purplegold.glb` | ChairDamaskPurplegold | Eric Chadwick — Wayfair | CC BY 4.0 |
| `glass-vase-flowers.glb` | GlassVaseFlowers | Eric Chadwick (vase), Rico Cilliers (fleurs) | CC0 1.0 |
| `diffuse-transmission-teacup.glb` | DiffuseTransmissionTeacup | Poly Haven et Eric Chadwick | CC0 1.0 |

Modèles écartés :

- *Sponza* (Crytek), distribué sous licence CRYENGINE, incompatible avec un usage commercial libre.
- *GlassHurricaneCandleHolder* : retiré, car sa texture porte le logo Khronos (marque déposée). La bougie des raccords est
  modélisée par code.
- *IridescentDishWithOlives* : essayée dans le mas, puis remplacée par une coupe en céramique modélisée (la coupelle
  irisée renvoyait un reflet saturé sous le soleil rasant).
- *SheenWoodLeatherSofa*, *SpecularSilkPouf*, *DiffuseTransmissionPlant* : retirés avec les scènes loft / penthouse ;
  la licence n'est pas en cause.

### Pipeline d’optimisation

`scripts/optimize-models.mjs` (glTF-Transform 4, Meshoptimizer, Sharp) : suppression des lumières embarquées et des
variantes de matériaux, dédoublonnage, soudure, quantification, compression **Meshopt**, textures redimensionnées à
1024 px et converties en **WebP**. Poids total : ~3 Mo.

Pour régénérer : télécharger les `.glb` d’origine (variante *glTF-Binary*) dans un dossier, puis
`npm run assets:models -- <dossier>`.

Les meubles sont recolorés dans le code (`tints`) pour s’accorder aux palettes des environnements.

## Cartes d’environnement HDR (`public/hdri`)

| Fichier | Source | Licence |
| --- | --- | --- |
| `venice_sunset_1k.hdr` | Poly Haven — « Venice Sunset » (villa) | CC0 1.0 |
| `lebombo_1k.hdr` | Poly Haven — « Lebombo » (mas, château) | CC0 1.0 |

Fichiers obtenus via le miroir [pmndrs/drei-assets](https://github.com/pmndrs/drei-assets) (copie des HDRI Poly Haven
utilisées par les préréglages de Drei). Elles servent uniquement à l’éclairage indirect et aux reflets ; elles ne sont
jamais affichées comme décor.

## Polices

Instrument Serif et Inter Tight (Google Fonts, SIL Open Font License), auto-hébergées par `next/font`.
