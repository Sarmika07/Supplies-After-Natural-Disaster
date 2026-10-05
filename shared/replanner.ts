import { cloneScenario, type Disruption, type Route, type Scenario, type Stop, type Vehicle } from "./scenario.ts";

export interface PlanMetrics {
  serviceRate: number;
  commitmentsProtected: number;
  lateCritical: number;
  lateStops: number;
  distanceKm: number;
  cost: number;
  emissionsKg: number;
  reliability: number;
  stability: number;
  score: number;
  unassignedStops: string[];
  routeChanges: number;
  vehicleUtilisation: number;
}

export interface PlanResult {
  planner: "baseline" | "reliefroute";
  scenario: Scenario;
  metrics: PlanMetrics;
  changedRoutes: string[];
  decisions: string[];
  elapsedMs: number;
  disruptionId: string;
}

export const OBJECTIVE_WEIGHTS = {
  service: 0.40,
  cost: 0.15,
  distance: 0.15,
  emissions: 0.10,
  reliability: 0.15,
  stability: 0.05,
} as const;

const priorityWeight = { Critical: 3, Urgent: 2, Normal: 1 } as const;
const SPEED_MIN_PER_KM = 2.3;
const MANUAL_BASELINE_SECONDS = 480;
const FUEL_RESERVE_L = 5;

function round(n: number): number { return Math.round(n * 10) / 10; }

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const latKm = 111.32;
  const lonKm = 111.32 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.sqrt(((a.lat - b.lat) * latKm) ** 2 + ((a.lon - b.lon) * lonKm) ** 2) * 1.12;
}

function vehicleById(scenario: Scenario, id: string): Vehicle | undefined { return scenario.vehicles.find(v => v.id === id); }
function driverById(scenario: Scenario, id: string) { return scenario.drivers.find(d => d.id === id); }
function routeByVehicle(scenario: Scenario, vehicleId: string) { return scenario.routes.find(r => r.vehicleId === vehicleId); }
function stopById(scenario: Scenario, id: string) { return scenario.stops.find(s => s.id === id); }

function routePendingStops(route: Route, scenario: Scenario): Stop[] {
  return route.stopIds
    .slice(route.currentStopIndex)
    .map(id => stopById(scenario, id))
    .filter((s): s is Stop => Boolean(s && !s.completed && !s.cancelled));
}

function usedCapacity(route: Route, scenario: Scenario): number {
  return routePendingStops(route, scenario).reduce((sum, s) => sum + s.demandKg, 0);
}

function routeCurrentLocation(route: Route, scenario: Scenario) {
  const driver = driverById(scenario, route.driverId);
  if (driver) return driver.location;
  if (route.currentStopIndex > 0) {
    const previous = stopById(scenario, route.stopIds[route.currentStopIndex - 1]);
    if (previous) return previous.location;
  }
  return route.start;
}

function routeRemainingDistance(route: Route, scenario: Scenario): number {
  const pending = routePendingStops(route, scenario);
  let current = routeCurrentLocation(route, scenario);
  let total = 0;
  for (const stop of pending) {
    total += distanceKm(current, stop.location);
    current = stop.location;
  }
  return total;
}

function routeTotalDistance(route: Route, scenario: Scenario): number {
  return Math.max(0, route.distanceCompletedKm) + routeRemainingDistance(route, scenario);
}

function routeEndMin(route: Route, scenario: Scenario, stops = routePendingStops(route, scenario)): number {
  if (!stops.length) return route.etaMin;
  let current = routeCurrentLocation(route, scenario);
  let travel = 0;
  for (const stop of stops) {
    travel += distanceKm(current, stop.location) * SPEED_MIN_PER_KM + stop.serviceMin;
    current = stop.location;
  }
  return route.etaMin + travel;
}

function predictedArrivals(route: Route, scenario: Scenario, stops: Stop[]): Map<string, number> {
  const result = new Map<string, number>();
  let current = routeCurrentLocation(route, scenario);
  let time = route.etaMin;
  for (const stop of stops) {
    time += distanceKm(current, stop.location) * SPEED_MIN_PER_KM;
    result.set(stop.id, time);
    time += stop.serviceMin;
    current = stop.location;
  }
  return result;
}

