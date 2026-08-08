import { useState } from "react";
import { DateRangeEditor } from "./DateRangeEditor";
import type { DateRange, EventConfig } from "../types";

interface EventSetupProps {
  onSubmit: (config: EventConfig) => void;
}

export function EventSetup({ onSubmit }: EventSetupProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);

  const isValid = title.trim() !== "" && dateRanges.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ title: title.trim(), description: description.trim(), password, dateRanges });
  }

  return (
    <form className="event-setup" onSubmit={handleSubmit}>
      <h1>TimeFind</h1>
      <p className="subtitle">Find a day that works for everyone.</p>

      <label>
        Event title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cabin trip"
          autoFocus
        />
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any details worth sharing (optional)"
          rows={3}
        />
      </label>

      <label>
        Password (optional)
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave blank for no password"
          autoComplete="new-password"
        />
      </label>

      <DateRangeEditor ranges={dateRanges} onChange={setDateRanges} />

      <button type="submit" disabled={!isValid}>
        Start voting
      </button>
    </form>
  );
}
