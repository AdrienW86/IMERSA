import { process } from "@/content/site";

export function ProcessSection() {
  return (
    <section id="fonctionnement" className="scroll-mt-20 bg-bone px-6 py-28 text-ink md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-ink/55">{process.eyebrow}</p>
        <h2 className="display mt-6 max-w-[20ch] text-4xl leading-[1.02] md:text-6xl">{process.title}</h2>
        <ol className="mt-20 grid gap-16 md:grid-cols-3 md:gap-10">
          {process.steps.map((step) => (
            <li key={step.index} className="flex flex-col gap-5">
              <span className="display text-6xl text-ink/20">{step.index}</span>
              <h3 className="text-sm font-medium uppercase tracking-[0.3em]">{step.title}</h3>
              <p className="leading-relaxed text-ink/70">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