function affectedByRoad(route: Route, scenario: Scenario, disruption: Disruption): boolean {
  if (disruption.type !== "road") return false;
  const road = scenario.roads.find(r => r.id === disruption.targetId);
  if (!road) return false;
  return routePendingStops(route, scenario).some(stop => distanceKm(stop.location, road.location) <= road.radiusKm);
}

function applyDisruption(scenario: Scenario, disruption: Disruption): { affected: string[]; released: Stop[] } {
  const affected: string[] = [];
  const released: Stop[] = [];
  const releaseRoute = (route: Route) => {
    affected.push(route.id);
    route.status = "At risk";
    const pending = routePendingStops(route, scenario);
    pending.forEach(stop => {
      if (!released.some(s => s.id === stop.id)) released.push(stop);
      stop.routeId = "UNASSIGNED";
    });
    route.stopIds = route.stopIds.slice(0, route.currentStopIndex);
  };

  if (disruption.type === "vehicle_unavailable") {
    const vehicle = vehicleById(scenario, disruption.targetId);
    if (vehicle) {
      vehicle.available = false;
      const route = routeByVehicle(scenario, vehicle.id);
      if (route) releaseRoute(route);
    }
  }

  if (disruption.type === "cancellation") {
    const stop = stopById(scenario, disruption.targetId);
    if (stop && !stop.completed) {
      stop.cancelled = true;
      affected.push(stop.routeId);
      const route = scenario.routes.find(r => r.id === stop.routeId);
      if (route) route.stopIds = route.stopIds.filter(id => id !== stop.id);
    }
  }

  if (disruption.type === "urgent_addition") {
    const extra = disruption.extraStop;
    if (extra && !scenario.stops.some(s => s.id === extra.id)) {
      scenario.stops.push({ ...extra, routeId: "UNASSIGNED", completed: false, cancelled: false });
      released.push(scenario.stops.find(s => s.id === extra.id)!);
    }
  }

  if (disruption.type === "road") {
    scenario.routes.filter(route => affectedByRoad(route, scenario, disruption)).forEach(releaseRoute);
  }

  if (disruption.type === "capacity_shortage") {
    const vehicle = vehicleById(scenario, disruption.targetId);
    if (vehicle) {
      vehicle.capacityKg = Math.max(400, vehicle.capacityKg - 1200);
      const route = routeByVehicle(scenario, vehicle.id);
      if (route && usedCapacity(route, scenario) > vehicle.capacityKg) releaseRoute(route);
    }
  }

  return { affected: Array.from(new Set(affected)), released };
}

function feasibleRoute(scenario: Scenario, route: Route, stop: Stop): boolean {
  const vehicle = vehicleById(scenario, route.vehicleId);
  const driver = driverById(scenario, route.driverId);
  if (!vehicle?.available || !driver?.available) return false;
  if (usedCapacity(route, scenario) + stop.demandKg > vehicle.capacityKg) return false;
  if (vehicle.fuelL <= FUEL_RESERVE_L) return false;
  const fuelNeeded = (routeRemainingDistance(route, scenario) + distanceKm(routeCurrentLocation(route, scenario), stop.location)) * 0.18;
  if (vehicle.fuelL - fuelNeeded < FUEL_RESERVE_L) return false;
  return true;
}

function insertionDelta(route: Route, stop: Stop, scenario: Scenario, index: number): number {
  const pending = routePendingStops(route, scenario);
  const before = index === 0 ? routeCurrentLocation(route, scenario) : pending[index - 1].location;
  const after = index >= pending.length ? null : pending[index].location;
  return distanceKm(before, stop.location) + (after ? distanceKm(stop.location, after) - distanceKm(before, after) : 0);
}

