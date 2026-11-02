"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { FormMessage, type ActionState } from "@/components/ui/FormMessage";
import { GlucoseField } from "@/components/tea/GlucoseField";
import { formatGlucose, UNIT_LABELS, type GlucoseUnit } from "@/lib/units";
import {
  formatCountdown,
  nextMeasurementAt,
  nextOffset,
  TEA_OFFSETS,
} from "@/lib/tea";
import { enregistrerMesure, marquerTheePris, terminerSession } from "../../actions";

type Mesure = { offset_minutes: number; value_mgdl: number };

function SubmitMesure({ pretA }: { pretA: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!pretA || pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md transition-all hover:opacity-90 disabled:opacity-50"
    >
      <Icon name="add_circle" fill size={20} />
      {pending ? "Enregistrement…" : "Enregistrer ma mesure"}
    </button>
  );
}

export function SessionEnCours({
  sessionId,
  teaName,
  baselineMgdl,
  teaTakenAt,
  mesures,
  unit,
}: {
  sessionId: string;
  teaName: string;
  baselineMgdl: number | null;
  teaTakenAt: string | null;
  mesures: Mesure[];
  unit: GlucoseUnit;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    enregistrerMesure,
    null,
  );
  const [mesureValide, setMesureValide] = useState(false);
  const [enCours, demarrer] = useTransition();
  const router = useRouter();

  const prochain = nextOffset(mesures);

  // Une mesure vient d'être enregistrée : on redemande les données au serveur
  // pour que l'étape suivante s'affiche sans rechargement manuel.
  useEffect(() => {
    if (state?.info) router.refresh();
  }, [state, router]);

  // Horloge locale, uniquement pour le décompte affiché.
  const [maintenant, setMaintenant] = useState<number | null>(null);
  useEffect(() => {
    setMaintenant(Date.now());
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const echeance =
    teaTakenAt && prochain ? nextMeasurementAt(teaTakenAt, prochain) : null;
  // `maintenant` reste nul au premier rendu serveur : évite toute
  // divergence d'hydratation sur une valeur qui change chaque seconde.
  const restant =
    echeance && maintenant !== null ? echeance.getTime() - maintenant : null;
  const echu = restant !== null && restant <= 0;

  return (
    <div className="flex flex-col gap-stack-lg">
      {/* En-tête de session */}
      <section className="flex items-center gap-3 rounded-xl bg-tertiary-fixed/40 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
          <Icon name="local_cafe" fill size={22} />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="font-title-lg text-title-lg text-on-surface">
            {teaName}
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant">
            Session en cours
          </span>
        </span>
      </section>

      {/* Déroulé */}
      <ol className="flex flex-col gap-stack-sm">
        <li className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
          <Icon name="check_circle" fill className="text-primary" />
          <span className="flex flex-1 flex-col">
            <span className="font-body-lg text-body-lg text-on-surface">
              Mesure initiale
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              {baselineMgdl !== null
                ? `${formatGlucose(baselineMgdl, unit)} ${UNIT_LABELS[unit]}`
                : "—"}
            </span>
          </span>
        </li>

        <li className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
          <Icon
            name={teaTakenAt ? "check_circle" : "radio_button_unchecked"}
            fill={Boolean(teaTakenAt)}
            className={teaTakenAt ? "text-primary" : "text-outline"}
          />
          <span className="flex flex-1 flex-col">
            <span className="font-body-lg text-body-lg text-on-surface">
              Thé pris
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              {teaTakenAt
                ? new Date(teaTakenAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "En attente"}
            </span>
          </span>
        </li>

        {TEA_OFFSETS.map((o) => {
          const faite = mesures.find((m) => m.offset_minutes === o);
          const active = prochain === o && Boolean(teaTakenAt);
          return (
            <li
              key={o}
              className={`flex items-center gap-3 rounded-xl p-4 shadow-sm ${
                active
                  ? "bg-primary-fixed/40 ring-1 ring-primary-fixed-dim"
                  : "bg-surface-container-lowest"
              }`}
            >
              <Icon
                name={faite ? "check_circle" : "schedule"}
                fill={Boolean(faite)}
                className={faite ? "text-primary" : "text-outline"}
              />
              <span className="flex flex-1 flex-col">
                <span className="font-body-lg text-body-lg text-on-surface">
                  Mesure à +{o} min
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  {faite
                    ? `${formatGlucose(Number(faite.value_mgdl), unit)} ${UNIT_LABELS[unit]}`
                    : active && restant !== null
                      ? echu
                        ? "C'est le moment"
                        : `Dans ${formatCountdown(restant)}`
                      : "À venir"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Action courante */}
      {!teaTakenAt ? (
        <button
          type="button"
          disabled={enCours}
          onClick={() => demarrer(() => void marquerTheePris(sessionId))}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-tertiary-container font-title-lg text-title-lg text-on-tertiary shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Icon name="local_cafe" fill size={20} />
          {enCours ? "…" : "J'ai bu mon thé"}
        </button>
      ) : prochain !== null ? (
        <form
          action={formAction}
          className="flex flex-col gap-stack-md rounded-xl bg-surface-container-low p-4"
        >
          <input type="hidden" name="session_id" value={sessionId} readOnly />
          {/* Le décalage est déduit côté serveur, pas envoyé d'ici. */}
          <GlucoseField
            // Re-monte le champ à chaque étape pour le vider.
            key={prochain}
            name="value_mgdl"
            label={`Mesure à +${prochain} min`}
            unit={unit}
            onValidityChange={setMesureValide}
          />
          {!echu && (
            <p className="font-label-md text-label-md text-on-surface-variant">
              Vous pouvez saisir maintenant si vous avez mesuré plus tôt — le
              décompte n&apos;est qu&apos;un repère.
            </p>
          )}
          <FormMessage state={state} />
          <SubmitMesure pretA={mesureValide} />
        </form>
      ) : null}

      <button
        type="button"
        disabled={enCours}
        onClick={() => demarrer(() => void terminerSession(sessionId))}
        className="self-center rounded-full px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant disabled:opacity-60"
      >
        Terminer la session
      </button>
    </div>
  );
}
