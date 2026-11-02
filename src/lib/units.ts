/**
 * Gestion des unités glycémiques.
 *
 * Les maquettes Stitch utilisent trois unités différentes selon l'écran
 * (g/L sur le tableau de bord, mmol/L sur le profil, mg/dL sur la session thé).
 * On tranche ici : toute valeur est STOCKÉE en mg/dL (unité canonique, entière
 * et sans perte) et convertie à l'affichage selon la préférence de
 * l'utilisateur.
 */

export type GlucoseUnit = "g_l" | "mmol_l" | "mg_dl";

/** Facteur officiel de conversion glucose mg/dL → mmol/L (masse molaire 180,16 g/mol). */
const MMOL_FACTOR = 18.0182;

export const UNIT_LABELS: Record<GlucoseUnit, string> = {
  g_l: "g/L",
  mmol_l: "mmol/L",
  mg_dl: "mg/dL",
};

/** Nombre de décimales pertinent pour chaque unité. */
const UNIT_DECIMALS: Record<GlucoseUnit, number> = {
  g_l: 2,
  mmol_l: 1,
  mg_dl: 0,
};

/** Pas de saisie naturel pour chaque unité. */
export const UNIT_STEP: Record<GlucoseUnit, number> = {
  g_l: 0.01,
  mmol_l: 0.1,
  mg_dl: 1,
};

/** Bornes de saisie plausibles, exprimées en mg/dL. */
export const PLAUSIBLE_RANGE_MGDL = { min: 20, max: 600 } as const;

/** Convertit une valeur mg/dL vers l'unité demandée. */
export function fromMgdl(valueMgdl: number, unit: GlucoseUnit): number {
  switch (unit) {
    case "mg_dl":
      return valueMgdl;
    case "g_l":
      return valueMgdl / 100;
    case "mmol_l":
      return valueMgdl / MMOL_FACTOR;
  }
}

/**
 * Convertit une valeur exprimée dans `unit` vers l'unité canonique mg/dL.
 *
 * Le résultat est arrondi à deux décimales, la précision de la colonne
 * `numeric(6,2)`. Sans cela, `1,11 g/L` donne `111.00000000000001` en IEEE 754,
 * valeur qui transite telle quelle dans les formulaires et les journaux.
 */
export function toMgdl(value: number, unit: GlucoseUnit): number {
  const brut = (() => {
    switch (unit) {
      case "mg_dl":
        return value;
      case "g_l":
        return value * 100;
      case "mmol_l":
        return value * MMOL_FACTOR;
    }
  })();
  return Math.round(brut * 100) / 100;
}

/** Formate une valeur mg/dL pour l'affichage, sans le suffixe d'unité. */
export function formatGlucose(valueMgdl: number, unit: GlucoseUnit): string {
  const converted = fromMgdl(valueMgdl, unit);
  return converted.toFixed(UNIT_DECIMALS[unit]).replace(".", ",");
}

/** Formate une valeur mg/dL avec son suffixe d'unité — ex. « 1,12 g/L ». */
export function formatGlucoseWithUnit(
  valueMgdl: number,
  unit: GlucoseUnit,
): string {
  return `${formatGlucose(valueMgdl, unit)} ${UNIT_LABELS[unit]}`;
}

/**
 * Formate un écart (delta) en conservant le signe.
 * Utilisé par le résumé de session thé : « −0,22 g/L ».
 */
export function formatDelta(deltaMgdl: number, unit: GlucoseUnit): string {
  const converted = fromMgdl(Math.abs(deltaMgdl), unit);
  const sign = deltaMgdl < 0 ? "−" : "+";
  return `${sign}${converted.toFixed(UNIT_DECIMALS[unit]).replace(".", ",")} ${UNIT_LABELS[unit]}`;
}

/** Valide une saisie utilisateur exprimée dans `unit`. Retourne la valeur en mg/dL. */
export function parseGlucoseInput(
  raw: string,
  unit: GlucoseUnit,
): { ok: true; valueMgdl: number } | { ok: false; error: string } {
  const normalized = raw.replace(",", ".").trim();
  if (normalized === "") return { ok: false, error: "Saisissez une valeur." };

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: "Valeur non numérique." };
  }

  const valueMgdl = toMgdl(parsed, unit);
  if (
    valueMgdl < PLAUSIBLE_RANGE_MGDL.min ||
    valueMgdl > PLAUSIBLE_RANGE_MGDL.max
  ) {
    const lo = formatGlucose(PLAUSIBLE_RANGE_MGDL.min, unit);
    const hi = formatGlucose(PLAUSIBLE_RANGE_MGDL.max, unit);
    return {
      ok: false,
      error: `Valeur hors des bornes plausibles (${lo} – ${hi} ${UNIT_LABELS[unit]}).`,
    };
  }

  return { ok: true, valueMgdl };
}

/** Convertit un poids et une taille en IMC — écran « Profil médical, étape 1 ». */
export function computeBmi(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number.isFinite(bmi) ? bmi : null;
}

export type BmiCategory =
  | "Insuffisance pondérale"
  | "Corpulence normale"
  | "Surpoids"
  | "Obésité";

/**
 * Catégorie OMS correspondant à un IMC.
 *
 * On classe sur la valeur ARRONDIE à une décimale, celle que l'utilisateur
 * lit à l'écran. Sinon un IMC de 24,977 s'affiche « 25,0 » tout en étant
 * classé « Corpulence normale », ce qui se lit comme une erreur.
 */
export function bmiCategory(bmi: number): BmiCategory {
  const affiche = Math.round(bmi * 10) / 10;
  if (affiche < 18.5) return "Insuffisance pondérale";
  if (affiche < 25) return "Corpulence normale";
  if (affiche < 30) return "Surpoids";
  return "Obésité";
}
