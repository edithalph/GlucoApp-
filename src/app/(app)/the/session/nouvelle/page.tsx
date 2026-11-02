import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { NouvelleSessionForm } from "./NouvelleSessionForm";
import { trierThes } from "@/lib/tea";
import type { GlucoseUnit } from "@/lib/units";

export default async function NouvelleSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Une seule session active à la fois : on redirige plutôt que d'en ouvrir une seconde.
  const { data: enCours } = await supabase
    .from("tea_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (enCours) redirect(`/the/session/${enCours.id}`);

  const [{ data: thes }, { data: profile }] = await Promise.all([
    supabase
      .from("teas")
      .select("*"),
    supabase
      .from("profiles")
      .select("preferred_unit")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <main className="mx-auto w-full max-w-md px-container-padding-mobile md:px-container-padding-desktop">
      <header className="mb-stack-lg flex items-center gap-2">
        <Link
          href="/the"
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Nouvelle session thé
        </h1>
      </header>

      <NouvelleSessionForm
        // Le tri mêle un critère éditorial (thé maison) et un critère de
        // données : il se fait en TypeScript, pas en SQL.
        thes={trierThes(thes ?? [])}
        unit={(profile?.preferred_unit ?? "g_l") as GlucoseUnit}
      />
    </main>
  );
}
