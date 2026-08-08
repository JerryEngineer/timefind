import { expandDateRanges, formatDateLabel } from "../lib/dates";
import type { DateRange, PersonAvailability } from "../types";

interface OverlapListViewProps {
  dateRanges: DateRange[];
  people: PersonAvailability[];
}

export function OverlapListView({ dateRanges, people }: OverlapListViewProps) {
  const dates = expandDateRanges(dateRanges);

  return (
    <div className="day-picker">
      {dates.map((date) => {
        const freeNames = people.filter((p) => p.selectedDates.has(date)).map((p) => p.name || "?");
        const everyoneFree = freeNames.length === people.length && people.length > 0;
        const someoneFree = freeNames.length > 0;

        return (
          <div
            key={date}
            className={`day-cell overlap-cell${everyoneFree ? " match" : someoneFree ? " partial" : ""}`}
          >
            <span>{formatDateLabel(date)}</span>
            {someoneFree && <small>{freeNames.join(", ")}</small>}
          </div>
        );
      })}
    </div>
  );
}
