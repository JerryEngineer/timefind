import { MONTH_NAMES, WEEKDAY_LABELS, monthCells } from "../lib/dates";

interface MonthCardProps {
  year: number;
  monthIndex: number;
  selectedDates: Set<string>;
  isDateDisabled: (date: string) => boolean;
  onCellPointerDown: (date: string) => void;
  /** Keyboard fallback: toggles and commits a single day immediately (no drag involved). */
  onCellActivate: (date: string) => void;
  onToggleMonth: () => void;
}

export function MonthCard({
  year,
  monthIndex,
  selectedDates,
  isDateDisabled,
  onCellPointerDown,
  onCellActivate,
  onToggleMonth,
}: MonthCardProps) {
  const cells = monthCells(year, monthIndex);

  return (
    <div className="month-card">
      <button type="button" className="month-card-header" onClick={onToggleMonth}>
        {MONTH_NAMES[monthIndex]} {year}
      </button>
      <div className="month-card-weekdays">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="month-card-days">
        {cells.map((date, i) => {
          if (date === null) return <span key={i} className="cal-day blank" />;
          const disabled = isDateDisabled(date);
          const selected = selectedDates.has(date);
          return (
            <div
              key={date}
              className={`cal-day${selected ? " selected" : ""}${disabled ? " disabled" : ""}`}
              data-date={date}
              tabIndex={disabled ? -1 : 0}
              role="button"
              aria-pressed={selected}
              aria-disabled={disabled}
              onPointerDown={() => !disabled && onCellPointerDown(date)}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCellActivate(date);
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
