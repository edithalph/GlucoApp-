import { Icon } from "@/components/ui/Icon";

/**
 * Cadre affiché sur tout écran produisant une estimation de santé.
 * Le texte reste volontairement explicite : l'utilisateur doit comprendre
 * qu'il lit un ordre de grandeur statistique, pas une mesure ni un avis médical.
 */
export function AvertissementMedical({
  variante = "complet",
}: {
  variante?: "complet" | "bref";
}) {
  return (
    <aside className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <Icon
        name="info"
        size={20}
        className="mt-0.5 shrink-0 text-on-surface-variant"
      />
      <p className="font-body-md text-body-md text-on-surface-variant">
        {variante === "bref" ? (
          <>
            Estimation indicative, calculée à partir de moyennes de population.
            Elle ne remplace pas une mesure réelle.
          </>
        ) : (
          <>
            <strong className="font-semibold">Estimation indicative.</strong>{" "}
            Ce calcul repose sur des moyennes de population et sur la
            composition déclarée du repas. Il ne tient pas compte de votre
            traitement, de votre activité récente, de votre sommeil ni de votre
            sensibilité propre — autant de facteurs qui font varier fortement la
            réponse glycémique, y compris chez une même personne d&apos;un jour
            à l&apos;autre. Seule une mesure réelle fait foi. Pour toute
            décision concernant votre traitement, adressez-vous à votre médecin.
          </>
        )}
      </p>
    </aside>
  );
}
