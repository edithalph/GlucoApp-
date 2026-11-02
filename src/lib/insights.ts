import type { GlucoseReading, ReadingContext } from "@/types/database";

export type Insight = { title: string; body: string; tone: "positive" | "attention" | "neutral" };

/** Des constats descriptifs, jamais des recommandations de traitement. */
export function glucoseInsights(
  readings: Pick<GlucoseReading, "value_mgdl" | "context" | "measured_at">[],
  targetMin: number,
  targetMax: number,
): Insight[] {
  if (readings.length < 3) return [{ title: "Encore quelques relevés", body: "Après 3 mesures ou plus, GlucoApp fera ressortir vos tendances par contexte.", tone: "neutral" }];
  const grouped = new Map<ReadingContext, number[]>();
  for (const r of readings) grouped.set(r.context, [...(grouped.get(r.context) ?? []), Number(r.value_mgdl)]);
  const insights: Insight[] = [];
  const inRange = readings.filter((r) => Number(r.value_mgdl) >= targetMin && Number(r.value_mgdl) <= targetMax).length;
  insights.push({ title: `${Math.round(inRange / readings.length * 100)} % dans votre cible`, body: `Sur ${readings.length} mesures récentes.`, tone: inRange / readings.length >= .7 ? "positive" : "attention" });
  for (const [context, values] of grouped) {
    if (values.length < 2) continue;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg > targetMax) insights.push({ title: `Tendance haute ${context === "fasting" ? "à jeun" : context === "post_meal" ? "après repas" : "dans ce contexte"}`, body: `Moyenne de ${Math.round(avg)} mg/dL sur ${values.length} relevés. À discuter avec votre équipe soignante si cela se répète.`, tone: "attention" });
  }
  return insights.slice(0, 3);
}
