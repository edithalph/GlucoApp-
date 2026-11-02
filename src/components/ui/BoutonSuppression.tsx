"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

/**
 * Suppression en deux temps.
 *
 * Un premier appui arme le bouton, un second confirme. Une suppression est
 * irréversible et ces boutons sont petits, souvent atteints au pouce : une
 * confirmation explicite évite d'effacer un relevé par un appui malheureux.
 * L'état armé retombe seul après quelques secondes.
 */
export function BoutonSuppression({
  action,
  libelle,
  apresSuppression,
}: {
  /** Action serveur liée à l'identifiant concerné. */
  action: () => Promise<void>;
  /** Décrit l'élément visé, pour les lecteurs d'écran. */
  libelle: string;
  /** Chemin à rejoindre après coup ; sinon on rafraîchit la vue courante. */
  apresSuppression?: string;
}) {
  const [arme, setArme] = useState(false);
  const [enCours, demarrer] = useTransition();
  const router = useRouter();

  function armer() {
    setArme(true);
    // Retour à l'état neutre si l'utilisateur ne confirme pas.
    setTimeout(() => setArme(false), 4000);
  }

  function confirmer() {
    demarrer(async () => {
      await action();
      if (apresSuppression) router.push(apresSuppression);
      else router.refresh();
    });
  }

  if (!arme) {
    return (
      <button
        type="button"
        onClick={armer}
        aria-label={`Supprimer ${libelle}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
      >
        <Icon name="delete" size={20} />
      </button>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={confirmer}
        disabled={enCours}
        aria-label={`Confirmer la suppression de ${libelle}`}
        className="rounded-full bg-error px-3 py-1.5 font-label-md text-label-md text-on-error transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {enCours ? "…" : "Confirmer"}
      </button>
      <button
        type="button"
        onClick={() => setArme(false)}
        disabled={enCours}
        aria-label="Annuler la suppression"
        className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant"
      >
        <Icon name="close" size={18} />
      </button>
    </span>
  );
}
