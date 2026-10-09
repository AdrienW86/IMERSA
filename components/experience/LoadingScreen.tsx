"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { enterFallback, useExperience } from "@/lib/experience-store";

const SLOW_LOADING_MS = 20000;

/**
 * Écran de chargement initial : la villa n'apparaît qu'une fois ses assets
 * téléchargés et ses shaders compilés.
 */
export function LoadingScreen() {
  const status = useExperience((s) => s.status);
  const { progress } = useProgress();
  const [slow, setSlow] = useState(false);
  const visible = status === "detecting" || status === "loading";

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setSlow(true), SLOW_LOADING_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-ink transition-opacity duration-[1400ms] ease-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <Logo className="h-5 w-auto text-bone" />
      <div className="h-px w-40 overflow-hidden bg-bone/15" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Chargement de l’expérience">
        <div className="h-full bg-bone/80 transition-transform duration-500" style={{ transform: `scaleX(${progress / 100})`, transformOrigin: "left" }} />
      </div>
      <p className="text-[0.62rem] uppercase tracking-[0.4em] text-bone/50">Préparation de la visite</p>
      {slow && visible && (
        <button
          type="button"
          onClick={() => enterFallback("slow")}
          className="text-xs text-bone/70 underline underline-offset-4 hover:text-bone"
        >
          Le chargement est long — découvrir IMERSA sans la 3D
        </button>
      )}
    </div>
  );
}
