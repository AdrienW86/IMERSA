import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { audiences, process, technology } from "@/content/site";

export const metadata: Metadata = {
  title: "La plateforme",
  description:
    "IMERSA transforme les captures de logements en visites 3D immersives, navigables et partageables pour les professionnels de l’immobilier.",
};

const capabilities = [
  {
    title: "Visites 3D navigables",
    text: "Vos clients se déplacent librement dans le bien, pièce après pièce, depuis un simple lien.",
  },
  {
    title: "Mise en scène",
    text: "Points de vue, parcours guidés et lumière : chaque bien est présenté sous son meilleur jour.",
  },
  {
    title: "Diffusion",
    text: "Intégration aux annonces, au site de l’agence et aux échanges avec les acquéreurs.",
  },
  {
    title: "Suivi",
    text: "Mesure de l’engagement des visiteurs pour qualifier les demandes avant la visite physique.",
  },
] as const;

export default function PlateformePage() {
  return (
    <PageShell>
      <p className="eyebrow">La plateforme</p>
      <h1 className="display mt-6 max-w-[18ch] text-5xl leading-[1] md:text-7xl">
        Chaque bien, une expérience à part entière.
      </h1>
      <p className="mt-10 max-w-2xl text-lg leading-relaxed text-bone/70">{technology.intro}</p>

      <section aria-labelledby="capacites" className="mt-24">
        <h2 id="capacites" className="eyebrow">
          Ce que permet IMERSA
        </h2>
        <ul className="mt-10 grid gap-12 md:grid-cols-2">
          {capabilities.map((c) => (
            <li key={c.title} className="border-t border-bone/15 pt-8">
              <h3 className="display text-3xl">{c.title}</h3>
              <p className="mt-4 max-w-md leading-relaxed text-bone/65">{c.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="etapes" className="mt-28">
        <h2 id="etapes" className="eyebrow">
          {process.eyebrow}
        </h2>
        <ol className="mt-10 grid gap-12 md:grid-cols-3">
          {process.steps.map((s) => (
            <li key={s.index}>
              <span className="display text-5xl text-bone/25">{s.index}</span>
              <h3 className="mt-4 text-sm font-medium uppercase tracking-[0.3em]">{s.title}</h3>
              <p className="mt-4 leading-relaxed text-bone/65">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-28 flex flex-col gap-8 border-t border-bone/15 pt-14 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Pour</p>
          <p className="display mt-4 max-w-xl text-3xl leading-tight">{audiences.join(" · ")}</p>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-bone/55">
            IMERSA est en cours de développement et ouvre son accès anticipé progressivement. Les environnements de
            la page d’accueil sont des créations fictives réalisées en 3D temps réel.
          </p>
        </div>
        <Link href="/demo" className="btn btn-solid self-start md:self-auto">
          Demander une démonstration
        </Link>
      </section>
    </PageShell>
  );
}
