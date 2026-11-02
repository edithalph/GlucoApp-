"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  computeTotals,
  glycemicLoadBand,
  igBand,
  IG_BAND_LABELS,
  IG_BAND_STYLES,
  GL_BAND_LABELS,
  GL_BAND_STYLES,
  type MealItemWithFood,
} from "@/lib/nutrition";
import { creerRepas, rechercherAliments, type AlimentTrouve } from "../actions";

type Ligne = { food: AlimentTrouve; quantity_g: number };

/**
 * Portion de départ, pas d'incrément et unité affichée, par catégorie.
 *
 * Un pas unique de 25 g convenait tant que le catalogue ne contenait que des
 * aliments d'assiette. Il est absurde pour une huile — 100 g d'huile de palme,
 * c'est 884 kcal, personne ne commence là — et pour une boisson, qui se compte
 * en verres. Les valeurs ci-dessous suivent les portions du document de
 * référence : la cuillère à soupe (15 ml) pour les matières grasses, le verre
 * (250 ml) pour les boissons.
 */
const PORTIONS: Record<string, { depart: number; pas: number; unite: string }> = {
  "Huiles et matières grasses": { depart: 15, pas: 5, unite: "ml" },
  Boissons: { depart: 250, pas: 50, unite: "ml" },
  Oléagineux: { depart: 30, pas: 10, unite: "g" },
};

const PORTION_DEFAUT = { depart: 100, pas: 25, unite: "g" };

function portion(food: AlimentTrouve) {
  return PORTIONS[food.category ?? ""] ?? PORTION_DEFAUT;
}

/**
 * Index glycémique et son classement. Le chiffre seul ne parle qu'aux
 * initiés : « 75 » ne dit rien, « 75, élevé » se comprend d'un coup d'œil.
 */
function Ig({ valeur }: { valeur: number | null }) {
  if (valeur === null) return <>IG inconnu</>;
  if (valeur === 0) return <>Pas de glucides</>;
  const bande = igBand(valeur);
  return (
    <>
      IG {valeur}{" "}
      <span className={IG_BAND_STYLES[bande]}>({IG_BAND_LABELS[bande]})</span>
    </>
  );
}

/**
 * Signale un aliment dont la composition dépend fortement de la préparation
 * (quantité d'huile, friture, fumage). L'utilisateur doit savoir quand le
 * chiffre est un ordre de grandeur plutôt qu'une mesure.
 */
function PuceEstimation() {
  return (
    <span
      title="Valeur moyenne : varie selon la quantité d'huile et le mode de cuisson"
      className="rounded-full bg-tertiary-fixed px-2 py-0.5 font-label-md text-label-md text-on-tertiary-fixed-variant"
    >
      Estimation
    </span>
  );
}

