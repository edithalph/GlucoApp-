"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { FormMessage, type ActionState } from "@/components/ui/FormMessage";
import { AppleLogo, GoogleLogo } from "@/components/ui/BrandIcon";
import { signInWithProvider } from "@/app/auth/actions";
import type { SocialProvider } from "@/lib/supabase/providers";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-stack-sm flex h-14 w-full items-center justify-center rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Un instant…" : label}
    </button>
  );
}

function ProviderButton({
  provider,
  label,
  logo,
}: {
  provider: "google" | "apple";
  label: string;
  logo: React.ReactNode;
}) {
  return (
    <form action={signInWithProvider.bind(null, provider)}>
      <button
        type="submit"
        className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-background transition-colors hover:bg-surface-variant"
      >
        {logo}
        {label}
      </button>
    </form>
  );
}

export function AuthForm({
  mode,
  action,
  erreurInitiale,
  suivant,
  providers = [],
}: {
  mode: "signup" | "signin";
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  erreurInitiale?: string;
  /** Chemin interne à rejoindre après connexion. */
  suivant?: string;
  providers?: SocialProvider[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    erreurInitiale ? { error: erreurInitiale } : null,
  );

  const isSignup = mode === "signup";

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-container-padding-mobile pb-10 pt-6 lg:flex-none lg:py-12">
      <p className="eyebrow mb-3">
        {isSignup ? "Un nouveau départ" : "Votre espace personnel"}
      </p>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-on-background">
        {isSignup ? "Créer mon compte" : "Content de vous revoir"}
      </h1>
      <p className="mb-8 mt-3 text-sm leading-relaxed text-on-surface-variant">
        {isSignup
          ? "Quelques instants pour commencer à prendre soin de votre quotidien."
          : "Retrouvez votre suivi et avancez à votre rythme."}
      </p>

      <form action={formAction} className="flex w-full flex-col gap-stack-md">
        {suivant && (
          <input type="hidden" name="suivant" value={suivant} readOnly />
        )}
        <FloatingInput
          // Re-monte le champ quand l'e-mail re-servi change, pour que
          // `defaultValue` soit réellement pris en compte.
          key={state?.values?.email ?? ""}
          label="Adresse e-mail"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          required
        />
        <FloatingInput
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
        />

        <FormMessage state={state} />

        <SubmitButton label={isSignup ? "Créer mon compte" : "Se connecter"} />
      </form>

      {providers.length > 0 && (
        <>
          <div className="my-stack-lg flex w-full items-center gap-4">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              ou
            </span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <div className="flex w-full flex-col gap-stack-sm">
            {providers.includes("google") && (
              <ProviderButton
                provider="google"
                label="Continuer avec Google"
                logo={<GoogleLogo />}
              />
            )}
            {providers.includes("apple") && (
              <ProviderButton
                provider="apple"
                label="Continuer avec Apple"
                logo={<AppleLogo />}
              />
            )}
          </div>
        </>
      )}

      <p className="mt-stack-lg text-center font-body-md text-body-md text-on-surface-variant">
        {isSignup ? (
          <>
            Vous avez déjà un compte ?{" "}
            <Link href="/connexion" className="font-semibold text-primary">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-semibold text-primary">
              Créer un compte
            </Link>
          </>
        )}
      </p>

      {isSignup && (
        <p className="mt-stack-md text-center font-label-md text-label-md text-on-surface-variant">
          En continuant, vous acceptez nos conditions d&apos;utilisation.
        </p>
      )}
    </main>
  );
}
