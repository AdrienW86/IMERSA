import Link from "next/link";
import { navigation } from "@/content/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-bone/10 bg-ink px-6 py-14 text-bone md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <Logo className="h-4 w-auto self-start" />
          <p className="max-w-xs text-sm text-bone/55">L’immobilier prend une nouvelle dimension.</p>
        </div>
        <nav aria-label="Pied de page">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-xs uppercase tracking-[0.25em] text-bone/60">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-bone">{item.label}</Link>
              </li>
            ))}
            <li><Link href="/plateforme" className="hover:text-bone">Plateforme</Link></li>
            <li><Link href="/credits" className="hover:text-bone">Crédits</Link></li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-12 max-w-6xl text-xs text-bone/35">
        © {new Date().getFullYear()} IMERSA. Les environnements présentés sont des créations fictives en 3D temps réel.
      </p>
    </footer>
  );
}
