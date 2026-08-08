# TimeFind

Pick one or more date ranges, have everyone mark which days they're free,
and see the overlap. No accounts — create an event and share its link
(`/<id>`) with whoever needs to vote. People can be added or removed on the
fly, events can optionally be password-protected, and everyone viewing the
same event sees votes update live over a WebSocket connection.

Events are stored as JSON files on disk by a small local API server (see
`api/`).

## Developing locally

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
to the API server on `http://localhost:3001` (see `vite.config.ts`).

Other useful commands, run from the project root:

```
npm run build   # type-check and build the frontend for production
npm run lint    # oxlint
npm run preview # preview a production build locally
```

## Running with Docker

`docker compose up --build` builds the frontend, bundles it with the API
server into a single container, and serves everything (frontend + `/api`
+ `/ws`) from one origin on `http://localhost:3001`. Event data is stored
as JSON files in `api/data` on the host (bind-mounted into the container),
so it persists across rebuilds and restarts.

```
docker compose up --build -d   # start in the background
docker compose down            # stop
```

## Deploying to production

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
