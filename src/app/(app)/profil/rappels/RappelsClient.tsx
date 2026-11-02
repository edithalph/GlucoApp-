"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { FormMessage, type ActionState } from "@/components/ui/FormMessage";
import type { Reminder, ReminderKind } from "@/types/database";
import { basculerRappel, creerRappel } from "../actions";

const KIND_LABELS: Record<ReminderKind, string> = {
  glucose: "Mesure",
  tea: "Thé",
  meal: "Repas",
  custom: "Autre",
};

const KIND_ICONS: Record<ReminderKind, string> = {
  glucose: "bloodtype",
  tea: "local_cafe",
  meal: "restaurant",
  custom: "notifications",
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary-container px-5 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <Icon name="add" size={18} />
      {pending ? "…" : "Ajouter"}
    </button>
  );
}

export function RappelsClient({ rappels }: { rappels: Reminder[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    creerRappel,
    null,
  );
  const [enCours, demarrer] = useTransition();
  const router = useRouter();

  // Même raison que pour le sélecteur d'unité : `revalidatePath` ne suffit pas
  // à rafraîchir la vue déjà rendue.
  useEffect(() => {
    if (state?.info) router.refresh();
  }, [state, router]);

  function basculer(id: string, actif: boolean) {
    demarrer(async () => {
      await basculerRappel(id, actif);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-stack-lg">
      {/* Création */}
      <form
        action={formAction}
        className="flex flex-col gap-stack-md rounded-xl bg-surface-container-lowest p-5 shadow-card"
      >
        <h2 className="font-title-lg text-title-lg text-on-background">
          Nouveau rappel
        </h2>

        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
            Intitulé
          </span>
          <input
            name="label"
            required
            maxLength={80}
            placeholder="Mesure du matin"
            className="h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 font-body-lg text-body-lg text-on-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        <div className="flex gap-stack-sm">
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Type
            </span>
            <select
              name="kind"
              defaultValue="glucose"
              className="h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-body-lg text-body-lg text-on-background focus:border-primary focus:outline-none"
            >
              {(Object.keys(KIND_LABELS) as ReminderKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Heure
            </span>
            <input
              type="time"
              name="time_of_day"
              required
              defaultValue="07:30"
              className="h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-body-lg text-body-lg text-on-background focus:border-primary focus:outline-none"
            />
          </label>
        </div>

        <FormMessage state={state} />
        <div className="self-end">
          <Submit />
        </div>
      </form>

      {/* Liste */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="font-title-lg text-title-lg text-on-background">
          Mes rappels
        </h2>

        {rappels.length === 0 ? (
          <p className="rounded-xl bg-surface-container-low p-6 text-center font-body-md text-body-md text-on-surface-variant">
            Aucun rappel programmé.
          </p>
        ) : (
          <ul className="flex flex-col gap-stack-sm">
            {rappels.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    r.is_active
                      ? "bg-primary-fixed text-on-primary-fixed-variant"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  <Icon name={KIND_ICONS[r.kind]} fill={r.is_active} size={20} />
                </span>

                <span className="flex flex-1 flex-col">
                  <span className="font-body-lg text-body-lg text-on-surface">
                    {r.label}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {r.time_of_day.slice(0, 5)} · {KIND_LABELS[r.kind]}
                  </span>
                </span>

                <button
                  type="button"
                  disabled={enCours}
                  aria-pressed={r.is_active}
                  onClick={() => basculer(r.id, !r.is_active)}
                  className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition-colors disabled:opacity-60 ${
                    r.is_active
                      ? "bg-primary-fixed text-on-primary-fixed-variant"
                      : "border border-outline-variant text-on-surface-variant"
                  }`}
                >
                  {r.is_active ? "Actif" : "Inactif"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <Icon
          name="info"
          size={18}
          className="mt-0.5 shrink-0 text-on-surface-variant"
        />
        <p className="font-label-md text-label-md leading-relaxed text-on-surface-variant">
          Ces rappels sont enregistrés dans votre profil, mais aucune
          notification n&apos;est encore envoyée — l&apos;envoi push reste à
          brancher.
        </p>
      </aside>
    </div>
  );
}
