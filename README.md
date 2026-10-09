# IMERSA

**L’immobilier prend une nouvelle dimension.**

IMERSA est une future plateforme SaaS de reconstruction 3D destinée aux agences immobilières, réseaux, promoteurs et
professionnels du prestige : elle transformera les captures de logements en environnements tridimensionnels navigables et
partageables.

Ce dépôt contient la **première étape** du projet : la page d’accueil immersive, un voyage architectural en 3D temps
réel piloté par le scroll :

> Villa sur la mer → Mas provençal → Château → retour à la villa (IMERSA)

Trois univers, reliés par trois **raccords cinématographiques sur objet** : la caméra s'approche d'un objet jusqu'à ce
qu'il remplisse le cadre, la scène change à l'image près, puis la caméra recule sur l'objet jumeau dans un autre lieu.

| Raccord | De → vers |
| --- | --- |
| Le verre | verre de rosé de la villa → même verre sur la table de ferme du mas |
| La flamme | bougie du mas → bougie du candélabre du château |
| Le voilage | voilage de la grande baie du château → voilage de lin de la villa |

Chaque environnement est une vraie scène WebGL (géométries, matériaux PBR, lumières, ombres) traversée par une caméra
dont la trajectoire est commandée par le défilement — pas de vidéo, pas d’image fixe, pas de parallaxe simulée.
L'analyse des moodboards, la direction artistique et la liste des objets repères sont décrites dans
[docs/DIRECTION_ARTISTIQUE.md](./docs/DIRECTION_ARTISTIQUE.md).

---

## Démarrage

Prérequis : **Node.js ≥ 20.9** (développé avec Node 22) et npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Commande                  | Rôle                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| `npm run dev`             | Serveur de développement (Turbopack)                                  |
| `npm run build`           | Build de production (inclut la vérification TypeScript)               |
| `npm run start`           | Sert le build de production                                           |
| `npm run lint`            | ESLint (configuration Next.js + règles React Hooks)                   |
| `npm run typecheck`       | TypeScript strict, sans émission                                      |
| `npm run check`           | Typecheck + lint + build                                              |
| `npm run assets:textures` | Régénère les textures PBR procédurales (`public/textures`)            |
| `npm run assets:models`   | Réoptimise les modèles glTF sources (voir [ASSETS.md](./ASSETS.md))   |

### Variables d’environnement

Copier `.env.example` vers `.env.local` :

| Variable                   | Usage                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | URL publique (métadonnées Open Graph).                                                                        |
| `DEMO_REQUEST_WEBHOOK_URL` | Webhook (POST JSON) qui reçoit les demandes de démonstration : CRM, Make, Zapier, Slack… Sans cette variable, le formulaire l’indique clairement à l’utilisateur (réponse 503) au lieu de perdre la demande. |

## Stack

| Domaine          | Choix                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | Next.js 16.4 (App Router, Turbopack), React 19.3                      |
| Langage          | TypeScript 5 en mode `strict`                                         |
| Styles           | Tailwind CSS 4                                                        |
| 3D               | three.js r186, React Three Fiber 9, Drei 10, postprocessing           |
| Animation        | GSAP 3.15 (ScrollTrigger, SplitText, `@gsap/react`)                   |
| État             | Zustand (store unique de l’expérience, hors cycle de rendu React)     |
| Qualité          | ESLint 9 (`eslint-config-next`), build Vercel                         |
| Pipeline d’assets| glTF-Transform + Meshoptimizer + Sharp (scripts Node)                 |

## Structure

```
app/                      Routes App Router (accueil, /plateforme, /demo, /credits, API)
components/
  3d/                     Moteur : Stage (Canvas), CameraRig, LightingRig, EnvironmentManager,
                          SceneDirector (chargement / libération), Effects
  experience/             Couche DOM de l’expérience : overlay narratif, voiles, rail, chargement,
                          parcours alternatif
  sections/               Sections commerciales (serveur)
  ui/                     Logo, en-tête, pied de page, menu mobile
  forms/                  Formulaire de demande de démonstration
scenes/
  config.ts               Configuration centralisée : trajectoires, éclairages, transitions, assets
  anchors.ts              Objets repères des raccords (positions, cadrage au moment de la coupe)
  villa/ gite/ chateau/ finale/   Un module par lieu (chargé à la demande)
  shared/                 Briques réutilisables : objets repères (verre, bougie, voilage), mobilier,
                          feu, ciel, eau, poussière, sonde de réflexion…
animations/               Timeline typographique GSAP synchronisée sur la caméra
content/                  Contenus éditoriaux (indépendants de la 3D)
hooks/ lib/ types/        Utilitaires, store, parcours, qualité, géométrie
public/models|textures|hdri|images
scripts/                  Génération des textures, optimisation des modèles
docs/ARCHITECTURE.md      Fonctionnement détaillé du moteur d’expérience
docs/DIRECTION_ARTISTIQUE.md  Moodboards, univers, objets repères, raccords
```

