"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { idValide, requireUser } from "@/lib/guards";
import type { ActionState } from "@/components/ui/FormMessage";
import { PLAUSIBLE_RANGE_MGDL } from "@/lib/units";
import { TEA_OFFSETS } from "@/lib/tea";

const valeurGlycemie = z.coerce
  .number()
  .min(PLAUSIBLE_RANGE_MGDL.min)
  .max(PLAUSIBLE_RANGE_MGDL.max);

/** Démarre une session : thé choisi + mesure initiale. */
export async function demarrerSession(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ tea_id: z.string().uuid(), baseline_mgdl: valeurGlycemie })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Choisissez un thé et saisissez une mesure valide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // L'index unique partiel `tea_sessions_one_active_per_user` empêche déjà
  // deux sessions actives ; on le vérifie d'abord pour renvoyer un message
  // clair plutôt qu'une erreur de contrainte.
  const { data: enCours } = await supabase
    .from("tea_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (enCours) redirect(`/the/session/${enCours.id}`);

  const { data: session, error } = await supabase
    .from("tea_sessions")
    .insert({
      user_id: user.id,
      tea_id: parsed.data.tea_id,
      baseline_mgdl: parsed.data.baseline_mgdl,
    })
    .select("id")
    .single();

  if (error || !session) {
    return { error: `Session impossible à démarrer : ${error?.message ?? ""}` };
  }

  // La mesure initiale alimente aussi l'historique glycémique général.
  await supabase.from("glucose_readings").insert({
    user_id: user.id,
    value_mgdl: parsed.data.baseline_mgdl,
    context: "pre_tea",
  });

  revalidatePath("/the");
  redirect(`/the/session/${session.id}`);
}

/** Marque la prise du thé : c'est l'origine des décalages de mesure. */
export async function marquerTheePris(idBrut: string) {
  const sessionId = idValide(idBrut);
  if (!sessionId) return;

  const { supabase, user } = await requireUser();

  await supabase
    .from("tea_sessions")
    .update({ tea_taken_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "active");

  revalidatePath(`/the/session/${sessionId}`);
}

/** Enregistre une mesure post-thé et clôture la session si c'était la dernière. */
export async function enregistrerMesure(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Le décalage n'est PAS transmis par le client : il est déduit côté serveur
  // des mesures déjà enregistrées. Sans cela, un formulaire dont les props
  // n'ont pas été rafraîchies renvoie un décalage périmé et la contrainte
  // d'unicité rejette la saisie.
  const parsed = z
    .object({
      session_id: z.string().uuid(),
      value_mgdl: valeurGlycemie,
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: "Mesure invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: session } = await supabase
    .from("tea_sessions")
    .select("id, user_id")
    .eq("id", parsed.data.session_id)
    .eq("user_id", user.id)
    .single();

  if (!session) return { error: "Session introuvable." };

  const { data: dejaFaites } = await supabase
    .from("tea_measurements")
    .select("offset_minutes")
    .eq("session_id", parsed.data.session_id);

  const faits = new Set((dejaFaites ?? []).map((m) => m.offset_minutes));
  const offset = TEA_OFFSETS.find((o) => !faits.has(o));

  if (offset === undefined) {
    return { error: "Toutes les mesures de cette session sont déjà prises." };
  }

  const { error } = await supabase.from("tea_measurements").insert({
    session_id: parsed.data.session_id,
    offset_minutes: offset,
    value_mgdl: parsed.data.value_mgdl,
  });

  if (error) {
    return { error: `Enregistrement impossible : ${error.message}` };
  }

  await supabase.from("glucose_readings").insert({
    user_id: user.id,
    value_mgdl: parsed.data.value_mgdl,
    context: "post_tea",
  });

  // Toutes les mesures faites : on clôture.
  faits.add(offset);
  const complete = TEA_OFFSETS.every((o) => faits.has(o));

  if (complete) {
    await supabase
      .from("tea_sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", parsed.data.session_id);

    revalidatePath("/the");
    redirect(`/the/session/${parsed.data.session_id}/resume`);
  }

  // Ni `revalidatePath` ni un `redirect` vers l'URL courante ne rafraîchissent
  // les props du composant client — rediriger vers la page où l'on est déjà
  // n'est pas une navigation. Le client appelle `router.refresh()` à réception
  // de ce message.
  revalidatePath(`/the/session/${parsed.data.session_id}`);
  return { info: `Mesure à +${offset} min enregistrée.` };
}

/** Termine la session avant la fin — l'effet est calculé sur ce qui existe. */
export async function terminerSession(idBrut: string) {
  const sessionId = idValide(idBrut);
  if (!sessionId) return;

  const { supabase, user } = await requireUser();

  const { data: mesures } = await supabase
    .from("tea_measurements")
    .select("id")
    .eq("session_id", sessionId);

  // Sans aucune mesure, la session n'a rien à montrer : on l'abandonne.
  const statut = (mesures ?? []).length > 0 ? "completed" : "abandoned";

  await supabase
    .from("tea_sessions")
    .update({ status: statut, ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  revalidatePath("/the");
  redirect(statut === "completed" ? `/the/session/${sessionId}/resume` : "/the");
}

/**
 * Supprime une session et tout ce qui s'y rattache.
 *
 * Les mesures partent en cascade (`tea_measurements.session_id` est déclarée
 * `on delete cascade`). Les relevés glycémiques créés pendant la session, eux,
 * sont volontairement CONSERVÉS : ce sont de vraies mesures, qui appartiennent
 * à l'historique glycémique indépendamment du rituel qui les a motivées.
 */
export async function supprimerSession(idBrut: string) {
  const sessionId = idValide(idBrut);
  if (!sessionId) return;

  const { supabase, user } = await requireUser();

  await supabase
    .from("tea_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  revalidatePath("/the");
}