function candidatePlans(scenario: Scenario, stop: Stop): Array<{ route: Route; index: number; delta: number; arrivals: Map<string, number>; endMin: number }> {
  const candidates: Array<{ route: Route; index: number; delta: number; arrivals: Map<string, number>; endMin: number }> = [];
  for (const route of scenario.routes) {
    if (!feasibleRoute(scenario, route, stop)) continue;
    const pending = routePendingStops(route, scenario);
    for (let index = 0; index <= pending.length; index++) {
      const next = [...pending];
      next.splice(index, 0, stop);
      const arrivals = predictedArrivals(route, scenario, next);
      const endMin = routeEndMin(route, scenario, next);
      const driver = driverById(scenario, route.driverId);
      if (driver && endMin > driver.shiftEndMin) continue;
      candidates.push({ route, index, delta: insertionDelta(route, stop, scenario, index), arrivals, endMin });
    }
  }
  return candidates;
}

function assignAt(scenario: Scenario, candidate: ReturnType<typeof candidatePlans>[number], stop: Stop): void {
  candidate.route.stopIds.splice(candidate.route.currentStopIndex + candidate.index, 0, stop.id);
  stop.routeId = candidate.route.id;
  candidate.route.status = "Recovering";
  candidate.route.distanceRemainingKm = routeRemainingDistance(candidate.route, scenario);
  candidate.route.etaMin = Math.round(candidate.endMin);
}

function baselineAssign(scenario: Scenario, stops: Stop[], decisions: string[]): void {
  const ordered = [...stops].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || a.deadlineMin - b.deadlineMin);
  for (const stop of ordered) {
    const candidates = candidatePlans(scenario, stop);
    if (!candidates.length) {
      decisions.push(`Escalated ${stop.id}: no feasible vehicle satisfies capacity, fuel or shift constraints.`);
      continue;
    }
    candidates.sort((a, b) => a.delta - b.delta || a.route.id.localeCompare(b.route.id));
    const best = candidates[0];
    assignAt(scenario, best, stop);
    decisions.push(`Baseline assigned ${stop.id} to ${best.route.id} using nearest-feasible append.`);
  }
}

function adaptiveAssign(scenario: Scenario, stops: Stop[], decisions: string[]): void {
  const ordered = [...stops].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || a.deadlineMin - b.deadlineMin);
  for (const stop of ordered) {
    const candidates = candidatePlans(scenario, stop).map(candidate => {
      const routeStops = [...routePendingStops(candidate.route, scenario)];
      routeStops.splice(candidate.index, 0, stop);
      const arrivals = predictedArrivals(candidate.route, scenario, routeStops);
      const stopArrival = arrivals.get(stop.id) ?? candidate.endMin;
      const lateCount = routeStops.filter(s => (arrivals.get(s.id) ?? Infinity) > s.deadlineMin).length;
      const criticalLate = routeStops.filter(s => s.priority === "Critical" && (arrivals.get(s.id) ?? Infinity) > s.deadlineMin).length;
      const routeChanges = candidate.route.currentStopIndex > 0 ? 1 : 0;
      const driver = driverById(scenario, candidate.route.driverId);
      const reserveBonus = driver?.committedRouteId ? 0 : 4;
      const commitmentPenalty = stop.committed ? 0 : 1;
      const score =
        candidate.delta * 1.2 +
        lateCount * 18 +
        criticalLate * 45 +
        Math.max(0, stopArrival - stop.deadlineMin) * 4 +
        routeChanges * 2 +
        commitmentPenalty - reserveBonus - priorityWeight[stop.priority] * 12;
      return { ...candidate, score, lateCount };
    });
    candidates.sort((a, b) => a.score - b.score || a.delta - b.delta || a.route.id.localeCompare(b.route.id));
    const best = candidates[0];
    if (!best) {
      decisions.push(`Escalated ${stop.id}: no feasible reassignment under hard capacity/fuel/shift constraints.`);
      continue;
    }
    assignAt(scenario, best, stop);
    decisions.push(`ReliefRoute inserted ${stop.id} into ${best.route.id} at position ${best.index + 1}; +${best.delta.toFixed(1)} km incremental distance; ${best.lateCount} projected late stop(s).`);
  }
}

function applyRoadPenalty(scenario: Scenario, disruption: Disruption): void {
  if (disruption.type !== "road") return;
  const road = scenario.roads.find(r => r.id === disruption.targetId);
  if (!road) return;
  scenario.routes.forEach(route => {
    if (affectedByRoad(route, scenario, disruption)) route.distanceRemainingKm *= road.detourMultiplier;
  });
}

