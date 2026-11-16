---
name: add-endpoint
description: Add or change an HTTP endpoint in the Everfit workout API following its layering, validation, error envelope, Swagger and test conventions. Use when the user asks for a new route, a new query parameter or filter, or a change to a request/response shape.
---

# Add an endpoint

Follow `.claude/rules/architecture.md`, `database.md` and `testing.md`. Steps in order; commit at the end.

## 1. Pin the contract first

Write down, before code:
- Method + path under `users/:userId/...` (userId validated by `UserIdParamDto`).
- Request DTO fields with limits; which fields are optional and their defaults.
- Success response shape (`{ data }` or `{ data, meta }`) and status.
- Every error: status + `ErrorCode` + `details[].path`. Reuse existing codes; add new ones to `src/common/errors/error-codes.ts`.
- Empty-result behaviour (`200` + `message`, never `404` for "no rows").

## 2. Failing integration test

Create or extend `test/<feature>.int-spec.ts`:
- happy path with hand-computed values,
- one case per validation rule asserting `error.code` and the `path`,
- empty result,
- unit conversion if weights are returned.

Run `npx jest -c test/jest-int.json --runInBand <feature>` and confirm it fails (404 or assertion).

## 3. Implement, outside in

1. DTO in `src/<feature>/dto/` with class-validator decorators; nested arrays need `@ValidateNested({ each: true })` + `@Type`.
2. Controller method: thin, `@ApiTags` on the class, `@ApiHeader` for custom headers.
3. Service method: cross-field validation via `validationFailed([...])`, domain errors via `AppException`, unit conversion via `UnitRegistry`, mapping to plain response objects.
4. Repository method using Repository/QueryBuilder; add `.limit(1)` for single rows; parameters always bound.
5. If a new query shape: add an index in a new migration + entity metadata, then check `npm run bench:explain`.
6. Pure logic (parsing, shaping, math) goes in a dependency-free file with its own `*.spec.ts`.
7. Register providers/controllers in the module; import `TypeOrmModule.forFeature([...])` for new entities.

## 4. Verify

```bash
npm run format && npm run lint && npx tsc --noEmit -p tsconfig.json && npm test && npm run test:int
```

Then update `README.md`: endpoint section with an example request/response and any new error code row.

## 5. Commit

`feat: <what the endpoint does>`; body explains any non-obvious query or validation choice.
