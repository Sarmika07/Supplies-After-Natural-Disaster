# Operational dataset

ReliefRoute intentionally runs without external operational infrastructure. The bundled dataset is a **synthetic operational snapshot** modelled on disaster-relief dispatch conditions.

It covers the exact state needed by the replanning problem:

- current route progress and stop index;
- distance already completed and distance remaining;
- vehicle capacity, fuel, cost and CO₂ factors;
- driver GPS snapshot, availability, commitments and shift end;
- delivery demand, priority, deadlines, service times and completion state;
- road closure geometry and detour multiplier;
- reproducible disruption definitions.

Files:

- `vehicles.csv` — fleet capacity, fuel, cost and emissions factors
- `drivers.csv` — current driver location, availability and commitments
- `stops.csv` — delivery demand, priority, deadline, service time and completion state
- `routes.csv` — active route progress and stop sequence
- `disruptions.csv` — benchmark failure states

The urgent-addition case creates `S-15` at disruption time; it is deliberately not present in the base route snapshot so the experiment represents a genuine new request.
