# Presight Frontend Exercise

Build a small full-stack user directory application. The goal is to evaluate how you design a searchable, filterable, paginated UI backed by persisted data and clear API boundaries.

The application should include:

- A React client.
- A Node.js API server.
- A SQLite database used as the source of truth for user data.
- Docker configuration for running the application locally.

## Scenario

Users need to browse a large directory of people, search by name, and narrow results by nationality and hobbies. The filter sidebar should help users discover useful filters based on the result set they are currently viewing.

## Requirements

### Data Model

Seed a SQLite database with enough records to make pagination, infinite scroll, search, and filter counts meaningful.

Each user should have:

- `avatar`
- `first_name`
- `last_name`
- `age`
- `nationality`
- `hobbies`, from 0 to 10 hobbies per user

Choose a data model that supports the required behavior.

SQLite must be the persisted source of user data.

### API

Expose an API that supports:

- Paginated user results.
- Text filtering from user input across `first_name` and `last_name`.
- Filtering by one or more nationalities.
- Filtering by one or more hobbies.
- Sorting by `first_name`, `last_name`, `age`, and `nationality`.
- Pagination metadata so the client can determine whether more results are available.
- Top 20 hobbies for the active text filter and filter state, including `{ value, count }`.
- Top 20 nationalities for the active text filter and filter state, including `{ value, count }`.

The top 20 values and counts must reflect the currently applied text filter and selected filters, not the global dataset.

Filter semantics:

- Multiple selected hobbies should match users who have all selected hobbies.
- Multiple selected nationalities should match users from any selected nationality.
- Text, hobby, and nationality filters should apply together.

Sorting semantics:

- Sorted results must be deterministic. Use `id` as a final tie-breaker when values are equal.
- Pagination must respect the active sort without duplicate or missing users.

### Client

Build a React interface that includes:

- A text filter input for `first_name` and `last_name`.
- A virtualized, infinitely scrolling list of user cards.
- A sidebar containing the top 20 hobbies and top 20 nationalities for the current result set, including counts.
- Controls for applying and removing hobby and nationality filters.
- Controls for choosing sort field and sort direction.
- Loading, empty, and error states.
- A responsive layout that remains usable on desktop and mobile.

User cards should follow this structure:

```text
|----------------------------------|
| avatar      first_name+last_name |
|             nationality      age |
|                                  |
|             (2 hobbies) (+n)     |
|----------------------------------|
```

Show up to 2 hobbies on the card. If the user has more hobbies, display the remaining count as `+n`.

Use a virtual scroll implementation for the list.

When the text filter or selected filters change, the client must refresh both:

- The paginated user list.
- The top 20 hobbies and nationalities in the sidebar.

The text filter value, selected hobbies, selected nationalities, sort field, and sort direction must be reflected in the URL query string. Reloading or sharing the URL should restore the same view state.

## Implementation Notes

- Keep the database setup easy to run locally.
- Include seed logic or a documented command that creates the SQLite database.
- Include a `Dockerfile` and `docker-compose.yml` that can run the application locally.

## Evaluation Focus

We will pay particular attention to:

- Correct data persistence and API behavior.
- Correct filtering, sorting, pagination, and top 20 counts.
- Smooth infinite scrolling with virtualization.
- URL-synced state.
- Clear loading, empty, and error states.
- Easy local and Docker-based setup.

## Deliverables

Please provide:

