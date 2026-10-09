import Image from "next/image";
import Link from "next/link";
import { narrative } from "@/content/narrative";

const posters: Record<string, string> = {
  hero: "/images/journey-villa.webp",
  gite: "/images/journey-gite.webp",
  chateau: "/images/journey-chateau.webp",
  finale: "/images/journey-finale.webp",
};

/**
 * Parcours alternatif, sans WebGL : mêmes chapitres, mêmes messages,
 * illustrés par des captures du rendu temps réel.
 */
export function StaticJourney({ reason }: { reason?: string | null }) {
  return (
    <div className="bg-ink text-bone">
      {reason && (
        <p className="px-6 pt-28 text-center text-xs uppercase tracking-[0.3em] text-bone/50 md:pt-32">
          {reason === "webgl"
            ? "Votre navigateur ne permet pas d’afficher la visite 3D. Voici le parcours en images."
            : "La visite 3D n’a pas pu démarrer sur cet appareil. Voici le parcours en images."}
        </p>
      )}
      {narrative.map((block, i) => (
        <section key={block.id} className="relative flex min-h-[90svh] items-end overflow-hidden">
          <Image
            src={posters[block.id]}
            alt=""
            fill
            sizes="100vw"
            priority={i === 0}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="relative flex max-w-3xl flex-col gap-5 px-6 pb-20 md:px-[7vw]">
            {block.lines.map((line) =>
              line.kind === "title" ? (
                i === 0 ? (
                  <h1 key={line.text} className="display text-[2.6rem] leading-[1] md:text-[4.6rem]">{line.text}</h1>
                ) : (
                  <h2 key={line.text} className="display text-[2.2rem] leading-[1] md:text-[4rem]">{line.text}</h2>
                )
              ) : line.kind === "lead" ? (
                <p key={line.text} className="max-w-[36ch] text-lg text-bone/85">« {line.text} »</p>
              ) : (
                <p key={line.text} className="text-[0.7rem] uppercase tracking-[0.45em] text-bone/70">{line.text}</p>
              ),
            )}
            {block.cta && (
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Link href="/plateforme" className="btn btn-solid">Découvrir IMERSA</Link>
                <Link href="/demo" className="btn btn-ghost">Demander une démonstration</Link>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
