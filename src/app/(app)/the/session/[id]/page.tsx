import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { SessionEnCours } from "./SessionEnCours";
import type { GlucoseUnit } from "@/lib/units";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: session }, { data: mesures }, { data: profile }] =
    await Promise.all([
      supabase
        .from("tea_sessions")
        .select("id, status, baseline_mgdl, tea_taken_at, teas(name)")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("tea_measurements")
        .select("offset_minutes, value_mgdl")
        .eq("session_id", id)
        .order("offset_minutes"),
      supabase
        .from("profiles")
        .select("preferred_unit")
        .eq("id", user.id)
        .single(),
    ]);

  if (!session) notFound();

  // Une session close n'est plus pilotable : son résumé est la bonne vue.
  if (session.status !== "active") redirect(`/the/session/${id}/resume`);

  return (
    <main className="mx-auto w-full max-w-md px-container-padding-mobile md:px-container-padding-desktop">
      <header className="mb-stack-lg flex items-center gap-2">
        <Link
          href="/the"
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Session en cours 🍵
        </h1>
      </header>

      <SessionEnCours
        sessionId={session.id}
        teaName={session.teas?.name ?? "Thé"}
        baselineMgdl={
          session.baseline_mgdl !== null ? Number(session.baseline_mgdl) : null
        }
        teaTakenAt={session.tea_taken_at}
        mesures={(mesures ?? []).map((m) => ({
          offset_minutes: m.offset_minutes,
          value_mgdl: Number(m.value_mgdl),
        }))}
        unit={(profile?.preferred_unit ?? "g_l") as GlucoseUnit}
      />
    </main>
  );
}
