import { useState } from "react";
import { DateRangeEditor } from "./DateRangeEditor";
import type { DateRange, EventConfig } from "../types";

const MAX_PEOPLE = 50;

interface EventSetupProps {
  onSubmit: (config: EventConfig) => void;
}

export function EventSetup({ onSubmit }: EventSetupProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [people, setPeople] = useState<string[]>(["Person 1", "Person 2"]);

  const isValid = title.trim() !== "" && dateRanges.length > 0;

  function renamePerson(index: number, name: string) {
    setPeople((prev) => prev.map((p, i) => (i === index ? name : p)));
  }

  function addPerson() {
    setPeople((prev) => (prev.length >= MAX_PEOPLE ? prev : [...prev, `Person ${prev.length + 1}`]));
  }

  function removePerson(index: number) {
    setPeople((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ title: title.trim(), description: description.trim(), password, dateRanges, people });
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

      <div className="people-editor">
        <p className="people-editor-label">People</p>
        {people.map((name, index) => (
          <div key={index} className="people-editor-row">
            <input
              type="text"
              value={name}
              onChange={(e) => renamePerson(index, e.target.value)}
              placeholder="Person's name"
            />
            <button
              type="button"
              className="people-editor-remove"
              onClick={() => removePerson(index)}
              disabled={people.length <= 1}
              aria-label={`Remove ${name || "this person"}`}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="people-editor-add" onClick={addPerson} disabled={people.length >= MAX_PEOPLE}>
          + Add person
        </button>
      </div>

      <DateRangeEditor ranges={dateRanges} onChange={setDateRanges} />

      <button type="submit" disabled={!isValid}>
        Start voting
      </button>
    </form>
  );
}
