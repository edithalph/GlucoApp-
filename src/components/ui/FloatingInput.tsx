"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Champ à label flottant, tel que dessiné sur l'écran « Inscription ».
 * Le label remonte via le sélecteur `:placeholder-shown` — d'où le
 * `placeholder=" "` (une espace) qui est indispensable.
 */
export function FloatingInput({
  label,
  name,
  type = "text",
  required = false,
  autoComplete,
  defaultValue,
  inputMode,
  min,
  max,
  step,
  onValueChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string | number;
  inputMode?: "text" | "numeric" | "decimal" | "email";
  min?: number;
  max?: number;
  step?: number;
  /** Notifie le parent à chaque frappe — utilisé pour le calcul d'IMC en direct. */
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const effectiveType = isPassword && revealed ? "text" : type;

  return (
    <div className="relative w-full">
      <input
        id={id}
        name={name}
        type={effectiveType}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        onChange={
          onValueChange ? (e) => onValueChange(e.target.value) : undefined
        }
        placeholder=" "
        className={`peer h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 font-body-lg text-body-lg text-on-background transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
          isPassword ? "pr-12" : ""
        }`}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 bg-surface-container-lowest px-1 font-body-lg text-body-lg text-on-surface-variant transition-all duration-200 peer-focus:top-0 peer-focus:font-label-md peer-focus:text-label-md peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:font-label-md peer-[:not(:placeholder-shown)]:text-label-md"
      >
        {label}
      </label>

      {isPassword && (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={
            revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-on-surface-variant hover:text-primary"
        >
          <Icon name={revealed ? "visibility_off" : "visibility"} />
        </button>
      )}
    </div>
  );
}
