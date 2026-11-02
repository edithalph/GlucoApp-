import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/content/Markdown";
import { CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_STYLES } from "@/lib/articles";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!article) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop">
      <header className="flex items-center gap-2">
        <Link
          href="/conseils"
          aria-label="Retour aux conseils"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
      </header>

      <div className="flex flex-col gap-stack-md">
        <span
          className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 font-label-md text-label-md ${CATEGORY_STYLES[article.category]}`}
        >
          <Icon name={CATEGORY_ICONS[article.category]} size={14} fill />
          {CATEGORY_LABELS[article.category]}
        </span>

        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 font-label-md text-label-md text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="schedule" size={14} />
            {article.read_minutes} min de lecture
          </span>
          {article.is_dietitian_validated && (
            <span className="flex items-center gap-1 text-primary">
              <Icon name="verified" size={14} fill />
              Validé par diététicien
            </span>
          )}
        </div>
      </div>

      <article>
        <Markdown source={article.content_md} />
      </article>

      <aside className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <Icon
          name="info"
          size={18}
          className="mt-0.5 shrink-0 text-on-surface-variant"
        />
        <p className="font-label-md text-label-md leading-relaxed text-on-surface-variant">
          Ces informations sont d&apos;ordre général et ne remplacent pas
          l&apos;avis de votre médecin ou de votre diététicien, seuls à même de
          tenir compte de votre situation.
        </p>
      </aside>

      <Link
        href="/conseils"
        className="flex h-14 items-center justify-center gap-2 rounded-[14px] border border-outline-variant bg-surface-container-lowest font-title-lg text-title-lg text-on-background transition-colors hover:bg-surface-variant"
      >
        <Icon name="local_library" size={20} />
        Retour à la bibliothèque
      </Link>
    </main>
  );
}
