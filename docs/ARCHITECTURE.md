# Architecture de l’expérience immersive

Ce document décrit le fonctionnement du moteur de la page d’accueil : comment le scroll pilote la caméra, comment les
environnements sont chargés, affichés et libérés, et comment les raccords sur objet relient les lieux.

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

## Transitions : raccords sur objet (`scenes/anchors.ts`)

Les trois frontières sont des **raccords dans l'axe** (« match cut ») sur un objet repère présent dans les deux lieux
(verre, bougie, voilage). La direction artistique de ces raccords est décrite dans
[DIRECTION_ARTISTIQUE.md](./DIRECTION_ARTISTIQUE.md).

- **Même cadre de part et d'autre.** `matchCuts` définit, pour chaque raccord, la position de la caméra relative à
  l'objet (`offset`) et la focale (`fov`). `cutCamera()` et `cutTarget()` en déduisent le dernier point de passage de
  la scène A et le premier de la scène B. Comme ils désignent le même point physique, `resolveScenes()` place l'origine
  de B de façon à superposer les deux objets jumeaux dans l'espace monde.
- **Temps d'arrêt.** Ces deux points de passage sont marqués `still` : la tangente de la spline y est nulle. La caméra
  ralentit jusqu'à l'arrêt sur l'objet, puis repart. La coupe a lieu à vitesse nulle, donc sans saut visible.
- **Coupe franche.** La transition est de type `match`, avec une demi-largeur de 0,012 et sans voile
  (`veilPeak: 0`). La visibilité des scènes bascule à l'image exacte du seuil.
- **Mise au point macro.** `focusAt()` (`lib/journey.ts`) renvoie le point de mise au point et un facteur « macro »
  qui croît à l'approche d'un raccord. `Effects` règle alors la profondeur de champ chaque image : distance focale =
  distance à l'objet, plage de netteté réduite à 12 cm et bokeh multiplié. Le décor se fond dans le flou : à la coupe,
  seules la couleur et la lumière de l'arrière-plan changent.
- **Éclairage.** Le rig interpole soleil, ambiance et lumières d'appoint entre les deux réglages. Au moment de la
  coupe, ce sont la lumière de la flamme ou le contre-jour du voilage qui assurent la continuité.

| Raccord | Objet (A → B) | Cadrage à la coupe |
| ------- | ------------- | ------------------ |
| Villa → Mas | verre de rosé, table basse → table de ferme | 21 cm de côté, focale 30° |
| Mas → Château | bougie du manteau → bougie du candélabre | 13 cm de face, focale 28° |
| Château → Villa (final) | voilage de la grande baie → voilage de lin de la terrasse | 32 cm, focale 40° |

Les sauts volontaires (rail de chapitres, « Passer l'introduction ») utilisent toujours le voile opaque décrit
plus haut ; `veilAt` reste synchronisé sur la progression de la caméra.

### Stabilité de l'image (écran noir)

Une seule valeur non finie (NaN ou infini) dans le tampon de couleur suffit à noircir toute l'image, car la
profondeur de champ et le bloom la diffusent. Précautions en place :

- `DustMotes` remplace les `Sparkles` de Drei, dont le fragment shader divise par la distance au centre du point ;
- la sonde de réflexion utilise une cible 8 bits sRGB, et les verres à transmission sont masqués pendant sa capture ;
- le verre repère n'utilise pas de transmission physique ;
- la mise au point lissée est réinitialisée si elle devient non finie.

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
| Post-traitement         | oui, MSAA ×4 | oui, MSAA ×2 | non (tonemapping natif) |
| Profondeur de champ     | complète  | ×0,8      | non            |
| Sonde de réflexion      | 384 px    | 256 px    | 128 px         |
| Rayons volumétriques    | oui       | oui       | non            |
| Poussière en suspension | 260       | 140       | 60             |

Le niveau initial est déduit de l’appareil (pointeur, taille d’écran, cœurs, mémoire, GPU). Ensuite,
`PerformanceMonitor` (Drei) réduit d’abord la résolution, puis le niveau de qualité si les FPS chutent.
Le rendu est suspendu (`frameloop="never"`) lorsque l’expérience sort de l’écran.

## Scènes

| Séquence  | Contenu principal                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Villa     | Séjour ouvert sur la mer au couchant : sol en travertin, baie acier avec porte-fenêtre ouverte et voilage de lin, monolithe en travertin avec foyer, canapé modulable en bouclette, table basse (bol, livres, verre de rosé), table de repas en chêne sous suspensions céramique, oliviers, terrasse et piscine à débordement, mer et promontoires. |
| Mas       | Salle commune d'un mas provençal : murs en moellons à joints beurrés, charpente en vieux chêne, tomettes, fenêtre à volets ouverte sur les cyprès et la lavande, cheminée de pierre (feu, bougie sur le manteau), table de ferme (verre, bouteille, coupe en céramique, pichet), chaises paillées, fauteuils. |
| Château   | Grand salon à boiseries ivoire et or, cheminée de marbre, miroir doré cintré, candélabres, lustre, croisées avec voilages et velours, canapé de velours, fauteuils damassés ; puis la galerie voûtée et l'escalier d'honneur jusqu'à la grande baie voilée. Sonde de réflexion pour la dorure et les miroirs. |
| Final     | Retour à la villa par le voilage, recul sur la terrasse au couchant et appel à l'action IMERSA. |

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
