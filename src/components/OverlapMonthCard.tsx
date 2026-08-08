import { MONTH_NAMES, WEEKDAY_LABELS, monthCells } from "../lib/dates";

type CellState = "match" | "partial" | "none";

interface OverlapMonthCardProps {
  year: number;
  monthIndex: number;
  cellState: (date: string) => CellState;
  /** Percentage (0-100) of the group free on this date — used to shade "partial" cells. */
  cellPercent: (date: string) => number;
  isDateDisabled: (date: string) => boolean;
  cellTitle: (date: string) => string | undefined;
}

// Partial-match cells are shaded by percentage, but clamped so even a sliver of
// availability is visible and the darkest partial shade still reads clearly
// against dark text, staying visually distinct from a full "everyone's free" match.
const MIN_FILL_PERCENT = 15;
const MAX_FILL_PERCENT = 70;

export function OverlapMonthCard({
  year,
  monthIndex,
  cellState,
  cellPercent,
  isDateDisabled,
  cellTitle,
}: OverlapMonthCardProps) {
  const cells = monthCells(year, monthIndex);

  return (
    <div className="month-card">
      <div className="month-card-header-static">
        {MONTH_NAMES[monthIndex]} {year}
      </div>
      <div className="month-card-weekdays">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="month-card-days">
        {cells.map((date, i) => {
          if (date === null) return <span key={i} className="cal-day blank" />;
          const disabled = isDateDisabled(date);
          const state = cellState(date);
          const tooltip = disabled ? undefined : cellTitle(date);
          const fillStyle =
            !disabled && state === "partial"
              ? ({
                  "--fill-percent": `${Math.min(MAX_FILL_PERCENT, Math.max(MIN_FILL_PERCENT, cellPercent(date)))}%`,
                } as React.CSSProperties)
              : undefined;
          return (
            <div
              key={date}
              className={`cal-day${!disabled && state !== "none" ? ` ${state}` : ""}${disabled ? " disabled" : ""}`}
              style={fillStyle}
            >
              {Number(date.slice(-2))}
              {tooltip && <span className="cal-day-tooltip">{tooltip}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
