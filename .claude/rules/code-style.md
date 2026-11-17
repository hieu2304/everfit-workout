---
paths:
  - "src/**/*.ts"
  - "test/**/*.ts"
---

# Code style

## TypeScript

- `strict` is on. No `any`; use `unknown` and narrow. No non-null `!` outside DTO/entity property declarations.
- Standalone helpers are arrow functions: `export const parseWorkoutDate = (input: string) => { … }`. Use `class` only where Nest or TypeORM needs one (modules, controllers, providers, DTOs, entities, exceptions).
- Prefer `const`. Use `let` only when reassignment is the clearest option (e.g. a pagination loop).
- Return early instead of nesting. Keep functions to one job.
- Explicit return types on exported functions and public methods (decorator factories excepted).
- Imports: node built-ins first (`node:crypto`), then packages, then relative. No barrel files except `src/database/entities/index.ts`.

## Comments

- No explanatory comments in code. Names and small functions carry the meaning.
- The reasoning behind a non-obvious choice goes in the commit message body, and in `README.md` when it is a design decision.
- This overrides the `ponytail` skill's "comment the why" and `shortcut:` markers: record shortcuts in README "At scale" instead.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case, role suffix | `workout-history.service.ts`, `log-workouts.dto.ts` |
| Classes | PascalCase + role | `WorkoutHistoryRepository`, `RecordsQueryDto` |
| Functions/vars | camelCase verbs for functions | `buildInsertPlan`, `toLoggedResponse` |
| Constants | UPPER_SNAKE for module-level constants | `SET_INSERT_CHUNK`, `MAX_FUTURE_MS` |
| DB columns | snake_case; entity properties camelCase with `name:` mapping | `weight_kg` ↔ `weightKg` |
| Error codes | UPPER_SNAKE in `ErrorCode` | `EXERCISE_NOT_FOUND` |

## Numbers and money-like values

- Weights are decimal strings end to end until display. Never multiply weights as JS floats; use `multiplyDecimals` from `src/common/decimal.ts`.
- Round only at the response boundary with `round2`.

## Formatting

Prettier (`.prettierrc`: single quotes, trailing commas, width 100) and ESLint (`typescript-eslint` recommended). Run `npm run format` before committing.
