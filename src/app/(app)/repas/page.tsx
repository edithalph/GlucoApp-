import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { formatRelative } from "@/lib/glycemia";
import { BoutonSuppression } from "@/components/ui/BoutonSuppression";
import { supprimerRepas } from "./actions";
import {
  glycemicLoadBand,
  GL_BAND_LABELS,
  GL_BAND_STYLES,
} from "@/lib/nutrition";
import { FavoriteButton } from "./FavoriteButton";
import { dupliquerRepas } from "./actions";

export default async function RepasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: repas }, { data: favoris }] = await Promise.all([
    supabase
      .from("meals")
      .select("id, name, eaten_at, total_kcal, total_carbs_g, glycemic_load")
      .eq("user_id", user.id)
      .order("eaten_at", { ascending: false })
      .limit(30),
    supabase.from("favorite_meals").select("meal_id").eq("user_id", user.id),
  ]);

  const liste = repas ?? [];
  const idsFavoris = new Set((favoris ?? []).map((f) => f.meal_id));

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          Mes repas
        </h1>
        <Link
          href="/repas/composer"
          className="flex items-center gap-1.5 rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <Icon name="add" size={18} />
          Composer
        </Link>
      </div>
      <p className="-mt-3 text-sm text-on-surface-variant">
        Vos assiettes, vos habitudes. Retrouvez et composez vos repas du
        quotidien.
      </p>

      {liste.length === 0 ? (
        <div className="flex flex-col items-center gap-stack-md rounded-xl bg-surface-container-low p-8 text-center">
          <Icon name="restaurant" size={40} className="text-outline" fill />
          <p className="font-body-md text-body-md text-on-surface-variant">
            Aucun repas enregistré. Composez-en un pour estimer son impact sur
            votre glycémie.
          </p>
          <Link
            href="/repas/composer"
            className="rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary"
          >
            Composer mon premier repas
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {liste.map((r) => {
            const gl = Number(r.glycemic_load);
            const bande = glycemicLoadBand(gl);

            return (
              <li
                key={r.id}
                className="flex min-w-0 flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-card"
              >
                <Link
                  href={`/repas/${r.id}/impact`}
                  className="flex flex-1 flex-wrap items-center gap-3 rounded-xl p-5 transition-colors hover:bg-surface-variant"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface">
                    <Icon name="restaurant" fill size={20} />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1 break-words">
                    <span className="font-body-lg text-body-lg text-on-surface">
                      {r.name ?? "Repas"}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      {formatRelative(r.eaten_at)} ·{" "}
                      {Math.round(Number(r.total_kcal))} kcal ·{" "}
                      {Math.round(Number(r.total_carbs_g))} g de glucides
                    </span>
                  </span>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 font-label-md text-label-md ${GL_BAND_STYLES[bande]}`}
                  >
                    {GL_BAND_LABELS[bande]}
                  </span>
                </Link>
                <div className="flex items-center justify-end gap-2 border-t border-outline-variant/40 px-4 py-2">
                  <span className="mr-auto text-xs text-on-surface-variant">
                    Mon repas
                  </span>
                  <BoutonSuppression
                    action={supprimerRepas.bind(null, r.id)}
                    libelle={`le repas du ${new Date(r.eaten_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
                  />
                  <FavoriteButton
                    mealId={r.id}
                    initial={idsFavoris.has(r.id)}
                  />
                  <form action={dupliquerRepas.bind(null, r.id)}>
                    <button
                      type="submit"
                      aria-label="Dupliquer ce repas"
                      className="grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-surface-variant"
                    >
                      <Icon name="content_copy" size={19} />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
