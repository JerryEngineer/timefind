import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OverlapView } from "../components/OverlapView";
import { EditEventModal } from "../components/EditEventModal";
import { PersonAvailabilityCalendar } from "../components/PersonAvailabilityCalendar";
import {
  PasswordRequiredError,
  addPerson,
  connectEventSocket,
  getEvent,
  removePerson,
  toPersonAvailability,
  toPersonOnWire,
  unlockEvent,
  updateEvent,
  updatePerson,
} from "../lib/api";
import type { DateRange, EventConfig, PersonAvailability } from "../types";

type LoadStatus = "loading" | "not-found" | "error" | "needs-password" | "ready";

const MAX_PEOPLE = 50;

export function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [people, setPeople] = useState<PersonAvailability[]>([]);
  const peopleRef = useRef(people);
  peopleRef.current = people;
  const focusedPersonIdRef = useRef<string | null>(null);

  const [editingEvent, setEditingEvent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);

  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setStatus("loading");
    getEvent(id)
      .then((event) => {
        if (cancelled) return;
        setTitle(event.title);
        setDescription(event.description);
        setDateRanges(event.dateRanges);
        setHasPassword(event.hasPassword);
        setPeople(event.people.map(toPersonAvailability));
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err instanceof PasswordRequiredError) {
          setStatus("needs-password");
        } else {
          setStatus(err.message === "Event not found" ? "not-found" : "error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || status !== "ready") return;
    return connectEventSocket(id, (event) => {
      setTitle(event.title);
      setDescription(event.description);
      setDateRanges(event.dateRanges);
      setHasPassword(event.hasPassword);
      setPeople((prev) =>
        event.people.map((p) => {
          if (p.id !== focusedPersonIdRef.current) return toPersonAvailability(p);
          const local = prev.find((prevPerson) => prevPerson.id === p.id);
          return { ...toPersonAvailability(p), name: local?.name ?? p.name };
        }),
      );
    });
  }, [id, status]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setPasswordError(null);
    try {
      const event = await unlockEvent(id, passwordInput);
      setTitle(event.title);
      setDescription(event.description);
      setDateRanges(event.dateRanges);
      setHasPassword(event.hasPassword);
      setPeople(event.people.map(toPersonAvailability));
      setStatus("ready");
    } catch {
      setPasswordError("Incorrect password");
    }
  }

  const commitPerson = useCallback(
    (personId: string) => {
      if (!id) return;
      focusedPersonIdRef.current = null;
      const person = peopleRef.current.find((p) => p.id === personId);
      if (!person) return;
      updatePerson(id, personId, toPersonOnWire(person)).catch(() => {
        // best-effort save; local state still reflects the user's edit
      });
    },
    [id],
  );

  function saveActivePersonAvailability(newSelectedDates: Set<string>) {
    if (!id || !activePerson) return;
    const personId = activePerson.id;
    const updated: PersonAvailability = { ...activePerson, selectedDates: newSelectedDates };
    setPeople((prev) => prev.map((p) => (p.id === personId ? updated : p)));
    updatePerson(id, personId, toPersonOnWire(updated)).catch(() => {
      // best-effort save; local state still reflects the user's edit
    });
  }

  function setName(personId: string, name: string) {
    setPeople((prev) => prev.map((p) => (p.id === personId ? { ...p, name } : p)));
  }

  function focusPerson(personId: string) {
    focusedPersonIdRef.current = personId;
  }

  async function handleAddPerson() {
    if (!id) return;
    const previousIds = new Set(peopleRef.current.map((p) => p.id));
    try {
      const event = await addPerson(id);
      const nextPeople = event.people.map(toPersonAvailability);
      setPeople(nextPeople);
      const newPerson = nextPeople.find((p) => !previousIds.has(p.id));
      if (newPerson) setActivePersonId(newPerson.id);
    } catch {
      // best-effort; nothing to roll back locally since we didn't optimistically add anyone
    }
  }

  async function handleRemovePerson(personId: string) {
    if (!id) return;
    const person = peopleRef.current.find((p) => p.id === personId);
    if (!confirm(`Remove ${person?.name || "this person"} and their picked dates?`)) return;
    try {
      const event = await removePerson(id, personId);
      setPeople(event.people.map(toPersonAvailability));
    } catch {
      // best-effort; local state stays as-is on failure
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard access unavailable; no-op
    }
  }

  async function saveEventEdit(config: EventConfig) {
    if (!id) return;
    try {
      const updated = await updateEvent(id, config);
      setTitle(updated.title);
      setDescription(updated.description);
      setDateRanges(updated.dateRanges);
      setHasPassword(updated.hasPassword);
      setPeople(updated.people.map(toPersonAvailability));
      setEditingEvent(false);
    } catch {
      // best-effort save; modal stays open with the unsaved draft
    }
  }

  if (status === "loading") {
    return <p className="status-message">Loading…</p>;
  }
  if (status === "not-found") {
    return (
      <p className="status-message">
        No event found for this link. <Link to="/">Start a new one</Link>.
      </p>
    );
  }
  if (status === "error") {
    return <p className="status-message error">Couldn't load this event. Is the API server running?</p>;
  }
  if (status === "needs-password") {
    return (
      <form className="event-setup" onSubmit={handleUnlock}>
        <h1>Password required</h1>
        <p className="subtitle">This event is password protected.</p>
        <label>
          Password
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
        </label>
        {passwordError && <p className="error">{passwordError}</p>}
        <button type="submit">Unlock</button>
      </form>
    );
  }

  const activePerson = people.find((p) => p.id === activePersonId) ?? people[0];

  return (
    <>
      <header className="event-header">
        <div className="event-header-top">
          <h1>{title}</h1>
          <div className="header-actions">
            <button type="button" className="link-button" onClick={copyLink}>
              {linkCopied ? "Copied!" : "Copy link"}
            </button>
            <button type="button" className="link-button" onClick={() => setEditingEvent(true)}>
              Edit event
            </button>
            <Link to="/" className="link-button">
              New event
            </Link>
          </div>
        </div>
        {description && <p className="event-description">{description}</p>}
      </header>

      {editingEvent && (
        <EditEventModal
          initialTitle={title}
          initialDescription={description}
          initialRanges={dateRanges}
          hasPassword={hasPassword}
          people={people}
          canAddPerson={people.length < MAX_PEOPLE}
          onRenamePerson={setName}
          onFocusPerson={focusPerson}
          onCommitPersonName={commitPerson}
          onAddPerson={handleAddPerson}
          onRemovePerson={handleRemovePerson}
          onSave={saveEventEdit}
          onCancel={() => setEditingEvent(false)}
        />
      )}

      {activePerson && (
        <section className="availability-section" id="availability">
          <div className="section-title">
            <h2>Choose Your Availability</h2>
            <a href="#overlap" className="jump-link">
              ↓ Overlap
            </a>
          </div>

          <div className="person-selector">
            <label>
              Acting as
              <select value={activePerson.id} onChange={(e) => setActivePersonId(e.target.value)}>
                {people.map((person, i) => (
                  <option key={person.id} value={person.id}>
                    {person.name || `Person ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Name
              <input
                type="text"
                value={activePerson.name}
                onChange={(e) => setName(activePerson.id, e.target.value)}
                onFocus={() => focusPerson(activePerson.id)}
                onBlur={() => commitPerson(activePerson.id)}
              />
            </label>
            <div className="person-actions">
              <button type="button" onClick={handleAddPerson} disabled={people.length >= MAX_PEOPLE}>
                + Add person
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => handleRemovePerson(activePerson.id)}
                disabled={people.length <= 1}
              >
                Remove {activePerson.name || "this person"}
              </button>
            </div>
          </div>

          <PersonAvailabilityCalendar
            eventDateRanges={dateRanges}
            selectedDates={activePerson.selectedDates}
            onChange={saveActivePersonAvailability}
          />
        </section>
      )}

      <OverlapView dateRanges={dateRanges} people={people} />
    </>
  );
}
