"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UNIT_LABELS, type GlucoseUnit } from "@/lib/units";
import { changerUnite } from "./actions";

const UNITES: GlucoseUnit[] = ["g_l", "mmol_l", "mg_dl"];

/**
 * Bascule l'unité d'affichage. Le stockage reste en mg/dL : changer d'unité
 * ne réécrit aucune donnée, seulement leur présentation.
 */
export function UniteSelector({ courante }: { courante: GlucoseUnit }) {
  const [enCours, demarrer] = useTransition();
  const router = useRouter();

  // `revalidatePath` invalide le cache serveur mais ne redemande pas le rendu
  // à la vue déjà affichée : sans ce refresh explicite, l'unité change en base
  // sans que l'écran bouge.
  function choisir(u: GlucoseUnit) {
    demarrer(async () => {
      await changerUnite(u);
      router.refresh();
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Unité d'affichage de la glycémie"
      className="flex gap-stack-sm"
    >
      {UNITES.map((u) => {
        const actif = u === courante;
        return (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={actif}
            disabled={enCours}
            onClick={() => choisir(u)}
            className={`flex-1 rounded-full px-3 py-2 font-body-md text-body-md transition-all disabled:opacity-60 ${
              actif
                ? "bg-primary-container text-on-primary shadow-sm"
                : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            {UNIT_LABELS[u]}
          </button>
        );
      })}
    </div>
  );
}
