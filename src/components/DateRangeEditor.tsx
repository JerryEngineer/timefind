import { useState } from "react";
import { CalendarGrid } from "./CalendarGrid";
import {
  currentMonthValue,
  dateRange,
  expandDateRanges,
  groupConsecutiveDates,
  monthDateRange,
  monthsBetween,
  toISODate,
  weekdaysOnlyRanges,
  weekendsOnlyRanges,
} from "../lib/dates";
import type { DateRange } from "../types";

interface DateRangeEditorProps {
  ranges: DateRange[];
  onChange: (ranges: DateRange[]) => void;
}

export function DateRangeEditor({ ranges, onChange }: DateRangeEditorProps) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set(expandDateRanges(ranges)));
  const [startMonth, setStartMonth] = useState(() => {
    const dates = expandDateRanges(ranges);
    if (dates.length === 0) return currentMonthValue();
    const minMonth = dates[0].slice(0, 7);
    // never default to a month before the current one — past months aren't selectable anyway
    return minMonth < currentMonthValue() ? currentMonthValue() : minMonth;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const dates = expandDateRanges(ranges);
    if (dates.length === 0) return `${new Date().getFullYear()}-12`;
    return dates[dates.length - 1].slice(0, 7);
  });

  const todayISO = toISODate(new Date());

  function windowFor(start: string, end: string): DateRange {
    const effectiveEnd = end < start ? start : end;
    const months = monthsBetween(start, effectiveEnd);
    const last = months[months.length - 1];
    return {
      start: start === currentMonthValue() ? todayISO : `${start}-01`,
      end: monthDateRange(last.year, last.monthIndex).end,
    };
  }

  const visibleWindow = windowFor(startMonth, endMonth);
  const visibleMonths = monthsBetween(startMonth, endMonth < startMonth ? startMonth : endMonth);

  const totalDays = selectedDates.size;

  function applySelection(newSet: Set<string>) {
    setSelectedDates(newSet);
    onChange(groupConsecutiveDates([...newSet].sort()));
  }

  /** Drops any selected dates that fall outside the given window — used when the visible range shrinks. */
  function pruneToWindow(bounds: DateRange) {
    const windowDates = new Set(dateRange(bounds.start, bounds.end));
    applySelection(new Set([...selectedDates].filter((d) => windowDates.has(d))));
  }

  function handleStartMonthChange(value: string) {
    const newEndMonth = value > endMonth ? value : endMonth;
    setStartMonth(value);
    if (value > endMonth) setEndMonth(value);
    pruneToWindow(windowFor(value, newEndMonth));
  }

  function handleEndMonthChange(value: string) {
    const newStartMonth = value < startMonth ? value : startMonth;
    setEndMonth(value);
    if (value < startMonth) setStartMonth(value);
    pruneToWindow(windowFor(newStartMonth, value));
  }

  function applyPresetWithinWindow(computeRanges: (window: DateRange) => DateRange[]) {
    const windowDates = new Set(dateRange(visibleWindow.start, visibleWindow.end));
    const outsideWindow = [...selectedDates].filter((d) => !windowDates.has(d));
    const withinWindow = expandDateRanges(computeRanges(visibleWindow));
    applySelection(new Set([...outsideWindow, ...withinWindow]));
  }

  return (
    <div className="date-range-editor">
      <div className="mode-selector">
        <button type="button" onClick={() => applyPresetWithinWindow(weekdaysOnlyRanges)}>
          Weekdays only
        </button>
        <button type="button" onClick={() => applyPresetWithinWindow(weekendsOnlyRanges)}>
          Weekends only
        </button>
        <button type="button" onClick={() => applySelection(new Set())} disabled={totalDays === 0}>
          Clear
        </button>
      </div>

      <div className="calendar-range-picker">
        <label>
          Start month
          <input
            type="month"
            value={startMonth}
            min={currentMonthValue()}
            onChange={(e) => handleStartMonthChange(e.target.value)}
          />
        </label>
        <label>
          End month
          <input
            type="month"
            value={endMonth}
            min={startMonth}
            onChange={(e) => handleEndMonthChange(e.target.value)}
          />
        </label>
      </div>

      <CalendarGrid
        months={visibleMonths}
        selectedDates={selectedDates}
        onChange={applySelection}
        isDateDisabled={(d) => d < todayISO}
      />

      <p className="range-total">
        {totalDays} day{totalDays === 1 ? "" : "s"} selected
      </p>
    </div>
  );
}
