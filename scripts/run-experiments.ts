import { BASE_SCENARIO, cloneScenario, type Scenario } from "../shared/scenario.ts";
import { BENCHMARK_ASSUMPTIONS, makeDisruption, planScenario } from "../shared/replanner.ts";
import fs from "node:fs";

const cases = [
  { id: "vehicle-breakdown", type: "vehicle_unavailable" as const, expected: "Reassign V-07 pending stops without exceeding capacity." },
  { id: "urgent-addition", type: "urgent_addition" as const, expected: "Insert a new 420 kg critical request while preserving earlier commitments." },
  { id: "cancellation", type: "cancellation" as const, expected: "Remove S-07 without disturbing completed work." },
  { id: "road-closure", type: "road" as const, expected: "Recover A12-affected work and account for detour risk." },
  { id: "capacity-shortage", type: "capacity_shortage" as const, expected: "Recover after V-12 loses usable capacity while keeping capacity hard." },
];

function runCase(base: Scenario, c: typeof cases[number]) {
  const disruption = makeDisruption(c.type);
  const baseline = planScenario(base, disruption, "baseline");
  const reliefroute = planScenario(base, disruption, "reliefroute");
  const manualSeconds = BENCHMARK_ASSUMPTIONS.manualRecoverySeconds;
  const plannerSeconds = reliefroute.elapsedMs / 1000;
  const serviceDelta = reliefroute.metrics.serviceRate - baseline.metrics.serviceRate;
  const protectedDelta = reliefroute.metrics.commitmentsProtected - baseline.metrics.commitmentsProtected;
  const distanceDeltaPct = baseline.metrics.distanceKm ? ((reliefroute.metrics.distanceKm - baseline.metrics.distanceKm) / baseline.metrics.distanceKm) * 100 : 0;
  const emissionsDeltaPct = baseline.metrics.emissionsKg ? ((reliefroute.metrics.emissionsKg - baseline.metrics.emissionsKg) / baseline.metrics.emissionsKg) * 100 : 0;
  const costDeltaPct = baseline.metrics.cost ? ((reliefroute.metrics.cost - baseline.metrics.cost) / baseline.metrics.cost) * 100 : 0;
  const errorNote = reliefroute.metrics.unassignedStops.length
    ? `Explicit escalation: ${reliefroute.metrics.unassignedStops.join(", ")} could not be assigned under hard constraints.`
    : "No infeasible demand after replanning; all deliverable stops remained assigned.";
  return {
    id: c.id,
    expected: c.expected,
    baseline_ms: Number(baseline.elapsedMs.toFixed(2)),
    reliefroute_ms: Number(reliefroute.elapsedMs.toFixed(2)),
    manual_recovery_s: manualSeconds,
    speedup_vs_manual_x: Number((manualSeconds / Math.max(plannerSeconds, 0.001)).toFixed(1)),
    target_lt_2s_met: plannerSeconds < BENCHMARK_ASSUMPTIONS.plannerTargetSeconds,
    baseline_service_pct: baseline.metrics.serviceRate,
    reliefroute_service_pct: reliefroute.metrics.serviceRate,
    service_delta_pp: Number(serviceDelta.toFixed(1)),
    baseline_protected_pct: baseline.metrics.commitmentsProtected,
    reliefroute_protected_pct: reliefroute.metrics.commitmentsProtected,
    protected_delta_pp: Number(protectedDelta.toFixed(1)),
    baseline_distance_km: baseline.metrics.distanceKm,
    reliefroute_distance_km: reliefroute.metrics.distanceKm,
    distance_delta_pct: Number(distanceDeltaPct.toFixed(1)),
    baseline_cost: baseline.metrics.cost,
    reliefroute_cost: reliefroute.metrics.cost,
    cost_delta_pct: Number(costDeltaPct.toFixed(1)),
    baseline_emissions_kg: baseline.metrics.emissionsKg,
    reliefroute_emissions_kg: reliefroute.metrics.emissionsKg,
    emissions_delta_pct: Number(emissionsDeltaPct.toFixed(1)),
    baseline_late_stops: baseline.metrics.lateStops,
    reliefroute_late_stops: reliefroute.metrics.lateStops,
    baseline_unassigned: baseline.metrics.unassignedStops.length,
    reliefroute_unassigned: reliefroute.metrics.unassignedStops.length,
    baseline_score: baseline.metrics.score,
    reliefroute_score: reliefroute.metrics.score,
    baseline_route_changes: baseline.metrics.routeChanges,
    reliefroute_route_changes: reliefroute.metrics.routeChanges,
    changed_routes: reliefroute.changedRoutes.join("|") || "none",
    error_note: errorNote,
  };
}

function makeInfeasibleScenario(): Scenario {
  const scenario = cloneScenario(BASE_SCENARIO);
  for (const vehicle of scenario.vehicles) vehicle.available = false;
  const reserve = scenario.vehicles.find(v => v.id === "V-21");
  if (reserve) reserve.available = true;
  if (reserve) reserve.capacityKg = 300;
  const driver = scenario.drivers.find(d => d.id === "DR-05");
  if (driver) driver.available = true;
  return scenario;
}

const rows = cases.map(c => runCase(cloneScenario(BASE_SCENARIO), c));
const infeasible = runCase(makeInfeasibleScenario(), { id: "infeasible-overload", type: "urgent_addition", expected: "Escalate urgent demand when the remaining fleet cannot carry it." });
rows.push(infeasible);

const header = Object.keys(rows[0]);
const csv = [header.join(","), ...rows.map(row => header.map(k => JSON.stringify((row as Record<string, unknown>)[k])).join(","))].join("\n") + "\n";
const summary = {
  generatedAt: new Date().toISOString(),
  scenario: BASE_SCENARIO.name,
  assumptions: BENCHMARK_ASSUMPTIONS,
  manualBaseline: "8-minute dispatcher rebuild target",
  adaptiveTarget: "<2 seconds planner runtime",
  cases: rows,
  aggregate: {
    casesTested: rows.length,
    targetMetCount: rows.filter(r => r.target_lt_2s_met).length,
    targetMetPct: Number((rows.filter(r => r.target_lt_2s_met).length / rows.length * 100).toFixed(1)),
    averageReliefRouteMs: Number((rows.reduce((s, r) => s + r.reliefroute_ms, 0) / rows.length).toFixed(2)),
    averageServicePct: Number((rows.reduce((s, r) => s + r.reliefroute_service_pct, 0) / rows.length).toFixed(1)),
    averageProtectedPct: Number((rows.reduce((s, r) => s + r.reliefroute_protected_pct, 0) / rows.length).toFixed(1)),
    escalations: rows.filter(r => r.reliefroute_unassigned > 0).length,
  },
};

fs.mkdirSync("./artifacts", { recursive: true });
fs.writeFileSync("./artifacts/benchmark-results.csv", csv);
fs.writeFileSync("./artifacts/benchmark-results.json", JSON.stringify(summary, null, 2));

console.log("ReliefRoute reproducible benchmark");
console.table(rows.map(r => ({
  case: r.id,
  adaptive_ms: r.reliefroute_ms,
  manual_s: r.manual_recovery_s,
  service: r.reliefroute_service_pct,
  protected: r.reliefroute_protected_pct,
  distance_km: r.reliefroute_distance_km,
  cost: r.reliefroute_cost,
  emissions_kg: r.reliefroute_emissions_kg,
  unassigned: r.reliefroute_unassigned,
  score: r.reliefroute_score,
})));
console.log("Artifacts written to artifacts/benchmark-results.{csv,json}");
