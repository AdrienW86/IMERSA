"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { navigation } from "@/content/site";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="header-shadow relative z-10 text-[0.68rem] font-medium uppercase tracking-[0.3em]"
      >
        {open ? "Fermer" : "Menu"}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-0 bg-ink/95 px-6 pt-28 backdrop-blur-sm"
      >
        <ul className="flex flex-col gap-7">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={() => setOpen(false)} className="display text-4xl text-bone">
                {item.label}
              </Link>
            </li>
          ))}
          <li className="pt-6">
            <Link href="/demo" onClick={() => setOpen(false)} className="btn btn-solid">
              Demander une démonstration
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
