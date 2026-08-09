# AGENTS.md

Notes for future agent sessions working on this codebase. This is not
user-facing — see `README.md` for that. This file is about *how to work on
TimeFind effectively*, including things that aren't obvious from reading
the code and mistakes already made once that don't need repeating.

## What this is

TimeFind is a no-account scheduling poll app: create an event with a date
range, share the link, everyone marks their availability, overlap updates
live over a WebSocket. Frontend: React + TypeScript + Vite. Backend:
Express, one JSON file per event on disk (`api/data/`), no database.
Deployed as a single Docker image (Express serves both the API and the
built frontend) published to `ghcr.io/jerryengineer/timefind` via GitHub
Actions.

## Standing preferences (don't relitigate these)

- **Simplicity over sophistication, even when the sophisticated option is
  free.** A full Cloudflare Workers + Durable Objects deployment plan was
  designed and rejected in favor of Docker Compose + the existing
  file-per-event Express server, specifically because the owner values
  being able to open a JSON file and understand exactly what's stored.
  Don't propose rearchitecting the storage model without being asked.
- **No migration code.** When the data shape changes, don't write backfill
  logic for old JSON files — the owner would rather just create a new
  event. This came up once (a `backfillPersonIds` migration) and was
  explicitly reverted.
- **Copy should be plain, not salesy.** Feature bullets, taglines, etc.
  should read like quick reassurance, not marketing. When in doubt, fewer
  words.

## Local dev

Two terminals: `npm run dev` at root (Vite, :5173) and `npm run dev` in
`api/` (Express, :3001, proxied via `vite.config.ts`). Before assuming
port 3001 is free or is the dev server, check — a leftover Docker
container from manual deploy testing has occupied it before
(`lsof -nP -iTCP:3001 -sTCP:LISTEN`, `docker ps`).

## Verifying UI changes

`tsc`/`oxlint` catch type and lint errors, not visual bugs — several real
bugs in this project (misaligned padding, wrong colors, mobile overflow)
were CSS specificity or layout issues invisible to those tools. Use
Claude in Chrome (`/chrome` to enable if not already) and actually look at
the page. Pattern that's worked well:

- Start dev servers, resize the browser window, navigate, screenshot.
- `browser_batch` for sequences of clicks/types/screenshots — much faster
  than one tool call per step.
- Any event created while testing leaves a real file in `api/data/` —
  clean it up afterward (check file mtimes if unsure which are yours vs.
  the owner's real dev data; don't delete anything you didn't just
  create).
- The browser automation environment has a **hard floor of ~500px** on
  `resize_window` — you cannot get a true 375px-phone CSS viewport this
  way. Reason about narrower widths via CSS math (padding, minmax
  breakpoints) instead of assuming you can screenshot them directly.
- Native `<select>` elements: clicking + keyboard (Down/Enter) does not
  reliably fire React's `onChange`. Use `read_page` to get an element
  `ref`, then `form_input` with that ref — this fires the real event.
- `form_input` calls are not automatically captured by `gif_creator`
  recording (only `computer`/`navigate` actions are) — take an explicit
  `screenshot` right after if that state change needs to appear in a GIF.

## CSS gotchas specific to this codebase

- `.event-setup button` and `.overlap-view button` are blanket selectors
  (element + one class = specificity 0,1,1) that style *every* button
  inside those containers as a solid accent-color CTA. Any more specific
  single-class button style (e.g. `.people-editor-remove`,
  `.people-editor-add`) will lose to them unless given higher specificity
  — the established fix is to scope it under its own parent, e.g.
  `.people-editor .people-editor-remove` (0,2,0 beats 0,1,1). If you add a
  new button-like control inside `.event-setup` or `.overlap-view` and it
  renders as an unwanted solid-purple button, this is why — check
  specificity, don't just add `!important`.
- Give every reusable small component (like the people-editor rows) its
  own complete style block (padding, border, background) rather than
  relying on inherited styles from the surrounding form — the same
  component gets reused in different contexts (create page vs. edit
  modal) with different ambient input/button styling, and inheriting
  causes visible drift between the two.
- `.calendar-grid` uses `grid-template-columns: repeat(auto-fill,
  minmax(220px, 1fr))`, which looks responsive but isn't reliably so —
  it produces two cramped ~220px columns in the ~480–620px range instead
  of collapsing to one. Fixed with an explicit
  `@media (max-width: 640px) { grid-template-columns: 1fr; }`. If you add
  new grid-based layouts, don't assume `auto-fill`/`minmax` alone is
  enough on its own; check the awkward middle-width range specifically.
- `body { overflow-x: hidden; }` is intentional — it's the blanket fix
  for horizontal scroll caused by invisible-but-still-in-layout elements
  (e.g. absolutely-positioned tooltips near the calendar's edge columns,
  which can extend past the viewport even at `opacity: 0`). It doesn't
  affect the Grid view's own internal `overflow-x: auto` scroll, which is
  a separate nested scroll container.
- The date-range calendar's drag-to-select has **toggle semantics**: a
  drag starting on an already-selected cell removes days instead of
  adding them. Don't try to build up a selection with multiple separate
  drags from the same anchor point (e.g. `13→13`, then `13→14`, then
  `13→15`) — each subsequent drag starts on an already-selected cell and
  flips to remove-mode, net result is an empty selection. Use one
  continuous drag per range.

## Backend conventions

- `toPublicEvent()` strips `passwordHash` before any client response or
  WS broadcast — this must be preserved in every route/broadcast path.
  Never send raw `event` objects to the client.
- Password auth: `X-Event-Password` header for REST, `?password=` query
  param for WebSocket (the browser WS API can't set custom headers).
- IDs (event and person) come from the same 6-char nanoid alphabet
  (`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`) —
  note this alphabet includes `-` and `_`, so event IDs can start with a
  hyphen, which matters if you're ever constructing shell commands or
  file paths from an ID (quote it).

## Docker / CI

- `docker-compose.yml` deliberately keeps both `image:` (for
  `docker compose pull` in production) and `build: .` (for local
  `docker compose up --build`) in the same file — this is intentional
  dual-purpose, not leftover cruft.
- GHCR image name is hardcoded lowercase (`jerryengineer/timefind`) in
  the workflow rather than derived from `${{ github.repository }}`,
  because that variable preserves the GitHub username's actual case
  (`JerryEngineer`), and OCI image names must be lowercase.
- Multi-arch builds use **native GitHub-hosted ARM64 runners**
  (`ubuntu-24.04-arm`, free for public repos) via a matrix build +
  digest-export + `docker buildx imagetools create` merge job — not
  QEMU emulation. QEMU was the first working version but is noticeably
  slower; the native-runner version replaced it once available. Don't
  regress back to QEMU without a reason.
- The GHCR package needs to be set to **Public** manually on GitHub
  (Packages → timefind → Package settings) the first time, or pulls
  fail with a 401 even from a public repo — pushing the image doesn't
  make the package public automatically.

## Branding / assets

- Logo and favicon are `public/logo.svg` / `public/favicon.svg` — SVG,
  not PNG. Earlier PNG attempts had baked-in backgrounds that either
  showed a white box in dark mode or needed manual resizing for
  different contexts. SVG has no such issues and scales cleanly at any
  size — prefer it for any future logo/icon updates.
- `docs/demo.gif` is embedded in the README and is what the in-app
  "Help" link points to (`README.md#how-it-works`). If the UI changes
  enough that the recording looks stale, re-record it rather than
  leaving it out of sync — a wrong demo is worse than no demo.
