/**
 * ============================================================================
 * Courbe SVG rendue côté serveur — aucun JavaScript envoyé au navigateur.
 * ============================================================================
 *
 * Remplace Recharts, qui pesait 110 kB compressés et doublait le poids des
 * pages concernées. La courbe est un simple `polyline` calculé au rendu ; les
 * infobulles utilisent l'élément SVG `<title>`, que les navigateurs affichent
 * nativement au survol. Résultat : même lisibilité, zéro coût côté client.
 *
 * Le SVG est déclaré avec un `viewBox` et `preserveAspectRatio="none"` sur la
 * zone traçante uniquement, pour rester net à toute largeur.
 */

export type Point = {
  /** Position sur l'axe horizontal (temps en ms, ou index de catégorie). */
  x: number;
  /** Valeur affichée, déjà convertie dans l'unité voulue. */
  y: number;
  /** Libellé complet, montré au survol. */
  info: string;
};

const L = 46; // marge gauche, place pour les graduations
const R = 10;
const H = 8; // marge haute
const B = 26; // marge basse, place pour les libellés
const LARGEUR = 340;
const HAUTEUR = 200;

/** Graduations « rondes » couvrant l'intervalle, façon axe lisible. */
function graduations(min: number, max: number, cible = 4): number[] {
  const etendue = max - min;
  if (etendue <= 0) return [min];

  const brut = etendue / cible;
  const magnitude = 10 ** Math.floor(Math.log10(brut));
  const pas =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((p) => p >= brut) ??
    magnitude * 10;

  const debut = Math.ceil(min / pas) * pas;
  const valeurs: number[] = [];
  for (let v = debut; v <= max + pas * 0.001; v += pas) {
    valeurs.push(Number(v.toFixed(6)));
  }
  return valeurs;
}

export function LineChart({
  points,
  bandeMin,
  bandeMax,
  formatValeur,
  formatAbscisse,
  couleur = "#247BA0",
  messageVide = "Pas encore assez de données pour tracer une courbe.",
}: {
  points: Point[];
  /** Bornes de la zone cible, dans la même unité que `y`. */
  bandeMin: number;
  bandeMax: number;
  formatValeur: (v: number) => string;
  formatAbscisse: (x: number) => string;
  couleur?: string;
  messageVide?: string;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl bg-surface-container-low px-4 text-center font-body-md text-body-md text-on-surface-variant">
        {messageVide}
      </div>
    );
  }

  const ys = points.map((p) => p.y);
  const basBrut = Math.min(...ys, bandeMin);
  const hautBrut = Math.max(...ys, bandeMax);
  const marge = (hautBrut - basBrut) * 0.15 || Math.max(hautBrut * 0.1, 1);
  const bas = basBrut - marge;
  const haut = hautBrut + marge;

  const xMin = points[0].x;
  const xMax = points[points.length - 1].x;
  const etendueX = xMax - xMin || 1;

  const px = (x: number) => L + ((x - xMin) / etendueX) * (LARGEUR - L - R);
  const py = (y: number) =>
    H + (1 - (y - bas) / (haut - bas)) * (HAUTEUR - H - B);

  const chemin = points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ");
  const gradsY = graduations(bas, haut);

  // Au plus 4 libellés d'abscisse. On impose en plus un écart minimal en
  // pixels : sans cela, le dernier point ajouté d'office peut se superposer au
  // précédent et produire deux libellés illisibles l'un sur l'autre.
  const ECART_MINI = 62;
  const pasX = Math.max(1, Math.ceil(points.length / 4));
  const gradsX = points.reduce<Point[]>((acc, p, i) => {
    const candidat = i % pasX === 0 || i === points.length - 1;
    if (!candidat) return acc;
    const precedent = acc[acc.length - 1];
    if (precedent && px(p.x) - px(precedent.x) < ECART_MINI) {
      // Le dernier point prime : il borne la lecture de la courbe.
      if (i === points.length - 1) acc[acc.length - 1] = p;
      return acc;
    }
    return [...acc, p];
  }, []);

  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      className="h-52 w-full"
      role="img"
      aria-label={`Courbe de ${points.length} relevés, de ${formatValeur(Math.min(...ys))} à ${formatValeur(Math.max(...ys))}`}
    >
      {/* Zone cible */}
      <rect
        x={L}
        y={py(Math.min(bandeMax, haut))}
        width={LARGEUR - L - R}
        height={Math.max(
          0,
          py(Math.max(bandeMin, bas)) - py(Math.min(bandeMax, haut)),
        )}
        fill="#56B8B0"
        fillOpacity={0.15}
      />

      {/* Graduations horizontales */}
      {gradsY.map((v) => (
        <g key={v}>
          <line
            x1={L}
            y1={py(v)}
            x2={LARGEUR - R}
            y2={py(v)}
            stroke="#C8DBE3"
            strokeOpacity={0.4}
            strokeDasharray="3 3"
          />
          <text
            x={L - 6}
            y={py(v) + 3.5}
            textAnchor="end"
            fontSize={10}
            fill="#526A7B"
          >
            {formatValeur(v)}
          </text>
        </g>
      ))}

      {/* Libellés d'abscisse */}
      {gradsX.map((p, i) => (
        <text
          key={`${p.x}-${i}`}
          x={px(p.x)}
          y={HAUTEUR - 8}
          textAnchor={
            i === 0 ? "start" : i === gradsX.length - 1 ? "end" : "middle"
          }
          fontSize={10}
          fill="#526A7B"
        >
          {formatAbscisse(p.x)}
        </text>
      ))}

      {/* Courbe */}
      <polyline
        points={chemin}
        fill="none"
        stroke={couleur}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points — la cible de survol est plus large que le disque visible,
          pour rester atteignable au doigt. */}
      {points.map((p, i) => (
        <g key={`${p.x}-${i}`}>
          <circle cx={px(p.x)} cy={py(p.y)} r={3} fill={couleur} />
          <circle cx={px(p.x)} cy={py(p.y)} r={12} fill="transparent">
            <title>{p.info}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}
