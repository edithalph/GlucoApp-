/**
 * Source unique des destinations de navigation.
 *
 * La barre basse (mobile) et la barre latérale (écrans larges) sont générées
 * à partir de ce tableau : elles ne peuvent donc pas diverger. Un utilisateur
 * retrouve les mêmes entrées, dans le même ordre, avec les mêmes icônes,
 * quel que soit son appareil.
 */
export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Préfixes d'URL qui doivent aussi allumer cette entrée. */
  correspond?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/tableau-de-bord", label: "Accueil", icon: "home" },
  {
    href: "/glycemie",
    label: "Glycémie",
    icon: "bloodtype",
    correspond: ["/poids"],
  },
  { href: "/repas", label: "Repas", icon: "restaurant" },
  { href: "/the", label: "Thé", icon: "emoji_food_beverage" },
  {
    href: "/profil",
    label: "Profil",
    icon: "person",
    correspond: ["/conseils"],
  },
];

/** Une entrée est active si l'URL courante est dans sa section. */
export function estActif(item: NavItem, pathname: string): boolean {
  const prefixes = [item.href, ...(item.correspond ?? [])];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Titre de la section courante, pour situer l'utilisateur. */
export function sectionCourante(pathname: string): string | null {
  return NAV_ITEMS.find((i) => estActif(i, pathname))?.label ?? null;
}
