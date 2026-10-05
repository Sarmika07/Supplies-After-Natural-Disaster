export type Priority = "Critical" | "Urgent" | "Normal";
export type DisruptionType = "road" | "vehicle_unavailable" | "urgent_addition" | "cancellation" | "capacity_shortage";

export interface Coordinate { lat: number; lon: number; }
export interface Driver { id: string; name: string; location: Coordinate; available: boolean; committedRouteId: string | null; shiftEndMin: number; }
export interface Vehicle { id: string; capacityKg: number; available: boolean; fuelL: number; co2KgPerKm: number; costPerKm: number; driverId: string; }
export interface Stop {
  id: string;
  name: string;
  location: Coordinate;
  demandKg: number;
  priority: Priority;
  deadlineMin: number;
  serviceMin: number;
  routeId: string;
  committed: boolean;
  completed: boolean;
  cancelled?: boolean;
}
export interface Route {
  id: string;
  vehicleId: string;
  driverId: string;
  start: Coordinate;
  stopIds: string[];
  currentStopIndex: number;
  distanceCompletedKm: number;
  distanceRemainingKm: number;
  etaMin: number;
  status: "On route" | "At risk" | "Recovering" | "Complete";
}
export interface RoadClosure { id: string; name: string; location: Coordinate; radiusKm: number; detourMultiplier: number; }
export interface Scenario {
  name: string;
  asOf: string;
  hub: Coordinate;
  drivers: Driver[];
  vehicles: Vehicle[];
  stops: Stop[];
  routes: Route[];
  roads: RoadClosure[];
}
export interface Disruption {
  id: string;
  type: DisruptionType;
  targetId: string;
  description: string;
  severity: Priority;
  createdAt: string;
  extraStop?: Stop;
}

