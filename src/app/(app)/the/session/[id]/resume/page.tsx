import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { TeaEffectChart } from "@/components/tea/TeaEffectChart";
import {
  formatDelta,
  formatGlucose,
  UNIT_LABELS,
  type GlucoseUnit,
} from "@/lib/units";
import { appreciateEffect, computeEffect } from "@/lib/tea";

export default async function ResumeSessionPage({
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

  const [{ data: session }, { data: mesures }, { data: profile }] =
    await Promise.all([
      supabase
        .from("tea_sessions")
        .select("id, status, baseline_mgdl, tea_taken_at, started_at, teas(name)")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("tea_measurements")
        .select("offset_minutes, value_mgdl")
        .eq("session_id", id)
        .order("offset_minutes"),
      supabase
        .from("profiles")
        .select("preferred_unit, target_min_mgdl, target_max_mgdl")
        .eq("id", user.id)
        .single(),
    ]);

  if (!session) notFound();
  if (session.status === "active") redirect(`/the/session/${id}`);

  const unit = (profile?.preferred_unit ?? "g_l") as GlucoseUnit;
  const targetMin = Number(profile?.target_min_mgdl ?? 70);
  const targetMax = Number(profile?.target_max_mgdl ?? 140);

  const liste = (mesures ?? []).map((m) => ({
    offset_minutes: m.offset_minutes,
    value_mgdl: Number(m.value_mgdl),
  }));

  const baseline =
    session.baseline_mgdl !== null ? Number(session.baseline_mgdl) : null;
  const effet = computeEffect(baseline, liste);
  const appreciation = effet ? appreciateEffect(effet.percent) : null;

  const points = [
    ...(baseline !== null
      ? [{ label: "Avant", valueMgdl: baseline }]
      : []),
    ...liste.map((m) => ({
      label: `+${m.offset_minutes} min`,
      valueMgdl: m.value_mgdl,
    })),
  ];

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop">
      <header className="flex items-center gap-2">
        <Link
          href="/the"
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Résumé de la session
        </h1>
      </header>

      <section className="flex items-center gap-3 rounded-xl bg-tertiary-fixed/40 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
          <Icon name="local_cafe" fill size={22} />
        </span>
        <span className="font-title-lg text-title-lg text-on-surface">
          {session.teas?.name ?? "Thé"}
        </span>
      </section>

      {/* Effet observé */}
      {effet && appreciation ? (
        <section className="flex flex-col gap-stack-md rounded-xl bg-surface-container-lowest p-6 shadow-card">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
            Effet observé
          </span>

          <div className="flex items-baseline gap-3">
            <span className="font-display-hero text-display-hero tabular-nums text-on-surface">
              {formatDelta(effet.deltaMgdl, unit)}
            </span>
          </div>

          <span
            className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 font-label-md text-label-md ${appreciation.chip}`}
          >
            <Icon name={appreciation.icon} size={14} />
            {appreciation.label} · {effet.percent > 0 ? "+" : ""}
            {effet.percent} %
          </span>

          <p className="font-body-md text-body-md text-on-surface-variant">
            Constaté sur {effet.overMinutes} minutes, de{" "}
            {formatGlucose(effet.baselineMgdl, unit)} à{" "}
            {formatGlucose(effet.finalMgdl, unit)} {UNIT_LABELS[unit]}.
          </p>
        </section>
      ) : (
        <section className="rounded-xl bg-surface-container-low p-6 text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Aucune mesure n&apos;a été enregistrée après la prise du thé, il
            n&apos;y a donc pas d&apos;effet à afficher.
          </p>
        </section>
      )}

      {/* Courbe */}
      {points.length >= 2 && (
        <section className="flex flex-col gap-stack-sm rounded-xl bg-surface-container-lowest p-4 shadow-card">
          <h2 className="font-title-lg text-title-lg text-on-background">
            Évolution de la glycémie
          </h2>
          <TeaEffectChart
            points={points}
            unit={unit}
            targetMin={targetMin}
            targetMax={targetMax}
          />
        </section>
      )}

      {/* Relevés détaillés */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="font-title-lg text-title-lg text-on-background">
          Relevés détaillés
        </h2>
        <ul className="flex flex-col gap-stack-sm">
          {baseline !== null && (
            <li className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm">
              <span className="font-body-lg text-body-lg text-on-surface">
                Avant le thé
              </span>
              <span className="font-title-lg text-title-lg tabular-nums text-on-surface">
                {formatGlucose(baseline, unit)}{" "}
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {UNIT_LABELS[unit]}
                </span>
              </span>
            </li>
          )}
          {liste.map((m) => (
            <li
              key={m.offset_minutes}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm"
            >
              <span className="font-body-lg text-body-lg text-on-surface">
                +{m.offset_minutes} min
              </span>
              <span className="font-title-lg text-title-lg tabular-nums text-on-surface">
                {formatGlucose(m.value_mgdl, unit)}{" "}
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {UNIT_LABELS[unit]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Mise en garde : corrélation n'est pas causalité */}
      <aside className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <Icon
          name="info"
          size={18}
          className="mt-0.5 shrink-0 text-on-surface-variant"
        />
        <p className="font-label-md text-label-md leading-relaxed text-on-surface-variant">
          Cette variation est <strong>observée, pas expliquée</strong>. La
          glycémie redescend spontanément après un pic, thé ou non. Une baisse
          pendant une session ne prouve donc pas que le thé en soit la cause.
          Ces relevés servent à repérer vos tendances sur la durée, pas à
          établir un effet thérapeutique.
        </p>
      </aside>

      <Link
        href="/the"
        className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-opacity hover:opacity-90"
      >
        Retour à l&apos;espace thé
      </Link>
    </main>
  );
}