function calculateMetrics(scenario: Scenario, original: Scenario): PlanMetrics {
  const deliverable = scenario.stops.filter(s => !s.cancelled);
  const pending = deliverable.filter(s => !s.completed);
  const unassignedStops = pending.filter(stop => !scenario.routes.some(route => {
    const vehicle = vehicleById(scenario, route.vehicleId);
    const driver = driverById(scenario, route.driverId);
    return route.stopIds.includes(stop.id) && Boolean(vehicle?.available && driver?.available);
  })).map(stop => stop.id);
  let distanceKm = 0;
  let cost = 0;
  let emissionsKg = 0;
  let lateStops = 0;
  let lateCritical = 0;
  let committed = 0;
  let protectedCount = 0;
  let activeCapacity = 0;
  let activeUsed = 0;

  for (const route of scenario.routes) {
    const vehicle = vehicleById(scenario, route.vehicleId);
    if (!vehicle) continue;
    const totalDistance = routeTotalDistance(route, scenario);
    distanceKm += totalDistance;
    cost += totalDistance * vehicle.costPerKm;
    emissionsKg += totalDistance * vehicle.co2KgPerKm;
    const stops = routePendingStops(route, scenario);
    const arrivals = predictedArrivals(route, scenario, stops);
    for (const stop of stops) {
      const arrival = arrivals.get(stop.id) ?? Infinity;
      if (arrival > stop.deadlineMin) {
        lateStops++;
        if (stop.priority === "Critical") lateCritical++;
      }
      if (stop.committed) {
        committed++;
        if (arrival <= stop.deadlineMin) protectedCount++;
      }
    }
    if (vehicle.available) {
      activeCapacity += vehicle.capacityKg;
      activeUsed += Math.min(vehicle.capacityKg, usedCapacity(route, scenario));
    }
  }

  const serviceRate = deliverable.length ? ((deliverable.length - unassignedStops.length) / deliverable.length) * 100 : 100;
  const commitmentsProtected = committed ? (protectedCount / committed) * 100 : 100;
  const reliability = Math.max(0, Math.min(100, 100 - lateStops * 6 - lateCritical * 10 - unassignedStops.length * 18));
  const originalRoutes = new Map(original.routes.map(r => [r.id, r.stopIds]));
  const routeChanges = scenario.routes.reduce((count, route) => count + (JSON.stringify(route.stopIds) !== JSON.stringify(originalRoutes.get(route.id)) ? 1 : 0), 0);
  const stability = Math.max(0, 100 - routeChanges * 8);
  const originalDistance = original.routes.reduce((sum, r) => sum + routeTotalDistance(r, original), 0) || 1;
  const originalCost = original.routes.reduce((sum, r) => {
    const v = vehicleById(original, r.vehicleId);
    return sum + routeTotalDistance(r, original) * (v?.costPerKm ?? 1.5);
  }, 0) || 1;
  const originalEmissions = original.routes.reduce((sum, r) => {
    const v = vehicleById(original, r.vehicleId);
    return sum + routeTotalDistance(r, original) * (v?.co2KgPerKm ?? 0.8);
  }, 0) || 1;
  const costScore = Math.max(0, Math.min(100, 100 - ((cost / originalCost) - 1) * 100));
  const distanceScore = Math.max(0, Math.min(100, 100 - ((distanceKm / originalDistance) - 1) * 100));
  const emissionsScore = Math.max(0, Math.min(100, 100 - ((emissionsKg / originalEmissions) - 1) * 100));
  const score = Math.round((
    serviceRate * OBJECTIVE_WEIGHTS.service +
    costScore * OBJECTIVE_WEIGHTS.cost +
    distanceScore * OBJECTIVE_WEIGHTS.distance +
    emissionsScore * OBJECTIVE_WEIGHTS.emissions +
    reliability * OBJECTIVE_WEIGHTS.reliability +
    stability * OBJECTIVE_WEIGHTS.stability
  ) * 10) / 10;

  return {
    serviceRate: round(serviceRate),
    commitmentsProtected: round(commitmentsProtected),
    lateCritical,
    lateStops,
    distanceKm: round(distanceKm),
    cost: round(cost),
    emissionsKg: round(emissionsKg),
    reliability: round(reliability),
    stability: round(stability),
    score,
    unassignedStops,
    routeChanges,
    vehicleUtilisation: activeCapacity ? round((activeUsed / activeCapacity) * 100) : 0,
  };
}