export const BASE_SCENARIO: Scenario = {
  name: "North District flood response — synthetic operational snapshot",
  asOf: "2024-09-17T12:38:00+05:30",
  hub: { lat: 11.0168, lon: 76.9558 },
  drivers: [
    { id: "DR-01", name: "Amara Okafor", location: { lat: 11.031, lon: 76.963 }, available: true, committedRouteId: "R-104", shiftEndMin: 620 },
    { id: "DR-02", name: "Maya Patel", location: { lat: 11.022, lon: 76.971 }, available: true, committedRouteId: "R-110", shiftEndMin: 600 },
    { id: "DR-03", name: "Nia Thompson", location: { lat: 10.998, lon: 76.942 }, available: true, committedRouteId: "R-098", shiftEndMin: 590 },
    { id: "DR-04", name: "Sofia Reyes", location: { lat: 11.008, lon: 76.934 }, available: true, committedRouteId: "R-117", shiftEndMin: 620 },
    { id: "DR-05", name: "Liam Chen", location: { lat: 11.014, lon: 76.982 }, available: true, committedRouteId: null, shiftEndMin: 610 },
  ],
  vehicles: [
    { id: "V-12", capacityKg: 1800, available: true, fuelL: 62, co2KgPerKm: 0.92, costPerKm: 1.65, driverId: "DR-01" },
    { id: "V-07", capacityKg: 1400, available: true, fuelL: 38, co2KgPerKm: 0.78, costPerKm: 1.42, driverId: "DR-02" },
    { id: "V-03", capacityKg: 1000, available: true, fuelL: 55, co2KgPerKm: 0.65, costPerKm: 1.25, driverId: "DR-03" },
    { id: "V-18", capacityKg: 1600, available: true, fuelL: 44, co2KgPerKm: 0.84, costPerKm: 1.51, driverId: "DR-04" },
    { id: "V-21", capacityKg: 1200, available: true, fuelL: 72, co2KgPerKm: 0.70, costPerKm: 1.30, driverId: "DR-05" },
  ],
  stops: [
    { id: "S-01", name: "Ridge clinic", location: { lat: 11.043, lon: 76.973 }, demandKg: 320, priority: "Critical", deadlineMin: 545, serviceMin: 10, routeId: "R-104", committed: true, completed: true },
    { id: "S-02", name: "Hope Valley clinic", location: { lat: 11.052, lon: 76.988 }, demandKg: 420, priority: "Critical", deadlineMin: 570, serviceMin: 12, routeId: "R-104", committed: true, completed: true },
    { id: "S-03", name: "North shelter", location: { lat: 11.066, lon: 77.002 }, demandKg: 260, priority: "Urgent", deadlineMin: 600, serviceMin: 10, routeId: "R-104", committed: true, completed: false },
    { id: "S-04", name: "Water point 14", location: { lat: 11.071, lon: 76.981 }, demandKg: 210, priority: "Normal", deadlineMin: 620, serviceMin: 8, routeId: "R-104", committed: true, completed: false },
    { id: "S-05", name: "Eastbank school", location: { lat: 11.019, lon: 77.004 }, demandKg: 300, priority: "Urgent", deadlineMin: 585, serviceMin: 10, routeId: "R-110", committed: true, completed: true },
    { id: "S-06", name: "Eastbank shelter", location: { lat: 11.007, lon: 77.018 }, demandKg: 240, priority: "Urgent", deadlineMin: 610, serviceMin: 9, routeId: "R-110", committed: true, completed: false },
    { id: "S-07", name: "Community kitchen", location: { lat: 10.991, lon: 77.025 }, demandKg: 180, priority: "Normal", deadlineMin: 635, serviceMin: 8, routeId: "R-110", committed: true, completed: false },
    { id: "S-08", name: "Harbor depot", location: { lat: 10.973, lon: 76.969 }, demandKg: 360, priority: "Critical", deadlineMin: 565, serviceMin: 11, routeId: "R-098", committed: true, completed: true },
    { id: "S-09", name: "South clinic", location: { lat: 10.962, lon: 76.951 }, demandKg: 220, priority: "Urgent", deadlineMin: 600, serviceMin: 9, routeId: "R-098", committed: true, completed: true },
    { id: "S-10", name: "Riverbend shelter", location: { lat: 10.986, lon: 76.921 }, demandKg: 310, priority: "Critical", deadlineMin: 590, serviceMin: 12, routeId: "R-117", committed: true, completed: false },
    { id: "S-11", name: "West water point", location: { lat: 11.003, lon: 76.908 }, demandKg: 280, priority: "Urgent", deadlineMin: 615, serviceMin: 9, routeId: "R-117", committed: true, completed: false },
    { id: "S-12", name: "Riverbend school", location: { lat: 10.972, lon: 76.905 }, demandKg: 190, priority: "Normal", deadlineMin: 640, serviceMin: 8, routeId: "R-117", committed: true, completed: false },
    { id: "S-13", name: "Overflow camp", location: { lat: 11.028, lon: 76.996 }, demandKg: 260, priority: "Urgent", deadlineMin: 595, serviceMin: 10, routeId: "R-110", committed: true, completed: false },
    { id: "S-14", name: "Mobile clinic", location: { lat: 11.047, lon: 76.951 }, demandKg: 420, priority: "Critical", deadlineMin: 590, serviceMin: 12, routeId: "R-104", committed: true, completed: false },
  ],
  routes: [
    { id: "R-104", vehicleId: "V-12", driverId: "DR-01", start: { lat: 11.031, lon: 76.963 }, stopIds: ["S-01", "S-02", "S-03", "S-04", "S-14"], currentStopIndex: 2, distanceCompletedKm: 14.8, distanceRemainingKm: 9.4, etaMin: 42, status: "On route" },
    { id: "R-110", vehicleId: "V-07", driverId: "DR-02", start: { lat: 11.022, lon: 76.971 }, stopIds: ["S-05", "S-06", "S-07", "S-13"], currentStopIndex: 1, distanceCompletedKm: 8.2, distanceRemainingKm: 12.8, etaMin: 60, status: "At risk" },
    { id: "R-098", vehicleId: "V-03", driverId: "DR-03", start: { lat: 10.998, lon: 76.942 }, stopIds: ["S-08", "S-09"], currentStopIndex: 2, distanceCompletedKm: 11.5, distanceRemainingKm: 0, etaMin: 0, status: "Complete" },
    { id: "R-117", vehicleId: "V-18", driverId: "DR-04", start: { lat: 11.008, lon: 76.934 }, stopIds: ["S-10", "S-11", "S-12"], currentStopIndex: 1, distanceCompletedKm: 6.1, distanceRemainingKm: 15.9, etaMin: 87, status: "On route" },
    { id: "R-121", vehicleId: "V-21", driverId: "DR-05", start: { lat: 11.014, lon: 76.982 }, stopIds: [], currentStopIndex: 0, distanceCompletedKm: 0, distanceRemainingKm: 0, etaMin: 0, status: "On route" },
  ],
  roads: [
    { id: "A12", name: "North ridge bridge", location: { lat: 11.058, lon: 76.986 }, radiusKm: 2.5, detourMultiplier: 1.45 },
    { id: "B7", name: "Riverbend crossing", location: { lat: 10.986, lon: 76.918 }, radiusKm: 2.0, detourMultiplier: 1.55 },
  ],
};

export const DISRUPTIONS: Disruption[] = [
  { id: "D-328", type: "road", targetId: "A12", description: "Bridge closure on North ridge", severity: "Critical", createdAt: "2024-09-17T12:32:00+05:30" },
  { id: "D-326", type: "vehicle_unavailable", targetId: "V-07", description: "V-07 fuel system fault", severity: "Urgent", createdAt: "2024-09-17T12:24:00+05:30" },
  { id: "D-324", type: "urgent_addition", targetId: "S-14", description: "Mobile clinic supply request — 420 kg", severity: "Critical", createdAt: "2024-09-17T12:17:00+05:30" },
];

export function cloneScenario(scenario: Scenario = BASE_SCENARIO): Scenario {
  return JSON.parse(JSON.stringify(scenario)) as Scenario;
}