export function Composer({ erreurInitiale }: { erreurInitiale?: string }) {
  const [terme, setTerme] = useState("");
  const [resultats, setResultats] = useState<AlimentTrouve[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [erreur, setErreur] = useState(erreurInitiale ?? "");
  const [envoi, demarrerEnvoi] = useTransition();

  // Recherche différée : évite une requête par frappe.
  useEffect(() => {
    const q = terme.trim();
    if (q.length < 2) {
      setResultats([]);
      return;
    }

    let annule = false;
    setRecherche(true);
    const t = setTimeout(async () => {
      try {
        const trouves = await rechercherAliments(q);
        if (!annule) setResultats(trouves);
      } catch {
        if (!annule) setErreur("Recherche momentanément indisponible.");
      } finally {
        if (!annule) setRecherche(false);
      }
    }, 250);

    return () => {
      annule = true;
      clearTimeout(t);
    };
  }, [terme]);

  const items: MealItemWithFood[] = lignes.map((l) => ({
    quantity_g: l.quantity_g,
    food: l.food,
  }));
  const totaux = computeTotals(items);
  const bande = glycemicLoadBand(totaux.glycemicLoad);

  function ajouter(food: AlimentTrouve) {
    setLignes((ls) =>
      ls.some((l) => l.food.id === food.id)
        ? ls
        : [...ls, { food, quantity_g: portion(food).depart }],
    );
    setTerme("");
    setResultats([]);
  }

  function ajuster(id: string, delta: number) {
    setLignes((ls) =>
      ls.flatMap((l) => {
        if (l.food.id !== id) return [l];
        const q = l.quantity_g + delta;
        // Descendre sous le pas retire la ligne.
        return q <= 0 ? [] : [{ ...l, quantity_g: q }];
      }),
    );
  }

  function valider() {
    setErreur("");
    demarrerEnvoi(() => {
      creerRepas({
        items: lignes.map((l) => ({
          food_id: l.food.id,
          quantity_g: l.quantity_g,
        })),
      }).catch(() => setErreur("Enregistrement impossible."));
    });
  }

  return (
    <div className="flex flex-col gap-stack-lg pb-40">
      {/* Recherche */}
      <div className="relative">
        <label htmlFor="recherche-aliment" className="sr-only">
          Rechercher un aliment
        </label>
        <Icon
          name="search"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          id="recherche-aliment"
          type="search"
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          placeholder="Rechercher un aliment…"
          className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-12 pr-4 font-body-lg text-body-lg text-on-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {recherche && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant">
            …
          </span>
        )}
      </div>

      {resultats.length > 0 && (
        <ul className="flex flex-col gap-stack-sm">
          {resultats.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => ajouter(f)}
                className="flex w-full items-center gap-3 rounded-xl bg-surface-container-lowest p-3 text-left shadow-sm transition-colors hover:bg-surface-variant"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed-variant">
                  <Icon name="add" size={20} />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-body-lg text-body-lg text-on-surface">
                      {f.name}
                    </span>
                    {!f.is_verified && <PuceEstimation />}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    <Ig valeur={f.glycemic_index} /> ·{" "}
                    {Number(f.carbs_per_100g)} g de glucides / 100{" "}
                    {portion(f).unite}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {terme.trim().length >= 2 && !recherche && resultats.length === 0 && (
        <p className="rounded-xl bg-surface-container-low p-4 text-center font-body-md text-body-md text-on-surface-variant">
          Aucun aliment ne correspond à « {terme} ».
        </p>
      )}

      {/* Sélection */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="font-title-lg text-title-lg text-on-background">
          Sélection actuelle
        </h2>

        {lignes.length === 0 ? (
          <p className="rounded-xl bg-surface-container-low p-6 text-center font-body-md text-body-md text-on-surface-variant">
            Recherchez un aliment ci-dessus pour commencer à composer votre
            repas.
          </p>
        ) : (
          <ul className="flex flex-col gap-stack-sm">
            {lignes.map((l) => {
              const ratio = l.quantity_g / 100;
              return (
                <li
                  key={l.food.id}
                  className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
                >
                  <span className="flex flex-1 flex-col">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-body-lg text-body-lg text-on-surface">
                        {l.food.name}
                      </span>
                      {!l.food.is_verified && <PuceEstimation />}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      <Ig valeur={l.food.glycemic_index} /> ·{" "}
                      {Math.round(Number(l.food.kcal_per_100g) * ratio)} kcal
                    </span>
                  </span>

                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => ajuster(l.food.id, -portion(l.food).pas)}
                      aria-label={`Réduire la quantité de ${l.food.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface transition-colors hover:bg-surface-variant"
                    >
                      <Icon name="remove" size={18} />
                    </button>
                    <span className="w-14 text-center font-body-md text-body-md tabular-nums text-on-surface">
                      {l.quantity_g} {portion(l.food).unite}
                    </span>
                    <button
                      type="button"
                      onClick={() => ajuster(l.food.id, portion(l.food).pas)}
                      aria-label={`Augmenter la quantité de ${l.food.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed-variant transition-opacity hover:opacity-80"
                    >
                      <Icon name="add" size={18} />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {erreur && (
        <p
          role="alert"
          className="rounded-xl bg-error-container p-3 font-body-md text-body-md text-on-error-container"
        >
          {erreur}
        </p>
      )}

      {/* Barre de totaux, fixée en bas comme dans la maquette */}
      {lignes.length > 0 && (
        <div className="fixed inset-x-0 bottom-[88px] z-40 mx-auto max-w-[1200px] px-container-padding-mobile md:bottom-4">
          <div className="flex items-center gap-4 rounded-xl bg-inverse-surface p-4 shadow-card">
            <span className="flex flex-col">
              <span className="font-headline-md text-headline-md tabular-nums text-inverse-on-surface">
                {totaux.glycemicLoad.toFixed(1).replace(".", ",")}
              </span>
              <span className="font-label-md text-label-md text-inverse-on-surface opacity-80">
                Charge glyc.
              </span>
            </span>

            <span className="flex flex-1 flex-col gap-1">
              <span
                className={`w-fit rounded-full px-2.5 py-0.5 font-label-md text-label-md ${GL_BAND_STYLES[bande]}`}
              >
                {GL_BAND_LABELS[bande]}
              </span>
              <span className="font-body-md text-body-md text-inverse-on-surface opacity-90">
                {Math.round(totaux.kcal)} kcal ·{" "}
                {Math.round(totaux.carbsG)} g de glucides
              </span>
            </span>

            <button
              type="button"
              onClick={valider}
              disabled={envoi}
              className="flex items-center gap-1.5 rounded-full bg-primary-fixed px-4 py-3 font-label-md text-label-md text-on-primary-fixed-variant transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {envoi ? "…" : "Voir l'impact"}
              <Icon name="arrow_forward" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
