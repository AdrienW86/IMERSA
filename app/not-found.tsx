import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <p className="eyebrow">404</p>
      <h1 className="display mt-6 text-5xl md:text-6xl">Cet espace n’existe pas encore.</h1>
      <Link href="/" className="btn btn-ghost mt-12">
        Revenir à l’expérience
      </Link>
    </PageShell>
  );
}
