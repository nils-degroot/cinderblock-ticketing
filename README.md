# Cinderblock Ticketing

A showcase ticketing system built with [Cinderblock](https://github.com/nils-degroot/cinderblock) (Rust) and Bun + React.

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Bun](https://bun.sh/) (v1.2+)

## Quick Start

### Backend

```bash
cargo run
```

Starts the API server on **http://localhost:3001** with SQLite, seed data, and Swagger UI at `/swagger-ui`.

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Opens the dev server on **http://localhost:3000**.

### Generate API Client

After changing the backend API, export the OpenAPI spec and regenerate:

```bash
curl -s http://localhost:3001/api-docs/openapi.json > frontend/openapi.json
cd frontend && bun run generate
```

## Production Build

```bash
cd frontend
bun run build
```

Outputs optimized files to `frontend/dist/`.

## Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Backend  | Rust, Cinderblock, SQLite, Axum, utoipa       |
| Frontend | Bun, React 19, React Router, TanStack Query   |
| Styling  | Tailwind CSS v4                               |
| API      | hey-api (generated TypeScript client)         |

## Features

- **Dashboard** — stats overview, priority breakdown, team list, recent tickets
- **Ticket List** — paginated table with status/priority filters
- **Ticket Detail** — full view with status transitions, reassignment, comments
- **New Ticket** — create form with priority, label, reporter, assignee selection
- **CRUD** — create, resolve, close, delete tickets; add comments
