import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EventPage } from "./pages/EventPage";

type Theme = "light" | "dark";

const THEME_KEY = "timefind:theme";

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState<Theme | null>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.dataset.theme = theme;
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [theme]);

  const effectiveTheme = theme ?? systemTheme;

  function toggleTheme() {
    const next = effectiveTheme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }

  return (
    <div className="app">
      <div className="corner-links">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {effectiveTheme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
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