L’architecture détaillée (contrôleur de caméra, transitions, chargement, qualité adaptative) est décrite dans
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md). L’origine et la licence de chaque ressource sont listées dans
[ASSETS.md](./ASSETS.md) et sur la page `/credits` du site.

## Ce qui est réellement rendu

- **Architecture et matériaux** : toutes les architectures (baies, charpente, cheminées, boiseries, escalier, lustres…)
  et une partie du mobilier sont modélisées par code et texturées avec des matériaux PBR **procéduraux originaux**
  (chêne, vieux chêne, travertin, pierre à joints beurrés, tomettes, lin, bouclette, marbres, enduit), générés par
  `scripts/generate-textures.mjs`.
- **Mobilier** : modèles glTF du Khronos Group (Wayfair, CC0 / CC BY 4.0), compressés en Meshopt + WebP.
- **Lumière** : soleil directionnel avec ombres, éclairage d’ambiance hémisphérique, HDRI Poly Haven (CC0) pour
  l’éclairage indirect, feu et bougies, sonde de réflexion temps réel dans le château, halo (bloom), profondeur de
  champ pilotée par le parcours (mise au point sur l'objet repère, effet macro aux raccords) et tonemapping filmique.

Le rendu est **soigné mais pas photoréaliste** : il s’agit de 3D temps réel sans éclairage global précalculé ni
photogrammétrie. Les leviers pour aller plus loin (lightmaps cuites, modèles architecturaux sous licence, textures
scannées) sont listés dans `docs/ARCHITECTURE.md`.

## Accessibilité et appareils

- `prefers-reduced-motion` : la caméra ne se déplace plus en continu ; elle passe de point de vue en point de vue par
  fondus courts, et les animations d’ambiance sont figées.
- Navigation clavier : lien d’évitement, menu, rail de chapitres (boutons), « Passer l’introduction », formulaires.
- Les informations commerciales (Technologie, Fonctionnement, Contact, /plateforme, /demo) restent accessibles sans
  parcourir l’animation (menu et lien « Passer l’introduction »).
- Sans WebGL 2, en cas de perte de contexte, d’erreur de chargement ou de chargement trop long : **parcours
  alternatif** (mêmes chapitres, captures du rendu temps réel).
- Mobile : qualité réduite (pas de post-traitement ni d’ombres, pas de profondeur de champ, particules allégées), champ de vision élargi
  en portrait, parcours de scroll raccourci, amortissement adapté au tactile.

## Outils de diagnostic

Paramètres d’URL (développement et recette) :

| Paramètre                  | Effet                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| `?stats`                   | Affiche les statistiques GPU/CPU (StatsGl)                           |
| `?quality=low\|medium\|high` | Impose un niveau de qualité et désactive l’adaptation automatique  |
| `?p=0.66`                  | Ouvre directement le parcours à une progression (0 → 1)              |
| `?capture`                 | Mode capture automatisée (rendu logiciel lent : pas de lissage GSAP) |

## Validation

Vérifié dans l’environnement de développement (Chromium headless, rendu logiciel SwiftShader) :

- `npm run typecheck`, `npm run lint`, `npm run build` sans erreur ;
- chargement réel des modèles, textures et HDRI, compilation des shaders avant affichage ;
- rendu des trois univers et des trois raccords (image de coupe identique de part et d'autre, aucune image noire) ;
- scroll dans les deux sens (progression lissée et réversible), saut de chapitre masqué, libération des scènes ;
- mise en page desktop et mobile portrait, parcours alternatif.

**À valider sur matériel réel** (le rendu logiciel ne permet pas de mesurer les performances) : fluidité et FPS sur
GPU dédié / intégré / mobile, ressenti du scroll tactile (iOS Safari, Android Chrome), temps de chargement sur réseau
mobile, adaptation dynamique de la qualité (PerformanceMonitor). L’objectif est de viser 60 FPS sur un ordinateur
récent ; ce n’est pas garanti sur tous les appareils.

## Déploiement (Vercel)

Le projet est compatible Vercel sans configuration particulière (framework Next.js détecté automatiquement) :
importer le dépôt, définir les variables d’environnement, déployer. Les assets 3D de `public/` sont servis avec un
cache CDN d’une semaine (voir `next.config.ts`). Aucun déploiement en production n’a été effectué.

## Feuille de route (non développée à ce stade)

Le découpage prévoit l’ajout ultérieur, sans refonte de l’expérience : authentification Supabase, tableau de bord
agences, reconstruction 3D, éditeur de visites, gestion des biens, abonnements. Voir la section « Évolutions » de
`docs/ARCHITECTURE.md`.
