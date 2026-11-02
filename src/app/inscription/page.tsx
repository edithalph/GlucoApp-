import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Icon } from "@/components/ui/Icon";
import { signUp } from "@/app/auth/actions";
import { AuthIntro } from "@/components/auth/AuthIntro";
import { enabledProviders } from "@/lib/supabase/providers";

export default async function InscriptionPage() {
  const providers = await enabledProviders();
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <AuthIntro />
      <div className="relative flex min-h-[100dvh] flex-col bg-surface-container-lowest lg:justify-center">
        <header className="relative z-40 flex w-full items-center bg-surface-container-lowest px-container-padding-mobile pb-4 pt-8">
          <Link
            href="/onboarding"
            aria-label="Retour"
            className="-ml-2 flex items-center justify-center rounded-full p-2 text-on-surface transition-colors hover:bg-surface-variant hover:text-primary"
          >
            <Icon name="arrow_back" />
          </Link>
        </header>

        <AuthForm mode="signup" action={signUp} providers={providers} />
      </div>
    </div>
  );
}
