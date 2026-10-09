export const site = {
  name: "IMERSA",
  tagline: "L’immobilier prend une nouvelle dimension.",
  description:
    "IMERSA transforme les captures de logements en environnements 3D navigables et partageables, pour les agences et les professionnels de l’immobilier.",
} as const;

export const navigation = [
  { label: "Expérience", href: "/#experience" },
  { label: "Technologie", href: "/#technologie" },
  { label: "Fonctionnement", href: "/#fonctionnement" },
  { label: "Contact", href: "/#contact" },
] as const;

export const technology = {
  eyebrow: "Technologie",
  title: "Du relevé à l’espace navigable.",
  intro:
    "IMERSA reconstruit chaque bien sous la forme d’un environnement tridimensionnel continu, que vos clients parcourent librement depuis un navigateur.",
  pillars: [
    {
      title: "Reconstruction 3D",
      text: "Les captures réalisées sur place sont converties en volumes, matériaux et lumières cohérents, au plus près de la réalité du lieu.",
    },
    {
      title: "Rendu temps réel",
      text: "Le moteur WebGL adapte la qualité à chaque appareil : ordinateur, tablette ou smartphone, sans application à installer.",
    },
    {
      title: "Partage instantané",
      text: "Chaque visite devient un lien unique, intégrable à vos annonces, à votre site et à vos échanges avec les acquéreurs.",
    },
  ],
} as const;

export const process = {
  eyebrow: "Fonctionnement",
  title: "Trois étapes, une visite qui se souvient de chaque détail.",
  steps: [
    {
      index: "01",
      title: "Capturer",
      text: "Vous réalisez la capture du bien avec un équipement compatible. La prise de vue est guidée pièce par pièce.",
    },
    {
      index: "02",
      title: "Reconstruire",
      text: "IMERSA assemble les captures et génère un environnement 3D fidèle, prêt à être mis en scène.",
    },
    {
      index: "03",
      title: "Présenter",
      text: "Publiez la visite, suivez son audience et accompagnez vos clients dans la découverte du lieu, à distance.",
    },
  ],
} as const;

export const audiences = [
  "Agences immobilières",
  "Réseaux immobiliers",
  "Promoteurs",
  "Immobilier de prestige",
] as const;
