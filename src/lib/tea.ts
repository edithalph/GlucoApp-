import type { TeaKind, TeaMeasurement, TeaSession } from "@/types/database";

/**
 * ============================================================================
 * Session « thé régulateur ».
 * ============================================================================
 *
 * Déroulé : mesure initiale → prise du thé → mesures à +30, +60 et +120 min.
 * Les décalages sont comptés depuis la prise du thé, pas depuis l'ouverture
 * de la session.
 *
 * MISE EN GARDE — l'effet affiché est OBSERVATIONNEL, pas causal. La glycémie
 * redescend spontanément après un pic post-prandial, thé ou non. Une baisse
 * constatée pendant une session ne prouve donc pas que le thé en soit la
 * cause. Ces mesures servent à repérer des tendances personnelles sur la durée,
 * pas à établir un effet thérapeutique.
 */

/** Décalages proposés après la prise du thé, en minutes. */
export const TEA_OFFSETS = [30, 60, 120] as const;
export type TeaOffset = (typeof TEA_OFFSETS)[number];

/**
 * Thé mis en avant dans l'application.
 *
 * C'est une décision ÉDITORIALE, pas clinique : `expected_effect_pct` reste
 * inchangé pour ce thé comme pour les autres. Gonfler cette valeur afin de le
 * faire remonter reviendrait à maquiller une donnée d'efficacité affichée à
 * l'utilisateur — le classement se fait donc sur un critère séparé et assumé.
 *
 * Si le catalogue devait accueillir plusieurs thés maison, cette constante
 * aurait vocation à devenir une colonne `is_house` sur la table `teas`.
 */
export const THE_MAISON = "AFRAthé";

export function estTheMaison(nom: string): boolean {
  return nom === THE_MAISON;
}

/**
 * Ordonne le catalogue : le thé maison d'abord, puis par effet attendu
 * décroissant. Le tri se fait ici plutôt qu'en SQL car il mêle un critère
 * éditorial et un critère de données.
 */
export function trierThes<T extends { name: string; expected_effect_pct: number | null }>(
  thes: T[],
): T[] {
  return [...thes].sort((a, b) => {
    const ma = estTheMaison(a.name) ? 0 : 1;
    const mb = estTheMaison(b.name) ? 0 : 1;
    if (ma !== mb) return ma - mb;
    return (a.expected_effect_pct ?? 0) - (b.expected_effect_pct ?? 0);
  });
}

/**
 * « de » ou « d' » selon l'initiale du nom.
 *
 * Les noms de thés sont libres : sans élision, on obtient « une infusion de
 * AFRAthé ». On traite aussi le h muet, courant en français.
 */
export function avecElision(nom: string): string {
  const initiale = nom.trim().charAt(0).toLowerCase();
  const voyelles = "aeiouyàâäéèêëîïôöùûü";
  return voyelles.includes(initiale) || initiale === "h"
    ? `d'${nom}`
    : `de ${nom}`;
}

export const TEA_KIND_LABELS: Record<TeaKind, string> = {
  green: "Thé vert",
  black: "Thé noir",
  oolong: "Oolong",
  herbal: "Tisane",
  matcha: "Matcha",
  white: "Thé blanc",
  other: "Autre",
};

/** Étape courante d'une session active. */
export type SessionStep =
  | "awaiting_tea" // mesure initiale prise, thé pas encore consommé
  | "awaiting_measurement" // thé pris, une mesure est attendue
  | "complete"; // les trois mesures sont enregistrées

export function sessionStep(
  session: Pick<TeaSession, "tea_taken_at">,
  measurements: Pick<TeaMeasurement, "offset_minutes">[],
): SessionStep {
  if (!session.tea_taken_at) return "awaiting_tea";
  const faits = new Set(measurements.map((m) => m.offset_minutes));
  return TEA_OFFSETS.every((o) => faits.has(o))
    ? "complete"
    : "awaiting_measurement";
}

/** Prochain décalage attendu, ou null si la session est complète. */
export function nextOffset(
  measurements: Pick<TeaMeasurement, "offset_minutes">[],
): TeaOffset | null {
  const faits = new Set(measurements.map((m) => m.offset_minutes));
  return TEA_OFFSETS.find((o) => !faits.has(o)) ?? null;
}

