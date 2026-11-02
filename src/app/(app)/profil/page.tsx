import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { UniteSelector } from "./UniteSelector";
import { signOut } from "@/app/auth/actions";
import {
  bmiCategory,
  computeBmi,
  formatGlucose,
  UNIT_LABELS,
  type GlucoseUnit,
} from "@/lib/units";
import { computeStats } from "@/lib/glycemia";
import type { MedicalCondition } from "@/types/database";

const CONDITION_LABELS: Record<MedicalCondition, string> = {
  type1: "Diabétique Type 1",
  type2: "Diabétique Type 2",
  prediabetic: "Prédiabétique",
  prevention: "En prévention",
  other: "Situation particulière",
};

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: profile }, { data: releves }, { count: nbSessions }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("glucose_readings")
        .select("value_mgdl, measured_at")
        .eq("user_id", user.id),
      supabase
        .from("tea_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed"),
    ]);

  if (!profile) redirect("/onboarding/profil-medical/etape-1");

  const unit = profile.preferred_unit as GlucoseUnit;
  const targetMin = Number(profile.target_min_mgdl);
  const targetMax = Number(profile.target_max_mgdl);
  const liste = releves ?? [];
  const stats = computeStats(liste, targetMin, targetMax);

  // Nombre de journées distinctes comportant au moins un relevé.
  const joursActifs = new Set(
    liste.map((r) => new Date(r.measured_at).toDateString()),
  ).size;

  const imc =
    profile.weight_kg && profile.height_cm
      ? computeBmi(Number(profile.weight_kg), Number(profile.height_cm))
      : null;

  const initiale = (profile.first_name ?? "?").charAt(0).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop pt-2">
      {/* Identité */}
      <section className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed font-headline-md text-headline-md text-on-primary-fixed-variant">
          {initiale}
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-headline-md text-headline-md text-on-background">
            {profile.first_name ?? "Vous"}
          </span>
          {profile.condition && (
            <span className="w-fit rounded-full bg-primary-fixed px-3 py-1 font-label-md text-label-md text-on-primary-fixed-variant">
              {CONDITION_LABELS[profile.condition]}
            </span>
          )}
        </span>
      </section>

      {/* Statistiques cumulées */}
      <section className="grid grid-cols-2 gap-stack-sm md:grid-cols-4">
        {[
          { icone: "bloodtype", label: "Mesures", valeur: String(stats.count) },
          {
            icone: "local_library",
            label: "Sessions thé",
            valeur: String(nbSessions ?? 0),
          },
          {
            icone: "calendar_today",
            label: "Jours actifs",
            valeur: String(joursActifs),
          },
          {
            icone: "trending_up",
            label: "Moyenne",
            valeur:
              stats.average === null
                ? "—"
                : `${formatGlucose(stats.average, unit)}`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
          >
            <span className="flex items-center gap-1.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              <Icon name={s.icone} size={14} />
              {s.label}
            </span>
            <span className="font-title-lg text-title-lg tabular-nums text-on-surface">
              {s.valeur}
            </span>
          </div>
        ))}
      </section>

      {/* Profil médical */}
      <section className="flex flex-col gap-stack-md rounded-xl bg-surface-container-lowest p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-title-lg text-title-lg text-on-background">
          <Icon name="assignment_ind" size={20} className="text-secondary" />
          Profil médical
        </h2>

        <dl className="flex flex-col gap-stack-sm">
          {[
            { terme: "Âge", valeur: profile.age ? `${profile.age} ans` : "—" },
            {
              terme: "Poids",
              valeur: profile.weight_kg ? `${profile.weight_kg} kg` : "—",
            },
            {
              terme: "Taille",
              valeur: profile.height_cm ? `${profile.height_cm} cm` : "—",
            },
            {
              terme: "IMC",
              valeur: imc
                ? `${imc.toFixed(1).replace(".", ",")} — ${bmiCategory(imc)}`
                : "—",
            },
            {
              terme: "Objectif glycémie",
              valeur: `${formatGlucose(targetMin, unit)} – ${formatGlucose(targetMax, unit)} ${UNIT_LABELS[unit]}`,
            },
          ].map((l) => (
            <div
              key={l.terme}
              className="flex items-center justify-between gap-4"
            >
              <dt className="font-body-md text-body-md text-on-surface-variant">
                {l.terme}
              </dt>
              <dd className="text-right font-body-lg text-body-lg text-on-surface">
                {l.valeur}
              </dd>
            </div>
          ))}
        </dl>

        <Link
          href="/onboarding/profil-medical/etape-1"
          className="flex items-center justify-center gap-2 rounded-full border border-outline-variant py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-variant"
        >
          <Icon name="edit" size={16} />
          Modifier mes informations
        </Link>
      </section>

      {/* Unité d'affichage */}
      <section className="flex flex-col gap-stack-md rounded-xl bg-surface-container-lowest p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-title-lg text-title-lg text-on-background">
          <Icon name="straighten" size={20} className="text-secondary" />
          Unité d&apos;affichage
        </h2>
        <UniteSelector courante={unit} />
        <p className="font-label-md text-label-md text-on-surface-variant">
          Vos mesures sont stockées en mg/dL. Changer d&apos;unité ne modifie
          que leur affichage, aucune donnée n&apos;est réécrite.
        </p>
      </section>

      {/* Raccourcis */}
      <section className="flex flex-col gap-stack-sm">
        {[
          {
            href: "/profil/rappels",
            icone: "notifications_active",
            label: "Rappels",
          },
          { href: "/conseils", icone: "local_library", label: "Conseils" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-colors hover:bg-surface-variant"
          >
            <Icon name={l.icone} className="text-on-surface-variant" />
            <span className="flex-1 font-body-lg text-body-lg text-on-surface">
              {l.label}
            </span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </Link>
        ))}
      </section>

      {/* Déconnexion */}
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/40 p-4 font-title-lg text-title-lg text-error transition-colors hover:bg-error-container"
        >
          <Icon name="logout" size={20} />
          Se déconnecter
        </button>
      </form>

      <p className="pb-4 text-center font-label-md text-label-md text-on-surface-variant">
        GlucoApp est un outil de suivi personnel. Il ne remplace ni un
        traitement, ni le suivi par un professionnel de santé.
      </p>
    </main>
  );
}
