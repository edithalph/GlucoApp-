import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point de retour OAuth (Google / Apple) et lien de confirmation par e-mail.
 * Échange le code contre une session, puis oriente selon l'avancement du profil.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const erreur = searchParams.get("error_description") ?? searchParams.get("error");

  if (erreur) {
    return NextResponse.redirect(
      `${origin}/connexion?erreur=${encodeURIComponent(erreur)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/connexion?erreur=${encodeURIComponent(error.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(`${origin}/connexion`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  return NextResponse.redirect(
    profile?.onboarding_completed
      ? `${origin}/tableau-de-bord`
      : `${origin}/onboarding/profil-medical/etape-1`,
  );
}
