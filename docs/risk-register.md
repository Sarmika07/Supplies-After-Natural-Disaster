# Risk register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Stale driver GPS | Medium | High | Show data timestamp; require dispatcher confirmation before apply | Dispatcher |
| Incorrect vehicle capacity | Medium | Critical | Hard capacity constraint + validation on ingest | Operations |
| Road status changes again | High | High | Treat closures as short-lived scenario inputs; allow re-run | Dispatcher |
| No feasible vehicle | Medium | Critical | Explicit escalation list; never silently drop demand | System |
| Planner becomes slow as fleet grows | Medium | High | Time budget, bounded candidate search, later swap in CP-SAT/VRP | Engineering |
| Weighting favours distance over service | Medium | High | Service is 40%; expose all KPI trade-offs and allow governance review | Operations |
| Driver rejects reassignment | Medium | Medium | Penalise handoffs; require approval workflow in production | Dispatcher |
| Synthetic data does not match field reality | High | High | Pilot validation with dispatchers and replay real historical snapshots | Product |
