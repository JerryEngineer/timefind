import { Route, Routes } from "react-router-dom";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EventPage } from "./pages/EventPage";

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<CreateEventPage />} />
        <Route path="/:id" element={<EventPage />} />
      </Routes>
    </div>
  );
}
