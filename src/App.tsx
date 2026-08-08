import { Route, Routes } from "react-router-dom";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EventPage } from "./pages/EventPage";

export default function App() {
  return (
    <div className="app">
      <div className="corner-links">
        <a
          href="https://github.com/JerryEngineer/timefind#how-it-works"
          target="_blank"
          rel="noopener noreferrer"
        >
          Help
        </a>
        <a
          href="https://github.com/JerryEngineer/timefind/issues/new?template=feedback.yml"
          target="_blank"
          rel="noopener noreferrer"
        >
          Feedback
        </a>
      </div>
      <Routes>
        <Route path="/" element={<CreateEventPage />} />
        <Route path="/:id" element={<EventPage />} />
      </Routes>
    </div>
  );
}
