---
paths:
  - "src/**/*.ts"
---

# Architecture

## Layering

Each feature module (`exercises`, `workouts`, `records`, `health`) owns its own `controller → service → repository`.

- **Controller:** HTTP only. Bind `@Param() UserIdParamDto`, `@Body()`/`@Query()` DTOs, headers; call one service method; set status/headers. No business logic, no repository access.
- **Service:** business rules, cross-field validation (e.g. `from <= to`), unit conversion, response shaping, transactions (`dataSource.transaction('READ COMMITTED', …)`).
- **Repository:** the only layer that talks to TypeORM. Injects `Repository<Entity>` via `@InjectRepository` or receives an `EntityManager` inside a transaction. Speaks domain language (`ensureExist`, `findBest`), not SQL.
- **Pure helpers** (`insert-plan.ts`, `records-summary.ts`, `history-cursor.ts`, `workout-date.ts`) have no Nest or DB imports and are unit tested directly.

Other modules depend on `ExercisesRepository` through `ExercisesModule` exports, never on its entity directly.

## Errors

- Throw `AppException(status, ErrorCode.X, message, details?)` or `validationFailed(details)` for every expected failure. Add new codes to `src/common/errors/error-codes.ts` and to the README error table.
- Never return an error body by hand; `AllExceptionsFilter` produces `{ error: { code, message, details }, requestId }` for everything.
- Unexpected errors surface as `500 INTERNAL_ERROR` with no internals in the body; the filter logs them.
- Validation details use bracketed paths: `entries[1].sets[0].weight`.

## Validation

- Every input is a DTO validated by the global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Nested arrays need `@ValidateNested({ each: true })` + `@Type(() => Child)` + `@ArrayMinSize/MaxSize`.
- Dates use `@IsWorkoutDate()` / `@IsCalendarDate()`; never `@IsISO8601` (it accepts offset-less datetimes).
- Units use `@IsIn(SUPPORTED_UNITS)`.

## Domain rules that must not drift

- **Units:** defined only in `src/units/units.config.ts` as exact decimal strings to kg. Everything else asks `UnitRegistry`.
- **Dates:** store `performed_at` (UTC) + `local_date` + `utc_offset_minutes`. Filter and group by `local_date`. Offset-less datetimes are rejected.
- **PRs:** computed on read from `workout_sets`; ties go to the earliest `performed_at`, then `id`. Epley is `weight × (1 + reps/30)` for all reps.
- **Muscle groups:** live in `config/exercises.json`, seeded on boot. Never hard-code them in services.
- **Bulk writes:** all-or-nothing in one transaction. Exercise names are upserted before the transaction, sorted.

## Responses

- Plain objects shaped by mapper functions (`toLoggedResponse`, `buildPeriodRecords`), never entities.
- Lists: `{ data, meta: { limit, nextCursor, message? } }`. Empty results are `200` with a `message`, not errors.
