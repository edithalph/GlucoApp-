import type { Food, MedicalCondition, RiskLevel } from "@/types/database";

/**
 * ============================================================================
 * Modèle d'estimation de l'impact glycémique d'un repas.
 * ============================================================================
 *
 * AVERTISSEMENT — Ce modèle est une heuristique de population, volontairement
 * simple et transparente. Il n'est PAS un dispositif médical, ne remplace pas
 * une mesure réelle, et ne tient pas compte de facteurs déterminants comme
 * l'insulinothérapie en cours, l'activité physique récente, le stress, le
 * sommeil, la vidange gastrique individuelle ou la sensibilité propre à la
 * personne. La réponse glycémique à un même repas varie fortement d'un individu
 * à l'autre, et chez une même personne d'un jour à l'autre.
 *
 * Il sert à donner un ORDRE DE GRANDEUR et à hiérarchiser des repas entre eux,
 * pas à prédire une valeur. Toute décision thérapeutique doit reposer sur une
 * mesure réelle et l'avis d'un professionnel de santé.
 */

export type MealItemWithFood = {
  quantity_g: number;
  food: Pick<
    Food,
    | "name"
    | "glycemic_index"
    | "carbs_per_100g"
    | "kcal_per_100g"
    | "protein_per_100g"
    | "fat_per_100g"
    | "fiber_per_100g"
    | "is_verified"
  >;
};

/**
 * IG retenu lorsque le catalogue ne renseigne pas celui de l'aliment.
 *
 * Sans cette valeur, `glycemic_index` à null contribuait ZÉRO à la charge
 * glycémique : une assiette d'un féculent non référencé s'affichait « charge
 * faible, risque faible ». C'est l'erreur la plus dangereuse que ce module
 * puisse commettre. On retient donc le seuil d'entrée de la catégorie « IG
 * élevé » — sur-alerter plutôt que sous-alerter — et `unknownGiFoods` permet à
 * l'interface de dire clairement que le chiffre est une majoration.
 */
export const IG_PAR_DEFAUT = 70;

/**
 * Classement d'un index glycémique.
 * Barème usuel, sur l'échelle où le glucose vaut 100 :
 * bas <= 55, moyen 56–69, élevé >= 70.
 */
export type IgBand = "bas" | "moyen" | "eleve";

export function igBand(ig: number): IgBand {
  if (ig <= 55) return "bas";
  if (ig <= 69) return "moyen";
  return "eleve";
}

export const IG_BAND_LABELS: Record<IgBand, string> = {
  bas: "bas",
  moyen: "moyen",
  eleve: "élevé",
};

export const IG_BAND_STYLES: Record<IgBand, string> = {
  bas: "text-primary",
  moyen: "text-on-surface-variant",
  eleve: "text-error",
};

export type MealTotals = {
  kcal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
  /** Charge glycémique : Σ (IG × glucides disponibles) / 100. */
  glycemicLoad: number;
  /** Aliments glucidiques dont l'IG est inconnu et a été majoré à IG_PAR_DEFAUT. */
  unknownGiFoods: string[];
};

/** Totaux nutritionnels d'une composition de repas. */
export function computeTotals(items: MealItemWithFood[]): MealTotals {
  return items.reduce<MealTotals>(
    (acc, { quantity_g, food }) => {
      const ratio = quantity_g / 100;
      const carbs = Number(food.carbs_per_100g) * ratio;

      // Un aliment sans glucides n'a pas de charge glycémique, quel que soit
      // son IG. Un aliment glucidique sans IG est majoré, jamais ignoré.
      const igInconnu = food.glycemic_index === null && carbs > 0;
      const ig = igInconnu ? IG_PAR_DEFAUT : (food.glycemic_index ?? 0);

      return {
        kcal: acc.kcal + Number(food.kcal_per_100g) * ratio,
        carbsG: acc.carbsG + carbs,
        proteinG: acc.proteinG + Number(food.protein_per_100g) * ratio,
        fatG: acc.fatG + Number(food.fat_per_100g) * ratio,
        fiberG: acc.fiberG + Number(food.fiber_per_100g) * ratio,
        glycemicLoad: acc.glycemicLoad + (ig * carbs) / 100,
        unknownGiFoods: igInconnu
          ? [...acc.unknownGiFoods, food.name]
          : acc.unknownGiFoods,
      };
    },
    {
      kcal: 0,
      carbsG: 0,
      proteinG: 0,
      fatG: 0,
      fiberG: 0,
      glycemicLoad: 0,
      unknownGiFoods: [],
    },
  );
}

/**
 * Classification usuelle de la charge glycémique d'un repas :
 * basse <= 10, moyenne 11–19, élevée >= 20.
 */
export type GlycemicLoadBand = "low" | "moderate" | "high";

export function glycemicLoadBand(gl: number): GlycemicLoadBand {
  if (gl <= 10) return "low";
  if (gl < 20) return "moderate";
  return "high";
}

export const GL_BAND_LABELS: Record<GlycemicLoadBand, string> = {
  low: "Faible",
  moderate: "Modérée",
  high: "Élevée",
};

