import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center gap-stack-lg px-container-padding-mobile md:px-container-padding-desktop text-center">
      <span className="rounded-full bg-surface-container-high p-6 text-on-surface-variant">
        <Icon name="search_off" size={48} fill />
      </span>

      <div className="flex flex-col gap-stack-sm">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          Page introuvable
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Cette page n&apos;existe pas, ou le contenu ne vous appartient pas.
        </p>
      </div>

      <Link
        href="/tableau-de-bord"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-opacity hover:opacity-90"
      >
        <Icon name="home" size={20} />
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
