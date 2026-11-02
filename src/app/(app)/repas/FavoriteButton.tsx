"use client";

import { useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { basculerFavoriRepas } from "./actions";

export function FavoriteButton({ mealId, initial }: { mealId: string; initial: boolean }) {
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} aria-label={initial ? "Retirer des favoris" : "Ajouter aux favoris"} onClick={() => startTransition(() => basculerFavoriRepas(mealId, !initial))} className={`rounded-full p-2 ${initial ? "text-tertiary" : "text-on-surface-variant"}`}><Icon name="star" fill={initial} /></button>;
}
