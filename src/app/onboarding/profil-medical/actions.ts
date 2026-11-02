"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/components/ui/FormMessage";

const etape1 = z.object({
  first_name: z.string().trim().min(1, "Indiquez votre prénom.").max(60),
  age: z.coerce.number().int().min(1).max(120),
  sex: z.enum(["male", "female"]),
  weight_kg: z.coerce.number().min(20, "Poids invalide.").max(400),
  height_cm: z.coerce.number().min(50, "Taille invalide.").max(260),
});

const etape2 = z.object({
  condition: z.enum(["type1", "type2", "prediabetic", "prevention", "other"]),
});

/** Le profil facultatif peut être complété ultérieurement depuis le profil. */
export async function ignorerProfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);
  if (error) throw new Error("Impossible de continuer pour le moment.");
  revalidatePath("/", "layout");
  redirect("/tableau-de-bord");
}

export async function enregistrerEtape1(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = etape1.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return { error: `Enregistrement impossible : ${error.message}` };

  redirect("/onboarding/profil-medical/etape-2");
}

export async function enregistrerEtape2(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = etape2.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Sélectionnez votre situation." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Cible thérapeutique par défaut selon la situation, en mg/dL.
  // Valeurs indicatives, ajustables ensuite depuis le profil.
  const cibles: Record<string, { min: number; max: number }> = {
    type1: { min: 70, max: 180 },
    type2: { min: 70, max: 180 },
    prediabetic: { min: 70, max: 140 },
    prevention: { min: 70, max: 140 },
    other: { min: 70, max: 140 },
  };
  const cible = cibles[parsed.data.condition];

  const { error } = await supabase
    .from("profiles")
    .update({
      condition: parsed.data.condition,
      target_min_mgdl: cible.min,
      target_max_mgdl: cible.max,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) return { error: `Enregistrement impossible : ${error.message}` };

  revalidatePath("/", "layout");
  redirect("/tableau-de-bord");
}