export function planScenario(base: Scenario, disruption: Disruption, planner: "baseline" | "reliefroute"): PlanResult {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const scenario = cloneScenario(base);
  const original = cloneScenario(scenario);
  const { affected, released } = applyDisruption(scenario, disruption);
  applyRoadPenalty(scenario, disruption);
  const unique = Array.from(new Map(released.map(stop => [stop.id, stop])).values());
  const decisions: string[] = [];
  if (planner === "baseline") baselineAssign(scenario, unique, decisions);
  else adaptiveAssign(scenario, unique, decisions);
  scenario.routes.forEach(route => { if (affected.includes(route.id)) route.status = "Recovering"; });
  const metrics = calculateMetrics(scenario, original);
  const changedRoutes = scenario.routes.filter(route => JSON.stringify(route.stopIds) !== JSON.stringify(original.routes.find(r => r.id === route.id)?.stopIds)).map(r => r.id);
  const finished = typeof performance !== "undefined" ? performance.now() : Date.now();
  return { planner, scenario, metrics, changedRoutes, decisions, elapsedMs: round(finished - started), disruptionId: disruption.id };
}

export function makeDisruption(type: Disruption["type"]): Disruption {
  const now = new Date().toISOString();
  if (type === "road") return { id: "EXP-ROAD", type, targetId: "A12", description: "A12 bridge closure forces a detour for affected north routes", severity: "Critical", createdAt: now };
  if (type === "vehicle_unavailable") return { id: "EXP-VAN", type, targetId: "V-07", description: "V-07 becomes unavailable after a fuel-system fault", severity: "Urgent", createdAt: now };
  if (type === "cancellation") return { id: "EXP-CANCEL", type, targetId: "S-07", description: "Community kitchen cancels before dispatch", severity: "Normal", createdAt: now };
  if (type === "capacity_shortage") return { id: "EXP-CAP", type, targetId: "V-12", description: "V-12 loses 1,200 kg usable capacity mid-route", severity: "Urgent", createdAt: now };
  return {
    id: "EXP-URGENT",
    type: "urgent_addition",
    targetId: "S-15",
    description: "Mobile clinic adds a new 420 kg critical request",
    severity: "Critical",
    createdAt: now,
    extraStop: { id: "S-15", name: "Emergency mobile clinic", location: { lat: 11.047, lon: 76.951 }, demandKg: 420, priority: "Critical", deadlineMin: 590, serviceMin: 12, routeId: "UNASSIGNED", committed: true, completed: false },
  };
}

export function calculateRecoveryTime(startedAt: number, finishedAt: number): number {
  if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt)) throw new Error("Recovery timestamps must be finite numbers");
  if (finishedAt < startedAt) throw new Error("Recovery cannot finish before it starts");
  return Math.max(1, Math.round((finishedAt - startedAt) / 1000));
}

export function scorePlan(input: { service: number; cost: number; distance: number; emissions: number; reliability: number; stability: number }): number {
  return Math.round((input.service * OBJECTIVE_WEIGHTS.service + input.cost * OBJECTIVE_WEIGHTS.cost + input.distance * OBJECTIVE_WEIGHTS.distance + input.emissions * OBJECTIVE_WEIGHTS.emissions + input.reliability * OBJECTIVE_WEIGHTS.reliability + input.stability * OBJECTIVE_WEIGHTS.stability) * 10) / 10;
}

export const BENCHMARK_ASSUMPTIONS = {
  manualRecoverySeconds: MANUAL_BASELINE_SECONDS,
  plannerTargetSeconds: 2,
  speedMinPerKm: SPEED_MIN_PER_KM,
  fuelReserveLitres: FUEL_RESERVE_L,
};
