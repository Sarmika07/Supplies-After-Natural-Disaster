# Requirements traceability

| Requirement | Implementation | Evidence |
|---|---|---|
| Rapid replanning interface | Simulation drawer + reports + decision trace | `client/src/pages/Home.tsx` |
| Last-minute cancellation | `cancellation` disruption | `shared/replanner.ts`, UI Disruptions |
| Urgent addition | New S-15 generated at disruption time | `makeDisruption()` |
| Vehicle unavailable | V-07 hard removal from feasible fleet | `applyDisruption()` |
| Current route progress | Route index, completed distance, remaining distance, ETA | `data/routes.csv` |
| Capacities | Vehicle capacity and hard feasibility | `data/vehicles.csv`, `feasibleRoute()` |
| Driver locations | Lat/lon snapshot | `data/drivers.csv` |
| Commitments | Stop commitment and deadlines | `data/stops.csv` |
| Limited infrastructure | Local-first deterministic planner | `docs/architecture.md` |
| Baseline | Nearest-feasible append planner | `baselineAssign()` |
| Multi-objective trade-offs | Service/cost/distance/emissions/reliability/stability | `OBJECTIVE_WEIGHTS` |
| Recovery time | Runtime around deterministic planning function | `elapsedMs`, benchmark artifact |
| At least 3 failure cases | 6 benchmark cases | `scripts/run-experiments.ts` |
| Error analysis | Explicit infeasible escalation | `docs/experiments.md` |
| Architecture diagram | Mermaid architecture | `docs/architecture.md` |
| Data schema | CSV + optional Drizzle schema | `docs/data-schema.md`, `drizzle/schema.ts` |
| Risk register | Operational risk and mitigation table | `docs/risk-register.md` |
| User guide | Dispatcher workflow | `docs/user-guide.md` |
| Reproducibility | Commands and deterministic data | `docs/reproducibility.md` |
| Validation | Prototype walkthrough and field validation protocol | `docs/validation.md` |

## Evidence honesty rule

No external stakeholder interview or field deployment is claimed unless it is actually performed. The Validation screen is therefore presented as a reproducible prototype acceptance walkthrough, while `docs/validation.md` contains the protocol for a real 3–5 dispatcher study.
