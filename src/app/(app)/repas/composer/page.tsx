import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Composer } from "./Composer";

export default async function ComposerPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-container-padding-mobile md:px-container-padding-desktop">
      <header className="mb-stack-lg flex items-center gap-2">
        <Link
          href="/repas"
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-title-lg text-title-lg text-on-background">
          Composer mon repas
        </h1>
      </header>

      <Composer erreurInitiale={erreur} />
    </main>
  );
}
