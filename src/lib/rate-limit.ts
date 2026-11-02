import "server-only";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

/**
 * ============================================================================
 * Limitation de débit.
 * ============================================================================
 *
 * Deux implémentations, choisies automatiquement :
 *
 *   • `SUPABASE_SERVICE_ROLE_KEY` définie → compteur PERSISTÉ en base
 *     (fonction `consommer_quota`). C'est le mode correct : l'état est partagé
 *     entre toutes les instances et survit aux redémarrages.
 *
 *   • Sinon → compteur EN MÉMOIRE, propre au processus. Suffisant pour un
 *     `next start` unique ou le développement, mais contournable dès qu'il y a
 *     plusieurs instances (serverless notamment), et remis à zéro à chaque
 *     redéploiement.
 *
 * À noter : Supabase Auth applique déjà ses propres limites côté GoTrue sur
 * l'inscription et la connexion. Ce module protège surtout les écritures
 * applicatives, qui n'ont sinon aucun garde-fou.
 */

export type Quota = {
  autorise: boolean;
  restant: number;
  /** Secondes avant réouverture de la fenêtre. */
  repriseDans: number;
};

/** Barèmes par type d'action. */
export const BAREMES = {
  auth: { limite: 10, fenetreSecondes: 300 },
  ecriture: { limite: 60, fenetreSecondes: 60 },
  recherche: { limite: 120, fenetreSecondes: 60 },
} as const;

export type TypeAction = keyof typeof BAREMES;

// ---------------------------------------------------------------------------
// Repli en mémoire
// ---------------------------------------------------------------------------

const memoire = new Map<string, { compteur: number; finMs: number }>();

function consommerEnMemoire(
  cle: string,
  limite: number,
  fenetreSecondes: number,
): Quota {
  const maintenant = Date.now();
  const courant = memoire.get(cle);

  // Purge opportuniste : évite que la table enfle indéfiniment.
  if (memoire.size > 5000) {
    for (const [k, v] of memoire) if (v.finMs < maintenant) memoire.delete(k);
  }

  if (!courant || courant.finMs < maintenant) {
    memoire.set(cle, {
      compteur: 1,
      finMs: maintenant + fenetreSecondes * 1000,
    });
    return { autorise: true, restant: limite - 1, repriseDans: fenetreSecondes };
  }

  courant.compteur += 1;
  return {
    autorise: courant.compteur <= limite,
    restant: Math.max(0, limite - courant.compteur),
    repriseDans: Math.ceil((courant.finMs - maintenant) / 1000),
  };
}

// ---------------------------------------------------------------------------
// Mode persisté
// ---------------------------------------------------------------------------

function clientAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) return null;

  return createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Identifie l'appelant. On préfère l'identifiant utilisateur quand il existe ;
 * sinon l'adresse IP transmise par le proxy.
 *
 * `x-forwarded-for` est falsifiable si l'application est exposée directement.
 * Derrière Vercel ou un reverse proxy correctement configuré, l'en-tête est
 * réécrit et fiable.
 */
export async function identifiantAppelant(
  prefixe: string,
  identite?: string,
): Promise<string> {
  if (identite) return `${prefixe}:u:${identite}`;

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "inconnu";

  return `${prefixe}:ip:${ip}`;
}

/** Consomme une unité de quota. */
export async function consommerQuota(
  cle: string,
  type: TypeAction = "ecriture",
): Promise<Quota> {
  const { limite, fenetreSecondes } = BAREMES[type];
  const admin = clientAdmin();

  if (!admin) return consommerEnMemoire(cle, limite, fenetreSecondes);

  const { data, error } = await admin.rpc("consommer_quota", {
    cle_in: cle,
    limite_in: limite,
    fenetre_secondes: fenetreSecondes,
  });

  // En cas d'indisponibilité de la base, on n'ouvre pas les vannes en grand :
  // on bascule sur le compteur local plutôt que d'autoriser aveuglément.
  if (error || !data || !Array.isArray(data) || data.length === 0) {
    return consommerEnMemoire(cle, limite, fenetreSecondes);
  }

  const ligne = data[0] as {
    autorise: boolean;
    restant: number;
    reprise_dans: number;
  };

  return {
    autorise: ligne.autorise,
    restant: ligne.restant,
    repriseDans: ligne.reprise_dans,
  };
}

/** Message d'attente lisible. */
export function messageQuota(quota: Quota): string {
  const minutes = Math.ceil(quota.repriseDans / 60);
  return minutes > 1
    ? `Trop de tentatives. Réessayez dans ${minutes} minutes.`
    : "Trop de tentatives. Réessayez dans une minute.";
}
