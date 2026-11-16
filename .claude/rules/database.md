---
paths:
  - "src/database/**"
  - "src/**/*.repository.ts"
  - "src/**/*.store.ts"
  - "scripts/**/*.sql"
---

# Database

## Schema changes

- Schema is owned by hand-written migrations in `src/database/migrations/`. `synchronize` stays `false`.
- A schema change = new migration file (`<timestamp>-<Name>.ts`, registered in `typeorm.config.ts`) + matching entity change. Never edit a migration that has shipped.
- Generated columns are declared in the entity with `generatedType: 'STORED'`, `asExpression` identical to the migration, and `insert: false, update: false`.
- Arithmetic on integer columns divides as integers: write `reps / 30.0`, not `reps / 30`.

## Types

- `numeric` columns are `string` in entities. Convert to `number` only for display.
- `date` columns arrive as `YYYY-MM-DD` strings (`registerPgTypeParsers`); keep them as strings.
- `timestamptz` → `Date`. When microseconds matter (cursors), select `to_char(col AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`.

## Queries

- Use Repository methods or QueryBuilder. Raw SQL is allowed only in migrations, the health ping and benchmark scripts.
- `getOne()` does not add `LIMIT`; always add `.limit(1)` when you only need one row.
- Use property paths (`e.localDate`) in QueryBuilder; bind every value as a parameter, never interpolate input.
- Cast parameters with `CAST(:p AS type)`, not `:p::type` (TypeORM can misparse `::`).
- Every new query path needs an index that matches its `WHERE` + `ORDER BY`. Confirm with `npm run bench:explain` on the 50k seed; no `Seq Scan` on `workout_sets` or `workout_entries`.
- Pagination is keyset on `(local_date, performed_at, id)`; never `OFFSET`.

## Writes and concurrency

- Multi-row inserts go through `manager.insert` in chunks (`SET_INSERT_CHUNK = 1000`) to stay below Postgres' 65,535 bind parameters.
- IDs are UUIDv7 generated in the app; never rely on `RETURNING` order.
- "Create if missing": sort keys, `insert().orIgnore()`, then re-select. `RETURNING` is empty for skipped rows.
- Idempotency keys are claimed first inside the write transaction (READ COMMITTED) so concurrent duplicates wait on the unique index.
- `jsonb` reorders object keys; compare stored JSON structurally.
