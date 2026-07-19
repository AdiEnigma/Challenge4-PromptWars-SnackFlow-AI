# SnackFlow AI — Database Layer

Standalone multi-database module for SnackFlow AI, sitting outside `frontend/`
and `backend/`. It owns connection management, schemas, migrations, and seeding
for the three databases described in `database-guide.md`.

```
database/
├── config.ts                  # env-based connection config (PG / Redis / Influx)
├── logger.ts                  # minimal leveled console logger
├── index.ts                   # connectDatabases() / initPostgresSchema() entry points
├── postgres/
│   ├── client.ts              # pg Pool + transactions + health ping
│   ├── schema.sql             # full idempotent schema (users, stalls, ...)
│   └── migrations/
│       └── 001_initial_schema.sql
├── influxdb/
│   └── client.ts              # bucket ensure + typed measurement builders
├── redis/
│   ├── client.ts              # ioredis client + connect/ping
│   └── cache.ts               # TTL keys, pub/sub channels
└── scripts/
    ├── run-migrations.ts      # applies postgres migrations
    ├── seed.ts                # dev data seed
    └── setup-influx.ts        # ensures Influx bucket
```

## Architecture

| Database     | Role            | Managed here                              |
|--------------|-----------------|-------------------------------------------|
| PostgreSQL   | Structured data | `postgres/` — schema + migrations + pool  |
| InfluxDB     | Time-series     | `influxdb/` — bucket + measurement schemas|
| Redis        | Cache + pub/sub | `redis/` — TTL keys + channels            |

### PostgreSQL tables
`users`, `stalls`, `food_items`, `stall_food_items`, `inventory`, `queue_data`,
`match_context` (per `database-guide.md`). Indexes and FK constraints included.

### InfluxDB measurements
`demand_forecasts`, `swipe_aggregated`, `lost_sales`, `prediction_accuracy`
— tags/fields from the guide, with a 30-day default retention.

### Redis cache keys & TTL
`session:{user_id}` (8h), `forecasts:stall:{stall_id}` (3m),
`translation:{text_hash}:{language}` (1h), `queue:stall:{stall_id}` (2m),
`inventory:stall:{stall_id}` (1m). Pub/Sub channels: `heatmap_update`,
`stall_update:{stall_id}`, `stadium_update`, `alert:{stall_id}`.

## Setup

```bash
cd database
npm install
cp ../backend/.env.example .env   # or set vars in your environment

# 1. Create PostgreSQL schema (idempotent)
npm run migrate

# 2. Ensure InfluxDB bucket
npm run setup:influx

# 3. Load development data
npm run seed
```

## Usage (from application code)

```ts
import { connectDatabases, initPostgresSchema, pool, redis, cache } from './database';

await initPostgresSchema();      // create/update PostgreSQL schema
await connectDatabases();        // open + verify all connections

const u = await pool.query('SELECT * FROM users');
await cache.cacheSet(cache.KEYS.forecasts('stall-1'), [...], cache.TTL.FORECAST);
```

Environment variables are identical to those documented in
`backend/.env.example` (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`,
`PGDATABASE`, `REDIS_*`, `INFLUX_*`).
