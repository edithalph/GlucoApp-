import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { AvertissementMedical } from "@/components/nutrition/AvertissementMedical";
import { glycemicLoadBand, GL_BAND_LABELS } from "@/lib/nutrition";

/**
 * Stratégies de compensation après un repas plus riche que prévu.
 * Chaque suggestion repose sur un mécanisme physiologique établi, rappelé
 * explicitement pour que l'utilisateur comprenne le « pourquoi » plutôt que
 * de suivre une consigne opaque.
 */
const STRATEGIES = [
  {
    titre: "Fruits et aliments conseillés",
    icone: "nutrition",
    tint: "bg-tertiary-fixed/40",
    puce: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    entrees: [
      {
        nom: "Citron dans de l'eau tiède",
        detail: "L'acidité ralentit la vidange gastrique",
      },
      {
        nom: "Un demi-avocat",
        detail: "Fibres et lipides, aucun glucide disponible",
      },
      {
        nom: "Une poignée d'amandes (30 g)",
        detail: "IG 15, riches en fibres et en magnésium",
      },
    ],
  },
  {
    titre: "Boissons",
    icone: "local_drink",
    tint: "bg-secondary-fixed/30",
    puce: "bg-secondary-fixed text-on-secondary-fixed-variant",
    entrees: [
      {
        nom: "Un grand verre d'eau",
        detail: "L'hydratation favorise l'élimination rénale du glucose",
      },
      {
        nom: "Thé vert ou tisane",
        detail: "Catéchines et pause digestive",
      },
    ],
  },
  {
    titre: "Activité physique",
    icone: "directions_walk",
    tint: "bg-primary-fixed/40",
    puce: "bg-primary-fixed text-on-primary-fixed-variant",
    entrees: [
      {
        nom: "15 minutes de marche légère",
        detail:
          "Le muscle en contraction capte le glucose sans insuline — le geste le plus efficace",
      },
      {
        nom: "Quelques flexions ou montées d'escalier",
        detail: "Même de courtes séquences mobilisent le glucose circulant",
      },
    ],
  },
] as const;

export default async function CompensationPage({
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

  // Le filtre `user_id` double la RLS : si une policy était un jour assouplie
  // par erreur, cette page ne deviendrait pas pour autant un accès aux repas
  // d'autrui.
  const { data: repas } = await supabase
    .from("meals")
    .select("id, glycemic_load, total_kcal")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!repas) notFound();

  const gl = Number(repas.glycemic_load);
  const bande = glycemicLoadBand(gl);

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop pb-4">
      <header className="flex items-center gap-2">
        <Link
          href={`/repas/${id}/impact`}
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Compenser intelligemment
        </h1>
      </header>

      <section className="flex flex-col gap-stack-sm">
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Votre repas présente une charge glycémique{" "}
          <strong className="font-semibold text-on-surface">
            {GL_BAND_LABELS[bande].toLowerCase()}
          </strong>{" "}
          ({gl.toFixed(1).replace(".", ",")}). Voici des actions simples pour
          lisser la courbe.
        </p>
      </section>

      {STRATEGIES.map((s) => (
        <section
          key={s.titre}
          className={`flex flex-col gap-stack-md rounded-xl p-5 ${s.tint}`}
        >
          <h2 className="flex items-center gap-3 font-title-lg text-title-lg text-on-surface">
            <span className={`rounded-full p-2 ${s.puce}`}>
              <Icon name={s.icone} fill size={20} />
            </span>
            {s.titre}
          </h2>

          <ul className="flex flex-col gap-stack-sm">
            {s.entrees.map((e) => (
              <li
                key={e.nom}
                className="flex items-start gap-3 rounded-xl bg-surface-container-lowest p-3"
              >
                <Icon
                  name="check_circle"
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                  fill
                />
                <span className="flex flex-col">
                  <span className="font-body-lg text-body-lg text-on-surface">
                    {e.nom}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {e.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="flex items-start gap-4 rounded-xl border border-primary-fixed-dim bg-primary-fixed/30 p-5">
        <span className="shrink-0 rounded-full bg-surface-container-lowest p-2 text-primary shadow-sm">
          <Icon name="favorite" fill />
        </span>
        <p className="font-body-md text-body-md text-on-surface">
          <strong className="font-semibold">
            Un écart ponctuel n&apos;a rien de grave.
          </strong>{" "}
          Ce qui compte est la tendance sur la durée, pas un repas isolé. Ces
          gestes aident à retrouver l&apos;équilibre plus vite, sans culpabilité.
        </p>
      </section>

      <AvertissementMedical variante="bref" />

      <Link
        href="/tableau-de-bord"
        className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-opacity hover:opacity-90"
      >
        <Icon name="thumb_up" size={20} />
        C&apos;est noté
      </Link>
    </main>
  );
}