/** Instant théorique de la prochaine mesure. */
export function nextMeasurementAt(
  teaTakenAt: string,
  offset: TeaOffset,
): Date {
  return new Date(new Date(teaTakenAt).getTime() + offset * 60_000);
}

export type TeaEffect = {
  baselineMgdl: number;
  /** Dernière mesure enregistrée après la prise du thé. */
  finalMgdl: number;
  /** finalMgdl − baselineMgdl (négatif = baisse). */
  deltaMgdl: number;
  /** Variation relative, en pourcentage arrondi. */
  percent: number;
  /** Décalage de la dernière mesure, en minutes. */
  overMinutes: number;
};

/**
 * Effet observé sur la session : écart entre la mesure initiale et la
 * DERNIÈRE mesure enregistrée. On ne retient pas le minimum de la série,
 * qui donnerait systématiquement un résultat flatteur.
 */
export function computeEffect(
  baselineMgdl: number | null,
  measurements: Pick<TeaMeasurement, "offset_minutes" | "value_mgdl">[],
): TeaEffect | null {
  if (baselineMgdl === null || measurements.length === 0) return null;

  const triees = [...measurements].sort(
    (a, b) => a.offset_minutes - b.offset_minutes,
  );
  const derniere = triees[triees.length - 1];

  const base = Number(baselineMgdl);
  const finale = Number(derniere.value_mgdl);
  const delta = finale - base;

  return {
    baselineMgdl: base,
    finalMgdl: finale,
    deltaMgdl: delta,
    percent: Math.round((delta / base) * 100),
    overMinutes: derniere.offset_minutes,
  };
}

export type EffectAppreciation = {
  label: string;
  icon: string;
  chip: string;
};

/**
 * Qualification de l'effet observé.
 * Le seuil de 5 % écarte le bruit de mesure : les lecteurs grand public ont
 * une marge d'erreur du même ordre, une variation plus faible n'est pas
 * interprétable.
 */
export function appreciateEffect(percent: number): EffectAppreciation {
  if (percent <= -5) {
    return {
      label: "Baisse observée",
      icon: "arrow_downward",
      chip: "bg-primary-fixed text-on-primary-fixed-variant",
    };
  }
  if (percent >= 5) {
    return {
      label: "Hausse observée",
      icon: "arrow_upward",
      chip: "bg-error-container text-on-error-container",
    };
  }
  return {
    label: "Stable",
    icon: "trending_flat",
    chip: "bg-surface-container-highest text-on-surface-variant",
  };
}

export type WeeklyStats = {
  sessions: number;
  /** Moyenne des variations relatives, en pourcentage. Null si aucune session complète. */
  averagePercent: number | null;
  trend: "favorable" | "defavorable" | "stable" | null;
};

/** Statistiques de l'encart « Stats de la semaine ». */
export function computeWeeklyStats(
  effets: (TeaEffect | null)[],
): WeeklyStats {
  const valides = effets.filter((e): e is TeaEffect => e !== null);

  if (valides.length === 0) {
    return { sessions: effets.length, averagePercent: null, trend: null };
  }

  const moyenne =
    valides.reduce((s, e) => s + e.percent, 0) / valides.length;

  return {
    sessions: effets.length,
    averagePercent: Math.round(moyenne),
    trend: moyenne <= -5 ? "favorable" : moyenne >= 5 ? "defavorable" : "stable",
  };
}

export const TREND_LABELS: Record<
  NonNullable<WeeklyStats["trend"]>,
  { label: string; icon: string; color: string }
> = {
  favorable: {
    label: "Favorable",
    icon: "trending_down",
    color: "text-primary",
  },
  defavorable: {
    label: "À surveiller",
    icon: "trending_up",
    color: "text-error",
  },
  stable: { label: "Stable", icon: "trending_flat", color: "text-secondary" },
};

/** « 15:00 » restant avant la prochaine mesure. */
export function formatCountdown(msRestants: number): string {
  if (msRestants <= 0) return "maintenant";
  const total = Math.ceil(msRestants / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}
