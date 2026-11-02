import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Garde-fous communs aux actions serveur.
 *
 * Deux principes :
 *   1. Toute entrée venant du client est validée, y compris les identifiants.
 *      La RLS protège les données, mais un identifiant malformé provoque une
 *      erreur Postgres dont le message peut renseigner un attaquant sur le
 *      schéma. Mieux vaut rejeter avant d'atteindre la base.
 *   2. L'utilisateur est résolu une seule fois, au même endroit.
 */

const uuid = z.string().uuid();

/** Valide un identifiant UUID. Retourne null si la valeur est invalide. */
export function idValide(valeur: unknown): string | null {
  const r = uuid.safeParse(valeur);
  return r.success ? r.data : null;
}

/** Session obligatoire. Redirige vers la connexion si absente. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  return { supabase, user };
}
