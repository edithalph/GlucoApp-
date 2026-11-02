import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, securityHeaders } from "@/lib/security";

/** Routes accessibles sans session. */
const PUBLIC_PATHS = ["/", "/onboarding", "/connexion", "/inscription", "/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const DEV = process.env.NODE_ENV !== "production";

export async function middleware(request: NextRequest) {
  // Nonce unique par requête, consommé par la CSP et par les scripts de Next.
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce, DEV);

  // Le nonce doit être visible du rendu serveur : on le pose sur la requête.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Rafraîchit le token si nécessaire — ne pas retirer.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    // Chemin interne uniquement : un `suivant` absolu permettrait à un tiers
    // de transformer la page de connexion en redirection ouverte.
    url.searchParams.set("suivant", `${pathname}${search}`);
    const redirection = NextResponse.redirect(url);
    appliquerEntetes(redirection, csp);
    return redirection;
  }

  appliquerEntetes(response, csp);
  return response;
}

function appliquerEntetes(reponse: NextResponse, csp: string) {
  reponse.headers.set("Content-Security-Policy", csp);
  for (const [cle, valeur] of Object.entries(securityHeaders(DEV))) {
    reponse.headers.set(cle, valeur);
  }
}

export const config = {
  matcher: [
    /*
     * Exclut tous les fichiers statiques.
     *
     * Ce filtre n'est pas cosmétique : le middleware appelle `getUser()`, qui
     * est une requête réseau vers Supabase. Toute ressource qui le traverse
     * inutilement ajoute donc un aller-retour à chaque chargement — c'était le
     * cas des polices, absentes de la liste et redirigées en 307.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|icons/|fonts/|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
