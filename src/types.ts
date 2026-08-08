export interface DateRange {
  /** ISO date strings (YYYY-MM-DD), inclusive */
  start: string;
  end: string;
}

export interface EventConfig {
  title: string;
  description: string;
  dateRanges: DateRange[];
  /** Set/change the event's password. Omit or leave empty to keep it unchanged. */
  password?: string;
  /** Update-only: clears the event's password. */
  removePassword?: boolean;
  /** Create-only: initial list of people's names. Ignored on update. */
  people?: string[];
}

export interface PersonAvailability {
  id: string;
  name: string;
  /** ISO date strings (YYYY-MM-DD) this person is free */
  selectedDates: Set<string>;
}

export interface StoredEvent {
  id: string;
  title: string;
  description: string;
  dateRanges: DateRange[];
  hasPassword: boolean;
  createdAt: string;
  people: PersonOnWire[];
}

export interface PersonOnWire {
  id: string;
  name: string;
  selectedDates: string[];
}
