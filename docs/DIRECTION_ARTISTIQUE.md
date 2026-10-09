# Direction artistique et raccords

Ce document traduit les moodboards de référence (villa / maison, gîte, château, et la planche globale) en règles
concrètes pour les scènes 3D. Les images des moodboards ne sont pas versionnées dans le dépôt : elles servent de
référence et leurs droits ne sont pas établis.

## 1. Analyse des moodboards

**Ce qui revient sur toutes les planches**

- **Une seule heure : la lumière dorée.** Soleil bas et chaud qui rase les matières. L'intérieur est toujours plus sombre
  que la baie, et des sources secondaires prennent le relais : feu, bougie, suspension.
- **Peu de matières, mais nobles et lisibles de près.** Pierre, bois, lin, céramique, puis marbre, dorure et velours au
  château. La matière sert de motif principal, la décoration reste secondaire.
- **Des cadrages de photographe d'intérieur.** Caméra à hauteur d'œil ou plus basse, premier plan flou (bol, vase,
  verre), profondeur de champ courte sur les détails.
- **Les planches proposent déjà des raccords.** « Du verre à l'autre lieu », « par la flamme », « la lumière comme lien »
  (rideau), « match cut sur un luminaire », « le miroir comme portail », « match cut sur un bouquet ». Les objets repères
  sont presque les mêmes d'un univers à l'autre : verre, vase, suspension ou lustre, livre, rideau, bougie.

**Ce qui distingue les trois univers**

| | Villa / maison | Gîte (mas provençal) | Château |
| --- | --- | --- | --- |
| Architecture | Lignes horizontales, grandes baies, plafond plat, cheminée bloc en travertin | Murs de moellons à joints beurrés, poutres, petites fenêtres à volets, cheminée en pierre | Boiseries et moulures, grandes croisées, cheminée de marbre, escalier d'honneur |
| Lumière | Soleil couchant sur la mer, intérieur lumineux | Soleil rasant par la fenêtre, pénombre chaude, feu de bois | Lumière froide du parc, intérieur porté par les bougies et le lustre |
| Matières | Travertin, chêne clair, lin, bouclette, céramique, métal noir | Pierre calcaire, vieux chêne, tomettes, lin, terre cuite, fer forgé | Marbre blanc / noir, parquet, dorure, velours, pierre taillée |
| Couleurs | Sable, beige, taupe, vert olive, bleu Méditerranée | Terre de Sienne, pierre, lin, olive, terracotta | Ivoire, or, vert bouteille, bordeaux, noir |
| Végétal | Oliviers en pot, pins, mer | Oliviers, cyprès, lavande | Parc, buis taillés |

## 2. Direction retenue par univers

### Villa — « la lumière horizontale »

Golden hour sur la mer (`venice_sunset`, soleil bas à l'ouest). Sol en travertin chaud, canapé modulable en bouclette
écrue, table basse en travertin avec un bol, des livres et un verre de rosé. Table de repas en chêne sous des
suspensions céramique, oliviers en pot et voilage de lin à la baie. Le travail porte surtout sur le premier plan : une
profondeur de champ légère en plan large et des objets posés là où l'œil va.

### Mas — « la pénombre habitée »

Salle commune d'un mas à la fin de l'après-midi (`lebombo`, soleil rasant par la fenêtre du mur ouest). Murs en
moellons calcaires clairs, joints beurrés à la chaux, badigeon irrégulier. Charpente en vieux chêne, sol en tomettes.
Cheminée de pierre avec feu et bougie sur le manteau. Table de ferme avec le même verre que dans la villa, une
bouteille, une coupe en céramique et un pichet en terre cuite. Dehors, cyprès et champs de lavande. Exposition plus
basse que la villa : le feu et le soleil se partagent la pièce.

### Château — « le cérémonial »

Grand salon à boiseries ivoire filetées d'or, cheminée de marbre surmontée d'un miroir doré cintré, candélabres,
lustre, canapé de velours vert, fauteuils damassés, tapis et console fleurie. Grandes croisées avec voilages et
rideaux de velours. Le parcours continue par la galerie puis l'escalier d'honneur, jusqu'à la grande baie voilée.
Lumière extérieure froide et faible ; ce sont les bougies et la sonde de réflexion (dorure, miroir) qui portent la
scène.

## 3. Objets repères communs (raccords possibles)

| Motif | Villa | Mas | Château | Utilisé |
| --- | --- | --- | --- | --- |
| **Verre** | verre de rosé, table basse | même verre, table de ferme | (coupe en cristal) | ✅ raccord 1 |
| **Flamme / bougie** | cheminée bloc | bougie sur le manteau | candélabre sur la cheminée | ✅ raccord 2 |
| **Rideau / voilage** | voilage de lin à la baie | (rideau en lin) | voilage de la grande baie | ✅ raccord 3 |
| Vase | vase céramique sur la console | pichet en terre cuite | vase fleuri sur la console | piste |
| Luminaire | suspensions céramique | suspension au-dessus de la table | lustre | piste |
| Livre | livres sur la table basse | — | — | piste |
| Miroir | — | — | miroir doré cintré | piste (portail) |
| Élément de table | bol, plateau en travertin | coupe en céramique, planche | service à thé | piste |

Les objets des trois raccords retenus sont **identiques** d'un lieu à l'autre : même géométrie, même échelle. Cela
garantit que le cadre au moment de la coupe est le même au pixel près.

## 4. Les trois transitions

Principe commun (voir `scenes/anchors.ts` et `docs/ARCHITECTURE.md`) :

1. La caméra s'approche de l'objet repère jusqu'à ce qu'il remplisse le cadre. La focale se resserre et la profondeur
   de champ passe en mode macro : le décor se fond dans le flou.
2. À l'image de la coupe, la caméra occupe **exactement la même position relative** par rapport à l'objet jumeau de
   la scène suivante. Sa vitesse y est nulle : la trajectoire marque un temps d'arrêt.
3. La scène change à cette image précise, sans fondu ni voile. Seul l'arrière-plan flou change de couleur et de
   lumière.
4. La caméra recule et révèle le nouveau lieu.

| # | Raccord | De → vers | Ce qui change dans le flou |
| --- | --- | --- | --- |
| 1 | **Le verre** | verre de rosé sur la table basse de la villa → même verre sur la table de ferme du mas | mer et travertin → pierre et pénombre ambrée |
| 2 | **La flamme** | bougie sur le manteau du mas → bougie du candélabre sur la cheminée du château | pierre et poutres → boiseries dorées et miroir |
| 3 | **Le voilage** | voilage de la grande baie du château → voilage de lin de la villa | lumière froide du parc → soleil couchant sur la terrasse |

Le parcours est une boucle : villa → mas → château → retour à la villa (terrasse, appel à l'action). Le dernier
raccord ramène au point de départ.
