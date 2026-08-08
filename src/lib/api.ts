import type { EventConfig, PersonAvailability, PersonOnWire, StoredEvent } from "../types";

export class PasswordRequiredError extends Error {
  constructor() {
    super("Password required");
  }
}

async function parseOrThrow(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body.passwordProtected) throw new PasswordRequiredError();
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}

function passwordStorageKey(eventId: string) {
  return `timefind:${eventId}:password`;
}

function getCachedPassword(eventId: string): string | null {
  return localStorage.getItem(passwordStorageKey(eventId));
}

function setCachedPassword(eventId: string, password: string) {
  localStorage.setItem(passwordStorageKey(eventId), password);
}

function passwordHeaders(eventId: string): HeadersInit {
  const password = getCachedPassword(eventId);
  return password ? { "X-Event-Password": password } : {};
}

export async function createEvent(config: EventConfig): Promise<StoredEvent> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  const event = await parseOrThrow(res);
  if (config.password) setCachedPassword(event.id, config.password);
  return event;
}

export async function getEvent(id: string): Promise<StoredEvent> {
  const res = await fetch(`/api/events/${id}`, { headers: passwordHeaders(id) });
  return parseOrThrow(res);
}

/** Verifies a password against an event and, on success, remembers it on this device. */
export async function unlockEvent(id: string, password: string): Promise<StoredEvent> {
  const res = await fetch(`/api/events/${id}`, { headers: { "X-Event-Password": password } });
  const event = await parseOrThrow(res);
  setCachedPassword(id, password);
  return event;
}

export async function updatePerson(
  eventId: string,
  personId: string,
  person: PersonOnWire,
): Promise<StoredEvent> {
  const res = await fetch(`/api/events/${eventId}/people/${personId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...passwordHeaders(eventId) },
    body: JSON.stringify(person),
  });
  return parseOrThrow(res);
}

export async function addPerson(eventId: string): Promise<StoredEvent> {
  const res = await fetch(`/api/events/${eventId}/people`, {
    method: "POST",
    headers: passwordHeaders(eventId),
  });
  return parseOrThrow(res);
}

export async function removePerson(eventId: string, personId: string): Promise<StoredEvent> {
  const res = await fetch(`/api/events/${eventId}/people/${personId}`, {
    method: "DELETE",
    headers: passwordHeaders(eventId),
  });
  return parseOrThrow(res);
}

export async function updateEvent(eventId: string, config: EventConfig): Promise<StoredEvent> {
  const res = await fetch(`/api/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...passwordHeaders(eventId) },
    body: JSON.stringify(config),
  });
  const event = await parseOrThrow(res);
  if (config.password) setCachedPassword(eventId, config.password);
  return event;
}

export function toPersonAvailability(person: PersonOnWire): PersonAvailability {
  return { id: person.id, name: person.name, selectedDates: new Set(person.selectedDates) };
}

export function toPersonOnWire(person: PersonAvailability): PersonOnWire {
  return { id: person.id, name: person.name, selectedDates: [...person.selectedDates] };
}

/** Subscribes to live updates for an event. Returns a function that disconnects. */
export function connectEventSocket(eventId: string, onEvent: (event: StoredEvent) => void): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  function connect() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const password = getCachedPassword(eventId);
    const passwordParam = password ? `&password=${encodeURIComponent(password)}` : "";
    socket = new WebSocket(`${protocol}://${window.location.host}/ws?eventId=${eventId}${passwordParam}`);
    socket.onmessage = (ev) => onEvent(JSON.parse(ev.data));
    socket.onclose = () => {
      if (!stopped) reconnectTimer = setTimeout(connect, 1000);
    };
  }

  connect();

  return () => {
    stopped = true;
    clearTimeout(reconnectTimer);
    socket?.close();
  };
}
