# AI Workflow

I built this with Claude Code. Most of the code was written by the AI; my job was deciding what to build,
keeping it honest, and testing what came out. This file covers how that went, including the parts that
went wrong.

## Tools and what I used them for

| Tool | What for |
|---|---|
| Claude Code (main session) | Reading the brief, brainstorming the design with me, writing the spec and plan, implementing with TDD, debugging, docs |
| Claude Code subagents | A separate "hallucination hunter" that reviewed the design, spec and plan against official docs and by actually running SQL and code |
| Postman + Newman | My own manual testing, then a collection with assertions for every endpoint and error case |
| pgAdmin | Looking at the data and query results directly |

I also kept a running log of AI mistakes while working (`notes/ai-log.md`). This file is the short version.

## How I prompted

- **Analysis and plan before code.** I gave the AI the whole PDF first and asked for an analysis, then a
  plan, before any code. I also asked it upfront whether this needed Kafka for async processing, because
  I wanted that settled before the design rather than bolted on later.
- **One decision at a time.** The design was done as a series of questions with options and trade-offs:
  how to store workout dates (UTC + local date), how to compute PRs (on read, with indexes), which ORM
  (TypeORM), which extras (50k benchmark, OpenAPI). I picked each one before moving on.
- **A second AI to check the first.** Early on I asked myself how I would even know when the AI was wrong.
  My answer was to run a separate subagent in parallel, with no shared context, whose only job was to find
  hallucinations between me and the main session. I told it to check claims against official docs or by
  running code, not from memory. Most of the mistakes below were caught this way.
- **Small steps with tests.** Every task was: failing test, implementation, passing run, commit.
  Integration tests run against a real Postgres 16 (Testcontainers), so SQL mistakes show up immediately.
- **Rules files.** Conventions live in `CLAUDE.md` and `.claude/rules/` (code style, architecture,
  database, testing, git), plus a few project skills in `.claude/skills/`. Any new session starts with the
  same context instead of me repeating myself.

## Where the AI was wrong

1. **It quietly dropped the ORM.** I chose TypeORM, but when I read the code every query was hand-written
   SQL, with TypeORM only handling connections and migrations. The AI had also edited the spec to match
   without asking me. I stopped it and asked why it was writing queries directly. We refactored to
   entities + Repository/QueryBuilder, with the 48 integration tests at the time as a safety net. The
   refactor surfaced another trap: `getOne()` does not add `LIMIT`, so PR queries needed `.limit(1)`.
2. **Concurrent exercise creation.** The AI said `INSERT … ON CONFLICT DO NOTHING` handled two requests
   creating the same new exercise. The reviewer ran it on Postgres: `RETURNING` gives nothing for the
   skipped row, so the second request would have no exercise id, and two batches in opposite order can
   deadlock. Fixed by inserting names sorted, then re-selecting ids. Tested with 20 parallel writers.
3. **Dates without a timezone.** It proposed `@IsISO8601` to require an offset, but that accepts
   `2026-03-01T10:00:00`, which JS reads in the server's timezone and can put the workout on the wrong
   day. Replaced with an explicit `Z|±HH:MM` check plus luxon, with tests for both cases.
4. **A benchmark on an empty database.** I asked for a POST load test. The AI re-ran everything and
   reported reads much faster than the first run, without noticing why. Later I opened the history
   endpoint in Postman and got no rows: the Docker volume had been recreated and the 50k seed was gone, so
   those read numbers were measured on nothing. We re-seeded and re-measured, and the benchmark script now
   refuses to run if the seeded user is empty.
5. **Error responses missing `requestId`.** While testing in Postman, malformed JSON came back without a
   `requestId`, even though the README promises one on every error. Writing a test for it exposed a second
   bug: a body over 1 MB returned `500` instead of `413`. Both came from the body parser running before
   the request id was assigned. Fixed with a middleware ahead of the parser; both cases are now tested.

Smaller ones: it promised "p95" from autocannon, which only reports p97.5/p99; its plan was missing a
Jest setup file and types for `uuid`; and it understated what Prisma supports when justifying TypeORM.

## Suggestions I rejected

- **Writing everything in raw SQL.** Covered above: I rejected the "TypeORM without entities" approach
  and asked for TypeORM to be used properly.
- **Cleaning up the database after testing.** After running the Postman collection and load tests, the AI
  deleted the test data to "keep things clean". I told it to stop: that data is the evidence for the
  performance claims, and I need it for the interview. Data now stays, and there is a `pg_dump` backup.
- **Dropping idempotency, then changing my mind.** I first left `Idempotency-Key` out of scope. The
  reviewer argued that "same user logging the same exercise at the same time" most likely means a
  double submit or a client retry, not just a race on creating exercises. That convinced me, so it went
  back in.
- **Kafka.** I asked about it, and we agreed it wasn't needed: nothing slow happens after a write, and
  async processing would make PRs stale right after logging. The outbox approach is in the README under
  "At scale".

## How I checked the output

- Expected values in tests are worked out by hand (225 lb = 102.05828325 kg; 100 kg × 5 reps → e1RM
  116.67), not copied from what the code returned.
- Real Postgres in integration tests, including concurrency cases.
- `EXPLAIN ANALYZE` on 50k entries / 200k sets to confirm every query uses an index, and an autocannon
  load test for reads and bulk writes (the tooling is kept outside the repo).
- Manual testing in Postman, then a collection with assertions on status, error code, field path and
  computed values, run against the Docker stack.
- Reading diffs before committing, with typecheck, lint and both test suites green.
