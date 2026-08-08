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

The same Docker Compose setup is what you deploy — there's no separate
build for production. All you need is a server with Docker installed.

1. **Get a server.** Any small VPS works (DigitalOcean, Hetzner, etc.) —
   this app is lightweight. Install
   [Docker Engine + the Compose plugin](https://docs.docker.com/engine/install/)
   on it.

2. **Copy the code over**, e.g. `git clone` the repo directly on the
   server, or `scp`/`rsync` it from your machine.

3. **Start it:**

   ```
   docker compose up --build -d
   ```

   The app is now serving on port 3001. `api/data` on the host holds every
   event as a JSON file — that's the entire database, so back it up by
   copying that folder.

4. **Put it on a real domain with HTTPS.** Port 3001 alone is HTTP-only.
   The simplest way to add a domain + automatic HTTPS is a
   [Caddy](https://caddyserver.com/) reverse proxy in front — it's one
   file, and it handles certificates for you. Install Caddy on the server
   (or run it as another Compose service) with a `Caddyfile` like:

   ```
   yourdomain.com {
       reverse_proxy localhost:3001
   }
   ```

   Then `caddy run` (or `systemctl start caddy` if installed as a
   service). Point your domain's DNS A record at the server's IP first —
   Caddy needs that to issue a certificate.

5. **Deploying updates:** pull the latest code and rebuild —

   ```
   git pull
   docker compose up --build -d
   ```

   `api/data` isn't touched by a rebuild, so existing events survive.