- ✅ Source code for the React client and Node.js server: [`client/`](client), [`server/`](server)
- ✅ A `Dockerfile` and `docker-compose.yml`: [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml)
- ✅ Instructions for setup, database seeding, and running locally: [§1 below](#1-running-locally)
- ✅ Instructions for running with Docker Compose: [§2 below](#2-running-with-docker-compose)

---

## Running the app

The project is a Yarn workspaces monorepo:

    client/    React 19 + Vite SPA
    server/    Express 5 JSON API + SQLite

Pick **one** of the two paths below. Docker Compose needs nothing installed but Docker;
local development gives hot reload for both packages.

---

## 1. Running locally

### 1.1 Prerequisites

| | |
|---|---|
| **Node** | 22 or newer (`.nvmrc` is provided, so `nvm use` works) |
| **Yarn** | 1.x (classic). The workspace scripts assume `yarn workspace` |
| **Build tools** | `better-sqlite3` is a native module. Prebuilt binaries cover mainstream platforms; if none matches, you need a C++ toolchain (Xcode CLT on macOS, `build-essential` + `python3` on Linux). |

### 1.2 Setup

    git clone <repo-url>
    cd presight-execise
    yarn install          # installs both workspaces and hoists shared dev deps

### 1.3 Database seeding

    yarn seed

Creates `server/data/users.db` and populates it with **5,000 users, 60 hobbies and
40 nationalities** (~25,000 `user_hobbies` rows) inside a single transaction, which takes
a couple of seconds. The generator is seeded with a fixed value (`faker.seed(42)`), so the
dataset is **byte-identical on every machine and every run**.

Output:

    Seeded 5000 users into /.../server/data/users.db

Notes:

- **`yarn seed` is optional.** The server calls `seedIfEmpty()` on startup, so an absent or
  empty database is seeded automatically the first time you run `yarn dev`. The explicit
  command exists so seeding is a documented, repeatable step rather than a side effect.

- **Re-seeding requires a clean database.** `hobbies.name` is `UNIQUE`, so running
  `yarn seed` against an already-seeded file fails fast with
  `SqliteError: UNIQUE constraint failed: hobbies.name`. The whole seed runs in one
  transaction, so it **rolls back and leaves the existing data untouched**. You cannot
  end up with a half-seeded or duplicated database. To genuinely re-seed, delete the
  three SQLite files first:

      rm -f server/data/users.db server/data/users.db-wal server/data/users.db-shm
      yarn seed

- **Custom location:** `DB_PATH` overrides the default for both the seeder and the server.

      DB_PATH=/tmp/users.db yarn seed

### 1.4 Running

    yarn dev

Starts both workspaces in parallel (via Lerna):

| | |
|---|---|
| **API** | http://localhost:3000. Express under `tsx watch`, restarts on server changes |
| **Client** | http://localhost:5173. Vite dev server with HMR |
| **API docs** | http://localhost:3000/api/docs. Swagger UI |

**Open http://localhost:5173.** That is the app. Vite proxies `/api/*` through to
`:3000`, so the client and API are same-origin in the browser and no CORS configuration
is involved.

To run just one side:

    yarn workspace presight-server dev
    yarn workspace presight-client dev

### 1.5 Tests

    yarn test             # both workspaces

    yarn workspace presight-server test    # query semantics, filters, facets, HTTP validation
    yarn workspace presight-client test    # URL state round-trip, card, list/sidebar states

Server tests run against in-memory SQLite databases, so they need no seeded data and
leave nothing behind.

### 1.6 Production build (without Docker)

    yarn build                                            # tsc for the server, vite build for the client
    STATIC_DIR=../client/dist yarn workspace presight-server start

With `STATIC_DIR` set, the API server also serves the built SPA (plus a history fallback
for client-side routes), so the whole app is on **http://localhost:3000** from a single
process, the same topology the Docker image uses. Without it, the server exposes the API only.

`STATIC_DIR` is resolved against the **current working directory**, and `yarn workspace`
runs the script from `server/`, hence `../client/dist`. If the path doesn't exist the
server skips static serving silently and you get the API with no UI, so double-check it
if `/` returns a 404.

### 1.7 Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | API / server port |
| `DB_PATH` | `server/data/users.db` | SQLite file location (used by the server and the seeder) |
| `STATIC_DIR` | *(unset)* | When set, the server also serves the built client from this directory |

### 1.8 Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `NODE_MODULE_VERSION` mismatch, or `better-sqlite3` fails to load | The native binding is compiled against one Node ABI. Re-run `yarn install` (or `npm rebuild better-sqlite3`) after switching Node versions. |
| Client loads but every request 500s or the list is empty | The API isn't running, or the DB is empty. Check `:3000/api/users` directly and run `yarn seed`. |
| `EADDRINUSE :3000` | Another process holds the port. Use `PORT=3001 yarn dev`, or free it. |
| `UNIQUE constraint failed: hobbies.name` from `yarn seed` | The database is already seeded. Harmless: the transaction rolls back and existing data is intact. Delete `server/data/users.db*` first if you want a fresh seed. |

---

## 2. Running with Docker Compose

The only prerequisite is Docker with Compose v2 (`docker compose`, not `docker-compose`).
Node and Yarn are **not** needed on the host, since the build happens inside the image.

### 2.1 Start

    docker compose up --build

**Open http://localhost:3000.** One container serves both the API and the built SPA;
Swagger UI is at http://localhost:3000/api/docs.

First build takes a few minutes (installs both workspaces and compiles client and server);
subsequent runs reuse cached layers. On first boot the database is empty, so the server
seeds it automatically. Watch for `API listening on http://localhost:3000` in the logs.

### 2.2 Everyday commands

    docker compose up --build        # build and start in the foreground
    docker compose up -d --build     # ...in the background
    docker compose logs -f           # follow logs
    docker compose down              # stop, keeping the database
    docker compose down -v           # stop and delete the database volume (full reset)

### 2.3 Data persistence

The SQLite file lives at `/data/users.db` inside the container, backed by the named
volume `sqlite-data`, deliberately **outside** the image layer, so it survives rebuilds
and restarts.

- `docker compose down` → data kept; the next `up` skips seeding.
- `docker compose down -v` → volume deleted; the next `up` re-seeds 5,000 users.

### 2.4 Changing the port

Edit the port mapping in `docker-compose.yml` (host:container):

    ports:
      - "8080:3000"      # app on http://localhost:8080

### 2.5 What the image does

`Dockerfile` is a three-stage build:

1. **build**: installs all workspaces and compiles the client (`vite build`) and the
   server (`tsc`).
2. **runtime-deps**: a clean `yarn install --production` against *only*
   `server/package.json`, so React, Tailwind, Vite and the dev toolchain never reach the
   final image.
3. **runtime**: `node:22-slim` with `server/dist`, `client/dist` and the pruned
   `node_modules`. Runs `node server/dist/index.js` with `STATIC_DIR` and `DB_PATH`
   preset, serving the API and the SPA from a single process on port 3000.

Both install steps use `--frozen-lockfile`, so builds are reproducible.

### 2.6 Helper scripts: build an image, ship it, run it

Two scripts in [`scripts/`](scripts) wrap the image lifecycle. They're optional, since
`docker compose up --build` above is all you need to run the app, but they're handy for
producing a portable image you can hand to someone who has Docker and nothing else.

    ./scripts/package.sh          # build the image, save it to deploy/presight-app-<date>.tar.gz
    ./scripts/deploy.sh           # load that tarball and run it on port 3000
    ./scripts/deploy.sh '' 3001   # ...or on another port

| Script | Does | Needs |
|---|---|---|
| `scripts/package.sh` | `docker compose build`, then `docker save \| gzip` into `deploy/`. **Starts nothing.** | This repo + Docker |
| `scripts/deploy.sh` | `docker load` the tarball, replace any previous container, `docker run -d` with the `presight-data` volume, then wait until `/api/users` responds | **Only Docker** |

**To run it on another machine:** copy `deploy/presight-app-<date>.tar.gz` and
`scripts/deploy.sh` into the same directory there, then:

    ./deploy.sh presight-app-<date>.tar.gz 3000

No repo, no Node, no build step. `deploy.sh` is self-contained and finds a tarball sitting
next to it. Both scripts resolve paths from their own location, so they work from any
working directory.

Notes:

- `deploy.sh` exits non-zero with a clear message if the port is held by another process
  (checked *before* the old container is removed, so a busy port can't leave you with
  nothing running) or if an explicitly-passed tarball doesn't exist.
- Data lives in the `presight-data` volume, separate from Compose's `sqlite-data`. Reset
  with `docker rm -f presight-app && docker volume rm presight-data`.
- `deploy/` is gitignored, since the tarballs are build output, not source.

---

### API summary

    GET /api/users?q=&nationalities=a,b&hobbies=x,y&sort=first_name|last_name|age|nationality&dir=asc|desc&page=1&limit=25
    GET /api/facets?q=&nationalities=a,b&hobbies=x,y

Hobbies combine with AND (users must have all), nationalities with OR. Facet counts
are scoped to the active filters; each facet ignores its own selection where needed
so multi-select remains possible. In particular, nationality facet counts intentionally
do not shrink when you select a nationality. Own-facet exclusion keeps the OR group
expandable so you can still add a second or third nationality. Sorting is deterministic
(`id` tie-break).
