"use client";

import { useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { basculerFavoriRepas } from "./actions";

export function FavoriteButton({
  mealId,
  initial,
}: {
  mealId: string;
  initial: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={initial ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={() =>
        startTransition(() => basculerFavoriRepas(mealId, !initial))
      }
      className={`grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-surface-variant disabled:opacity-50 ${initial ? "text-tertiary" : "text-on-surface-variant"}`}
    >
      <Icon name="star" fill={initial} />
    </button>
  );
}
