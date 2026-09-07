# ReliefRoute — Rapid Replanning & Dispatch Recovery

ReliefRoute is a field-ready emergency operations dashboard prototype for disaster-relief dispatchers. It helps a dispatcher understand the current fleet state, inject a last-minute disruption, run a weighted recovery plan, and compare operational outcomes.

## What is included

- Feminine operations UI with a blush, plum, coral, mint, and warm-paper visual system.
- Persistent dashboard shell with Overview, Live operations, Dispatch plan, Disruptions, and Reports & KPIs views.
- Synthetic disaster-relief dataset rendered directly in the prototype: routes, drivers, vehicles, stops, priorities, commitments, and route progress.
- Disruption simulation drawer for road disruptions, vehicle unavailability, urgent requests, and cancellations.
- Measured plan recovery time from disruption injection to a valid proposed plan.
- Replanning decision explanation that protects completed and in-progress work, updates an at-risk route, and reports capacity/commitment checks.
- Map-like SVG route network with active route highlighting and live position context.
- KPI report cards for recovery time, protected commitments, avoided distance, emissions, and fleet utilization.
- Unit tests for measured recovery time and weighted plan scoring.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open the local preview URL printed by the dev server.

## Validate

```bash
pnpm check
pnpm test
pnpm build
```

The current prototype keeps the scenario data and replanning simulation client-side so it is immediately usable in preview mode. The WebDev scaffold also includes the server, database, storage, and Manus OAuth foundations for a later persistent operational dataset.
