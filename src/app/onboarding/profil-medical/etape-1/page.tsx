import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { Etape1Form } from "./Etape1Form";

export default async function Etape1Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-[100dvh] justify-center bg-surface-container-lowest text-on-surface">
      <div className="w-full max-w-md px-container-padding-mobile pb-10 pt-8">
        <header className="mb-stack-lg flex items-center justify-between">
          <Link
            href="/inscription"
            aria-label="Retour"
            className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
          >
            <Icon name="arrow_back" />
          </Link>
          <Link
            href="/tableau-de-bord"
            className="rounded-full px-3 py-1.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            Ignorer
          </Link>
        </header>

        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          Votre profil
        </h1>
        <p className="mb-stack-lg mt-stack-sm font-body-md text-body-md text-on-surface-variant">
          Étape 1 sur 2 — Informations personnelles
        </p>

        <div className="mb-stack-lg h-1 w-full overflow-hidden rounded-full bg-surface-variant">
          <div className="h-full w-1/2 rounded-full bg-primary" />
        </div>

        <Etape1Form prenomInitial={profile?.first_name ?? ""} />
      </div>
    </div>
  );
}
