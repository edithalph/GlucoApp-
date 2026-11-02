import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { SaisieForm } from "./SaisieForm";
import type { GlucoseUnit } from "@/lib/units";

export default async function SaisiePage({ searchParams }: { searchParams: Promise<{ mealId?: string }> }) {
  const { mealId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: profile }, { data: dernier }, { data: repas }] = await Promise.all([
    supabase
      .from("profiles")
      .select("preferred_unit, target_min_mgdl, target_max_mgdl")
      .eq("id", user.id)
      .single(),
    supabase
      .from("glucose_readings")
      .select("value_mgdl")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("id, name, eaten_at")
      .eq("user_id", user.id)
      .order("eaten_at", { ascending: false })
      .limit(12),
  ]);

  return (
    <main className="mx-auto w-full max-w-md px-container-padding-mobile md:px-container-padding-desktop">
      <header className="mb-stack-lg flex items-center gap-2">
        <Link
          href="/glycemie"
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Nouvelle mesure
        </h1>
      </header>

      <SaisieForm
        unit={(profile?.preferred_unit ?? "g_l") as GlucoseUnit}
        targetMin={Number(profile?.target_min_mgdl ?? 70)}
        targetMax={Number(profile?.target_max_mgdl ?? 140)}
        lastReadingMgdl={dernier ? Number(dernier.value_mgdl) : null}
        meals={(repas ?? []).map((meal) => ({
          id: meal.id,
          label: meal.name ?? `Repas du ${new Date(meal.eaten_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
        }))}
        initialMealId={mealId}
      />
    </main>
  );
}
