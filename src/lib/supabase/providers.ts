import "server-only";

export type SocialProvider = "google" | "apple";

/** N'affiche que les fournisseurs réellement activés sur le projet. */
export async function enabledProviders(): Promise<SocialProvider[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return [];
    const settings = await response.json();
    return (["google", "apple"] as const).filter(
      (provider) => settings.external?.[provider] === true,
    );
  } catch {
    // Une panne du catalogue OAuth ne doit pas bloquer le formulaire e-mail.
    return [];
  }
}
