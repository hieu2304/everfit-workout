# Git

## Commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `perf:`, `build:`, `docs:`, `chore:`.
- Subject in imperative mood, lower case, no period, ≤ 72 chars: `feat: add keyset pagination to workout history`.
- Body (when the change is not obvious) explains **why**, wrapped at 72: the constraint, the trap avoided, the trade-off. This is where reasoning goes instead of code comments.
- One logical change per commit, and every commit leaves typecheck, lint and tests green.
- No AI attribution trailers (`Co-Authored-By: Claude`, "Generated with …").

## Before committing

```bash
npm run format && npm run lint && npx tsc --noEmit -p tsconfig.json && npm test && npm run test:int
```

## Never commit

`.env`, `dist/`, `coverage/`, `node_modules/`, benchmark scratch data.
