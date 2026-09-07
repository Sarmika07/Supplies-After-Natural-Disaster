export function calculateRecoveryTime(startedAt: number, finishedAt: number): number {
  if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt)) {
    throw new Error("Recovery timestamps must be finite numbers");
  }
  if (finishedAt < startedAt) {
    throw new Error("Recovery cannot finish before it starts");
  }
  return Math.max(1, Math.round((finishedAt - startedAt) / 1000));
}

export function scorePlan(input: {
  service: number;
  cost: number;
  distance: number;
  emissions: number;
  reliability: number;
  stability: number;
}): number {
  const weighted =
    input.service * 0.4 +
    input.cost * 0.15 +
    input.distance * 0.15 +
    input.emissions * 0.1 +
    input.reliability * 0.15 +
    input.stability * 0.05;
  return Math.round(weighted * 10) / 10;
}
