import { MONTH_NAMES, WEEKDAY_LABELS, monthCells } from "../lib/dates";

type CellState = "start" | "end" | "in-range" | "none";

interface RangeMonthCardProps {
  year: number;
  monthIndex: number;
  cellState: (date: string) => CellState;
  isDateDisabled: (date: string) => boolean;
  onCellClick: (date: string) => void;
  onCellHover: (date: string | null) => void;
}

export function RangeMonthCard({
  year,
  monthIndex,
  cellState,
  isDateDisabled,
  onCellClick,
  onCellHover,
}: RangeMonthCardProps) {
  const cells = monthCells(year, monthIndex, true);

  return (
    <div className="month-card range-month-card">
      <p className="month-card-header-static">
        {MONTH_NAMES[monthIndex]} {year}
      </p>
      <div className="month-card-weekdays">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="month-card-days" onPointerLeave={() => onCellHover(null)}>
        {cells.map((date, i) => {
          if (date === null) return <span key={i} className="cal-day blank" />;
          const disabled = isDateDisabled(date);
          const state = disabled ? "none" : cellState(date);
          return (
            <div
              key={date}
              className={`cal-day${state !== "none" ? ` range-${state}` : ""}${disabled ? " disabled" : ""}`}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              onClick={() => !disabled && onCellClick(date)}
              onPointerEnter={() => !disabled && onCellHover(date)}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCellClick(date);
                }
              }}
            >
              {Number(date.slice(-2))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
