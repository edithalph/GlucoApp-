"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, estActif } from "./nav-items";

/**
 * Navigation principale à partir de `md`.
 *
 * Elle reprend exactement les entrées de la barre basse — mêmes destinations,
 * mêmes icônes, mêmes libellés, même ordre — pour qu'un utilisateur passant du
 * téléphone à l'ordinateur retrouve ses repères.
 *
 * Deux largeurs : rail de 80 px sur tablette, où l'espace horizontal est
 * compté, et 240 px à partir de `lg` où le libellé se place à côté de l'icône.
 */
export function SideNav({
  firstName,
  avatarUrl,
}: {
  firstName?: string | null;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const initiale = (firstName ?? "?").charAt(0).toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-24 flex-col border-r border-outline-variant/40 bg-surface-container-lowest md:flex lg:w-60">
      {/* Marque */}
      <Link
        href="/tableau-de-bord"
        className="flex h-16 shrink-0 items-center justify-center gap-2 px-3 lg:justify-start lg:px-5"
      >
        <Icon name="water_drop" fill size={26} className="text-primary" />
        <span className="hidden font-headline-md text-headline-md font-semibold text-primary lg:inline">
          GlucoApp
        </span>
      </Link>

      {/* Sections */}
      <nav aria-label="Navigation principale" className="flex-1 px-2 py-2 lg:px-3">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const actif = estActif(item, pathname);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={actif ? "page" : undefined}
                  title={item.label}
                  // Rail : icône au-dessus du libellé, comme la barre basse.
                  // À partir de lg : libellé à côté de l'icône.
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-colors lg:min-h-[52px] lg:flex-row lg:justify-start lg:gap-3 lg:px-4 ${
                    actif
                      ? "bg-primary-fixed font-semibold text-on-primary-fixed-variant"
                      : "text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  <Icon name={item.icon} fill={actif} size={22} />
                  {/* Jamais d'icône seule : un libellé est toujours lisible,
                      quelle que soit la largeur. */}
                  <span className="font-label-md text-label-md leading-tight lg:font-body-lg lg:text-body-lg">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Raccourcis bas */}
      <div className="flex shrink-0 flex-col gap-1 border-t border-outline-variant/40 px-2 py-3 lg:px-3">
        <Link
          href="/profil/rappels"
          title="Rappels"
          className="flex min-h-[48px] items-center justify-center gap-3 rounded-xl px-3 text-on-surface-variant transition-colors hover:bg-surface-variant lg:justify-start lg:px-4"
        >
          <Icon name="notifications" size={20} />
          <span className="hidden font-body-md text-body-md lg:inline">
            Rappels
          </span>
          <span className="sr-only lg:hidden">Rappels</span>
        </Link>

        <Link
          href="/profil"
          title={firstName ?? "Mon profil"}
          className="flex min-h-[48px] items-center justify-center gap-3 rounded-xl px-3 transition-colors hover:bg-surface-variant lg:justify-start lg:px-4"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md text-on-primary-fixed-variant">
              {initiale}
            </span>
          )}
          <span className="hidden truncate font-body-md text-body-md text-on-surface lg:inline">
            {firstName ?? "Mon profil"}
          </span>
        </Link>
      </div>
    </aside>
  );
}
