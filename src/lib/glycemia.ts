import type { GlucoseReading, ReadingContext } from "@/types/database";

/** Libellés français des contextes de mesure, tels qu'affichés dans les maquettes. */
export const CONTEXT_LABELS: Record<ReadingContext, string> = {
  fasting: "À jeun",
  pre_meal: "Avant repas",
  post_meal: "Après repas",
  pre_tea: "Avant thé",
  post_tea: "Après thé",
  other: "Autre",
};

/** Icône Material Symbols associée à chaque contexte. */
export const CONTEXT_ICONS: Record<ReadingContext, string> = {
  fasting: "wb_twilight",
  pre_meal: "restaurant",
  post_meal: "dinner_dining",
  pre_tea: "local_cafe",
  post_tea: "emoji_food_beverage",
  other: "schedule",
};

/** Contextes proposés à la saisie (l'écran « Saisie » n'en montre que quatre). */
export const INPUT_CONTEXTS: ReadingContext[] = [
  "fasting",
  "pre_meal",
  "post_meal",
  "pre_tea",
];

export type Period = "today" | "7d" | "30d" | "3m";

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  "7d": "7 jours",
  "30d": "30 jours",
  "3m": "3 mois",
};

/** Date de début de la période, pour filtrer les relevés. */
export function periodStart(period: Period, now = new Date()): Date {
  const d = new Date(now);
  switch (period) {
    case "today":
      d.setHours(0, 0, 0, 0);
      return d;
    case "7d":
      d.setDate(d.getDate() - 7);
      return d;
    case "30d":
      d.setDate(d.getDate() - 30);
      return d;
    case "3m":
      d.setMonth(d.getMonth() - 3);
      return d;
  }
}

export type GlucoseStats = {
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
  /** Part des relevés dans la zone cible, en pourcentage entier. */
  inRangePercent: number | null;
};

/**
 * Statistiques de l'écran « Historique ».
 * Toutes les valeurs sont en mg/dL — la conversion se fait à l'affichage.
 */
export function computeStats(
  readings: Pick<GlucoseReading, "value_mgdl">[],
  targetMin: number,
  targetMax: number,
): GlucoseStats {
  if (readings.length === 0) {
    return { count: 0, average: null, min: null, max: null, inRangePercent: null };
  }

  const values = readings.map((r) => Number(r.value_mgdl));
  const sum = values.reduce((a, b) => a + b, 0);
  const inRange = values.filter((v) => v >= targetMin && v <= targetMax).length;

  return {
    count: values.length,
    average: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    inRangePercent: Math.round((inRange / values.length) * 100),
  };
}

export type ReadingStatus = "low" | "in_range" | "high";

/** Positionne une valeur par rapport à la zone cible du profil. */
export function readingStatus(
  valueMgdl: number,
  targetMin: number,
  targetMax: number,
): ReadingStatus {
  if (valueMgdl < targetMin) return "low";
  if (valueMgdl > targetMax) return "high";
  return "in_range";
}

/** Classes de couleur associées à un statut, tirées du design system. */
export const STATUS_STYLES: Record<
  ReadingStatus,
  { chip: string; label: string }
> = {
  low: {
    chip: "bg-secondary-fixed text-on-secondary-fixed-variant",
    label: "Basse",
  },
  in_range: {
    chip: "bg-primary-fixed text-on-primary-fixed-variant",
    label: "Dans la cible",
  },
  high: {
    chip: "bg-error-container text-on-error-container",
    label: "Élevée",
  },
};

export type Trend = "up" | "down" | "flat";

/** Icône de tendance entre deux relevés successifs (seuil : 10 mg/dL). */
export function trendIcon(trend: Trend): string {
  return trend === "up"
    ? "trending_up"
    : trend === "down"
      ? "trending_down"
      : "trending_flat";
}

/**
 * Tendance d'un relevé par rapport au précédent.
 * Le seuil de 10 mg/dL évite d'afficher une flèche pour du bruit de mesure —
 * les lecteurs de glycémie grand public ont une marge d'erreur de cet ordre.
 */
export function computeTrend(
  valueMgdl: number,
  previousMgdl: number | null,
): Trend {
  if (previousMgdl === null) return "flat";
  const delta = valueMgdl - previousMgdl;
  if (delta > 10) return "up";
  if (delta < -10) return "down";
  return "flat";
}

/** « Il y a 2 heures », « Hier, 20:15 », « 22 oct., 10:15 ». */
export function formatRelative(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24 && date.toDateString() === now.toDateString()) {
    return `Il y a ${diffH} heure${diffH > 1 ? "s" : ""}`;
  }

  const heure = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hier = new Date(now);
  hier.setDate(hier.getDate() - 1);
  if (date.toDateString() === hier.toDateString()) return `Hier, ${heure}`;

  if (date.toDateString() === now.toDateString()) return heure;

  return `${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}, ${heure}`;
}
