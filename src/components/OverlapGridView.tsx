import { dateRange, expandDateRanges, isWeekend } from "../lib/dates";
import type { DateRange, PersonAvailability } from "../types";

interface OverlapGridViewProps {
  dateRanges: DateRange[];
  people: PersonAvailability[];
}

export function OverlapGridView({ dateRanges, people }: OverlapGridViewProps) {
  const candidateDates = expandDateRanges(dateRanges);
  if (candidateDates.length === 0) return null;

  const allDates = dateRange(candidateDates[0], candidateDates[candidateDates.length - 1]);
  const eligibleDates = new Set(candidateDates);

  function cellClasses(date: string, extra: string): string {
    const classes = ["grid-cell", extra];
    if (isWeekend(date)) classes.push("weekend");
    if (!eligibleDates.has(date)) classes.push("inactive");
    return classes.join(" ");
  }

  return (
    <div className="overlap-grid-scroll">
      <table className="overlap-grid">
        <thead>
          <tr>
            <th className="row-label corner" />
            {allDates.map((date) => (
              <th key={date} className={isWeekend(date) ? "weekend" : ""}>
                <span className="grid-date-label">{date}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((person, i) => (
            <tr key={i}>
              <th scope="row" className="row-label">
                {person.name || `Person ${i + 1}`}
              </th>
              {allDates.map((date) => (
                <td key={date} className={cellClasses(date, person.selectedDates.has(date) ? "filled" : "")} />
              ))}
            </tr>
          ))}
          <tr className="combined-row">
            <th scope="row" className="row-label">
              Combined
            </th>
            {allDates.map((date) => {
              const freeCount = people.filter((p) => p.selectedDates.has(date)).length;
              const state =
                freeCount === people.length && people.length > 0 ? "match" : freeCount > 0 ? "partial" : "";
              return <td key={date} className={cellClasses(date, state)} />;
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
