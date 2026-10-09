import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { credits } from "@/content/credits";

export const metadata: Metadata = {
  title: "Crédits",
  description: "Origine et licences des ressources 3D utilisées sur le site IMERSA.",
};

export default function CreditsPage() {
  return (
    <PageShell>
      <p className="eyebrow">Crédits</p>
      <h1 className="display mt-6 max-w-[20ch] text-5xl leading-[1] md:text-6xl">Ressources et licences</h1>
      <p className="mt-8 max-w-2xl leading-relaxed text-bone/65">
        Les architectures, les matériaux (textures procédurales), les shaders et l’identité visuelle sont des
        créations originales d’IMERSA. Le mobilier ci-dessous provient de la bibliothèque officielle d’exemples glTF
        du Khronos Group ; les cartes d’environnement proviennent de Poly Haven. Les environnements présentés sont
        fictifs.
      </p>
      <ul className="mt-16 divide-y divide-bone/10 border-y border-bone/10">
        {credits.map((c) => (
          <li key={c.file} className="grid gap-2 py-6 md:grid-cols-[1.2fr_1.4fr_0.6fr] md:gap-8">
            <a href={c.url} className="underline-offset-4 hover:underline" rel="noreferrer" target="_blank">
              {c.asset}
            </a>
            <span className="text-bone/60">{c.author}</span>
            <span className="text-sm uppercase tracking-[0.2em] text-sand">{c.license}</span>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
