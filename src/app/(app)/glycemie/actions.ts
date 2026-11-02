"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { idValide, requireUser } from "@/lib/guards";
import type { ActionState } from "@/components/ui/FormMessage";
import { PLAUSIBLE_RANGE_MGDL } from "@/lib/units";

const releve = z.object({
  value_mgdl: z.coerce
    .number()
    .min(PLAUSIBLE_RANGE_MGDL.min)
    .max(PLAUSIBLE_RANGE_MGDL.max),
  context: z.enum([
    "fasting",
    "pre_meal",
    "post_meal",
    "pre_tea",
    "post_tea",
    "other",
  ]),
  measured_at: z.string().optional(),
  note: z.string().trim().max(500).optional(),
  meal_id: z.string().uuid().optional().or(z.literal("")),
  activity_minutes: z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().int().min(0).max(1440).optional()),
  sleep_hours: z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().min(0).max(24).optional()),
  stress_level: z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().int().min(1).max(5).optional()),
  medication_taken: z.enum(["true", "false"]).optional(),
  symptoms: z.string().trim().max(500).optional(),
});

export async function enregistrerReleve(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = releve.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Valeur ou contexte invalide. Vérifiez votre saisie." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Un UUID valide n'est pas une autorisation : un relevé ne peut être lié
  // qu'à l'un des repas du propriétaire courant.
  if (parsed.data.meal_id) {
    const { data: meal } = await supabase
      .from("meals")
      .select("id")
      .eq("id", parsed.data.meal_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!meal) return { error: "Le repas associé est introuvable." };
  }

  const { error } = await supabase.from("glucose_readings").insert({
    user_id: user.id,
    value_mgdl: parsed.data.value_mgdl,
    context: parsed.data.context,
    measured_at: parsed.data.measured_at || new Date().toISOString(),
    note: parsed.data.note || null,
    meal_id: parsed.data.meal_id || null,
    activity_minutes: parsed.data.activity_minutes ?? null,
    sleep_hours: parsed.data.sleep_hours ?? null,
    stress_level: parsed.data.stress_level ?? null,
    medication_taken:
      parsed.data.medication_taken === undefined
        ? null
        : parsed.data.medication_taken === "true",
    symptoms: parsed.data.symptoms || null,
  });

  if (error) return { error: `Enregistrement impossible : ${error.message}` };

  revalidatePath("/tableau-de-bord");
  revalidatePath("/glycemie");
  redirect("/glycemie");
}

export async function supprimerReleve(idBrut: string) {
  const id = idValide(idBrut);
  if (!id) return;

  const { supabase, user } = await requireUser();

  // La RLS restreint déjà à l'utilisateur ; le filtre explicite documente l'intention.
  await supabase
    .from("glucose_readings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/tableau-de-bord");
  revalidatePath("/glycemie");
}

const poids = z.object({
  weight_kg: z.coerce.number().min(20).max(400),
});

export async function enregistrerPoids(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = poids.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Poids invalide (entre 20 et 400 kg)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { error } = await supabase.from("weight_entries").insert({
    user_id: user.id,
    weight_kg: parsed.data.weight_kg,
  });

  if (error) return { error: `Enregistrement impossible : ${error.message}` };

  // Le poids courant du profil suit la dernière pesée.
  await supabase
    .from("profiles")
    .update({ weight_kg: parsed.data.weight_kg })
    .eq("id", user.id);

  revalidatePath("/tableau-de-bord");
  redirect("/tableau-de-bord");
}
