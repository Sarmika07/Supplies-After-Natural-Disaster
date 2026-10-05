# Submission completion checklist

| Item | Status | Evidence |
|---|---|---|
| Working dispatcher UI | Complete | `client/src/pages/Home.tsx` |
| Cancellation flow | Complete | Simulation drawer + replanner |
| Urgent addition flow | Complete | S-15 generated on disruption |
| Vehicle unavailable flow | Complete | V-07 hard removal |
| Current route progress | Complete | Live Operations + `data/routes.csv` |
| Capacities | Complete | `data/vehicles.csv` + hard constraint |
| Driver locations | Complete | `data/drivers.csv` |
| Commitments | Complete | `data/stops.csv` |
| Baseline | Complete | nearest-feasible append |
| Adaptive planner | Complete | insertion search + weighted decision score |
| Cost KPI | Complete | route distance × vehicle cost factor |
| Service KPI | Complete | assigned deliverable stops |
| Emissions KPI | Complete | route distance × CO₂ factor |
| Reliability KPI | Complete | late + infeasibility penalties |
| Stability KPI | Complete | route-change penalty |
| Recovery-time benchmark | Complete | benchmark JSON/CSV |
| 3+ failure cases | Complete | 6 benchmark cases |
| Error analysis | Complete | infeasible overload case |
| Architecture | Complete | Mermaid diagram |
| Data schema | Complete | CSV schema + Drizzle schema |
| Risk register | Complete | `docs/risk-register.md` |
| User guide | Complete | `docs/user-guide.md` |
| Reproducibility | Complete | `docs/reproducibility.md` |
| Decision rationale | Complete | `docs/decision-rationale.md` |
| Requirement traceability | Complete | `docs/requirements-traceability.md` |
| Stakeholder validation protocol | Complete | `docs/validation.md` |
| External field-user study | Not claimed | Must be performed by project team |

## Important evidence boundary

The project is designed so an evaluator can reproduce the technical claims locally. It does not invent external interviews, field deployment or live operational data that were not actually supplied.
