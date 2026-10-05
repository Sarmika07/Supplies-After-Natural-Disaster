# ReliefRoute — rapid replanning for disaster-relief dispatch

ReliefRoute is an end-to-end MVP for a relief organisation that must recover a delivery plan after last-minute cancellations, urgent additions, road closures and vehicle breakdowns.

## Project status

**Technical MVP: complete and reproducible.** The repository includes the dispatcher interface, operational dataset, baseline, adaptive replanning engine, benchmark experiment, automated tests, documentation and optional persistence schema.

The only evidence item intentionally not fabricated is external field-user research. The Validation screen and `docs/validation.md` provide a reproducible acceptance walkthrough and a protocol for a real 3–5 dispatcher study.

## Implemented

- Functional dispatcher UI: Overview, Live Operations, Dispatch Plan, Disruptions, Reports & KPIs and Validation.
- Synthetic operational snapshot with route progress, driver locations, vehicle capacity/fuel/cost/CO₂, commitments, deadlines and priorities.
- Five dispatcher-facing disruption states plus an infeasible stress case.
- Real deterministic replanning engine with hard capacity, fuel-reserve and shift constraints.
- Completed-stop protection and unavailable-vehicle exclusion.
- Simple nearest-feasible append baseline.
- Adaptive insertion search with deadline, priority, stability and multi-objective trade-off scoring.
- Quantified service, commitments protected, distance, cost, emissions, late stops, reliability, stability and utilisation.
- Explicit escalation for infeasible demand.
- Actual planner runtime measurement with a `<2 second` target and an 8-minute manual recovery reference.
- Automated tests for the core failure modes.
- Reproducible CSV/JSON benchmark for six cases.
- Architecture, schema, assumptions, rationale, experiments, risk register, user guide, validation and requirement traceability.
- Optional Drizzle/MySQL operational schema; benchmark remains database-independent.

## Run

```bash
pnpm install
pnpm dev
```

## Validate

```bash
pnpm check
pnpm test
pnpm experiment
pnpm build
```

`pnpm experiment` writes:

- `artifacts/benchmark-results.csv`
- `artifacts/benchmark-results.json`

## Baseline and recovery time

The algorithmic baseline is a nearest-feasible append repair policy. For operational context, the project also uses an explicit **8-minute manual rebuild reference** for this small four-route scenario. ReliefRoute measures wall-clock planner runtime and targets `<2 seconds`.

## Data policy

The demo uses synthetic operational data only. No external API, live GPS service, paid map service or unlimited infrastructure is required.

## Evidence map

See `docs/requirements-traceability.md` and `docs/completion-checklist.md` for a requirement-by-requirement audit.
