import { useEffect, useMemo } from "react";

interface Disposable {
  dispose: () => void;
}

type DisposableGroup = Disposable | readonly Disposable[] | { readonly [key: string]: Disposable };

function disposeAll(value: DisposableGroup) {
  if (Array.isArray(value)) value.forEach((v: Disposable) => v.dispose());
  else if (typeof (value as Disposable).dispose === "function") (value as Disposable).dispose();
  else Object.values(value as Record<string, Disposable>).forEach((v) => v.dispose());
}

/**
 * Crée une ou plusieurs ressources GPU (géométries, matériaux, textures…)
 * mémorisées, et les libère automatiquement au démontage du composant.
 */
export function useDisposable<T extends DisposableGroup>(factory: () => T, deps: React.DependencyList): T {
  // Hook générique : les dépendances sont fournies par l'appelant.
  // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => disposeAll(value), [value]);
  return value;
}
