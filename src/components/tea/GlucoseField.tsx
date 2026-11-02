"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  UNIT_LABELS,
  UNIT_STEP,
  parseGlucoseInput,
  type GlucoseUnit,
} from "@/lib/units";

/**
 * Saisie d'une glycémie dans l'unité du profil, convertie en mg/dL dans un
 * champ caché. La validation est identique à celle de l'écran de saisie
 * principal — mêmes bornes de plausibilité.
 */
export function GlucoseField({
  name,
  label,
  unit,
  onValidityChange,
}: {
  name: string;
  label: string;
  unit: GlucoseUnit;
  onValidityChange?: (valide: boolean) => void;
}) {
  const [saisie, setSaisie] = useState("");

  const validation = saisie === "" ? null : parseGlucoseInput(saisie, unit);
  const valeurMgdl = validation?.ok ? validation.valueMgdl : "";

  function changer(v: string) {
    setSaisie(v);
    const r = v === "" ? null : parseGlucoseInput(v, unit);
    onValidityChange?.(r?.ok === true);
  }

  return (
    <div className="flex flex-col gap-stack-sm">
      <label
        htmlFor={`champ-${name}`}
        className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant"
      >
        {label}
      </label>

      <div className="flex items-center gap-3">
        <input
          id={`champ-${name}`}
          type="number"
          inputMode="decimal"
          step={UNIT_STEP[unit]}
          value={saisie}
          onChange={(e) => changer(e.target.value)}
          placeholder="—"
          className="h-14 min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 font-title-lg text-title-lg tabular-nums text-on-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="font-body-lg text-body-lg text-on-surface-variant">
          {UNIT_LABELS[unit]}
        </span>
      </div>

      <input type="hidden" name={name} value={valeurMgdl} readOnly />

      {validation && !validation.ok && (
        <p className="flex items-center gap-1.5 font-label-md text-label-md text-error">
          <Icon name="error" size={14} />
          {validation.error}
        </p>
      )}
    </div>
  );
}
