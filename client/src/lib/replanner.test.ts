import { describe, expect, it } from "vitest";
import { BASE_SCENARIO, cloneScenario, makeDisruption } from "../../../shared/scenario";
import { calculateRecoveryTime, planScenario, scorePlan } from "../../../shared/replanner";

describe("calculateRecoveryTime", () => {
  it("measures elapsed seconds and rounds to the nearest second", () => expect(calculateRecoveryTime(1_000, 19_250)).toBe(18));
  it("never reports less than one second for a completed run", () => expect(calculateRecoveryTime(1_000, 1_001)).toBe(1));
  it("rejects invalid timestamp order", () => expect(() => calculateRecoveryTime(2_000, 1_000)).toThrow("finish before it starts"));
});

describe("scorePlan", () => {
  it("applies the published multi-objective weights", () => {
    expect(scorePlan({ service: 100, cost: 80, distance: 70, emissions: 90, reliability: 80, stability: 60 })).toBe(86.5);
  });
});

describe("rapid replanning", () => {
  it("reassigns all pending work after a vehicle breakdown", () => {
    const result = planScenario(cloneScenario(BASE_SCENARIO), makeDisruption("vehicle_unavailable"), "reliefroute");
    expect(result.scenario.vehicles.find(v => v.id === "V-07")?.available).toBe(false);
    expect(result.metrics.unassignedStops.length).toBe(0);
    expect(result.changedRoutes.length).toBeGreaterThan(0);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("adds a genuinely new urgent stop without exceeding capacity", () => {
    const result = planScenario(cloneScenario(BASE_SCENARIO), makeDisruption("urgent_addition"), "reliefroute");
    expect(result.scenario.stops.some(s => s.id === "S-15")).toBe(true);
    expect(result.metrics.unassignedStops).not.toContain("S-15");
    for (const route of result.scenario.routes) {
      const vehicle = result.scenario.vehicles.find(v => v.id === route.vehicleId)!;
      const load = route.stopIds.slice(route.currentStopIndex).reduce((sum, id) => sum + (result.scenario.stops.find(s => s.id === id)?.demandKg ?? 0), 0);
      expect(load).toBeLessThanOrEqual(vehicle.capacityKg);
    }
  });

  it("keeps completed stops immutable after cancellation", () => {
    const result = planScenario(cloneScenario(BASE_SCENARIO), makeDisruption("cancellation"), "reliefroute");
    const completed = BASE_SCENARIO.stops.filter(s => s.completed).map(s => s.id);
    for (const id of completed) expect(result.scenario.stops.find(s => s.id === id)?.completed).toBe(true);
    expect(result.scenario.stops.find(s => s.id === "S-07")?.cancelled).toBe(true);
  });

  it("treats capacity as a hard constraint and exposes infeasibility", () => {
    const scenario = cloneScenario(BASE_SCENARIO);
    for (const vehicle of scenario.vehicles) vehicle.available = false;
    const reserve = scenario.vehicles.find(v => v.id === "V-21")!;
    reserve.available = true;
    reserve.capacityKg = 300;
    const result = planScenario(scenario, makeDisruption("urgent_addition"), "reliefroute");
    expect(result.metrics.unassignedStops).toContain("S-15");
    expect(result.decisions.some(d => d.includes("Escalated S-15"))).toBe(true);
  });

  it("never assigns work to an unavailable vehicle", () => {
    const result = planScenario(cloneScenario(BASE_SCENARIO), makeDisruption("vehicle_unavailable"), "reliefroute");
    const route = result.scenario.routes.find(r => r.vehicleId === "V-07");
    expect(route?.stopIds.length).toBe(route?.currentStopIndex);
  });
});
