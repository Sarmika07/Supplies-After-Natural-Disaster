# Why the chosen approach is appropriate

Relief operations after a disaster have three characteristics that make a transparent heuristic suitable for this MVP: data is incomplete, decisions must be made quickly, and a dispatcher needs to understand why a route changed.

## Why not a full optimisation stack?

A production vehicle-routing solver, live GIS traffic feed and streaming GPS architecture would increase operational dependencies and make a small reproducible evaluation harder. The brief explicitly permits simulated/open data and does not assume unlimited infrastructure.

## Why constraint-first insertion?

The planner first filters vehicles using hard constraints:

- vehicle availability;
- driver availability;
- remaining payload capacity;
- fuel reserve;
- driver shift end.

It then searches insertion positions and ranks feasible candidates using service priority, deadline risk, route stability and incremental travel. This gives a fast, explainable recovery plan while leaving a clear seam for a CP-SAT/VRP solver later.

## Why multi-objective scoring?

Distance-only optimisation can move a critical delivery to a vehicle that is operationally undesirable. ReliefRoute therefore publishes six dimensions: service, cost, distance, emissions, reliability and stability. The weights are governance assumptions, not universal truths, and should be reviewed with dispatchers.

## What happens when the problem is impossible?

The planner does not fabricate success. It returns `unassignedStops` and a decision-trace escalation. In relief logistics this is safer than silently violating capacity or deadlines.
