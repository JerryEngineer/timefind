import { Route, Routes } from "react-router-dom";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EventPage } from "./pages/EventPage";

export default function App() {
  return (
    <div className="app">
      <a
        href="https://github.com/JerryEngineer/timefind#how-it-works"
        target="_blank"
        rel="noopener noreferrer"
        className="help-link"
      >
        Help
      </a>
      <Routes>
        <Route path="/" element={<CreateEventPage />} />
        <Route path="/:id" element={<EventPage />} />
      </Routes>
    </div>
  );
}
