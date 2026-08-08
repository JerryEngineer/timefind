import type { DateRange } from "../types";

/** Parses a YYYY-MM-DD string as a local-time date (avoids UTC off-by-one shifts). */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Returns every date from start to end (inclusive) as YYYY-MM-DD strings. */
export function dateRange(startISO: string, endISO: string): string[] {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const dates: string[] = [];
  for (let d = start; d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    dates.push(toISODate(d));
  }
  return dates;
}

export function formatDateLabel(iso: string): string {
  const date = parseISODate(iso);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Expands a list of ranges into a deduped, ascending-sorted flat list of dates. */
export function expandDateRanges(ranges: DateRange[]): string[] {
  const dates = new Set<string>();
  for (const range of ranges) {
    for (const date of dateRange(range.start, range.end)) {
      dates.add(date);
    }
  }
  return [...dates].sort();
}

/** Collapses a sorted, deduped date list into minimal contiguous ranges. */
export function groupConsecutiveDates(sortedDates: string[]): DateRange[] {
  const ranges: DateRange[] = [];
  let rangeStart: string | null = null;
  let prev: string | null = null;

  for (const date of sortedDates) {
    if (rangeStart === null) {
      rangeStart = date;
    } else if (!isNextDay(prev!, date)) {
      ranges.push({ start: rangeStart, end: prev! });
      rangeStart = date;
    }
    prev = date;
  }
  if (rangeStart !== null) {
    ranges.push({ start: rangeStart, end: prev! });
  }
  return ranges;
}

function isNextDay(a: string, b: string): boolean {
  const d = parseISODate(a);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return toISODate(next) === b;
}

export function isWeekend(iso: string): boolean {
  const day = parseISODate(iso).getDay();
  return day === 0 || day === 6;
}

export function isWeekday(iso: string): boolean {
  return !isWeekend(iso);
}

function lastDayOfMonth(year: number, monthIndex: number): string {
  // day 0 of the month after `monthIndex` rolls back to the last day of `monthIndex`
  return toISODate(new Date(year, monthIndex + 1, 0));
}

export function weekdaysOnlyRanges(window: DateRange): DateRange[] {
  return groupConsecutiveDates(dateRange(window.start, window.end).filter(isWeekday));
}

export function weekendsOnlyRanges(window: DateRange): DateRange[] {
  return groupConsecutiveDates(dateRange(window.start, window.end).filter(isWeekend));
}

/** The full range for a given calendar month. */
export function monthDateRange(year: number, monthIndex: number): DateRange {
  return {
    start: toISODate(new Date(year, monthIndex, 1)),
    end: lastDayOfMonth(year, monthIndex),
  };
}

/** Leading blank cells (for days-of-week padding) followed by one date string per day of the month. */
export function monthCells(year: number, monthIndex: number): (string | null)[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  return [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(year, monthIndex, i + 1))),
  ];
}

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Today's value in the "YYYY-MM" shape `<input type="month">` expects. */
export function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Every year/month pair from `startValue` to `endValue` (both "YYYY-MM"), inclusive. */
export function monthsBetween(startValue: string, endValue: string): { year: number; monthIndex: number }[] {
  const [startYear, startMonth] = startValue.split("-").map(Number);
  const [endYear, endMonth] = endValue.split("-").map(Number);
  const months: { year: number; monthIndex: number }[] = [];

  let year = startYear;
  let monthIndex = startMonth - 1;
  const endMonthIndex = endMonth - 1;
  while (year < endYear || (year === endYear && monthIndex <= endMonthIndex)) {
    months.push({ year, monthIndex });
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }
  return months;
}

/** The distinct, chronologically-sorted months touched by any of the given ranges. */
export function monthsSpannedByRanges(ranges: DateRange[]): { year: number; monthIndex: number }[] {
  const seen = new Set<string>();
  const months: { year: number; monthIndex: number }[] = [];

  for (const range of ranges) {
    for (const month of monthsBetween(range.start.slice(0, 7), range.end.slice(0, 7))) {
      const key = `${month.year}-${month.monthIndex}`;
      if (!seen.has(key)) {
        seen.add(key);
        months.push(month);
      }
    }
  }

  return months.sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex);
}
