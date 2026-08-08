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

Every push to `main` triggers `.github/workflows/docker-publish.yml`, which
builds the image and pushes it to GitHub Container Registry as
`ghcr.io/jerryengineer/timefind:latest` (and `:<commit-sha>`, for rollback).
The server just pulls that image — it never needs the source code, `npm`,
or a build step of its own.

1. **Get a server.** Any small VPS works (DigitalOcean, Hetzner, etc.) —
   this app is lightweight. Install
   [Docker Engine + the Compose plugin](https://docs.docker.com/engine/install/)
   on it.

2. **Make the package pullable.** By default a package pushed via
   `GITHUB_TOKEN` is private. Either:
   - Go to the package's page on GitHub (your profile/org → **Packages** →
     `timefind`) → **Package settings** → change visibility to **Public**
     (simplest — anyone, including your server, can then `docker pull`
     with no login), or
   - Keep it private and `docker login ghcr.io` on the server with a
     [personal access token](https://github.com/settings/tokens) that has
     the `read:packages` scope.

3. **Copy just the compose file over** — the server only needs
   `docker-compose.yml` (and an `api/data` folder next to it for the bind
   mount), not the whole repo:

   ```
   scp docker-compose.yml your-server:~/timefind/
   ```

4. **Pull and start it:**

   ```
   cd ~/timefind
   mkdir -p api/data
   docker compose pull
   docker compose up -d
   ```

   The app is now serving on port 3001. `api/data` holds every event as a
   JSON file — that's the entire database, so back it up by copying that
   folder.

5. **Put it on a real domain with HTTPS.** Port 3001 alone is HTTP-only.
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

6. **Deploying updates:** once a push to `main` finishes building, just
   pull the new image and restart —

   ```
   docker compose pull
   docker compose up -d
   ```

   `api/data` isn't touched, so existing events survive. To roll back,
   swap `:latest` for a specific `:<commit-sha>` tag in
   `docker-compose.yml` and repeat the pull/up.

### Deploying without repo access

If you just want to run someone else's already-published TimeFind image
(the package is public), you don't need the source repo at all — only
Docker and this one file.

1. **Get a server and install Docker**, same as above:

   ```
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER   # log out/in afterward
   ```

2. **Create `~/timefind/docker-compose.yml` by hand:**

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

   (Same as the repo's compose file, minus `build: .` — there's no source
   to build here, so `latest` always resolves to whatever the owner's CI
   last published.)

3. **Pull and run:**

   ```
   cd ~/timefind
   mkdir -p api/data
   docker compose pull
   docker compose up -d
   ```

   Check it with `docker compose ps` and `curl http://localhost:3001`, or
   visit `http://your-server-ip:3001`. Domain + HTTPS setup is the same
   Caddy step as above.
