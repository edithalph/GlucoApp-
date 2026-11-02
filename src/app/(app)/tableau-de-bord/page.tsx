import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { GlucoseChart } from "@/components/glucose/GlucoseChart";
import { formatGlucose, UNIT_LABELS, type GlucoseUnit } from "@/lib/units";
import {
  CONTEXT_LABELS,
  computeStats,
  formatRelative,
  periodStart,
  readingStatus,
  STATUS_STYLES,
} from "@/lib/glycemia";

const ACTIONS = [
  {
    href: "/glycemie/saisie",
    icon: "bloodtype",
    label: "Ma glycémie",
    detail: "Ajouter une mesure",
    tint: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  {
    href: "/repas/composer",
    icon: "restaurant",
    label: "Mon repas",
    detail: "Composer mon assiette",
    tint: "bg-secondary-fixed text-on-secondary-fixed-variant",
  },
  {
    href: "/poids/saisie",
    icon: "monitor_weight",
    label: "Mon poids",
    detail: "Enregistrer une pesée",
    tint: "bg-surface-container-high text-on-surface",
  },
  {
    href: "/the",
    icon: "emoji_food_beverage",
    label: "Mon rituel thé",
    detail: "Prendre un moment",
    tint: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  },
] as const;

export default async function TableauDeBordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const [
    { data: profile },
    { data: dernier },
    { data: semaine, error: readingsError },
    { data: astuce },
  ] = await Promise.all([
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
      .select("value_mgdl, measured_at")
      .eq("user_id", user.id)
      .gte("measured_at", periodStart("7d").toISOString())
      .order("measured_at", { ascending: true }),
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
  const readings = semaine ?? [];
  const stats = computeStats(readings, targetMin, targetMax);
  const statut = dernier
    ? readingStatus(Number(dernier.value_mgdl), targetMin, targetMax)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-container-padding-mobile pt-4 md:px-container-padding-desktop md:pt-1 lg:gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Votre espace santé</p>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-semibold md:text-headline-lg">
            Bonjour{profile?.first_name ? `, ${profile.first_name}` : ""}.
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Un peu de clarté pour prendre soin de vous, chaque jour.
          </p>
        </div>
        <Link href="/glycemie/saisie" className="action-link">
          <Icon name="add" size={20} />
          Ajouter une mesure
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        <section className="dashboard-hero relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white shadow-card sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-16 -z-10 h-72 w-72 rounded-full border-[40px] border-brand-teal/15"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Icon name="bloodtype" size={20} className="text-brand-teal" />
              Dernière glycémie
            </h2>
            {statut && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[statut].chip}`}
              >
                <Icon
                  name={statut === "in_range" ? "check_circle" : "warning"}
                  size={15}
                />
                {STATUS_STYLES[statut].label}
              </span>
            )}
          </div>
          {dernier ? (
            <div className="my-6">
              <p className="flex items-baseline gap-3">
                <span className="text-[64px] font-semibold leading-none tracking-[-0.06em] tabular-nums sm:text-[76px]">
                  {formatGlucose(Number(dernier.value_mgdl), unit)}
                </span>
                <span className="text-xl text-brand-mist">
                  {UNIT_LABELS[unit]}
                </span>
              </p>
              <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-brand-mist">
                <Icon name="schedule" size={16} />
                {formatRelative(dernier.measured_at)}
                <span aria-hidden="true">·</span>
                {CONTEXT_LABELS[dernier.context]}
              </p>
            </div>
          ) : (
            <div className="my-6">
              <p className="text-3xl font-semibold leading-tight">
                Votre suivi commence ici.
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-mist">
                Ajoutez une première mesure pour retrouver vos repères au fil
                des jours.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4 text-sm">
            <span className="text-brand-mist">
              Cible : {formatGlucose(targetMin, unit)} –{" "}
              {formatGlucose(targetMax, unit)} {UNIT_LABELS[unit]}
            </span>
            <Link
              href="/glycemie"
              className="inline-flex min-h-10 items-center gap-2 font-semibold text-white hover:underline"
            >
              Mon historique
              <Icon name="arrow_forward" size={18} />
            </Link>
          </div>
        </section>

        <section className="ds-card flex flex-col justify-between rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Vos repères</h2>
            <span className="rounded-full bg-surface-container-low px-3 py-1.5 text-xs text-on-surface-variant">
              7 derniers jours
            </span>
          </div>
          {readingsError ? (
            <p role="status" className="py-8 text-on-surface-variant">
              Vos mesures sont momentanément indisponibles. Réessayez dans un
              instant.
            </p>
          ) : (
            <>
              <div className="my-6 flex items-center gap-5">
                <div
                  className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#56B8B0 ${(stats.inRangePercent ?? 0) * 3.6}deg, #E5F3F4 0deg)`,
                  }}
                >
                  <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white text-2xl font-semibold tabular-nums">
                    {stats.inRangePercent === null
                      ? "—"
                      : `${stats.inRangePercent}%`}
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Mesures dans la cible</p>
                  <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                    {stats.count
                      ? `Sur ${stats.count} relevé${stats.count > 1 ? "s" : ""} enregistré${stats.count > 1 ? "s" : ""}.`
                      : "Vos prochains relevés apparaîtront ici."}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/50 pt-5">
                <div>
                  <p className="text-xs text-on-surface-variant">
                    Moyenne des mesures
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {stats.average === null
                      ? "—"
                      : formatGlucose(stats.average, unit)}{" "}
                    <span className="text-xs font-normal text-on-surface-variant">
                      {UNIT_LABELS[unit]}
                    </span>
                  </p>
                </div>
                <div className="border-l border-outline-variant/50 pl-5">
                  <p className="text-xs text-on-surface-variant">
                    Relevés enregistrés
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {stats.count}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="mb-4 text-lg font-semibold">
          À votre rythme
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group ds-card flex flex-col gap-4 p-4 transition duration-200 hover:-translate-y-1 hover:border-brand-teal hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl ${a.tint}`}
                >
                  <Icon name={a.icon} size={23} />
                </span>
                <Icon
                  name="arrow_forward"
                  size={18}
                  className="text-outline transition-transform group-hover:translate-x-1"
                />
              </div>
              <div>
                <h3 className="font-semibold">{a.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                  {a.detail}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="ds-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Votre évolution</h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Glycémie · 7 derniers jours
              </p>
            </div>
            <Link
              href="/glycemie"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"
            >
              Voir le détail
              <Icon name="chevron_right" size={18} />
            </Link>
          </div>
          {readingsError ? (
            <p className="py-12 text-center text-on-surface-variant">
              Courbe indisponible pour le moment.
            </p>
          ) : (
            <GlucoseChart
              points={readings.map((r) => ({
                at: r.measured_at,
                valueMgdl: Number(r.value_mgdl),
              }))}
              unit={unit}
              targetMin={targetMin}
              targetMax={targetMax}
            />
          )}
          <p className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-teal" />
            La zone colorée représente votre cible personnelle.
          </p>
        </section>
        <aside className="flex flex-col gap-4">
          {astuce && (
            <Link
              href={`/conseils/${astuce.slug}`}
              className="group rounded-[24px] border border-brand-gold/40 bg-tertiary-fixed p-6 transition hover:shadow-card"
            >
              <span className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-tertiary">
                <Icon name="lightbulb" fill size={20} />
                Un peu d’inspiration
              </span>
              <h2 className="mb-3 text-xl font-semibold leading-snug">
                {astuce.title}
              </h2>
              <p className="line-clamp-3 text-sm leading-relaxed text-on-surface-variant">
                {astuce.excerpt}
              </p>
              <span className="mt-5 flex items-center gap-2 text-sm font-semibold">
                Prendre le temps de lire
                <Icon
                  name="arrow_forward"
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          )}
          <Link
            href="/profil/rappels"
            className="ds-card flex items-center gap-3"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-mist text-primary">
              <Icon name="notifications" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">
                Vos rendez-vous avec vous
              </span>
              <span className="mt-1 block text-xs text-on-surface-variant">
                Retrouver mes rappels
              </span>
            </span>
            <Icon name="chevron_right" size={18} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
