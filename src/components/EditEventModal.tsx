import { useEffect, useRef, useState } from "react";
import { DateRangePicker } from "./DateRangePicker";
import type { DateRange, EventConfig, PersonAvailability } from "../types";

interface EditEventModalProps {
  initialTitle: string;
  initialDescription: string;
  initialRanges: DateRange[];
  hasPassword: boolean;
  people: PersonAvailability[];
  canAddPerson: boolean;
  onRenamePerson: (personId: string, name: string) => void;
  onFocusPerson: (personId: string) => void;
  onCommitPersonName: (personId: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (personId: string) => void;
  onSave: (config: EventConfig) => Promise<void>;
  onCancel: () => void;
}

export function EditEventModal({
  initialTitle,
  initialDescription,
  initialRanges,
  hasPassword,
  people,
  canAddPerson,
  onRenamePerson,
  onFocusPerson,
  onCommitPersonName,
  onAddPerson,
  onRemovePerson,
  onSave,
  onCancel,
}: EditEventModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [draftDescription, setDraftDescription] = useState(initialDescription);
  const [draftRanges, setDraftRanges] = useState(initialRanges);
  const [draftPassword, setDraftPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isValid = draftTitle.trim() !== "" && draftRanges.length > 0;

  useEffect(() => {
    dialogRef.current?.showModal();
    // showModal() doesn't lock body scroll on its own — do it explicitly so the
    // page behind can't scroll (and the modal's own overflow can't chain into it).
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  async function handleSave() {
    if (!isValid) return;
    setIsSaving(true);
    try {
      await onSave({
        title: draftTitle.trim(),
        description: draftDescription.trim(),
        dateRanges: draftRanges,
        password: draftPassword,
        removePassword,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="event-editor-modal"
      onClose={onCancel}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <div className="event-editor-modal-body">
        <label>
          Event title
          <input type="text" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
        </label>

        <label>
          Description
          <textarea
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            placeholder="Any details worth sharing (optional)"
            rows={3}
          />
        </label>

        <label>
          {hasPassword ? "Change password" : "Set a password (optional)"}
          <input
            type="password"
            value={draftPassword}
            onChange={(e) => setDraftPassword(e.target.value)}
            placeholder={hasPassword ? "Leave blank to keep the current password" : "Leave blank for no password"}
            autoComplete="new-password"
            disabled={removePassword}
          />
        </label>

        {hasPassword && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={removePassword}
              onChange={(e) => {
                setRemovePassword(e.target.checked);
                if (e.target.checked) setDraftPassword("");
              }}
            />
            Remove existing password
          </label>
        )}

        <div className="date-range-field">
          <p className="people-editor-label">Dates</p>
          <DateRangePicker ranges={draftRanges} onChange={setDraftRanges} />
        </div>

        <div className="people-editor">
          <p className="people-editor-label">People</p>
          {people.map((person) => (
            <div key={person.id} className="people-editor-row">
              <input
                type="text"
                value={person.name}
                onChange={(e) => onRenamePerson(person.id, e.target.value)}
                onFocus={() => onFocusPerson(person.id)}
                onBlur={() => onCommitPersonName(person.id)}
                placeholder="Person's name"
              />
              <button
                type="button"
                className="people-editor-remove"
                onClick={() => onRemovePerson(person.id)}
                disabled={people.length <= 1}
                aria-label={`Remove ${person.name || "this person"}`}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="people-editor-add" onClick={onAddPerson} disabled={!canAddPerson}>
            + Add person
          </button>
        </div>
      </div>
      <div className="event-editor-actions">
        <button type="button" onClick={handleSave} disabled={!isValid || isSaving}>
          Save changes
        </button>
        <button type="button" className="link-button" onClick={() => dialogRef.current?.close()}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}
