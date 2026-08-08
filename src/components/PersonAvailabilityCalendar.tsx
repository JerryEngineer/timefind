import { CalendarGrid } from "./CalendarGrid";
import { expandDateRanges, monthsSpannedByRanges, toISODate } from "../lib/dates";
import type { DateRange } from "../types";

interface PersonAvailabilityCalendarProps {
  eventDateRanges: DateRange[];
  selectedDates: Set<string>;
  onChange: (dates: Set<string>) => void;
}

export function PersonAvailabilityCalendar({
  eventDateRanges,
  selectedDates,
  onChange,
}: PersonAvailabilityCalendarProps) {
  const todayISO = toISODate(new Date());
  const months = monthsSpannedByRanges(eventDateRanges);
  const eligibleDates = new Set(expandDateRanges(eventDateRanges));
  const totalDays = selectedDates.size;

  return (
    <div className="person-availability-calendar">
      <p className="calendar-caption">Greyed-out days are outside this event's dates.</p>

      <CalendarGrid
        months={months}
        selectedDates={selectedDates}
        onChange={onChange}
        isDateDisabled={(d) => d < todayISO || !eligibleDates.has(d)}
      />

      <p className="range-total">
        {totalDays} day{totalDays === 1 ? "" : "s"} marked available
      </p>
    </div>
  );
}
