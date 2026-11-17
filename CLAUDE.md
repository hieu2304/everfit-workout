# Everfit Workout Logging API

NestJS 10 + PostgreSQL 16 + TypeORM 0.3 API for logging workouts, browsing history and computing personal records. See `README.md` for the API contract and design decisions.

## Commands

| Task | Command |
|---|---|
| Run everything | `docker compose up --build` (API :3000, docs `/docs`, Postgres on host :5433) |
| Dev server | `cp .env.example .env && docker compose up -d db && npm run start:dev` |
| Unit tests | `npm test` |
| Integration tests | `npm run test:int` (Testcontainers, needs Docker) |
| Lint / format | `npm run lint` / `npm run format` |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` |

Definition of done for any change: typecheck, lint, `npm test` and `npm run test:int` all green.

## Map

```
src/common/       AppException + ErrorCode, global filter, date parsing, validators, decimal math
src/config/       Joi env schema (boot fails on invalid env)
src/database/     entities, hand-written migration, pg type parsers
src/units/        UnitRegistry — the only place weight units are defined
src/exercises/    catalog, name normalization, seeder (config/exercises.json)
src/workouts/     POST bulk logging, idempotency, GET history
src/records/      personal records + period comparison
test/             integration tests (*.int-spec.ts) + Testcontainers harness
```

## Rules

Detailed rules live in `.claude/rules/` and are loaded automatically:

- `code-style.md` — TypeScript style, naming, no comments
- `architecture.md` — module layering, error envelope, units, dates
- `database.md` — entities vs migrations, indexes, queries, concurrency
- `testing.md` — TDD loop, what goes in unit vs integration tests
- `git.md` — commit format and granularity

## Skills

Project skills in `.claude/skills/`:

- `add-endpoint` — add a route following the project's layering and error model
- `add-weight-unit` — add a unit (e.g. stone) end to end
- `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt` — smallest-change discipline and reviews (third-party, MIT)
- `nestjs-patterns` — general NestJS reference (third-party, MIT); project rules win where they differ
