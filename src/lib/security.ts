/**
 * ============================================================================
 * En-têtes de sécurité HTTP.
 * ============================================================================
 *
 * La CSP est construite avec un nonce généré par requête. Next.js détecte le
 * nonce présent dans l'en-tête `Content-Security-Policy` et l'applique
 * automatiquement à ses propres balises <script> — c'est ce qui permet une
 * politique stricte sans `unsafe-inline` sur les scripts.
 */

/** Origine du projet Supabase, extraite de l'URL publique. */
function origineSupabase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

export function buildCsp(nonce: string, dev: boolean): string {
  const supabase = origineSupabase();

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],

    // `strict-dynamic` : seuls les scripts porteurs du nonce peuvent charger
    // d'autres scripts. Les listes d'hôtes deviennent alors inutiles, ce qui
    // supprime toute une classe de contournements de CSP.
    // En développement, Next évalue du code pour le rafraîchissement à chaud.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(dev ? ["'unsafe-eval'"] : []),
    ],

    // Tailwind et Next injectent des styles en ligne : `unsafe-inline` est
    // inévitable ici. L'impact est faible, une injection CSS ne permet pas
    // d'exécuter de code.
    "style-src": ["'self'", "'unsafe-inline'"],

    // Polices auto-hébergées : plus aucun domaine externe autorisé.
    "font-src": ["'self'", "data:"],

    // Illustrations générées par Stitch + images encodées en data URI.
    "img-src": ["'self'", "data:", "blob:", "https://lh3.googleusercontent.com"],

    // Seul le projet Supabase est joignable en XHR/WebSocket.
    "connect-src": [
      "'self'",
      ...(supabase ? [supabase, supabase.replace("https://", "wss://")] : []),
      ...(dev ? ["ws://localhost:*", "http://localhost:*"] : []),
    ],

    // L'application n'embarque aucune iframe et ne doit pas être embarquée :
    // protection contre le clickjacking.
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],

    // Empêche l'injection d'une <base> qui détournerait les URL relatives.
    "base-uri": ["'self'"],

    // Les formulaires ne peuvent poster que vers l'application elle-même.
    "form-action": ["'self'"],

    "object-src": ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
  };

  const csp = Object.entries(directives)
    .map(([cle, valeurs]) => `${cle} ${valeurs.join(" ")}`)
    .join("; ");

  // En production uniquement : force le passage en HTTPS des sous-ressources.
  return dev ? csp : `${csp}; upgrade-insecure-requests`;
}

/** En-têtes appliqués à toutes les réponses. */
export function securityHeaders(dev: boolean): Record<string, string> {
  return {
    // Empêche le navigateur de deviner un type MIME différent de celui déclaré,
    // vecteur classique d'exécution de contenu téléversé.
    "X-Content-Type-Options": "nosniff",

    // Redondant avec `frame-ancestors` pour les navigateurs anciens.
    "X-Frame-Options": "DENY",

    // Ne divulgue l'URL complète qu'aux navigations internes.
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Aucune de ces API n'est utilisée : on les coupe explicitement.
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),

    // Isole le contexte de navigation des fenêtres ouvertes par des tiers.
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",

    // HSTS n'a de sens qu'en HTTPS : inutile et gênant en local.
    ...(dev
      ? {}
      : {
          "Strict-Transport-Security":
            "max-age=63072000; includeSubDomains; preload",
        }),
  };
}
