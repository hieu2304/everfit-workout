# AI log (raw notes → distilled into AI_WORKFLOW.md)

| # | Phase | What I asked | What AI produced | Problem | How caught | Fix / decision | Commit |
|---|---|---|---|---|---|---|---|
| 1 | Design | Do we need Kafka for async processing? | Recommended no Kafka | — (evaluated) | Reasoned on read-time PRs + consistency | No broker; outbox described in README "at scale" | spec |
| 2 | Design | Justify ORM choice | "Prisma can't do generated columns or trigram indexes" | Trigram part false: Prisma supports `ops: raw("gin_trgm_ops")` | Independent reviewer agent checked Prisma docs | Justification limited to generated columns | spec |
| 3 | Design | Concurrent exercise creation | `INSERT ... ON CONFLICT DO NOTHING` "handles it" | `RETURNING` empty on conflict → no id; opposite-order inserts can deadlock | Reviewer ran it on Postgres 16 (PGlite) | Sorted upsert in short tx + follow-up SELECT | spec |
| 4 | Design | Validate datetime with offset | `@IsISO8601` | Accepts `2026-03-01T10:00:00` (no offset) → server-TZ parse | Reviewer tested class-validator 0.14.1 | Regex for `Z|±HH:MM` + luxon `setZone` | spec |
| 5 | Design | Epley for reps = 1 | AI proposed e1RM = weight for 1 rep | Deviates from formula stated in the brief | Reviewer compared against PDF | Rejected; literal formula, convention noted in README | spec |
| 6 | Design | Concurrency edge case | AI first treated it as exercise-creation race | Brief most likely means duplicate submit/retry | Reviewer re-read requirement | Added Idempotency-Key | spec |
| 7 | Design | Benchmark target | "p95 < 50 ms with autocannon" | autocannon reports p97.5/p99, no p95 | Audit agent checked autocannon README | Target p99, report p50/p97.5/p99 | plan |
| 8 | Chat | Explain the "bỏ" confusion | AI said "bỏ" referred to Kafka | False: its own question wrongly said I had dropped Idempotency-Key | Audit agent read transcript | Corrected in chat | — |
| 9 | Task 1 | Unit tests per plan | Plan omitted Jest `setupFiles: ["reflect-metadata"]` | `@Type` crashed: `Reflect.getMetadata is not a function` | Running the test | Added setupFiles to unit and int Jest configs | task 1 |
| 10 | Task 7 | Use `uuid@10` per plan | Assumed uuid 10 ships types | TS7016: no declaration file for `uuid` | ts-jest compile error | Added `@types/uuid@10` | task 7 |
| 11 | Task 12 | Concurrent idempotency test per plan | Compared bodies with `JSON.stringify` set size | jsonb reorders keys, so replayed bodies stringify differently | Audit agent ran the code on PGlite | Compare with `toEqual` against the first response | task 12 |
