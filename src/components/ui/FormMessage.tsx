import { Icon } from "@/components/ui/Icon";

export type ActionState = {
  error?: string;
  info?: string;
  /** Valeurs re-servies au formulaire pour ne pas les perdre après une erreur. */
  values?: Record<string, string>;
} | null;

/** Retour d'une action serveur : erreur (rouge) ou information (vert). */
export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.error && !state?.info) return null;

  const isError = Boolean(state.error);

  return (
    <p
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl p-3 font-body-md text-body-md ${
        isError
          ? "bg-error-container text-on-error-container"
          : "bg-primary-fixed text-on-primary-fixed-variant"
      }`}
    >
      <Icon
        name={isError ? "error" : "check_circle"}
        size={18}
        className="mt-0.5 shrink-0"
      />
      <span>{state.error ?? state.info}</span>
    </p>
  );
}
