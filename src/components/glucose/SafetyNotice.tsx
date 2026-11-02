import { Icon } from "@/components/ui/Icon";

/**
 * Message de sécurité : il ne remplace jamais le plan de soins individuel.
 * Les seuils servent seulement à attirer l'attention après une saisie.
 */
export function SafetyNotice({ valueMgdl }: { valueMgdl: number | null }) {
  if (valueMgdl === null) return null;
  if (valueMgdl < 54) {
    return (
      <aside role="alert" className="flex gap-3 rounded-xl border border-error bg-error-container p-4 text-on-error-container">
        <Icon name="warning" fill className="mt-0.5 shrink-0" />
        <p className="font-body-md text-body-md"><strong>Valeur très basse.</strong> Si vous êtes confus(e), inconscient(e), ne pouvez pas avaler ou avez besoin d’aide, appelez immédiatement les urgences locales. Sinon, suivez votre plan de traitement de l’hypoglycémie et recontrôlez selon ses instructions.</p>
      </aside>
    );
  }
  if (valueMgdl >= 240) {
    return (
      <aside role="alert" className="flex gap-3 rounded-xl border border-tertiary-fixed-dim bg-tertiary-fixed/50 p-4 text-on-tertiary-fixed">
        <Icon name="warning" fill className="mt-0.5 shrink-0" />
        <p className="font-body-md text-body-md"><strong>Valeur élevée.</strong> Suivez votre plan personnel. Si vous êtes malade ou avez soif intense, nausées/vomissements, respiration rapide, confusion ou cétones élevées, demandez une aide médicale urgente.</p>
      </aside>
    );
  }
  return null;
}
