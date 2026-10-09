import Link from "next/link";
import { navigation } from "@/content/site";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

/** Navigation discrète, lisible sur les scènes claires comme sombres. */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-[60] text-bone">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-bone focus:px-4 focus:py-2 focus:text-ink"
      >
        Aller au contenu
      </a>
      <div className="flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
        <Link href="/" aria-label="IMERSA — accueil" className="header-shadow transition-opacity hover:opacity-80">
          <Logo className="h-[15px] w-auto md:h-[17px]" />
        </Link>
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-10 text-[0.68rem] font-medium uppercase tracking-[0.3em]">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="nav-link header-shadow">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}
