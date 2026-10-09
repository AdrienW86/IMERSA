# Architecture de l’expérience immersive

Ce document décrit le fonctionnement du moteur de la page d’accueil : comment le scroll pilote la caméra, comment les
environnements sont chargés, affichés et libérés, et comment les transitions masquent les changements techniques.

## Vue d’ensemble

```
            scroll (GSAP ScrollTrigger)
                     │  target ∈ [0, 1]
                     ▼
┌──────────────────────────────────────────────┐
│ experienceStore (Zustand, hors rendu React)   │
│ target · progress · sceneIndex · ready · jump │
└──────────────────────────────────────────────┘
       ▲ progress (lissée)          │ abonnements directs (sans re-render)
       │                            ▼
 CameraRig (useFrame)        Overlay narratif (timeline GSAP), voiles, rail
       │
       ▼
 LightingRig · EnvironmentManager · SceneDirector · Effects   (lisent `progress`)
```

Une **seule source de vérité** : la progression effective (`progress`) est calculée par le `CameraRig` à chaque image,
puis lue par tous les autres systèmes (texte, voiles, éclairage, visibilité des scènes). Aucun autre système ne déplace
la caméra ; le texte ne peut donc pas se désynchroniser de l’image.

## Parcours et trajectoire (`scenes/config.ts`, `lib/journey.ts`)

- Chaque séquence déclare un **poids** (sa part de la longueur de scroll), des **points de passage caméra**
  (position, cible, champ de vision, en coordonnées locales), un **éclairage** et une **transition de sortie**.
- Le dernier point de passage d’une séquence et le premier de la suivante désignent le même lieu physique : le
  **seuil**. `resolveScenes()` en déduit l’origine monde de chaque séquence, si bien que la trajectoire globale est
  continue dans l’espace.
- La trajectoire est une **spline d’Hermite paramétrée par le temps** (tangentes de Catmull-Rom non uniformes) pour la
  position, la cible et le champ de vision : la vitesse est continue au passage de chaque point, même lorsque les
  points sont inégalement espacés. Vitesse nulle au départ et à l’arrivée.
- La caméra est orientée par `lookAt` avec un vecteur haut fixe : pas de roulis, horizon toujours stable.

## Contrôleur de caméra (`components/3d/CameraRig.tsx`)

1. Lit `target` (scroll) et calcule `progress` par **amortissement exponentiel** (`MathUtils.damp`) avec une
   **vitesse plafonnée** : un scroll brutal produit un travelling rapide mais jamais une téléportation.
2. **Verrou de chargement** : la caméra ne franchit pas un seuil tant que l’environnement de l’autre côté n’est pas
   prêt (modèles chargés, textures téléversées, shaders compilés). Un message discret s’affiche le cas échéant.
3. **Raccords volontaires** (rail de chapitres, « Passer l’introduction », `?p=`) : un voile opaque se ferme, la
   progression est fixée directement, puis le voile s’ouvre — le seul cas de saut, toujours masqué.
4. **Mouvements réduits** : la progression est quantifiée sur les points d’arrêt déclarés (`stop: true`), avec des
   fondus courts au lieu de déplacements continus.
5. Cadrage : en format portrait, le champ de vision vertical est élargi pour conserver la largeur de l’architecture.
6. Micro-interactions : très légère respiration de la visée et parallaxe au pointeur (bureau uniquement, désactivées
   en mouvements réduits).

## Environnements (`components/3d/SceneDirector.tsx`)

- Chaque environnement est un **module chargé à la demande** (`React.lazy`) : le code, les modèles et les textures de
  la villa sont seuls téléchargés à l’arrivée.
- Fenêtre de montage : une séquence est montée un peu avant d’être atteinte (`MOUNT_AHEAD`) et démontée peu après
  avoir été quittée (`KEEP_BEHIND`). Les assets de la séquence suivante sont préchargés plus tôt encore
  (`PRELOAD_AHEAD`, téléchargement et décodage sans montage).
- `ReadySignal` téléverse les textures (`initTexture`) et compile les shaders (`compileAsync`) **avant** l’affichage,
  pendant que la séquence est encore invisible : pas d’à-coup au franchissement du seuil.
- La visibilité est basculée dans `useFrame`, à l’image exacte où la caméra franchit le seuil.
- **Libération mémoire** : `lib/assets.ts` compte les références de chaque asset par séquence montée. Quand plus
  aucune séquence ne l’utilise (après un délai de 4 s), géométries, matériaux et textures sont libérés du GPU et
  retirés des caches. Les cartes d’environnement HDR non utilisées sont aussi libérées.
- Une erreur de chargement bascule proprement vers le parcours alternatif (frontières d’erreur React).

## Éclairage (`components/3d/LightingRig.tsx`)

Le rig est **commun à toutes les séquences** : un soleil directionnel (ombres), une lumière hémisphérique et deux
lumières ponctuelles d’appoint. Leur nombre ne change jamais, donc **aucun shader n’est recompilé** pendant une
transition ; seuls les paramètres sont interpolés (couleurs, intensités, brouillard, intensité de l’environnement,
halo). La caméra d’ombre suit la zone regardée, alignée sur la grille de texels pour éviter le scintillement.

