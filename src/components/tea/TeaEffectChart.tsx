import { LineChart, type Point } from "@/components/charts/LineChart";
import { UNIT_LABELS, fromMgdl, type GlucoseUnit } from "@/lib/units";

export type TeaPoint = { label: string; valueMgdl: number };

/**
 * Courbe avant / après thé, avec la zone cible du profil en fond.
 * Comme la courbe glycémique, rendue entièrement côté serveur.
 */
export function TeaEffectChart({
  points,
  unit,
  targetMin,
  targetMax,
}: {
  points: TeaPoint[];
  unit: GlucoseUnit;
  targetMin: number;
  targetMax: number;
}) {
  const decimales = unit === "mg_dl" ? 0 : unit === "mmol_l" ? 1 : 2;
  const format = (v: number) => v.toFixed(decimales).replace(".", ",");

  // L'abscisse est catégorielle (« Avant », « +30 min »…) : on l'indexe.
  const libelles = points.map((p) => p.label);

  const donnees: Point[] = points.map((p, i) => {
    const valeur = fromMgdl(p.valueMgdl, unit);
    return {
      x: i,
      y: valeur,
      info: `${p.label} — ${format(valeur)} ${UNIT_LABELS[unit]}`,
    };
  });

  return (
    <LineChart
      points={donnees}
      bandeMin={fromMgdl(targetMin, unit)}
      bandeMax={fromMgdl(targetMax, unit)}
      formatValeur={format}
      formatAbscisse={(x) => libelles[Math.round(x)] ?? ""}
      couleur="#785209"
      messageVide="Aucune mesure à représenter."
    />
  );
}
