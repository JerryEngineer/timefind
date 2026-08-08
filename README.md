# TimeFind

Find a date that works for everyone — no accounts, no sign-ups, nothing to
install. Create an event, share the link, and everyone marks the days
they're free. TimeFind shows you where everyone overlaps, updating live as
people vote.

**[Try it now at timefind.org →](https://timefind.org)**

![Creating an event, two people marking their availability, and the overlap updating live](docs/demo.gif)

## How it works

1. [Create an event](https://timefind.org) with a title and the date range
   you're choosing from.
2. Share the link — anyone who opens it can add themselves and mark the
   days they're free.
3. Watch the overlap update live as people vote, and switch between
   Calendar, List, or Grid views to see who's free when.

## Frequently asked questions

**Do I need to create an account?**
No. Just open the link, add your name, and start marking your availability.

**Is my event private?**
Anyone with the link can view and edit it, so treat the link itself as the
key. If you want more control, open **Edit event** and set a password —
after that, the link alone won't be enough to get in.

**What if I picked the wrong days?**
Revisit the link any time, choose yourself under **Acting as**, and update
your availability — changes save automatically and everyone sees them live.

**Can I add or remove people?**
Yes — anyone with the link can use **+ Add person** or **Remove** on the
availability screen.

**What if I lose the link?**
There's no account or email tied to an event, so there's no way to recover
a lost link — worth bookmarking or saving it somewhere you'll find it again.

**Is this really free?**
Yes — free, no ads, and [open source](https://github.com/JerryEngineer/timefind).
Use it at [timefind.org](https://timefind.org), no install required. Or deploy it yourself. (instructions below)

---

## For developers

The rest of this README covers running and deploying your own copy of
TimeFind.

### Developing locally

Run the frontend and API in two terminals:

```
npm install
npm run dev
```

```
cd api
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` and `/ws`
to the API server on `http://localhost:3001` (see `vite.config.ts`). Events
are stored as JSON files on disk by that API server (see `api/`).

Other useful commands, run from the project root:

```
npm run build   # type-check and build the frontend for production
npm run lint    # oxlint
npm run preview # preview a production build locally
```

### Running with Docker

`docker compose up --build` builds the frontend, bundles it with the API
server into a single container, and serves everything (frontend + `/api`
+ `/ws`) from one origin on `http://localhost:3001`. Event data is stored
as JSON files in `api/data` on the host (bind-mounted into the container),
so it persists across rebuilds and restarts.

```
docker compose up --build -d   # start in the background
docker compose down            # stop
```

### Deploying to production

Every push to `main` builds and publishes the image to
`ghcr.io/jerryengineer/timefind:latest`. A server just needs Docker and
this `docker-compose.yml`:

```yaml
services:
  timefind:
    image: ghcr.io/jerryengineer/timefind:latest
    ports:
      - "3001:3001"
    volumes:
      - ./api/data:/app/data
    restart: unless-stopped
```

```
docker compose pull
docker compose up -d
```

That's it — the app is serving on port 3001, and `api/data` holds every
event as a JSON file.
