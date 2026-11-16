---
paths:
  - "src/**/*.spec.ts"
  - "test/**"
---

# Testing

## Loop

1. Write the failing test with expected values computed by hand (write the arithmetic in the test name or fixture, e.g. `225 lb → 102.05828325 kg`).
2. Run it and see it fail for the right reason.
3. Implement the minimum to pass.
4. Run the whole suite: `npm test && npm run test:int`.
5. Commit.

## Where a test goes

| Behaviour | Test type | Location |
|---|---|---|
| Pure function (dates, cursor, decimal, PR shaping, hashing) | unit | `src/**/<name>.spec.ts` next to the file |
| DTO validation rules and error paths | unit with `plainToInstance` + `validate` | `src/**/dto/*.spec.ts` |
| Anything touching SQL, transactions, concurrency, HTTP status/shape | integration | `test/<feature>.int-spec.ts` |

Do not mock the database. Integration tests run on real Postgres 16 via Testcontainers (`test/setup/global-setup.ts`).

## Integration test conventions

- `createTestApp()` boots the real `AppModule` with `configureApp()`; `resetDatabase(app)` truncates and re-seeds the catalog in `beforeEach`.
- Exercise names in fixtures must not collide with `config/exercises.json` unless the test relies on the catalog.
- Concurrency: fire requests with `Promise.all` and assert on final row counts, not timing.
- Assert the full error envelope (`error.code`, `error.details[].path`) for validation cases.
- Compare JSON that went through `jsonb` with `toEqual`, never string equality.

## What every feature needs

- Happy path with hand-computed numbers.
- Each validation rule rejecting with the right `path`.
- Empty result returns `200` + `message`.
- Unit conversion both ways.
- A concurrency or rollback test when the feature writes.
