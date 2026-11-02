import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatGlucose, UNIT_LABELS, type GlucoseUnit } from "@/lib/units";
import {
  CONTEXT_LABELS,
  formatRelative,
  readingStatus,
  STATUS_STYLES,
  trendIcon,
  type Trend,
} from "@/lib/glycemia";
import type { ReadingContext } from "@/types/database";

/** Ligne de la liste « Derniers relevés ». */
export function ReadingRow({
  valueMgdl,
  context,
  measuredAt,
  trend,
  unit,
  targetMin,
  targetMax,
  actions,
}: {
  valueMgdl: number;
  context: ReadingContext;
  measuredAt: string;
  trend: Trend;
  unit: GlucoseUnit;
  targetMin: number;
  targetMax: number;
  /** Commandes propres à la ligne (suppression, édition…). */
  actions?: ReactNode;
}) {
  const statut = readingStatus(valueMgdl, targetMin, targetMax);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${STATUS_STYLES[statut].chip}`}
      >
        <Icon name={trendIcon(trend)} size={20} />
      </span>

      <span className="flex min-w-[110px] flex-1 flex-col">
        <span className="font-title-lg text-title-lg tabular-nums text-on-surface">
          {formatGlucose(valueMgdl, unit)}{" "}
          <span className="font-body-md text-body-md text-on-surface-variant">
            {UNIT_LABELS[unit]}
          </span>
        </span>
        <span className="font-body-md text-body-md text-on-surface-variant">
          {formatRelative(measuredAt)} · {CONTEXT_LABELS[context]}
        </span>
      </span>

      <span
        className={`shrink-0 rounded-full px-3 py-1 font-label-md text-label-md ${STATUS_STYLES[statut].chip}`}
      >
        {STATUS_STYLES[statut].label}
      </span>

      {actions}
    </li>
  );
}
