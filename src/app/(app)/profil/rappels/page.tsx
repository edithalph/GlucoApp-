import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { RappelsClient } from "./RappelsClient";

export default async function RappelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: rappels } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user.id)
    .order("time_of_day");

  return (
    <main className="mx-auto w-full max-w-md px-container-padding-mobile md:px-container-padding-desktop">
      <header className="mb-stack-lg flex items-center gap-2">
        <Link
          href="/profil"
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Rappels
        </h1>
      </header>

      <RappelsClient rappels={rappels ?? []} />
    </main>
  );
}