## Transitions

Chaque frontière déclare un type (`threshold`, `light`, `dissolve`), une demi-largeur et un voile :

| Frontière             | Principe                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Villa → Loft          | Couloir sombre en chêne fumé, reproduit à l’identique des deux côtés du seuil (raccord architectural), changement progressif de lumière (lumière méditerranéenne → fin d’après-midi industrielle). |
| Loft → Penthouse      | La caméra gravit l’escalier hélicoïdal jusqu’à la mezzanine et emprunte un passage sombre : sensation d’élévation. |
| Penthouse → Château   | La caméra sort sur la terrasse face au couchant ; la lumière envahit l’image (voile lumineux) puis se dissipe dans le vestibule du château. |
| Château → Révélation  | Au sommet de l’escalier d’honneur, face à la grande baie, l’image se dissout dans le noir et réapparaît à l’intérieur du jumeau numérique de la villa. |

Le voile DOM est calculé à partir de la même progression que la caméra (`veilAt`) : il est parfaitement synchronisé.

## Texte narratif (`animations/narrativeTimeline.ts`)

Une **timeline GSAP de durée 1** est construite une fois ; chaque bloc y est placé à sa progression globale. La
timeline n’est jamais jouée : elle est **positionnée** (`timeline.progress(progress)`) à chaque mise à jour de la
progression de la caméra. Elle est donc réversible par construction. Les titres sont découpés mot à mot (SplitText,
masques) pour des révélations typographiques ; les blocs cachés sont en `visibility: hidden` (non focalisables).

## Qualité adaptative (`lib/quality.ts`)

| Réglage                 | Haute     | Moyenne   | Basse (mobile) |
| ----------------------- | --------- | --------- | -------------- |
| DPR maximal             | 1,75      | 1,35      | 1,2            |
| Ombres                  | 2048 px   | 1024 px   | non            |
| Post-traitement (bloom) | oui, MSAA ×4 | oui, MSAA ×2 | non (tonemapping natif) |
| Verre à transmission    | oui       | non       | non            |
| Rayons volumétriques    | oui       | oui       | non            |
| Ville (tours)           | 1 400     | 900       | 500            |
| Nuage de points         | 60 000    | 32 000    | 16 000         |

Le niveau initial est déduit de l’appareil (pointeur, taille d’écran, cœurs, mémoire, GPU). Ensuite,
`PerformanceMonitor` (Drei) réduit d’abord la résolution, puis le niveau de qualité si les FPS chutent.
Le rendu est suspendu (`frameloop="never"`) lorsque l’expérience sort de l’écran.

## Scènes

| Séquence  | Contenu principal                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Villa     | Séjour de 14 × 19 m, baie panoramique acier, plafond en lames de chêne instanciées, monolithe en travertin avec foyer animé, cuisine, terrasse et piscine à débordement (eau animée), mer, promontoires procéduraux. |
| Loft      | Double hauteur de 9 m, verrière acier sur toute la façade, brique, poutres, mezzanine vitrée avec bibliothèque, escalier hélicoïdal en chêne et acier, rayons de soleil volumétriques, poussières, ville au couchant. |
| Penthouse | Angle entièrement vitré à 120 m de hauteur, sol en marbre poli, corniche lumineuse, lampadaire en arc, sculpture, terrasse, ville nocturne (tours instanciées + trame de rues éclairées). |
| Château   | Galerie de 64 m voûtée en berceau (15,7 m), baies cintrées et miroirs, pilastres et chapiteaux dorés, corniches extrudées, arcs doubleaux, damier de marbre instancié, sept lustres à pampilles, escalier d’honneur impérial avec balustres tournés, colonnes, grande baie et rayons volumétriques, sonde de réflexion. |
| Révélation| La villa du début, en maquette « coupe » : un balayage transforme son relevé (nuage de points échantillonné sur les surfaces) en espace 3D, puis la caméra s’éloigne. |

## Pistes pour aller vers le photoréalisme

- Lightmaps / occlusion ambiante précalculées (Blender, bake) pour chaque environnement.
- Modèles architecturaux et textures scannées sous licence commerciale (KTX2/Basis pour la mémoire GPU).
- Réflexions planaires sélectives (sol du château) sur le niveau haute qualité.
- À terme : rendu des reconstructions réelles (Gaussian splatting / maillages photogrammétriques) dans le même moteur.

## Évolutions prévues (non développées)

La structure accueille sans refonte les futurs modules :

- `app/(auth)/…` et `lib/supabase/` : authentification Supabase (SSR, middleware de session).
- `app/(dashboard)/…` : tableau de bord des agences, gestion des biens, abonnements.
- `app/(editor)/…` : éditeur de visites ; il réutilisera `components/3d` (rig de caméra, qualité, chargement).
- `scenes/` deviendra le lecteur de visites générées à partir des reconstructions.

La page d’accueil reste un ensemble de composants serveur (sections, pages éditoriales) ; seule l’expérience 3D et ses
interfaces superposées sont des composants client.