export const GL_BAND_STYLES: Record<GlycemicLoadBand, string> = {
  low: "bg-primary-fixed text-on-primary-fixed-variant",
  moderate: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  high: "bg-error-container text-on-error-container",
};

/**
 * Élévation glycémique attendue par unité de charge glycémique, en mg/dL.
 *
 * Ces coefficients traduisent le fait qu'à charge glucidique égale, une réponse
 * glycémique est d'autant plus ample que la tolérance au glucose est dégradée.
 * Ce sont des ordres de grandeur choisis pour rester conservateurs (plutôt
 * sur-alerter que sous-alerter), pas des constantes physiologiques mesurées.
 */
const RISE_PER_GL_UNIT: Record<MedicalCondition, number> = {
  type1: 3.5,
  type2: 3.0,
  prediabetic: 2.2,
  prevention: 1.6,
  other: 2.2,
};

/** Coefficient par défaut lorsque la situation n'est pas renseignée. */
const DEFAULT_RISE_PER_GL_UNIT = 2.2;

export type Prediction = {
  baselineMgdl: number;
  peakMgdl: number;
  riseMgdl: number;
  peakMinutes: number;
  risk: RiskLevel;
  /** Part de l'atténuation due aux fibres, en % (0 si aucune fibre). */
  fiberDampeningPercent: number;
};

/**
 * Estime le pic glycémique post-prandial.
 *
 * Trois effets sont modélisés :
 *   1. L'amplitude suit la charge glycémique, pondérée par la situation médicale.
 *   2. Les fibres solubles ralentissent l'absorption et écrêtent le pic
 *      (atténuation plafonnée à 25 %, au-delà l'effet marginal est négligeable).
 *   3. Les lipides et protéines retardent la vidange gastrique, donc décalent
 *      le pic dans le temps sans en réduire l'amplitude totale.
 */
export function predictImpact({
  totals,
  baselineMgdl,
  targetMaxMgdl,
  condition,
}: {
  totals: MealTotals;
  baselineMgdl: number;
  targetMaxMgdl: number;
  condition: MedicalCondition | null;
}): Prediction {
  const coefficient = condition
    ? RISE_PER_GL_UNIT[condition]
    : DEFAULT_RISE_PER_GL_UNIT;

  // Atténuation par les fibres : ~1,5 % par gramme, plafonnée à 25 %.
  const fiberDampening = Math.min(0.25, totals.fiberG * 0.015);
  const riseMgdl = totals.glycemicLoad * coefficient * (1 - fiberDampening);

  const peakMgdl = baselineMgdl + riseMgdl;

  // Pic à ~45 min pour un repas glucidique simple, retardé jusqu'à +45 min
  // par les lipides et protéines.
  const delaiSupplementaire = Math.min(
    45,
    (totals.fatG + totals.proteinG) * 0.6,
  );
  const peakMinutes = Math.round(45 + delaiSupplementaire);

  return {
    baselineMgdl,
    peakMgdl,
    riseMgdl,
    peakMinutes,
    risk: assessRisk(peakMgdl, targetMaxMgdl),
    fiberDampeningPercent: Math.round(fiberDampening * 100),
  };
}

/**
 * Niveau de risque du pic estimé, relatif à la cible du profil.
 *
 * Le seuil de 15 % au-dessus de la borne haute sépare « modéré » d'« élevé » :
 * un dépassement ponctuel et léger de la cible est courant et sans gravité,
 * un dépassement franc mérite d'être signalé.
 */
export function assessRisk(peakMgdl: number, targetMaxMgdl: number): RiskLevel {
  if (targetMaxMgdl <= 0) return "low";
  if (peakMgdl <= targetMaxMgdl) return "low";
  if (peakMgdl <= targetMaxMgdl * 1.15) return "moderate";
  return "high";
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Faible",
  moderate: "Modéré",
  high: "Élevé",
};

export const RISK_STYLES: Record<
  RiskLevel,
  { chip: string; card: string; icon: string }
> = {
  low: {
    chip: "bg-primary-fixed text-on-primary-fixed-variant",
    card: "bg-primary-fixed/40 border-primary-fixed-dim",
    icon: "check_circle",
  },
  moderate: {
    chip: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    card: "bg-tertiary-fixed/40 border-tertiary-fixed-dim",
    icon: "info",
  },
  high: {
    chip: "bg-error-container text-on-error-container",
    card: "bg-error-container/60 border-error",
    icon: "warning",
  },
};

export const RISK_MESSAGES: Record<RiskLevel, string> = {
  low: "Ce repas devrait rester dans votre zone cible.",
  moderate:
    "Ce repas pourrait dépasser légèrement votre zone cible. Quelques ajustements simples suffisent généralement.",
  high: "Ce repas risque de provoquer une hyperglycémie importante. Voici des actions qui peuvent aider.",
};

/** Glycémie de repli quand aucune mesure récente n'est disponible (mg/dL). */
export const DEFAULT_BASELINE_MGDL = 100;
