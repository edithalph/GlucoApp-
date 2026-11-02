"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { FormMessage, type ActionState } from "@/components/ui/FormMessage";
import { GlucoseField } from "@/components/tea/GlucoseField";
import { estTheMaison, TEA_KIND_LABELS } from "@/lib/tea";
import type { GlucoseUnit } from "@/lib/units";
import type { Tea } from "@/types/database";
import { demarrerSession } from "../../actions";

function Submit({ pretA }: { pretA: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!pretA || pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
    >
      <Icon name="play_arrow" fill size={20} />
      {pending ? "Démarrage…" : "Démarrer la session"}
    </button>
  );
}

export function NouvelleSessionForm({
  thes,
  unit,
}: {
  thes: Tea[];
  unit: GlucoseUnit;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    demarrerSession,
    null,
  );
  const [theChoisi, setTheChoisi] = useState<string>("");
  const [mesureValide, setMesureValide] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-stack-lg">
      <fieldset className="flex flex-col gap-stack-sm">
        <legend className="mb-stack-sm font-title-lg text-title-lg text-on-background">
          Quel thé allez-vous boire ?
        </legend>

        <div className="flex flex-col gap-stack-sm" role="radiogroup">
          {thes.map((t) => {
            const actif = theChoisi === t.id;
            const maison = estTheMaison(t.name);
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={actif}
                aria-label={`${t.name} — ${TEA_KIND_LABELS[t.kind]}`}
                onClick={() => setTheChoisi(t.id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  actif
                    ? "border-primary bg-primary-fixed/40 shadow-sm"
                    : maison
                      ? "border-primary-fixed-dim bg-primary-fixed/15 hover:bg-primary-fixed/25"
                      : "border-outline-variant bg-surface-container-lowest hover:bg-surface-variant"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    actif
                      ? "bg-primary-container text-on-primary"
                      : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                  }`}
                >
                  <Icon name="local_cafe" fill size={20} />
                </span>

                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-body-lg text-body-lg text-on-surface">
                      {t.name}
                    </span>
                    {maison && (
                      <span className="rounded-full bg-primary-container px-2 py-0.5 font-label-md text-label-md text-on-primary">
                        Notre thé
                      </span>
                    )}
                  </span>
                  {t.description && (
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      {t.description}
                    </span>
                  )}
                </span>

                {actif && (
                  <Icon name="check_circle" fill className="text-primary" />
                )}
              </button>
            );
          })}
        </div>

        <input type="hidden" name="tea_id" value={theChoisi} readOnly />
      </fieldset>

      <div className="rounded-xl bg-surface-container-low p-4">
        <GlucoseField
          name="baseline_mgdl"
          label="Mesure avant le thé"
          unit={unit}
          onValidityChange={setMesureValide}
        />
        <p className="mt-stack-sm font-label-md text-label-md text-on-surface-variant">
          C&apos;est le point de départ : toutes les mesures suivantes lui
          seront comparées.
        </p>
      </div>

      <FormMessage state={state} />
      <Submit pretA={theChoisi !== "" && mesureValide} />
    </form>
  );
}
