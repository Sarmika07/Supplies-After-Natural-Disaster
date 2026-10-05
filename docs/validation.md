# Validation

## Prototype acceptance walkthrough

The current repository includes a reproducible dispatcher walkthrough in the **Validation** screen. It checks the critical workflow without claiming external field research:

1. Inject a vehicle breakdown.
2. Inspect the proposed replacement routes.
3. Read the decision trace explaining why a vehicle/position was selected.
4. Check capacity, service, protected commitments and unassigned work.
5. Compare the adaptive plan with the baseline.

Acceptance criteria:

- completed stops remain unchanged;
- unavailable vehicles are not selected;
- route load never exceeds capacity;
- infeasible demand is explicitly escalated;
- reports expose time, service, distance, cost, emissions and reliability.

## External stakeholder validation protocol

A real deployment decision should include 3–5 dispatchers. Ask each participant to complete the same five tasks and record:

| Measure | Target |
|---|---:|
| Task completion without facilitator | >=90% |
| Median confidence | >=4/5 |
| Critical workflow errors | 0 |
| Explanation judged sufficient | >=80% |
| Median time to find proposed replacement | <60 seconds |

This section is intentionally a protocol rather than fabricated user research. The project is simulation-only and does not claim that interviews were conducted when they were not.
