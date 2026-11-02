import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_STYLES,
} from "@/lib/articles";
import type { ArticleCategory } from "@/types/database";

function estCategorie(v: string | undefined): v is ArticleCategory {
  return CATEGORY_ORDER.includes(v as ArticleCategory);
}

export default async function ConseilsPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie: brut } = await searchParams;
  const categorie = estCategorie(brut) ? brut : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  let requete = supabase
    .from("articles")
    .select("id, slug, title, category, excerpt, read_minutes, is_dietitian_validated")
    .order("published_at", { ascending: false });

  if (categorie) requete = requete.eq("category", categorie);

  const { data: articles } = await requete;
  const liste = articles ?? [];
  const [aLaUne, ...suite] = liste;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop pt-2">
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
        Conseils &amp; Nutrition
      </h1>

      {/* Filtres par catégorie */}
      {/* Comme les filtres de période : rien ne doit sortir de l'écran. */}
      <nav aria-label="Catégories" className="flex flex-wrap gap-stack-sm">
        <Link
          href="/conseils"
          aria-current={categorie === null ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 font-body-md text-body-md transition-all ${
            categorie === null
              ? "bg-primary-container text-on-primary shadow-sm"
              : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant"
          }`}
        >
          Tout
        </Link>
        {CATEGORY_ORDER.map((c) => {
          const actif = c === categorie;
          return (
            <Link
              key={c}
              href={`/conseils?categorie=${c}`}
              aria-current={actif ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-body-md text-body-md transition-all ${
                actif
                  ? "bg-primary-container text-on-primary shadow-sm"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <Icon name={CATEGORY_ICONS[c]} size={16} />
              {CATEGORY_LABELS[c]}
            </Link>
          );
        })}
      </nav>

      {liste.length === 0 ? (
        <p className="rounded-xl bg-surface-container-low p-6 text-center font-body-md text-body-md text-on-surface-variant">
          Aucun article dans cette catégorie pour l&apos;instant.
        </p>
      ) : (
        <>
          {/* Article mis en avant */}
          <Link
            href={`/conseils/${aLaUne.slug}`}
            className="flex flex-col gap-stack-md rounded-xl bg-primary-container p-6 shadow-card transition-opacity hover:opacity-95"
          >
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-tertiary-fixed px-3 py-1 font-label-md text-label-md uppercase tracking-wider text-on-tertiary-fixed-variant">
              Nouveau
            </span>
            <h2 className="font-headline-md text-headline-md text-on-primary-container">
              {aLaUne.title}
            </h2>
            <span className="flex flex-wrap items-center gap-3 font-label-md text-label-md text-on-primary-container opacity-90">
              <span className="flex items-center gap-1">
                <Icon name="schedule" size={14} />
                Lecture : {aLaUne.read_minutes} min
              </span>
              {aLaUne.is_dietitian_validated && (
                <span className="flex items-center gap-1">
                  <Icon name="verified" size={14} fill />
                  Validé par diététicien
                </span>
              )}
            </span>
          </Link>

          {/* Suite */}
          {suite.length > 0 && (
            <section className="flex flex-col gap-stack-sm">
              <h2 className="font-title-lg text-title-lg text-on-background">
                Articles recommandés
              </h2>
              <ul className="flex flex-col gap-stack-sm">
                {suite.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/conseils/${a.slug}`}
                      className="flex items-start gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-colors hover:bg-surface-variant"
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${CATEGORY_STYLES[a.category]}`}
                      >
                        <Icon name={CATEGORY_ICONS[a.category]} fill size={20} />
                      </span>

                      <span className="flex flex-1 flex-col gap-1">
                        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                          {CATEGORY_LABELS[a.category]}
                        </span>
                        <span className="font-body-lg text-body-lg text-on-surface">
                          {a.title}
                        </span>
                        {a.is_dietitian_validated && (
                          <span className="flex items-center gap-1 font-label-md text-label-md text-primary">
                            <Icon name="verified" size={14} fill />
                            Validé par diététicien
                          </span>
                        )}
                      </span>

                      <Icon
                        name="chevron_right"
                        className="shrink-0 text-on-surface-variant"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
