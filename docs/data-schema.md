# Data schema

| Entity | Required fields | Purpose |
|---|---|---|
| drivers | id, name, lat, lon, availability, committed route, shift end | Current field position and commitments |
| vehicles | id, capacity, availability, fuel, CO2/km, cost/km, driver | Feasibility and trade-off calculations |
| stops | id, location, demand, priority, deadline, service time, route, completed | Delivery obligations |
| routes | id, vehicle, driver, current stop index, completed/remaining distance, ETA, status, stop sequence | Current route progress |
| disruptions | id, type, target, severity, description, timestamp | Last-minute changes |
| experimentRuns | planner, elapsed time, service, protected commitments, distance, cost, emissions, score | Reproducible benchmark evidence |

All fields are finite and bounded in the simulation. No unlimited data or infrastructure is assumed.
