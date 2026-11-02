import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { formatGlucose, UNIT_LABELS, type GlucoseUnit } from "@/lib/units";
import {
  CONTEXT_ICONS,
  CONTEXT_LABELS,
  computeStats,
  formatRelative,
  periodStart,
} from "@/lib/glycemia";

const ACTIONS = [
  {
    href: "/glycemie/saisie",
    icon: "bloodtype",
    label: ["Saisir", "glycémie"],
    tint: "bg-primary-fixed text-on-primary-fixed-variant",
    border: "hover:border-primary-fixed-dim",
  },
  {
    href: "/poids/saisie",
    icon: "monitor_weight",
    label: ["Saisir", "poids"],
    tint: "bg-secondary-fixed text-on-secondary-fixed-variant",
    border: "hover:border-secondary-fixed",
  },
  {
    href: "/repas",
    icon: "restaurant",
    label: ["Composer", "un repas"],
    tint: "bg-surface-container-high text-on-surface",
    border: "hover:border-primary-fixed-dim",
  },
  {
    href: "/the",
    icon: "emoji_food_beverage",
    label: ["Session", "thé"],
    tint: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    border: "hover:border-tertiary-fixed",
  },
] as const;

export default async function TableauDeBordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const debutJour = periodStart("today").toISOString();

  const [{ data: profile }, { data: dernier }, { data: dujour }, { data: astuce }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, preferred_unit, target_min_mgdl, target_max_mgdl")
        .eq("id", user.id)
        .single(),
      supabase
        .from("glucose_readings")
        .select("value_mgdl, context, measured_at")
        .eq("user_id", user.id)
        .order("measured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("glucose_readings")
        .select("value_mgdl")
        .eq("user_id", user.id)
        .gte("measured_at", debutJour),
      supabase
        .from("articles")
        .select("slug, title, excerpt")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const unit = (profile?.preferred_unit ?? "g_l") as GlucoseUnit;
  const targetMin = Number(profile?.target_min_mgdl ?? 70);
  const targetMax = Number(profile?.target_max_mgdl ?? 140);
  const statsJour = computeStats(dujour ?? [], targetMin, targetMax);

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop pt-2">
      <section className="flex flex-col gap-1">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background md:font-headline-lg md:text-headline-lg">
          Bonjour, {profile?.first_name ?? "vous"} 👋
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Voici votre résumé santé du jour.
        </p>
      </section>

      {/* Carte héro : dernière glycémie */}
      <section className="relative flex flex-col gap-stack-md overflow-hidden rounded-xl bg-primary-container p-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-surface-tint opacity-20 blur-2xl" />

        <div className="z-10 flex items-start justify-between">
          <span className="font-title-lg text-title-lg text-on-primary-container">
            Dernière glycémie
          </span>
          {dernier && (
            <span className="flex items-center gap-1 rounded-full bg-tertiary-fixed-dim px-3 py-1 font-label-md text-label-md text-on-tertiary-fixed-variant shadow-sm">
              <Icon name={CONTEXT_ICONS[dernier.context]} size={14} />
              {CONTEXT_LABELS[dernier.context]}
            </span>
          )}
        </div>

        {dernier ? (
          <>
            <div className="z-10 flex items-baseline gap-2">
              <span className="font-display-hero text-display-hero tracking-tight tabular-nums text-on-primary-container">
                {formatGlucose(Number(dernier.value_mgdl), unit)}
              </span>
              <span className="font-body-lg text-body-lg text-on-primary-container opacity-80">
                {UNIT_LABELS[unit]}
              </span>
            </div>
            <div className="z-10 mt-2 flex items-center gap-2">
              <Icon
                name="schedule"
                size={18}
                className="text-on-primary-container"
              />
              <span className="font-body-md text-body-md text-on-primary-container opacity-90">
                {formatRelative(dernier.measured_at)}
              </span>
            </div>
          </>
        ) : (
          <div className="z-10 flex flex-col gap-stack-md">
            <p className="font-body-lg text-body-lg text-on-primary-container opacity-90">
              Aucune mesure enregistrée pour l&apos;instant.
            </p>
            <Link
              href="/glycemie/saisie"
              className="flex w-fit items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 font-label-md text-label-md text-primary shadow-sm"
            >
              <Icon name="add" size={18} />
              Saisir ma première mesure
            </Link>
          </div>
        )}
      </section>

      {/* Actions rapides */}
      <section className="grid grid-cols-2 gap-stack-md md:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex flex-col items-start gap-stack-md rounded-xl border border-surface-variant bg-surface-container-lowest p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${a.border}`}
          >
            <span
              className={`flex items-center justify-center rounded-full p-2.5 ${a.tint}`}
            >
              <Icon name={a.icon} fill />
            </span>
            <span className="text-left font-title-lg text-title-lg leading-tight text-on-surface">
              {a.label[0]}
              <br />
              {a.label[1]}
            </span>
          </Link>
        ))}
      </section>

      {/* Résumé du jour */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="mb-2 font-title-lg text-title-lg text-on-background">
          Aujourd&apos;hui
        </h2>
        <div className="flex flex-wrap gap-stack-sm">
          <span className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-highest px-4 py-2 font-body-md text-body-md text-on-surface">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {statsJour.average === null
              ? "Aucune mesure"
              : `Moy : ${formatGlucose(statsJour.average, unit)} ${UNIT_LABELS[unit]}`}
          </span>
          <span className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-highest px-4 py-2 font-body-md text-body-md text-on-surface">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            {statsJour.count} mesure{statsJour.count > 1 ? "s" : ""}
          </span>
          {statsJour.inRangePercent !== null && (
            <span className="flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-2 font-body-md text-body-md text-on-primary-fixed-variant shadow-sm">
              <Icon name="target" size={16} />
              {statsJour.inRangePercent} % dans la cible
            </span>
          )}
        </div>
      </section>

      {/* Astuce du jour */}
      {astuce && (
        <Link
          href={`/conseils/${astuce.slug}`}
          className="flex items-start gap-4 rounded-xl border border-secondary-fixed-dim bg-secondary-fixed bg-opacity-30 p-5 transition-opacity hover:opacity-90"
        >
          <span className="shrink-0 rounded-full bg-surface-container-lowest p-2 text-secondary shadow-sm">
            <Icon name="lightbulb" fill />
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              Astuce bien-être
            </span>
            <span className="font-body-md text-body-md text-on-surface">
              {astuce.excerpt ?? astuce.title}
            </span>
          </span>
        </Link>
      )}
    </main>
  );
}
