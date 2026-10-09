import { audiences, technology } from "@/content/site";

export function TechnologySection() {
  return (
    <section id="technologie" className="scroll-mt-20 bg-ink px-6 py-28 text-bone md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">{technology.eyebrow}</p>
        <h2 className="display mt-6 max-w-[18ch] text-4xl leading-[1.02] md:text-6xl">{technology.title}</h2>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-bone/70">{technology.intro}</p>
        <div className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10">
          {technology.pillars.map((pillar, i) => (
            <article key={pillar.title} className="border-t border-bone/15 pt-8">
              <p className="text-xs tabular-nums text-sand">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="display mt-4 text-2xl">{pillar.title}</h3>
              <p className="mt-4 leading-relaxed text-bone/65">{pillar.text}</p>
            </article>
          ))}
        </div>
        <ul className="mt-24 flex flex-wrap gap-x-10 gap-y-4 text-xs uppercase tracking-[0.3em] text-bone/45" aria-label="Pour qui">
          {audiences.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
