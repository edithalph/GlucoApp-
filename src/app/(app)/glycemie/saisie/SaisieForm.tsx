"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { FormMessage, type ActionState } from "@/components/ui/FormMessage";
import {
  UNIT_LABELS,
  formatGlucose,
  parseGlucoseInput,
  type GlucoseUnit,
} from "@/lib/units";
import {
  CONTEXT_ICONS,
  CONTEXT_LABELS,
  INPUT_CONTEXTS,
  readingStatus,
  STATUS_STYLES,
} from "@/lib/glycemia";
import type { ReadingContext } from "@/types/database";
import { enregistrerReleve } from "../actions";
import { SafetyNotice } from "@/components/glucose/SafetyNotice";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
    >
      <Icon name="check_circle" fill size={20} />
      {pending ? "Enregistrement…" : "Enregistrer la mesure"}
    </button>
  );
}

export function SaisieForm({
  unit,
  targetMin,
  targetMax,
  lastReadingMgdl,
  meals,
  initialMealId,
}: {
  unit: GlucoseUnit;
  targetMin: number;
  targetMax: number;
  lastReadingMgdl: number | null;
  meals: { id: string; label: string }[];
  initialMealId?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    enregistrerReleve,
    null,
  );

  const [saisie, setSaisie] = useState("");
  const [contexte, setContexte] = useState<ReadingContext>("fasting");
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [detailsOuverts, setDetailsOuverts] = useState(false);
  const [quand] = useState(() => new Date());

  const validation = useMemo(
    () => (saisie === "" ? null : parseGlucoseInput(saisie, unit)),
    [saisie, unit],
  );
  const valide = validation?.ok === true;
  const valeurMgdl = valide ? validation.valueMgdl : null;

  const statut =
    valeurMgdl !== null ? readingStatus(valeurMgdl, targetMin, targetMax) : null;

  function frappe(k: string) {
    setSaisie((v) => {
      if (k === "⌫") return v.slice(0, -1);
      if (k === "." && v.includes(".")) return v;
      if (k === "." && v === "") return "0.";
      // Garde-fou : au plus 3 décimales, longueur totale raisonnable.
      const suivant = v + k;
      if (suivant.replace(".", "").length > 5) return v;
      const [, dec] = suivant.split(".");
      if (dec && dec.length > 3) return v;
      return suivant;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-stack-lg">
      {/* Horodatage */}
      <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
        <span className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
          <Icon name="calendar_today" size={18} />
          {quand.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          {", "}
          {quand.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <input
        type="hidden"
        name="measured_at"
        value={quand.toISOString()}
        readOnly
      />

      <SafetyNotice valueMgdl={valeurMgdl} />

      {/* Valeur saisie */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-display-hero text-display-hero tabular-nums ${
              saisie === "" ? "text-outline" : "text-on-background"
            }`}
          >
            {saisie === "" ? "0" : saisie.replace(".", ",")}
          </span>
          <span className="font-body-lg text-body-lg text-on-surface-variant">
            {UNIT_LABELS[unit]}
          </span>
        </div>

        {statut && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-label-md text-label-md ${STATUS_STYLES[statut].chip}`}
          >
            <Icon
              name={
                statut === "high"
                  ? "trending_up"
                  : statut === "low"
                    ? "trending_down"
                    : "check_circle"
              }
              size={14}
            />
            {STATUS_STYLES[statut].label}
          </span>
        )}

        {validation && !validation.ok && (
          <span className="font-label-md text-label-md text-error">
            {validation.error}
          </span>
        )}

        {lastReadingMgdl !== null && saisie === "" && (
          <span className="font-body-md text-body-md text-on-surface-variant">
            Dernière mesure : {formatGlucose(lastReadingMgdl, unit)}{" "}
            {UNIT_LABELS[unit]}
          </span>
        )}
      </div>

      <input
        type="hidden"
        name="value_mgdl"
        value={valeurMgdl ?? ""}
        readOnly
      />

      {/* Contexte */}
      <fieldset>
        <legend className="mb-stack-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
          Contexte
        </legend>
        <div className="flex flex-wrap gap-stack-sm">
          {INPUT_CONTEXTS.map((c) => {
            const actif = contexte === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={actif}
                onClick={() => setContexte(c)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-body-md text-body-md transition-all ${
                  actif
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <Icon name={CONTEXT_ICONS[c]} size={16} fill={actif} />
                {CONTEXT_LABELS[c]}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="context" value={contexte} readOnly />
      </fieldset>

      {/* Note facultative */}
      {noteOuverte ? (
        <textarea
          name="note"
          rows={2}
          autoFocus
          placeholder="Note (facultatif) — repas, activité, ressenti…"
          className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-body-md text-body-md text-on-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <button
          type="button"
          onClick={() => setNoteOuverte(true)}
          className="flex items-center gap-2 self-start rounded-full px-3 py-1.5 font-label-md text-label-md text-primary transition-colors hover:bg-surface-variant"
        >
          <Icon name="edit_note" size={18} />
          Ajouter une note
        </button>
      )}

      <section className="rounded-xl bg-surface-container-low p-4">
        <button
          type="button"
          onClick={() => setDetailsOuverts((v) => !v)}
          aria-expanded={detailsOuverts}
          className="flex w-full items-center justify-between font-title-lg text-title-lg text-on-surface"
        >
          Ajouter du contexte
          <Icon name={detailsOuverts ? "expand_less" : "expand_more"} />
        </button>
        {detailsOuverts && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
              Repas associé
              <select name="meal_id" defaultValue={meals.some((meal) => meal.id === initialMealId) ? initialMealId : ""} className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-on-surface">
                <option value="">Aucun</option>
                {meals.map((meal) => <option key={meal.id} value={meal.id}>{meal.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Activité (min)<input name="activity_minutes" type="number" min="0" max="1440" inputMode="numeric" className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-on-surface" /></label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Sommeil (h)<input name="sleep_hours" type="number" min="0" max="24" step="0.5" inputMode="decimal" className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-on-surface" /></label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Stress (1–5)<select name="stress_level" defaultValue="" className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-on-surface"><option value="">Non précisé</option>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
            <label className="flex items-center gap-2 self-end pb-2 font-body-md text-body-md text-on-surface"><input name="medication_taken" type="checkbox" value="true" /> Traitement pris</label>
            <label className="col-span-2 flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">Symptômes éventuels<textarea name="symptoms" rows={2} maxLength={500} placeholder="Facultatif" className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3 font-body-md text-on-surface" /></label>
          </div>
        )}
      </section>

      {/* Pavé numérique */}
      <div className="grid grid-cols-3 gap-stack-sm">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => frappe(k)}
            aria-label={k === "⌫" ? "Effacer le dernier caractère" : k}
            className="flex h-14 items-center justify-center rounded-xl bg-surface-container-lowest font-title-lg text-title-lg text-on-surface shadow-sm transition-all hover:bg-surface-variant active:scale-95"
          >
            {k === "⌫" ? <Icon name="backspace" size={22} /> : k}
          </button>
        ))}
      </div>

      <FormMessage state={state} />
      <Submit disabled={!valide} />
    </form>
  );
}
