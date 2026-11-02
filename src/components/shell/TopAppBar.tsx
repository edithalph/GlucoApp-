import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Barre supérieure — téléphone uniquement.
 *
 * À partir de `md`, la marque et le profil vivent dans la barre latérale :
 * les afficher aussi en haut ferait doublon et volerait de la hauteur utile.
 */
export function TopAppBar({
  avatarUrl,
  firstName,
}: {
  avatarUrl?: string | null;
  firstName?: string | null;
}) {
  const initiale = (firstName ?? "?").charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between bg-surface px-container-padding-mobile shadow-sm md:hidden">
      <Link
        href="/profil"
        aria-label="Mon profil"
        className="flex items-center gap-stack-sm transition-opacity active:opacity-70"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full border border-outline-variant object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md text-on-primary-fixed-variant">
            {initiale}
          </span>
        )}
        <span className="font-headline-md text-headline-md font-semibold text-primary">
          GlucoApp
        </span>
      </Link>

      <Link
        href="/profil/rappels"
        aria-label="Rappels et notifications"
        className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors active:bg-surface-variant"
      >
        <Icon name="notifications" />
      </Link>
    </header>
  );
}
