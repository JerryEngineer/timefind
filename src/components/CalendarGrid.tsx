import { useEffect, useRef, useState } from "react";
import { MonthCard } from "./MonthCard";
import { dateRange, monthDateRange } from "../lib/dates";

interface CalendarGridProps {
  months: { year: number; monthIndex: number }[];
  /** Controlled value. */
  selectedDates: Set<string>;
  /** Fires at commit points only (drag end, single click, month-header toggle) — not on every pointermove. */
  onChange: (dates: Set<string>) => void;
  isDateDisabled: (date: string) => boolean;
}

type DragMode = "select" | "deselect";

export function CalendarGrid({ months, selectedDates, onChange, isDateDisabled }: CalendarGridProps) {
  const [liveDates, setLiveDates] = useState<Set<string> | null>(null);
  const isDragging = liveDates !== null;
  const displayDates = liveDates ?? selectedDates;

  const dragModeRef = useRef<DragMode | null>(null);
  const dragAnchorRef = useRef<string | null>(null);
  const dragBaselineRef = useRef<Set<string>>(new Set());
  const liveDatesRef = useRef<Set<string> | null>(null);
  liveDatesRef.current = liveDates;

  function toggleMonth(year: number, monthIndex: number) {
    const monthRange = monthDateRange(year, monthIndex);
    const eligibleDays = dateRange(monthRange.start, monthRange.end).filter((d) => !isDateDisabled(d));
    const isFullySelected = eligibleDays.length > 0 && eligibleDays.every((d) => selectedDates.has(d));

    const newSet = new Set(selectedDates);
    for (const day of eligibleDays) {
      if (isFullySelected) newSet.delete(day);
      else newSet.add(day);
    }
    onChange(newSet);
  }

  /** Applies the span between the drag anchor and `currentDate` to the baseline captured at drag start. */
  function applyDragRange(currentDate: string) {
    const anchor = dragAnchorRef.current;
    const mode = dragModeRef.current;
    if (!anchor || !mode) return;

    const [lo, hi] = anchor <= currentDate ? [anchor, currentDate] : [currentDate, anchor];
    const spanDates = dateRange(lo, hi).filter((d) => !isDateDisabled(d));

    const newSet = new Set(dragBaselineRef.current);
    for (const d of spanDates) {
      if (mode === "select") newSet.add(d);
      else newSet.delete(d);
    }
    setLiveDates(newSet);
  }

  function handleCellPointerDown(date: string) {
    dragAnchorRef.current = date;
    dragBaselineRef.current = new Set(selectedDates);
    dragModeRef.current = selectedDates.has(date) ? "deselect" : "select";
    applyDragRange(date);
  }

  function handleCellActivate(date: string) {
    const newSet = new Set(selectedDates);
    if (newSet.has(date)) newSet.delete(date);
    else newSet.add(date);
    onChange(newSet);
  }

  useEffect(() => {
    if (!isDragging) return;

    function handlePointerMove(e: PointerEvent) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const cell = target instanceof Element ? target.closest<HTMLElement>("[data-date]") : null;
      if (!cell || cell.getAttribute("aria-disabled") === "true") return;
      applyDragRange(cell.dataset.date!);
    }

    function endDrag() {
      if (liveDatesRef.current) onChange(liveDatesRef.current);
      setLiveDates(null);
      dragModeRef.current = null;
      dragAnchorRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, onChange]);

  return (
    <div className={`calendar-grid${isDragging ? " dragging" : ""}`}>
      {months.map(({ year, monthIndex }) => (
        <MonthCard
          key={`${year}-${monthIndex}`}
          year={year}
          monthIndex={monthIndex}
          selectedDates={displayDates}
          isDateDisabled={isDateDisabled}
          onCellPointerDown={handleCellPointerDown}
          onCellActivate={handleCellActivate}
          onToggleMonth={() => toggleMonth(year, monthIndex)}
        />
      ))}
    </div>
  );
}
