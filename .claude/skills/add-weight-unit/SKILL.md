---
name: add-weight-unit
description: Add a new weight unit (e.g. stone, g) to the Everfit workout API end to end — registry, validation, Swagger, tests and docs. Use when the user asks to support another unit for logging or for output conversion.
---

# Add a weight unit

Units are configuration, not code paths. Everything that accepts or converts units reads `src/units/units.config.ts`.

## 1. Get the exact factor

Find the exact definition in kilograms and write it as a decimal string, not a float literal:

| Unit | Definition | Factor string |
|---|---|---|
| lb | international avoirdupois pound | `'0.45359237'` |
| stone | 14 lb | `'6.35029318'` |
| g | 1/1000 kg | `'0.001'` |

Compute derived factors exactly (14 × 0.45359237 = 6.35029318). Do not round.

## 2. Failing tests

- `src/units/unit-registry.spec.ts`: `units` lists the new unit; `fromKg(<kg>, '<unit>')` returns the hand-computed value.
- `src/common/decimal.spec.ts` if the factor has more decimals than existing cases.
- `test/log-workouts.int-spec.ts`: logging `{ weight: 10, unit: '<unit>' }` stores `weight_kg` exactly (e.g. 10 stone → `63.5029318`).
- `test/history.int-spec.ts`: `?unit=<unit>` converts a kg set correctly.

## 3. Change

Add one line to `UNIT_FACTORS_TO_KG` in `src/units/units.config.ts`. Nothing else should need to change: DTO `@IsIn(SUPPORTED_UNITS)`, Swagger enums and `UnitRegistry` all derive from it. If anything else needs editing, that is a design smell; stop and report it.

## 4. Verify and document

```bash
npm test && npm run test:int
```

Update the README: request field docs (`unit ∈ kg | lb | <unit>`) and the extensibility paragraph. Commit as `feat: support <unit> as a weight unit`.
