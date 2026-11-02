"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Frontière d'erreur applicative.
 *
 * Le message technique n'est JAMAIS affiché : il peut contenir des fragments
 * de requête, des noms de colonnes ou des identifiants. Seul le `digest`,
 * identifiant opaque produit par Next, est montré pour permettre le
 * rapprochement avec les journaux serveur.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En production, brancher ici un collecteur (Sentry, etc.).
    console.error("Erreur applicative :", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop text-center">
      <span className="rounded-full bg-error-container p-6 text-on-error-container">
        <Icon name="error" size={48} fill />
      </span>

      <div className="flex flex-col gap-stack-sm">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          Quelque chose s&apos;est mal passé
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          L&apos;erreur a été enregistrée. Vos données ne sont pas affectées.
        </p>
        {error.digest && (
          <p className="font-label-md text-label-md text-outline">
            Référence : {error.digest}
          </p>
        )}
      </div>

      <div className="flex w-full flex-col gap-stack-sm">
        <button
          type="button"
          onClick={reset}
          className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-opacity hover:opacity-90"
        >
          <Icon name="refresh" size={20} />
          Réessayer
        </button>
        <Link
          href="/tableau-de-bord"
          className="flex h-14 items-center justify-center gap-2 rounded-[14px] border border-outline-variant font-title-lg text-title-lg text-on-background transition-colors hover:bg-surface-variant"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
