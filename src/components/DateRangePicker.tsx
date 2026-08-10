import { useEffect, useRef, useState } from "react";
import { RangeMonthCard } from "./RangeMonthCard";
import { addMonths, formatShortDate, toISODate } from "../lib/dates";
import type { MonthValue } from "../lib/dates";
import type { DateRange } from "../types";

const MOBILE_BREAKPOINT = "(max-width: 640px)";
const MOBILE_MONTHS_AHEAD = 12;

interface DateRangePickerProps {
  ranges: DateRange[];
  onChange: (ranges: DateRange[]) => void;
}

export function DateRangePicker({ ranges, onChange }: DateRangePickerProps) {
  const committed = ranges[0] ?? null;
  const todayISO = toISODate(new Date());

  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<string | null>(committed?.start ?? null);
  const [draftEnd, setDraftEnd] = useState<string | null>(committed?.end ?? null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [baseMonth, setBaseMonth] = useState<MonthValue>(() => monthOf(committed?.start ?? todayISO));
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_BREAKPOINT).matches);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_BREAKPOINT);
    const handleChange = () => setIsMobile(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function monthOf(iso: string): MonthValue {
    const [year, month] = iso.split("-").map(Number);
    return { year, monthIndex: month - 1 };
  }

  function openPicker() {
    setDraftStart(committed?.start ?? null);
    setDraftEnd(committed?.end ?? null);
    setBaseMonth(monthOf(committed?.start ?? todayISO));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setHoverDate(null);
  }

  function handleDayClick(date: string) {
    if (!draftStart || draftEnd || date < draftStart) {
      setDraftStart(date);
      setDraftEnd(null);
    } else {
      setDraftEnd(date);
    }
  }

  function cellState(date: string): "start" | "end" | "in-range" | "none" {
    if (!draftStart) return "none";
    if (date === draftStart) return "start";
    if (date === draftEnd) return "end";
    const rangeEnd = draftEnd ?? hoverDate;
    if (rangeEnd && date > draftStart && date < rangeEnd) return "in-range";
    return "none";
  }

  function handleDone() {
    if (draftStart && draftEnd) {
      onChange([{ start: draftStart, end: draftEnd }]);
      close();
    }
  }

  function handleClear() {
    setDraftStart(null);
    setDraftEnd(null);
  }

  const secondMonth = addMonths(baseMonth, 1);
  const todayMonth = monthOf(todayISO);
  const canGoBack = baseMonth.year * 12 + baseMonth.monthIndex > todayMonth.year * 12 + todayMonth.monthIndex;
  const mobileMonths = Array.from({ length: MOBILE_MONTHS_AHEAD }, (_, i) => addMonths(todayMonth, i));

  const label = committed ? `${formatShortDate(committed.start)} – ${formatShortDate(committed.end)}` : "Choose your dates";

  return (
    <div className="date-range-picker" ref={containerRef}>
      <button type="button" className="date-range-trigger" onClick={() => (open ? close() : openPicker())}>
        {label}
      </button>

      {open && (
        <div className="date-range-popover">
          {isMobile ? (
            <div className="date-range-scroll-months">
              {mobileMonths.map((m) => (
                <RangeMonthCard
                  key={`${m.year}-${m.monthIndex}`}
                  year={m.year}
                  monthIndex={m.monthIndex}
                  cellState={cellState}
                  isDateDisabled={(d) => d < todayISO}
                  onCellClick={handleDayClick}
                  onCellHover={setHoverDate}
                />
              ))}
            </div>
          ) : (
            <div className="date-range-nav">
              <button
                type="button"
                className="date-range-nav-btn"
                onClick={() => setBaseMonth((m) => addMonths(m, -1))}
                disabled={!canGoBack}
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="date-range-months">
                <RangeMonthCard
                  year={baseMonth.year}
                  monthIndex={baseMonth.monthIndex}
                  cellState={cellState}
                  isDateDisabled={(d) => d < todayISO}
                  onCellClick={handleDayClick}
                  onCellHover={setHoverDate}
                />
                <RangeMonthCard
                  year={secondMonth.year}
                  monthIndex={secondMonth.monthIndex}
                  cellState={cellState}
                  isDateDisabled={(d) => d < todayISO}
                  onCellClick={handleDayClick}
                  onCellHover={setHoverDate}
                />
              </div>
              <button
                type="button"
                className="date-range-nav-btn"
                onClick={() => setBaseMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          )}

          <div className="date-range-actions">
            <button type="button" className="link-button" onClick={handleClear} disabled={!draftStart}>
              Clear
            </button>
            <button type="button" onClick={handleDone} disabled={!draftStart || !draftEnd}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
