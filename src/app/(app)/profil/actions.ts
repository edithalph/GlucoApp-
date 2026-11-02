"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { idValide, requireUser } from "@/lib/guards";
import type { ActionState } from "@/components/ui/FormMessage";

/** Change l'unité d'affichage. Les valeurs stockées en mg/dL ne bougent pas. */
export async function changerUnite(unite: string) {
  const parsed = z.enum(["g_l", "mmol_l", "mg_dl"]).safeParse(unite);
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  await supabase
    .from("profiles")
    .update({ preferred_unit: parsed.data })
    .eq("id", user.id);

  // L'unité change l'affichage de presque tous les écrans.
  revalidatePath("/", "layout");
}

const rappel = z.object({
  label: z.string().trim().min(1, "Donnez un nom au rappel.").max(80),
  kind: z.enum(["glucose", "tea", "meal", "custom"]),
  time_of_day: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide."),
});

export async function creerRappel(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = rappel.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    label: parsed.data.label,
    kind: parsed.data.kind,
    time_of_day: parsed.data.time_of_day,
  });

  if (error) return { error: `Création impossible : ${error.message}` };

  revalidatePath("/profil/rappels");
  return { info: "Rappel créé." };
}

export async function basculerRappel(idBrut: string, actif: boolean) {
  const id = idValide(idBrut);
  if (!id || typeof actif !== "boolean") return;

  const { supabase, user } = await requireUser();

  await supabase
    .from("reminders")
    .update({ is_active: actif })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/profil/rappels");
}
