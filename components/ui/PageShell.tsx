import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Gabarit des pages éditoriales (hors expérience immersive). */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="min-h-[100svh] bg-ink px-6 pb-28 pt-36 text-bone md:px-10 md:pt-44">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
