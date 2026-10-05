# Reproducibility

The benchmark uses a deterministic synthetic operational snapshot. No live GPS, paid map API, solver cluster or database is required.

## Commands

```bash
pnpm install
pnpm check
pnpm test
pnpm experiment
pnpm build
```

## Expected artifacts

- `artifacts/benchmark-results.csv` — row-level case results
- `artifacts/benchmark-results.json` — results plus aggregate summary

## Determinism

The scenario, disruption definitions, constraint rules and objective weights are fixed in source. Planner runtime can vary by CPU, so exact milliseconds are not used as a correctness assertion; the acceptance target is `<2 seconds`.

## Optional persistence

The Drizzle/MySQL schema is included for a production migration path, but the demo and benchmark do not depend on a running database.
