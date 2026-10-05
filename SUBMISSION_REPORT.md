# ReliefRoute submission report

## Problem

Relief dispatchers currently rebuild delivery plans manually after last-minute cancellations, urgent additions and vehicle failures. The project implements a rapid replanning interface and a reproducible planning engine that works from a bounded synthetic operational snapshot.

## What is delivered

- working dispatcher UI;
- deterministic synthetic dataset;
- baseline repair planner;
- adaptive insertion replanner;
- hard capacity/fuel/shift constraints;
- cancellation, urgent-addition, vehicle-breakdown, road-closure and capacity-shortage flows;
- infeasible stress test with explicit escalation;
- recovery-time measurement;
- cost/service/emissions/reliability/stability comparison;
- automated test suite;
- benchmark CSV/JSON artifacts;
- architecture, assumptions, schema, rationale, risk register, user guide, validation protocol and traceability.

## Headline measured evidence

| Measure | Result |
|---|---:|
| Benchmark cases | 6 |
| ReliefRoute cases under 2 s | 6/6 (100%) |
| Average ReliefRoute planner time | 0.82 ms |
| Manual recovery reference | 480 s (8 min) |
| Average service across benchmark cases | 88.9% |
| Average protected commitments | 100% |
| Explicit infeasible escalations | 1/6 |

The infeasible case intentionally has 33.3% service and 10 unassigned stops because the remaining fleet cannot satisfy the demand. This is a safety result, not a hidden failure.

## Representative improvement

In the vehicle-breakdown case, ReliefRoute reduced:

- route distance from 70.6 km to 69.9 km (-1.0%);
- cost from $105.80 to $104.10 (-1.6%);
- emissions from 58.2 kg to 57.2 kg (-1.7%);
- route changes from 3 to 2;
- while preserving 100% service and 100% protected commitments.

The road-closure and capacity cases demonstrate that the adaptive planner may accept a modest distance/cost/emissions increase when that is the safer/stabler feasible choice. The project therefore does not claim distance-only optimisation.

## Evidence boundary

No external stakeholder interview, live field deployment or live GPS feed is fabricated. The repository includes a reproducible prototype acceptance walkthrough and a protocol for a real 3–5 dispatcher validation study.

## Reproduction

```bash
pnpm install
pnpm check
pnpm test
pnpm experiment
pnpm build
```
