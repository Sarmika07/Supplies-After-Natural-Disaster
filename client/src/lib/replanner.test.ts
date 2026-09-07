import { describe, expect, it } from "vitest";
import { calculateRecoveryTime, scorePlan } from "./replanner";

describe("calculateRecoveryTime", () => {
  it("measures elapsed seconds and rounds to the nearest second", () => {
    expect(calculateRecoveryTime(1_000, 19_250)).toBe(18);
  });

  it("never reports less than one second for a completed run", () => {
    expect(calculateRecoveryTime(1_000, 1_001)).toBe(1);
  });

  it("rejects invalid timestamp order", () => {
    expect(() => calculateRecoveryTime(2_000, 1_000)).toThrow("finish before it starts");
  });
});

describe("scorePlan", () => {
  it("applies the configurable ReliefRoute objective weights", () => {
    expect(scorePlan({ service: 100, cost: 80, distance: 70, emissions: 90, reliability: 80, stability: 60 })).toBe(86.5);
  });
});
