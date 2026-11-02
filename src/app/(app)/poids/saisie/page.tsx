import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { PoidsForm } from "./PoidsForm";

export default async function PoidsSaisiePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_kg, height_cm")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-md px-container-padding-mobile md:px-container-padding-desktop">
      <header className="mb-stack-lg flex items-center gap-2">
        <Link
          href="/tableau-de-bord"
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Nouvelle pesée
        </h1>
      </header>

      <PoidsForm
        poidsActuel={profile?.weight_kg ? Number(profile.weight_kg) : null}
        tailleCm={profile?.height_cm ? Number(profile.height_cm) : null}
      />
    </main>
  );
}
