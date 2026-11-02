import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { BoutonSuppression } from "@/components/ui/BoutonSuppression";
import { supprimerSession } from "./actions";
import { formatDelta, type GlucoseUnit } from "@/lib/units";
import { formatRelative } from "@/lib/glycemia";
import {
  appreciateEffect,
  computeEffect,
  computeWeeklyStats,
  TREND_LABELS,
} from "@/lib/tea";

export default async function TheePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const ilYaUneSemaine = new Date();
  ilYaUneSemaine.setDate(ilYaUneSemaine.getDate() - 7);

  const [{ data: profile }, { data: active }, { data: sessions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("preferred_unit")
        .eq("id", user.id)
        .single(),
      supabase
        .from("tea_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("tea_sessions")
        .select(
          "id, status, started_at, baseline_mgdl, teas(name), tea_measurements(offset_minutes, value_mgdl)",
        )
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(20),
    ]);

  const unit = (profile?.preferred_unit ?? "g_l") as GlucoseUnit;
  const liste = sessions ?? [];

  const avecEffet = liste.map((s) => ({
    ...s,
    effet: computeEffect(
      s.baseline_mgdl !== null ? Number(s.baseline_mgdl) : null,
      (s.tea_measurements ?? []).map((m) => ({
        offset_minutes: m.offset_minutes,
        value_mgdl: Number(m.value_mgdl),
      })),
    ),
  }));

  const cetteSemaine = avecEffet.filter(
    (s) => new Date(s.started_at) >= ilYaUneSemaine,
  );
  const stats = computeWeeklyStats(cetteSemaine.map((s) => s.effet));

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop pt-2">
      <section className="flex flex-col gap-1">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          Mon thé régulateur
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Un rituel apaisant pour accompagner votre équilibre glycémique.
        </p>
      </section>

      {/* Session en cours ou démarrage */}
      {active ? (
        <Link
          href={`/the/session/${active.id}`}
          className="flex items-center gap-3 rounded-xl bg-tertiary-container p-5 shadow-card transition-opacity hover:opacity-90"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
            <Icon name="local_cafe" fill size={22} />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="font-title-lg text-title-lg text-on-tertiary">
              Session en cours 🍵
            </span>
            <span className="font-body-md text-body-md text-on-tertiary opacity-90">
              Reprendre là où vous en étiez
            </span>
          </span>
          <Icon name="chevron_right" className="text-on-tertiary" />
        </Link>
      ) : (
        <Link
          href="/the/session/nouvelle"
          className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-opacity hover:opacity-90"
        >
          <Icon name="play_arrow" fill size={20} />
          Démarrer une session thé
        </Link>
      )}

      {/* Stats de la semaine */}
      <section className="flex flex-col gap-stack-md rounded-xl bg-surface-container-lowest p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-title-lg text-title-lg text-on-background">
          <Icon name="bar_chart" size={20} className="text-secondary" />
          Stats de la semaine
        </h2>

        <div className="grid grid-cols-3 gap-stack-sm">
          <div className="flex flex-col gap-1">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Sessions
            </span>
            <span className="font-headline-md text-headline-md tabular-nums text-on-surface">
              {stats.sessions}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Effet moyen
            </span>
            <span className="font-headline-md text-headline-md tabular-nums text-on-surface">
              {stats.averagePercent === null
                ? "—"
                : `${stats.averagePercent > 0 ? "+" : ""}${stats.averagePercent} %`}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Tendance
            </span>
            {stats.trend ? (
              <span
                className={`flex items-center gap-1 font-body-lg text-body-lg ${TREND_LABELS[stats.trend].color}`}
              >
                <Icon name={TREND_LABELS[stats.trend].icon} size={18} />
                {TREND_LABELS[stats.trend].label}
              </span>
            ) : (
              <span className="font-headline-md text-headline-md text-on-surface">
                —
              </span>
            )}
          </div>
        </div>

        {stats.sessions === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Aucune session cette semaine. Démarrez-en une pour commencer à
            mesurer.
          </p>
        )}
      </section>

      {/* Sessions récentes */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="flex items-center gap-2 font-title-lg text-title-lg text-on-background">
          <Icon name="history" size={20} className="text-on-surface-variant" />
          Sessions récentes
        </h2>

        {avecEffet.length === 0 ? (
          <p className="rounded-xl bg-surface-container-low p-6 text-center font-body-md text-body-md text-on-surface-variant">
            Vos sessions terminées apparaîtront ici, avec l&apos;effet observé
            pour chacune.
          </p>
        ) : (
          <ul className="flex flex-col gap-stack-sm">
            {avecEffet.map((s) => {
              const appreciation = s.effet
                ? appreciateEffect(s.effet.percent)
                : null;

              return (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-xl bg-surface-container-lowest pr-3 shadow-sm"
                >
                  <Link
                    href={`/the/session/${s.id}/resume`}
                    className="flex flex-1 items-center gap-4 rounded-xl p-4 transition-colors hover:bg-surface-variant"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
                      <Icon name="local_cafe" fill size={20} />
                    </span>

                    <span className="flex flex-1 flex-col">
                      <span className="font-body-lg text-body-lg text-on-surface">
                        {s.teas?.name ?? "Thé"}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        {formatRelative(s.started_at)}
                      </span>
                    </span>

                    {s.effet && appreciation ? (
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 font-label-md text-label-md ${appreciation.chip}`}
                      >
                        {formatDelta(s.effet.deltaMgdl, unit)}
                      </span>
                    ) : (
                      <span className="shrink-0 font-label-md text-label-md text-on-surface-variant">
                        Sans mesure
                      </span>
                    )}
                  </Link>

                  <BoutonSuppression
                    action={supprimerSession.bind(null, s.id)}
                    libelle={`la session ${s.teas?.name ?? "thé"} du ${new Date(s.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
