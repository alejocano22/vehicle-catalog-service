# Vehicle Catalog Service

Backend service that pulls vehicle make and vehicle-type data from the NHTSA public API in XML format, converts it to JSON, stores it in PostgreSQL, and exposes it through a single GraphQL endpoint.

Built with NestJS, TypeORM, and PostgreSQL.

## Quick start (Docker)

This is the fastest way to get it running, you don't need Node or Postgres installed locally, just Docker.

```bash
cp .env.example .env
docker compose up --build
```

Once containers are up, open `http://localhost:3000/graphql`. The database starts empty — ingestion doesn't run automatically on boot (more on why below), so the first thing you need to do is trigger it manually:

```graphql
mutation {
  triggerIngestion {
    makeId
    makeName
  }
}
```

That call fetches makes from NHTSA, pulls vehicle types for each one, transforms and stores everything. It takes somewhere around 1-3 minutes depending on how NHTSA's API performance (it's a free public API and not always fast). Once it finishes, you can query the data:

```graphql
query {
  makes {
    makeId
    makeName
    vehicleTypes {
      typeId
      typeName
    }
  }
}
```

## Running locally without Docker

Useful if you want to iterate quickly with hot reload.

**Requirements:** Node 20+, npm, and a running Postgres instance (you can still use Docker just for the DB)

```bash
npm install
cp .env.example .env
```

Start Postgres in Docker if you don't have it installed natively:

```bash
docker run --name vehicle-catalog-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vehicle_catalog \
  -p 5432:5432 -d postgres:16
```

Then:

```bash
npm run start:dev
```

The app boots on `http://localhost:3000`, GraphQL playground at `/graphql`. Same as above, you need to run the `triggerIngestion` mutation before there's anything in `makes`

## Running tests

```bash
npm run test
```

Covers the XML parsing logic, the transformation logic (the part that turns raw NHTSA responses into the final shape), and the ingestion orchestrator, including failure scenarios like a make timing out or the makes list itself failing to load.

## Environment variables

All of these are validated on startup with Zod. If something required is missing or malformed, the app refuses to start and tells you exactly what's wrong instead of failing later in some confusing way at request time.

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `3000` | |
| `DB_HOST` | `localhost` | Set to `postgres` automatically inside Docker Compose |
| `DB_PORT` | `5432` | |
| `DB_USERNAME` | — | required |
| `DB_PASSWORD` | — | required |
| `DB_NAME` | — | required |
| `NHTSA_BASE_URL` | `https://vpic.nhtsa.dot.gov/api/vehicles` | |
| `NHTSA_REQUEST_TIMEOUT_MS` | `15000` | |
| `INGESTION_MAKES_LIMIT` | `50` | See ingestion section |
| `LOG_LEVEL` | `info` | `fatal` / `error` / `warn` / `info` / `debug` / `trace` |

## Data model

Two tables, a straightforward one-to-many relationship:

makes
- id uuid (PK)
- make_id string, unique ← NHTSA's own ID, kept separate from our PK
- make_name string

vehicle_types
- id uuid (PK)
- type_id string ← NHTSA's own ID
- type_name string
- make_id FK → makes.id, ON DELETE CASCADE

I didn't use NHTSA's own IDs as primary keys. If NHTSA ever reused or changed one, our schema won't depending on it. `make_id` and `type_id` are just regular unique-ish columns that happen to come from an external system.

Ingestion upserts by `make_id`, so re-running it doesn't create duplicates, it just updates existing makes and their vehicle types.

## GraphQL schema

Schema is code-first, generated from the TypeScript classes in `src/modules/vehicles/presentation/`, written out to `src/graphql/schema.gql` on boot

**Query**

```graphql
makes: [Make!]!
```

Returns everything currently stored. No pagination or filtering right now

**Mutation**

```graphql
triggerIngestion: [Make!]!
```

Runs the full ingestion pipeline on demand and returns the resulting catalog.

**Types**

```graphql
type Make {
  makeId: ID!
  makeName: String!
  vehicleTypes: [VehicleType!]!
}

type VehicleType {
  typeId: ID!
  typeName: String!
}
```

## The ingestion pipeline

**The problem:** NHTSA's `getallmakes` endpoint returns everything in one call (+12,000 makes). But getting vehicle types requires a separate request per make (`GetVehicleTypesForMakeId/{id}`). There's no bulk endpoint for that. So a "complete" ingestion means one bulk request plus +12,000 individual requests, sequentially, against a free public API with no documented rate limits

Running that in full every time you want to test the service locally would take a long time and be flaky. So `INGESTION_MAKES_LIMIT` (default 50) caps how many makes get processed per run. For this challenge, keeping it synchronous and capped keeps the setup "clone and run" simple, which felt like the right trade-off given the scope

**The flow, step by step:**

1. `NhtsaApiClient` fetches the raw makes XML (one request).
2. `XmlParserService` parses it into typed objects.
3. The first `INGESTION_MAKES_LIMIT` makes get sliced off.
4. For each of those, `NhtsaApiClient` fetches its vehicle types.
5. `VehicleCatalogTransformer` combines everything into the final shape.
6. `VehicleCatalogRepository` upserts it all into Postgres.

If a single make's vehicle-type request fails, that one make gets logged and persisted with an empty `vehicleTypes` array

## Error handling strategy

- **Config validation:** Wrong on startup, app won't boot
- **XML parsing:** Validated explicitly before parsing (via `XMLValidator`). Throws a domain-specific `XmlParsingError`.
- **HTTP calls to NHTSA:** Wrapped in a `NhtsaApiError` so callers don't have to know or care about axios internals.
- **Per-make ingestion failures:** Isolated, logged, don't cascade
- **Persistence failures:** Wrapped in `VehicleCatalogPersistenceError`
- **Anything that escapes a resolver unhandled:** Caught globally by `GraphqlExceptionFilter`.

## Logging

Structured JSON logging via Pino, wired in as a drop-in replacement for Nest's built-in logger

`LOG_LEVEL` controls verbosity. Auth headers and cookies are redacted if they ever show up in request logs.

Startup and shutdown are logged explicitly: `enableShutdownHooks()` lets Nest's lifecycle hooks run on `SIGTERM`/`SIGINT`

## Configuration approach

Schema: `src/config/env.schema.ts`, using Zod. Every other part of the app reads config through `ConfigService`. Anything with a sensible default declares one. Anything genuinely required doesn't, and validation fails on boot if it's missing, with a readable message pointing at exactly which field is the problem, not a generic crash.

## what I'd do differently for a bigger system

- **Ingestion is synchronous and capped, not queued.** Fine here, wouldn't be fine for the real 12k+ make dataset.
- **No pagination on `makes`.** Only matters once the dataset is actually large
- **Sequential vehicle-type fetching, not concurrent.** I don't want to hammer a free public API with parallel requests. If `INGESTION_MAKES_LIMIT` were much higher, this is the first thing I'd revisit, with proper concurrency limiting rather than unlimited parallelism