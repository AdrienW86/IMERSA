import { sceneDefinitions } from "@/scenes/config";
import { ExperienceRoot } from "./ExperienceRoot";

const totalWeight = sceneDefinitions.reduce((sum, s) => sum + s.weight, 0);

/**
 * Section du parcours immersif. Sa hauteur définit la longueur de scroll :
 * elle est proportionnelle au poids narratif de chaque séquence.
 */
export function ExperienceSection() {
  return (
    <section
      id="experience"
      aria-label="Expérience immersive IMERSA"
      className="journey relative bg-ink"
      style={{ "--journey-weight": totalWeight } as React.CSSProperties}
    >
      <ExperienceRoot sectionId="experience" />
    </section>
  );
}
