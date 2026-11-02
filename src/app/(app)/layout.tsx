import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopAppBar } from "@/components/shell/TopAppBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { SideNav } from "@/components/shell/SideNav";

/**
 * Coquille des écrans authentifiés.
 *
 * Deux dispositions pour une seule navigation :
 *   • téléphone — barre haute (marque, rappels) + barre basse (5 sections)
 *   • md et au-delà — barre latérale qui regroupe marque, sections et profil
 *
 * Les entrées proviennent de `nav-items.ts` dans les deux cas : elles ne
 * peuvent pas diverger d'un appareil à l'autre.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, avatar_url, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding/profil-medical/etape-1");
  }

  return (
    <div className="min-h-[100dvh]">
      <SideNav
        firstName={profile?.first_name}
        avatarUrl={profile?.avatar_url}
      />
      <TopAppBar
        avatarUrl={profile?.avatar_url}
        firstName={profile?.first_name}
      />

      {/* Décalages : hauteur de la barre haute sur mobile, largeur de la
          barre latérale au-delà. La marge basse laisse passer la barre
          d'onglets sans masquer le dernier élément de la page. */}
      <div className="pb-28 pt-16 md:pb-10 md:pl-24 md:pt-8 lg:pl-60">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
