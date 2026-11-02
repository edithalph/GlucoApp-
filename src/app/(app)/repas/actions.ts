"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { idValide, requireUser } from "@/lib/guards";
import { consommerQuota } from "@/lib/rate-limit";

/**
 * Recherche d'aliments exécutée côté serveur.
 *
 * Passer par une action plutôt que par le client Supabase du navigateur évite
 * d'expédier tout le SDK dans le bundle de la page « Composer » — 70 kB pour
 * une seule requête. Le débit est limité au passage, la fonction SQL étant
 * plus coûteuse qu'un simple SELECT.
 */
export async function rechercherAliments(terme: string) {
  const parsed = z.string().trim().min(2).max(60).safeParse(terme);
  if (!parsed.success) return [];

  const { supabase, user } = await requireUser();

  const quota = await consommerQuota(`recherche:${user.id}`, "recherche");
  if (!quota.autorise) return [];

  const { data, error } = await supabase.rpc("search_foods", {
    terme: parsed.data,
    limite: 12,
  });

  if (error) return [];

  // Seuls les champs utiles à l'affichage et au calcul quittent le serveur.
  return (data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    glycemic_index: f.glycemic_index,
    carbs_per_100g: f.carbs_per_100g,
    kcal_per_100g: f.kcal_per_100g,
    protein_per_100g: f.protein_per_100g,
    fat_per_100g: f.fat_per_100g,
    fiber_per_100g: f.fiber_per_100g,
    // Distingue les compositions corroborées par les tables internationales
    // des préparations dont la valeur dépend du cuisinier.
    is_verified: f.is_verified,
  }));
}

export type AlimentTrouve = Awaited<
  ReturnType<typeof rechercherAliments>
>[number];

const composition = z.object({
  name: z.string().trim().max(120).optional(),
  items: z
    .array(
      z.object({
        food_id: z.string().uuid(),
        quantity_g: z.number().positive().max(5000),
      }),
    )
    .min(1, "Ajoutez au moins un aliment.")
    .max(30),
});

/**
 * Enregistre la composition puis redirige vers l'écran d'impact.
 * Les totaux (kcal, glucides, charge glycémique) sont recalculés côté base
 * par le trigger `recompute_meal_totals` — on ne les envoie pas depuis le client.
 */
export async function creerRepas(payload: unknown): Promise<never> {
  const parsed = composition.safeParse(payload);
  if (!parsed.success) {
    redirect(
      `/repas/composer?erreur=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: repas, error: erreurRepas } = await supabase
    .from("meals")
    .insert({ user_id: user.id, name: parsed.data.name || null })
    .select("id")
    .single();

  if (erreurRepas || !repas) {
    redirect(
      `/repas/composer?erreur=${encodeURIComponent(
        erreurRepas?.message ?? "Création du repas impossible.",
      )}`,
    );
  }

  const { error: erreurItems } = await supabase.from("meal_items").insert(
    parsed.data.items.map((i) => ({
      meal_id: repas.id,
      food_id: i.food_id,
      quantity_g: i.quantity_g,
    })),
  );

  if (erreurItems) {
    // Le repas resterait vide et orphelin : on le retire.
    await supabase.from("meals").delete().eq("id", repas.id);
    redirect(
      `/repas/composer?erreur=${encodeURIComponent(erreurItems.message)}`,
    );
  }

  revalidatePath("/repas");
  redirect(`/repas/${repas.id}/impact`);
}

export async function supprimerRepas(idBrut: string) {
  const id = idValide(idBrut);
  if (!id) return;

  const { supabase, user } = await requireUser();

  // `meal_items` et `meal_predictions` partent en cascade (ON DELETE CASCADE).
  await supabase.from("meals").delete().eq("id", id).eq("user_id", user.id);

  // Pas de `redirect` ici : rediriger vers la page d'où l'on vient n'est pas
  // une navigation et ne rafraîchit donc rien. Le composant appelant fait un
  // `router.refresh()` ou un `push` selon l'écran.
  revalidatePath("/repas");
  revalidatePath("/tableau-de-bord");
}

/** Recrée un repas à partir d'un repas personnel, sans modifier l'original. */
export async function dupliquerRepas(idBrut: string) {
  const id = idValide(idBrut);
  if (!id) return;
  const { supabase, user } = await requireUser();
  const { data: source } = await supabase
    .from("meals")
    .select("name, meal_items(food_id, quantity_g)")
    .eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!source || source.meal_items.length === 0) return;
  const { data: copie } = await supabase
    .from("meals")
    .insert({ user_id: user.id, name: source.name ? `${source.name} (copie)` : "Repas copié" })
    .select("id").single();
  if (!copie) return;
  const { error } = await supabase.from("meal_items").insert(source.meal_items.map((item) => ({ meal_id: copie.id, food_id: item.food_id, quantity_g: item.quantity_g })));
  if (error) { await supabase.from("meals").delete().eq("id", copie.id).eq("user_id", user.id); return; }
  revalidatePath("/repas");
  redirect(`/repas/${copie.id}/impact`);
}

export async function basculerFavoriRepas(idBrut: string, favori: boolean) {
  const id = idValide(idBrut);
  if (!id) return;
  const { supabase, user } = await requireUser();
  if (favori) await supabase.from("favorite_meals").upsert({ user_id: user.id, meal_id: id });
  else await supabase.from("favorite_meals").delete().eq("user_id", user.id).eq("meal_id", id);
  revalidatePath("/repas");
}

const predictionSchema = z.object({
  mealId: z.string().uuid(),
  baselineMgdl: z.number().finite().min(0).max(1000),
  peakMgdl: z.number().finite().min(0).max(2000),
  peakMinutes: z.number().int().min(0).max(600),
  risk: z.enum(["low", "moderate", "high"]),
});

/** Mémorise la prédiction affichée, pour pouvoir la confronter au réel ensuite. */
export async function enregistrerPrediction(payload: unknown) {
  const parsed = predictionSchema.safeParse(payload);
  if (!parsed.success) return;

  const { supabase, user } = await requireUser();

  // La RLS de `meal_predictions` remonte au propriétaire via `meals` ;
  // on vérifie tout de même l'appartenance pour ne pas dépendre d'elle seule.
  const { data: repas } = await supabase
    .from("meals")
    .select("id")
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!repas) return;

  // Idempotent : l'écran d'impact étant un rendu serveur, il est ré-exécuté à
  // chaque visite et préchargement. Sans ce garde-fou, chaque affichage
  // ajouterait une ligne identique.
  const { data: deja } = await supabase
    .from("meal_predictions")
    .select("id")
    .eq("meal_id", parsed.data.mealId)
    .maybeSingle();

  if (deja) return;

  await supabase.from("meal_predictions").insert({
    meal_id: parsed.data.mealId,
    baseline_mgdl: parsed.data.baselineMgdl,
    predicted_peak_mgdl: parsed.data.peakMgdl,
    predicted_peak_minutes: parsed.data.peakMinutes,
    risk: parsed.data.risk,
  });
}
