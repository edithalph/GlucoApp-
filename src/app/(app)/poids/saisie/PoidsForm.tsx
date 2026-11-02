"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { FormMessage, type ActionState } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";
import { bmiCategory, computeBmi } from "@/lib/units";
import { enregistrerPoids } from "../../glycemie/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    >
      <Icon name="check_circle" fill size={20} />
      {pending ? "Enregistrement…" : "Enregistrer la pesée"}
    </button>
  );
}

export function PoidsForm({
  poidsActuel,
  tailleCm,
}: {
  poidsActuel: number | null;
  tailleCm: number | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    enregistrerPoids,
    null,
  );
  const [poids, setPoids] = useState(poidsActuel ? String(poidsActuel) : "");

  const imc = tailleCm ? computeBmi(Number(poids), tailleCm) : null;
  const ecart =
    poidsActuel !== null && poids !== "" ? Number(poids) - poidsActuel : null;

  return (
    <form action={formAction} className="flex flex-col gap-stack-lg">
      <FloatingInput
        label="Poids (kg)"
        name="weight_kg"
        type="number"
        inputMode="decimal"
        step={0.1}
        min={20}
        max={400}
        defaultValue={poidsActuel ?? undefined}
        onValueChange={setPoids}
        required
      />

      {ecart !== null && Math.abs(ecart) >= 0.1 && (
        <p className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
          <Icon
            name={ecart > 0 ? "trending_up" : "trending_down"}
            size={18}
            className={ecart > 0 ? "text-tertiary" : "text-primary"}
          />
          {ecart > 0 ? "+" : "−"}
          {Math.abs(ecart).toFixed(1).replace(".", ",")} kg par rapport à la
          dernière pesée
        </p>
      )}

      {imc && (
        <div className="flex items-center gap-4 rounded-xl bg-secondary-fixed/30 p-4">
          <span className="shrink-0 rounded-full bg-surface-container-lowest p-2 text-secondary shadow-sm">
            <Icon name="monitor_weight" fill />
          </span>
          <span className="font-body-md text-body-md text-on-surface">
            IMC : {imc.toFixed(1).replace(".", ",")} — {bmiCategory(imc)}
          </span>
        </div>
      )}

      <FormMessage state={state} />
      <Submit />
    </form>
  );
}
