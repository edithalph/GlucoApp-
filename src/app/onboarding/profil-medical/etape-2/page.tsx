import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { Etape2Form } from "./Etape2Form";

export default async function Etape2Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profile } = await supabase
    .from("profiles")
    .select("condition")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-[100dvh] justify-center bg-background text-on-background">
      <div className="w-full max-w-md px-container-padding-mobile pb-10 pt-8">
        <header className="mb-stack-lg flex items-center gap-2">
          <Link
            href="/onboarding/profil-medical/etape-1"
            aria-label="Retour"
            className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
          >
            <Icon name="arrow_back" />
          </Link>
          <span className="font-label-md text-label-md text-on-surface-variant">
            Étape 2 sur 2
          </span>
        </header>

        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          Votre situation
        </h1>
        <p className="mb-stack-lg mt-stack-sm font-body-md text-body-md text-on-surface-variant">
          Sélectionnez le profil qui vous correspond pour personnaliser vos
          objectifs et recommandations.
        </p>

        <div className="mb-stack-lg h-1 w-full overflow-hidden rounded-full bg-surface-variant">
          <div className="h-full w-full rounded-full bg-primary" />
        </div>

        <Etape2Form conditionInitiale={profile?.condition} />
      </div>
    </div>
  );
}
