# Stakeholder assumptions

## Dispatcher

- Needs a revised plan within seconds after a last-minute event.
- Can override or reject a proposed plan.
- Cares more about protecting critical commitments than shaving every kilometre.
- Needs an explanation of why a vehicle/stop moved.

## Operations

- Completed stops cannot be replanned.
- Vehicle capacity is a hard constraint.
- Drivers have a finite shift window.
- Delivery deadlines are represented as scenario-relative minutes.
- The current route snapshot may be stale; the UI therefore labels the dataset as simulated and shows its timestamp.
- When no feasible assignment exists, the system must escalate the stop rather than silently dropping it.

## Data / infrastructure

- The MVP must run offline after dependencies are installed.
- Synthetic CSV data is the source of truth for the demo.
- MySQL/Drizzle is optional persistence, not a runtime requirement.
- Road closures are represented as disruption multipliers rather than a live routing API dependency.
