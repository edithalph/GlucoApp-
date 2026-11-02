"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormMessage, type ActionState } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";
import { enregistrerEtape2 } from "../actions";

const SITUATIONS = [
  {
    value: "type1",
    icon: "vaccines",
    title: "Diabétique Type 1",
    subtitle: "Insulinodépendant(e)",
  },
  {
    value: "type2",
    icon: "monitor_heart",
    title: "Diabétique Type 2",
    subtitle: "Gestion quotidienne et habitudes",
  },
  {
    value: "prediabetic",
    icon: "warning",
    title: "Prédiabétique",
    subtitle: "Surveillance et ajustements",
  },
  {
    value: "prevention",
    icon: "spa",
    title: "En prévention",
    subtitle: "Optimisation du bien-être global",
  },
  {
    value: "other",
    icon: "more_horiz",
    title: "Autre situation",
    subtitle: "Profil ou besoin spécifique",
  },
] as const;

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? "Un instant…" : "Continuer"}
      <Icon name="arrow_forward" size={20} />
    </button>
  );
}

export function Etape2Form({
  conditionInitiale,
}: {
  conditionInitiale?: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    enregistrerEtape2,
    null,
  );
  const [choix, setChoix] = useState<string | null>(conditionInitiale ?? null);

  return (
    <form action={formAction} className="flex flex-col gap-stack-lg">
      <div
        role="radiogroup"
        aria-label="Votre situation"
        className="flex flex-col gap-stack-sm"
      >
        {SITUATIONS.map((s) => {
          const actif = choix === s.value;
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={actif}
              // Sans ce libellé, l'arbre d'accessibilité n'expose aucun nom
              // pour la carte : un lecteur d'écran annoncerait « bouton radio »
              // sans dire lequel.
              aria-label={`${s.title} — ${s.subtitle}`}
              onClick={() => setChoix(s.value)}
              className={`flex items-center gap-4 rounded-xl p-4 text-left transition-all active:scale-[0.99] ${
                actif
                  ? "bg-primary-fixed shadow-card ring-2 ring-primary"
                  : "border border-outline-variant bg-surface-container-lowest hover:bg-surface-variant"
              }`}
            >
              <span
                className={`shrink-0 rounded-full p-2.5 ${
                  actif
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                <Icon name={s.icon} fill={actif} />
              </span>

              <span className="flex flex-1 flex-col">
                <span className="font-title-lg text-title-lg text-on-surface">
                  {s.title}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {s.subtitle}
                </span>
              </span>

              {actif && (
                <Icon name="check_circle" fill className="text-primary" />
              )}
            </button>
          );
        })}
      </div>

      <input type="hidden" name="condition" value={choix ?? ""} />

      <FormMessage state={state} />
      <Submit disabled={!choix} />
    </form>
  );
}
