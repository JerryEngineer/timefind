import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventSetup } from "../components/EventSetup";
import { createEvent } from "../lib/api";
import type { EventConfig } from "../types";

export function CreateEventPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(config: EventConfig) {
    setError(null);
    try {
      const event = await createEvent(config);
      navigate(`/${event.id}`);
    } catch {
      setError("Couldn't create the event. Is the API server running?");
    }
  }

  return (
    <>
      <EventSetup onSubmit={handleSubmit} />
      {error && <p className="error create-error">{error}</p>}
    </>
  );
}
