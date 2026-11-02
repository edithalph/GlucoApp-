import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { AvertissementMedical } from "@/components/nutrition/AvertissementMedical";
import { enregistrerPrediction } from "../../actions";
import { formatGlucose, UNIT_LABELS, type GlucoseUnit } from "@/lib/units";
import { formatRelative } from "@/lib/glycemia";
import { avecElision, trierThes } from "@/lib/tea";
import {
  computeTotals,
  DEFAULT_BASELINE_MGDL,
  glycemicLoadBand,
  GL_BAND_LABELS,
  GL_BAND_STYLES,
  predictImpact,
  RISK_LABELS,
  RISK_MESSAGES,
  RISK_STYLES,
  type MealItemWithFood,
} from "@/lib/nutrition";

export default async function ImpactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: profile }, { data: repas }, { data: dernier }, { data: thes }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("preferred_unit, target_max_mgdl, condition")
        .eq("id", user.id)
        .single(),
      supabase
        .from("meals")
        .select(
          "id, name, eaten_at, meal_items(quantity_g, foods(name, glycemic_index, carbs_per_100g, kcal_per_100g, protein_per_100g, fat_per_100g, fiber_per_100g, is_verified))",
        )
        .eq("id", id)
        // Double la RLS : cette page ne doit pas devenir un accès aux repas
        // d'autrui si une policy était un jour assouplie par erreur.
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("glucose_readings")
        .select("value_mgdl, measured_at")
        .eq("user_id", user.id)
        .order("measured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("teas")
        .select("name, kind, expected_effect_pct")
        .not("expected_effect_pct", "is", null),
    ]);

  if (!repas) notFound();

  const unit = (profile?.preferred_unit ?? "g_l") as GlucoseUnit;
  const targetMax = Number(profile?.target_max_mgdl ?? 140);

  // `foods` peut être nul si l'aliment a disparu du catalogue entre-temps.
  const items: MealItemWithFood[] = (repas.meal_items ?? [])
    .filter((l) => l.foods !== null)
    .map((l) => ({ quantity_g: Number(l.quantity_g), food: l.foods! }));

  const totaux = computeTotals(items);
  const baseline = dernier
    ? Number(dernier.value_mgdl)
    : DEFAULT_BASELINE_MGDL;

  const prediction = predictImpact({
    totals: totaux,
    baselineMgdl: baseline,
    targetMaxMgdl: targetMax,
    condition: profile?.condition ?? null,
  });

  // Historise l'estimation affichée. Permet, plus tard, de la confronter aux
  // glycémies réellement mesurées et d'ajuster les coefficients du modèle.
  await enregistrerPrediction({
    mealId: id,
    baselineMgdl: prediction.baselineMgdl,
    peakMgdl: prediction.peakMgdl,
    peakMinutes: prediction.peakMinutes,
    risk: prediction.risk,
  });

  const style = RISK_STYLES[prediction.risk];
  const bande = glycemicLoadBand(totaux.glycemicLoad);
  // Même règle de classement que l'écran de sélection : le thé maison est
  // proposé en premier, le reste suit l'effet attendu.
  const the = trierThes(thes ?? [])[0];

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop">
      <header className="flex items-center gap-2">
        <Link
          href="/repas"
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Impact prévu
        </h1>
      </header>

      {/* Point de départ */}
      <section className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <span className="flex flex-col">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
            Glycémie de départ
          </span>
          <span className="font-title-lg text-title-lg tabular-nums text-on-surface">
            {formatGlucose(baseline, unit)} {UNIT_LABELS[unit]}
          </span>
        </span>
        <span className="text-right font-body-md text-body-md text-on-surface-variant">
          {dernier ? (
            formatRelative(dernier.measured_at)
          ) : (
            <span className="flex items-center gap-1">
              <Icon name="help" size={16} />
              Valeur par défaut
            </span>
          )}
        </span>
      </section>

      {/* Pic estimé */}
      <section
        className={`flex flex-col gap-stack-md rounded-xl border p-6 ${style.card}`}
      >
        <div className="flex items-start justify-between">
          <span className="font-title-lg text-title-lg text-on-surface">
            Pic estimé
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-label-md text-label-md ${style.chip}`}
          >
            <Icon name={style.icon} size={14} fill />
            Risque {RISK_LABELS[prediction.risk].toLowerCase()}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display-hero text-display-hero tabular-nums tracking-tight text-on-surface">
            {formatGlucose(prediction.peakMgdl, unit)}
          </span>
          <span className="font-body-lg text-body-lg text-on-surface-variant">
            {UNIT_LABELS[unit]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-md text-body-md text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <Icon name="schedule" size={16} />
            Dans environ {prediction.peakMinutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="trending_up" size={16} />+
            {formatGlucose(prediction.riseMgdl, unit)} {UNIT_LABELS[unit]}
          </span>
          {prediction.fiberDampeningPercent > 0 && (
            <span className="flex items-center gap-1.5">
              <Icon name="grass" size={16} />
              Fibres : −{prediction.fiberDampeningPercent} %
            </span>
          )}
        </div>

        <p className="font-body-md text-body-md text-on-surface">
          {RISK_MESSAGES[prediction.risk]}
        </p>
      </section>

      {/* Composition */}
      <section className="flex flex-col gap-stack-sm rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-title-lg text-title-lg text-on-background">
            Composition
          </h2>
          <span
            className={`rounded-full px-3 py-1 font-label-md text-label-md ${GL_BAND_STYLES[bande]}`}
          >
            Charge {GL_BAND_LABELS[bande].toLowerCase()} ·{" "}
            {totaux.glycemicLoad.toFixed(1).replace(".", ",")}
          </span>
        </div>

        <ul className="flex flex-col gap-1">
          {items.map((i, n) => (
            <li
              key={n}
              className="flex items-center justify-between font-body-md text-body-md"
            >
              <span className="text-on-surface">
                {i.food.name}{" "}
                <span className="text-on-surface-variant">
                  · {i.quantity_g} g
                </span>
                {!i.food.is_verified && (
                  <span className="ml-2 rounded-full bg-tertiary-fixed px-2 py-0.5 font-label-md text-label-md text-on-tertiary-fixed-variant">
                    Estimation
                  </span>
                )}
              </span>
              <span className="text-on-surface-variant">
                IG {i.food.glycemic_index ?? "—"}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2 border-t border-outline-variant/40 pt-2 font-body-md text-body-md text-on-surface-variant">
          {Math.round(totaux.kcal)} kcal · {Math.round(totaux.carbsG)} g de
          glucides · {totaux.fiberG.toFixed(1).replace(".", ",")} g de fibres
        </p>

        {/* L'IG manquant est majoré : il faut le dire, sinon le chiffre
            affiché passerait pour une mesure. */}
        {totaux.unknownGiFoods.length > 0 && (
          <p className="flex items-start gap-1.5 font-label-md text-label-md text-on-surface-variant">
            <Icon name="help" size={16} />
            <span>
              Index glycémique inconnu pour{" "}
              {totaux.unknownGiFoods.join(", ")} : la charge affichée retient
              une valeur haute par prudence.
            </span>
          </p>
        )}
      </section>

      {/* Recommandations */}
      {prediction.risk !== "low" && (
        <section className="flex flex-col gap-stack-sm">
          <h2 className="font-title-lg text-title-lg text-on-background">
            Ce qui peut aider
          </h2>

          {the && (
            <Link
              href="/the"
              className="flex items-center gap-4 rounded-xl bg-tertiary-fixed/40 p-4 transition-opacity hover:opacity-90"
            >
              <span className="shrink-0 rounded-full bg-tertiary-fixed p-2.5 text-on-tertiary-fixed-variant">
                <Icon name="local_cafe" fill />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-body-lg text-body-lg text-on-surface">
                  Une infusion {avecElision(the.name)}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Effet moyen observé sur le pic :{" "}
                  {Math.abs(Number(the.expected_effect_pct))} %
                </span>
              </span>
              <Icon name="chevron_right" className="text-on-surface-variant" />
            </Link>
          )}

          <div className="flex items-center gap-4 rounded-xl bg-secondary-fixed/30 p-4">
            <span className="shrink-0 rounded-full bg-secondary-fixed p-2.5 text-on-secondary-fixed-variant">
              <Icon name="directions_walk" fill />
            </span>
            <span className="flex flex-col">
              <span className="font-body-lg text-body-lg text-on-surface">
                15 minutes de marche après le repas
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Le muscle capte le glucose sans insuline — effet immédiat
              </span>
            </span>
          </div>

          <Link
            href={`/repas/${id}/compensation`}
            className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 font-title-lg text-title-lg text-primary transition-colors hover:bg-surface-variant"
          >
            Voir toutes les stratégies
            <Icon name="arrow_forward" size={20} />
          </Link>
        </section>
      )}

      <AvertissementMedical />

      <section className="flex items-start gap-3 rounded-xl bg-secondary-fixed/40 p-4">
        <Icon name="schedule" className="mt-0.5 text-secondary" />
        <div className="flex flex-1 flex-col gap-1">
          <h2 className="font-title-lg text-title-lg text-on-surface">Vérifier la réponse réelle</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">L’estimation reste générale. Une mesure vers l’heure du pic prévu aide à observer votre réponse personnelle.</p>
          <Link href={`/glycemie/saisie?mealId=${id}`} className="mt-2 w-fit rounded-full bg-secondary px-4 py-2 font-label-md text-label-md text-on-secondary">Ajouter une mesure liée</Link>
        </div>
      </section>

      <div className="flex flex-col gap-stack-sm pb-4">
        <Link
          href="/repas/composer"
          className="flex h-14 items-center justify-center gap-2 rounded-[14px] border border-outline-variant bg-surface-container-lowest font-title-lg text-title-lg text-on-background transition-colors hover:bg-surface-variant"
        >
          <Icon name="edit" size={20} />
          Composer un autre repas
        </Link>
        <Link
          href="/tableau-de-bord"
          className="flex h-14 items-center justify-center rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-opacity hover:opacity-90"
        >
          Terminer
        </Link>
      </div>
    </main>
  );
}
