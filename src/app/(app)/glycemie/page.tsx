import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { GlucoseChart } from "@/components/glucose/GlucoseChart";
import { ReadingRow } from "@/components/glucose/ReadingRow";
import { BoutonSuppression } from "@/components/ui/BoutonSuppression";
import { supprimerReleve } from "./actions";
import { formatGlucose, UNIT_LABELS, type GlucoseUnit } from "@/lib/units";
import {
  computeStats,
  computeTrend,
  PERIOD_LABELS,
  periodStart,
  type Period,
} from "@/lib/glycemia";
import { glucoseInsights } from "@/lib/insights";

const PERIODS: Period[] = ["today", "7d", "30d", "3m"];

function estPeriode(v: string | undefined): v is Period {
  return PERIODS.includes(v as Period);
}

export default async function GlycemiePage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode: brut } = await searchParams;
  const periode: Period = estPeriode(brut) ? brut : "7d";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: profile }, { data: releves }] = await Promise.all([
    supabase
      .from("profiles")
      .select("preferred_unit, target_min_mgdl, target_max_mgdl")
      .eq("id", user.id)
      .single(),
    supabase
      .from("glucose_readings")
      .select("id, value_mgdl, context, measured_at")
      .eq("user_id", user.id)
      .gte("measured_at", periodStart(periode).toISOString())
      .order("measured_at", { ascending: false }),
  ]);

  const unit = (profile?.preferred_unit ?? "g_l") as GlucoseUnit;
  const targetMin = Number(profile?.target_min_mgdl ?? 70);
  const targetMax = Number(profile?.target_max_mgdl ?? 140);

  const liste = releves ?? [];
  const stats = computeStats(liste, targetMin, targetMax);
  const insights = glucoseInsights(liste, targetMin, targetMax);

  // Si la période sélectionnée est vide, on regarde s'il existe des relevés
  // ailleurs. Sans cela l'utilisateur tombe sur un écran vide et conclut que
  // ses données ont disparu — alors qu'il lui suffit d'élargir la période.
  const { data: dernierGlobal } =
    liste.length === 0
      ? await supabase
          .from("glucose_readings")
          .select("measured_at")
          .eq("user_id", user.id)
          .order("measured_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

  // La courbe se lit dans le sens chronologique.
  const chrono = [...liste].reverse();

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop pt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          Ma glycémie
        </h1>
        <Link
          href="/glycemie/saisie"
          className="flex items-center gap-1.5 rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <Icon name="add" size={18} />
          Mesurer
        </Link>
      </div>

      {/* Filtres de période */}
      {/* Retour à la ligne plutôt que défilement horizontal : sur un écran
          étroit, le filtre actif se retrouvait coupé au bord et donc invisible
          sans geste de défilement. */}
      <nav aria-label="Période" className="flex flex-wrap gap-stack-sm">
        {PERIODS.map((p) => {
          const actif = p === periode;
          return (
            <Link
              key={p}
              href={`/glycemie?periode=${p}`}
              prefetch={false}
              aria-current={actif ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 font-body-md text-body-md transition-all ${
                actif
                  ? "bg-primary-container text-on-primary shadow-sm"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {PERIOD_LABELS[p]}
            </Link>
          );
        })}
      </nav>

      {/* Statistiques */}
      <section className="grid grid-cols-2 gap-stack-sm md:grid-cols-4">
        {[
          {
            label: "Moyenne",
            valeur: stats.average,
            suffixe: UNIT_LABELS[unit],
          },
          { label: "Min", valeur: stats.min, suffixe: UNIT_LABELS[unit] },
          { label: "Max", valeur: stats.max, suffixe: UNIT_LABELS[unit] },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
          >
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              {s.label}
            </span>
            <span className="font-title-lg text-title-lg tabular-nums text-on-surface">
              {s.valeur === null ? "—" : formatGlucose(s.valeur, unit)}{" "}
              <span className="font-body-md text-body-md text-on-surface-variant">
                {s.valeur === null ? "" : s.suffixe}
              </span>
            </span>
          </div>
        ))}

        <div className="flex flex-col gap-1 rounded-xl bg-primary-fixed p-4 shadow-sm">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-primary-fixed-variant">
            Dans la cible
          </span>
          <span className="font-title-lg text-title-lg tabular-nums text-on-primary-fixed">
            {stats.inRangePercent === null ? "—" : `${stats.inRangePercent} %`}
          </span>
        </div>
      </section>

      {/* Courbe */}
      <section className="flex flex-col gap-stack-sm rounded-xl bg-surface-container-lowest p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-title-lg text-title-lg text-on-background">
            Évolution
          </h2>
          <span className="font-label-md text-label-md text-on-surface-variant">
            Zone cible : {formatGlucose(targetMin, unit)} –{" "}
            {formatGlucose(targetMax, unit)} {UNIT_LABELS[unit]}
          </span>
        </div>
        <GlucoseChart
          points={chrono.map((r) => ({
            at: r.measured_at,
            valueMgdl: Number(r.value_mgdl),
          }))}
          unit={unit}
          targetMin={targetMin}
          targetMax={targetMax}
        />
      </section>

      <section className="flex flex-col gap-stack-sm">
        <h2 className="font-title-lg text-title-lg text-on-background">
          Ce que vos données indiquent
        </h2>
        <div className="grid gap-stack-sm md:grid-cols-3">
          {insights.map((insight) => (
            <article
              key={insight.title}
              className={`rounded-xl p-4 ${insight.tone === "positive" ? "bg-primary-fixed" : insight.tone === "attention" ? "bg-tertiary-fixed/50" : "bg-surface-container-low"}`}
            >
              <h3 className="font-title-lg text-title-lg text-on-surface">
                {insight.title}
              </h3>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {insight.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Derniers relevés */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="font-title-lg text-title-lg text-on-background">
          Derniers relevés
          {stats.count > 0 && (
            <span className="ml-2 font-body-md text-body-md text-on-surface-variant">
              ({stats.count})
            </span>
          )}
        </h2>

        {liste.length === 0 ? (
          <div className="flex flex-col items-center gap-stack-md rounded-xl bg-surface-container-low p-8 text-center">
            <Icon name="bloodtype" size={40} className="text-outline" fill />
            <p className="font-body-md text-body-md text-on-surface-variant">
              {dernierGlobal
                ? `Aucun relevé sur cette période. Votre dernier remonte au ${new Date(dernierGlobal.measured_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
                : "Aucun relevé enregistré pour l'instant."}
            </p>

            <div className="flex flex-wrap justify-center gap-stack-sm">
              {dernierGlobal && periode !== "3m" && (
                <Link
                  href="/glycemie?periode=3m"
                  className="flex items-center gap-1.5 rounded-full border border-outline-variant px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-variant"
                >
                  <Icon name="history" size={16} />
                  Voir sur 3 mois
                </Link>
              )}
              <Link
                href="/glycemie/saisie"
                className="rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary"
              >
                {dernierGlobal
                  ? "Saisir une mesure"
                  : "Saisir ma première mesure"}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-stack-sm">
            {liste.map((r, i) => (
              <ReadingRow
                key={r.id}
                valueMgdl={Number(r.value_mgdl)}
                context={r.context}
                measuredAt={r.measured_at}
                // La liste est antichronologique : le relevé « précédent »
                // dans le temps est l'élément suivant du tableau.
                trend={computeTrend(
                  Number(r.value_mgdl),
                  liste[i + 1] ? Number(liste[i + 1].value_mgdl) : null,
                )}
                unit={unit}
                targetMin={targetMin}
                targetMax={targetMax}
                actions={
                  <BoutonSuppression
                    action={supprimerReleve.bind(null, r.id)}
                    libelle={`le relevé du ${new Date(r.measured_at).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`}
                  />
                }
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
