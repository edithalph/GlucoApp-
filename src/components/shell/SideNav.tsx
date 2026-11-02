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
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-24 flex-col bg-brand-navy text-white md:flex lg:w-60">
      {/* Marque */}
      <Link
        href="/tableau-de-bord"
        className="flex h-24 shrink-0 items-center justify-center gap-3 px-3 lg:justify-start lg:px-6"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-teal text-brand-navy">
          <Icon name="water_drop" fill size={24} />
        </span>
        <span className="hidden text-xl font-semibold tracking-tight text-white lg:inline">
          GlucoApp
        </span>
      </Link>

      {/* Sections */}
      <nav
        aria-label="Navigation principale"
        className="flex-1 px-2 py-4 lg:px-4"
      >
        <p className="mb-5 hidden px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-mist/70 lg:block">
          Mon quotidien
        </p>
        <ul className="flex flex-col gap-2">
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
                      ? "bg-brand-mist font-semibold text-brand-navy shadow-sm"
                      : "text-brand-mist hover:bg-white/10 hover:text-white"
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
      <Link
        href="/conseils"
        className="mx-4 mb-6 hidden rounded-xl border border-brand-teal/30 bg-white/5 p-4 lg:block"
      >
        <Icon name="lightbulb" className="mb-3 text-brand-gold" />
        <span className="block text-sm font-semibold">Un pas à la fois.</span>
        <span className="mt-2 block text-xs leading-relaxed text-brand-mist">
          Des conseils pour mieux comprendre votre quotidien.
        </span>
        <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-teal">
          Explorer les conseils
          <Icon name="arrow_forward" size={16} />
        </span>
      </Link>
      <div className="flex shrink-0 flex-col gap-1 border-t border-white/15 px-2 py-4 lg:px-3">
        <Link
          href="/profil/rappels"
          title="Rappels"
          className="flex min-h-[48px] items-center justify-center gap-3 rounded-xl px-3 text-brand-mist transition-colors hover:bg-white/10 lg:justify-start lg:px-4"
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
          className="flex min-h-[48px] items-center justify-center gap-3 rounded-xl px-3 transition-colors hover:bg-white/10 lg:justify-start lg:px-4"
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
          <span className="hidden truncate font-body-md text-body-md text-white lg:inline">
            {firstName ?? "Mon profil"}
          </span>
        </Link>
      </div>
    </aside>
  );
}
