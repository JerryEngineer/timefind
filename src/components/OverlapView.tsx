import { useState } from "react";
import { OverlapCalendarView } from "./OverlapCalendarView";
import { OverlapListView } from "./OverlapListView";
import { OverlapGridView } from "./OverlapGridView";
import type { DateRange, PersonAvailability } from "../types";

interface OverlapViewProps {
  dateRanges: DateRange[];
  people: PersonAvailability[];
}

type Mode = "calendar" | "list" | "grid";

export function OverlapView({ dateRanges, people }: OverlapViewProps) {
  const [mode, setMode] = useState<Mode>("calendar");

  return (
    <div className="overlap-view" id="overlap">
      <div className="overlap-view-header">
        <div className="section-title">
          <h2>Overlap</h2>
          <a href="#availability" className="jump-link">
            ↑ Choose Your Availability
          </a>
        </div>
        <div className="view-mode-selector">
          <button type="button" className={mode === "calendar" ? "active" : ""} onClick={() => setMode("calendar")}>
            Calendar
          </button>
          <button type="button" className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}>
            List
          </button>
          <button type="button" className={mode === "grid" ? "active" : ""} onClick={() => setMode("grid")}>
            Grid
          </button>
        </div>
      </div>

      {mode === "calendar" && <OverlapCalendarView dateRanges={dateRanges} people={people} />}
      {mode === "list" && <OverlapListView dateRanges={dateRanges} people={people} />}
      {mode === "grid" && <OverlapGridView dateRanges={dateRanges} people={people} />}
    </div>
  );
}
