import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Icon } from "@/components/ui/Icon";
import { signIn } from "@/app/auth/actions";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; suivant?: string }>;
}) {
  const { erreur, suivant } = await searchParams;

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-surface-container-lowest">
      <header className="relative z-40 flex w-full items-center bg-surface-container-lowest px-container-padding-mobile pb-4 pt-8">
        <Link
          href="/onboarding"
          aria-label="Retour"
          className="-ml-2 flex items-center justify-center rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant hover:text-primary"
        >
          <Icon name="arrow_back" />
        </Link>
      </header>

      <AuthForm
        mode="signin"
        action={signIn}
        erreurInitiale={erreur}
        suivant={suivant}
      />
    </div>
  );
}
