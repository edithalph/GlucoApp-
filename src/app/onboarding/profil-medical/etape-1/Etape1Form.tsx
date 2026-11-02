"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { FormMessage, type ActionState } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";
import { bmiCategory, computeBmi } from "@/lib/units";
import { enregistrerEtape1 } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Un instant…" : "Continuer"}
      <Icon name="arrow_forward" size={20} />
    </button>
  );
}

export function Etape1Form({
  profilInitial,
}: {
  profilInitial: {
    first_name: string | null;
    age: number | null;
    sex: "male" | "female" | null;
    weight_kg: number | null;
    height_cm: number | null;
  } | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    enregistrerEtape1,
    null,
  );

  const [age, setAge] = useState(profilInitial?.age ?? 45);
  const [sex, setSex] = useState<"male" | "female">(
    profilInitial?.sex ?? "female",
  );
  const [weight, setWeight] = useState(
    profilInitial?.weight_kg?.toString() ?? "",
  );
  const [height, setHeight] = useState(
    profilInitial?.height_cm?.toString() ?? "",
  );

  const bmi = computeBmi(Number(weight), Number(height));

  return (
    <form action={formAction} className="flex flex-col gap-stack-lg">
      <FloatingInput
        label="Prénom"
        name="first_name"
        autoComplete="given-name"
        defaultValue={profilInitial?.first_name ?? ""}
        required
      />

      {/* Âge : sélecteur à pas unitaire, comme sur la maquette */}
      <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
        <span className="font-body-lg text-body-lg text-on-surface-variant">
          Âge
        </span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setAge((a) => Math.max(1, a - 1))}
            aria-label="Diminuer l'âge"
            className="rounded-full bg-surface-container-high p-1.5 text-on-surface transition-colors hover:bg-surface-variant"
          >
            <Icon name="remove" size={20} />
          </button>
          <span className="w-10 text-center font-title-lg text-title-lg text-on-background">
            {age}
          </span>
          <button
            type="button"
            onClick={() => setAge((a) => Math.min(120, a + 1))}
            aria-label="Augmenter l'âge"
            className="rounded-full bg-primary-fixed p-1.5 text-on-primary-fixed-variant transition-colors hover:opacity-80"
          >
            <Icon name="add" size={20} />
          </button>
        </div>
        <input type="hidden" name="age" value={age} />
      </div>

      {/* Sexe biologique */}
      <fieldset className="flex flex-col gap-stack-sm">
        <legend className="mb-stack-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
          Sexe biologique
        </legend>
        <div className="grid grid-cols-2 gap-stack-sm">
          {(
            [
              { value: "male", label: "Homme", icon: "man" },
              { value: "female", label: "Femme", icon: "woman" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSex(opt.value)}
              aria-pressed={sex === opt.value}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 font-title-lg text-title-lg transition-all ${
                sex === opt.value
                  ? "bg-primary-container text-on-primary shadow-sm"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <Icon name={opt.icon} fill={sex === opt.value} size={20} />
              {opt.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="sex" value={sex} />
      </fieldset>

      <div className="grid grid-cols-2 gap-stack-md">
        <FloatingInput
          label="Poids (kg)"
          name="weight_kg"
          type="number"
          inputMode="decimal"
          step={0.1}
          min={20}
          max={400}
          required
          defaultValue={profilInitial?.weight_kg ?? undefined}
          onValueChange={setWeight}
        />
        <FloatingInput
          label="Taille (cm)"
          name="height_cm"
          type="number"
          inputMode="numeric"
          step={1}
          min={50}
          max={260}
          required
          defaultValue={profilInitial?.height_cm ?? undefined}
          onValueChange={setHeight}
        />
      </div>

      {/* IMC calculé en direct */}
      <div className="flex items-center gap-4 rounded-xl bg-secondary-fixed/30 p-4">
        <div className="shrink-0 rounded-full bg-surface-container-lowest p-2 text-secondary shadow-sm">
          <Icon name="monitor_weight" fill />
        </div>
        <div className="flex flex-col">
          <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
            Indice de masse corporelle
          </span>
          <span className="font-body-md text-body-md text-on-surface">
            {bmi
              ? `Votre IMC : ${bmi.toFixed(1).replace(".", ",")} — ${bmiCategory(bmi)}`
              : "Renseignez votre poids et votre taille."}
          </span>
        </div>
      </div>

      <FormMessage state={state} />
      <Submit />
    </form>
  );
}
