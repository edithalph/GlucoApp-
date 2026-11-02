import { createClient } from "@/lib/supabase/server";
import { SplashScreen } from "@/components/shell/SplashScreen";

/**
 * Écran « Lancement de GlucoApp ».
 * Détermine la destination côté serveur, puis laisse le splash s'afficher
 * le temps de l'animation avant de rediriger.
 */
export default async function RootPage() {
  let target = "/onboarding";

  // Si Supabase n'est pas encore configuré (ou injoignable), on ne bloque pas
  // le lancement : le splash s'affiche et l'utilisateur part sur l'onboarding.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      target = profile?.onboarding_completed
        ? "/tableau-de-bord"
        : "/onboarding/profil-medical/etape-1";
    }
  } catch {
    // On conserve la destination par défaut.
  }

  return <SplashScreen target={target} />;
}
