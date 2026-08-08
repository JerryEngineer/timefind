import { OverlapMonthCard } from "./OverlapMonthCard";
import { expandDateRanges, monthsSpannedByRanges } from "../lib/dates";
import type { DateRange, PersonAvailability } from "../types";

interface OverlapCalendarViewProps {
  dateRanges: DateRange[];
  people: PersonAvailability[];
}

const MAX_NAMES_SHOWN = 5;

export function OverlapCalendarView({ dateRanges, people }: OverlapCalendarViewProps) {
  const months = monthsSpannedByRanges(dateRanges);
  const eligibleDates = new Set(expandDateRanges(dateRanges));

  function freeNames(date: string): string[] {
    return people.filter((p) => p.selectedDates.has(date)).map((p) => p.name || "?");
  }

  function cellState(date: string): "match" | "partial" | "none" {
    const count = freeNames(date).length;
    if (count === 0) return "none";
    return count === people.length && people.length > 0 ? "match" : "partial";
  }

  /** Percentage of the group free on this date, used to shade partial-match cells. */
  function cellPercent(date: string): number {
    if (people.length === 0) return 0;
    return (freeNames(date).length / people.length) * 100;
  }

  function cellTooltip(date: string): string {
    const names = freeNames(date);
    const shown = names.slice(0, MAX_NAMES_SHOWN);
    const remaining = names.length - shown.length;
    const summary = `${names.length}/${people.length} available`;
    if (shown.length === 0) return summary;
    const namesLine = remaining > 0 ? `${shown.join(", ")}, +${remaining} more` : shown.join(", ");
    return `${summary}\n${namesLine}`;
  }

  return (
    <div className="calendar-grid">
      {months.map(({ year, monthIndex }) => (
        <OverlapMonthCard
          key={`${year}-${monthIndex}`}
          year={year}
          monthIndex={monthIndex}
          cellState={cellState}
          cellPercent={cellPercent}
          isDateDisabled={(d) => !eligibleDates.has(d)}
          cellTitle={cellTooltip}
        />
      ))}
    </div>
  );
}
