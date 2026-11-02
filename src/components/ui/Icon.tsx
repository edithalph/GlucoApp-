/**
 * Icône Material Symbols — le jeu d'icônes utilisé par les maquettes Stitch.
 * `fill` correspond à la variante pleine (font-variation-settings FILL 1).
 */
export function Icon({
  name,
  className = "",
  fill = false,
  size,
}: {
  name: string;
  className?: string;
  fill?: boolean;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined${fill ? " fill" : ""} ${className}`}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      {name}
    </span>
  );
}
