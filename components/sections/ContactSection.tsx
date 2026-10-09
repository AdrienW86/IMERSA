import Link from "next/link";

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 bg-ink px-6 py-28 text-bone md:px-10 md:py-40">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Contact</p>
          <h2 className="display mt-6 max-w-[16ch] text-4xl leading-[1.02] md:text-6xl">
            Présentons vos biens autrement.
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-bone/70">
            IMERSA ouvre progressivement son accès aux agences et aux promoteurs. Parlez-nous de vos biens : nous
            vous proposerons une démonstration adaptée à votre activité.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
          <Link href="/demo" className="btn btn-solid">Demander une démonstration</Link>
          <Link href="/plateforme" className="btn btn-ghost">Découvrir IMERSA</Link>
        </div>
      </div>
    </section>
  );
}
