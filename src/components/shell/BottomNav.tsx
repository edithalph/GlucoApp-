"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, estActif } from "./nav-items";

/**
 * Navigation principale sur téléphone : barre basse, à portée de pouce.
 * Au-delà de `md`, c'est la barre latérale qui prend le relais.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 z-50 w-full rounded-t-xl bg-surface-container-lowest shadow-dock md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around px-1 py-2">
        {NAV_ITEMS.map((tab) => {
          const actif = estActif(tab, pathname);

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={actif ? "page" : undefined}
                // 56px de haut : au-dessus des 44px recommandés pour une
                // cible tactile, et la zone couvre toute la largeur de l'onglet.
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-colors ${
                  actif
                    ? "text-primary"
                    : "text-on-surface-variant active:bg-surface-variant"
                }`}
              >
                <span
                  className={`flex h-7 w-14 items-center justify-center rounded-full transition-colors ${
                    actif ? "bg-primary-fixed" : ""
                  }`}
                >
                  <Icon name={tab.icon} fill={actif} size={22} />
                </span>
                <span
                  className={`font-label-md text-label-md leading-tight ${
                    actif ? "font-semibold" : ""
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
