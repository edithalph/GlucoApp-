import { LineChart, type Point } from "@/components/charts/LineChart";
import { UNIT_LABELS, fromMgdl, type GlucoseUnit } from "@/lib/units";

export type ChartPoint = {
  /** Horodatage ISO du relevé. */
  at: string;
  valueMgdl: number;
};

/**
 * Courbe d'évolution de la glycémie avec zone cible ombrée.
 *
 * Composant serveur : le SVG part déjà tracé dans le HTML, aucun JavaScript
 * n'est expédié pour l'afficher.
 */
export function GlucoseChart({
  points,
  unit,
  targetMin,
  targetMax,
}: {
  points: ChartPoint[];
  unit: GlucoseUnit;
  targetMin: number;
  targetMax: number;
}) {
  const decimales = unit === "mg_dl" ? 0 : unit === "mmol_l" ? 1 : 2;
  const format = (v: number) => v.toFixed(decimales).replace(".", ",");

  const donnees: Point[] = points.map((p) => {
    const date = new Date(p.at);
    const valeur = fromMgdl(p.valueMgdl, unit);
    return {
      x: date.getTime(),
      y: valeur,
      info: `${date.toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })} — ${format(valeur)} ${UNIT_LABELS[unit]}`,
    };
  });

  return (
    <LineChart
      points={donnees}
      bandeMin={fromMgdl(targetMin, unit)}
      bandeMax={fromMgdl(targetMax, unit)}
      formatValeur={format}
      formatAbscisse={(x) =>
        new Date(x).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })
      }
      couleur="#2f6388"
      messageVide="Pas encore assez de relevés pour tracer une courbe."
    />
  );
}
