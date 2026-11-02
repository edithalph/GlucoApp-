"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  consommerQuota,
  identifiantAppelant,
  messageQuota,
} from "@/lib/rate-limit";
import type { ActionState } from "@/components/ui/FormMessage";

const credentials = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

/**
 * N'accepte qu'un chemin interne. Sans ce filtre, un lien
 * `/connexion?suivant=https://site-malveillant` transformerait la page de
 * connexion en redirection ouverte — technique classique d'hameçonnage,
 * puisque l'utilisateur part d'un domaine légitime.
 */
function cheminInterneSur(valeur: string | undefined): string | null {
  if (!valeur) return null;
  // `//` ou `/\` sont interprétés comme des URL relatives au protocole.
  if (!valeur.startsWith("/")) return null;
  if (valeur.startsWith("//") || valeur.startsWith("/\\")) return null;
  return valeur;
}

/** URL de base pour les redirections OAuth / lien de confirmation. */
async function siteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv;
  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const emailSaisi = String(formData.get("email") ?? "");
  const parsed = credentials.safeParse({
    email: emailSaisi,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
      values: { email: emailSaisi },
    };
  }

  // Limite avant l'appel réseau : une tentative rejetée ne doit rien coûter.
  const quotaInscription = await consommerQuota(
    await identifiantAppelant("signup"),
    "auth",
  );
  if (!quotaInscription.autorise) {
    return { error: messageQuota(quotaInscription), values: { email: emailSaisi } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback` },
  });

  if (error) {
    return {
      error: traduireErreur(error.message),
      values: { email: emailSaisi },
    };
  }

  // Si la confirmation par e-mail est active, aucune session n'est ouverte :
  // on informe l'utilisateur au lieu de le rediriger dans le vide.
  if (!data.session) {
    return {
      info: "Compte créé. Ouvrez le lien de confirmation envoyé à votre adresse e-mail pour continuer.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding/profil-medical/etape-1");
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const emailSaisi = String(formData.get("email") ?? "");
  const parsed = credentials.safeParse({
    email: emailSaisi,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
      values: { email: emailSaisi },
    };
  }

  // Clé par e-mail ciblé : freine le bourrage d'identifiants sur un compte
  // précis, même si l'attaquant fait tourner ses adresses IP.
  const quotaConnexion = await consommerQuota(
    `signin:${parsed.data.email.toLowerCase()}`,
    "auth",
  );
  if (!quotaConnexion.autorise) {
    return { error: messageQuota(quotaConnexion), values: { email: emailSaisi } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error: traduireErreur(error.message),
      values: { email: emailSaisi },
    };
  }

  revalidatePath("/", "layout");
  // Renvoie l'utilisateur là où il voulait aller avant d'être intercepté.
  redirect(cheminInterneSur(String(formData.get("suivant") ?? "")) ?? "/");
}

export async function signInWithProvider(provider: "google" | "apple") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await siteUrl()}/auth/callback` },
  });

  if (error || !data.url) {
    redirect(
      `/connexion?erreur=${encodeURIComponent(
        "Connexion via ce fournisseur indisponible.",
      )}`,
    );
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/connexion");
}

/** Messages Supabase (en anglais) traduits pour l'interface. */
function traduireErreur(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("already registered") || m.includes("already exists")) {
    return "Un compte existe déjà avec cette adresse e-mail.";
  }
  if (m.includes("invalid login credentials")) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Adresse e-mail non confirmée. Vérifiez votre boîte de réception.";
  }
  if (m.includes("password") && m.includes("least")) {
    return "Le mot de passe est trop court.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  return `Une erreur est survenue : ${message}`;
}
