import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Écran d'attente pour les onglets dont le module n'est pas encore livré.
 * Évite les 404 dans la navigation basse pendant le développement incrémental.
 */
export function ModuleAVenir({
  titre,
  icone,
  description,
  module,
}: {
  titre: string;
  icone: string;
  description: string;
  module: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-stack-lg px-container-padding-mobile pt-16 text-center">
      <span className="rounded-full bg-surface-container-high p-6 text-on-surface-variant">
        <Icon name={icone} size={48} fill />
      </span>

      <div className="flex flex-col gap-stack-sm">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
          {titre}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {description}
        </p>
        <p className="font-label-md text-label-md uppercase tracking-wider text-primary">
          {module}
        </p>
      </div>

      <Link
        href="/tableau-de-bord"
        className="flex items-center gap-2 rounded-full bg-primary-container px-5 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-opacity hover:opacity-90"
      >
        <Icon name="home" size={18} />
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
