import type { Metadata } from "next";
import { DemoRequestForm } from "@/components/forms/DemoRequestForm";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Demander une démonstration",
  description: "Découvrez IMERSA sur vos propres biens : demandez une démonstration personnalisée.",
};

export default function DemoPage() {
  return (
    <PageShell>
      <div className="grid gap-16 md:grid-cols-[1fr_1.4fr] md:gap-24">
        <div>
          <p className="eyebrow">Démonstration</p>
          <h1 className="display mt-6 text-5xl leading-[1] md:text-6xl">Voyons vos biens en trois dimensions.</h1>
          <p className="mt-8 max-w-md leading-relaxed text-bone/65">
            Présentez-nous votre activité : nous préparons une démonstration de la plateforme et de ses visites
            immersives, adaptée à votre portefeuille.
          </p>
        </div>
        <DemoRequestForm />
      </div>
    </PageShell>
  );
}
