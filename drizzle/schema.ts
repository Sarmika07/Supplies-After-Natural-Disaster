import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const drivers = mysqlTable("drivers", {
  id: varchar("id", { length: 32 }).primaryKey(), name: varchar("name", { length: 120 }).notNull(),
  lat: decimal("lat", { precision: 9, scale: 6 }).notNull(), lon: decimal("lon", { precision: 9, scale: 6 }).notNull(),
  available: boolean("available").default(true).notNull(), committedRouteId: varchar("committedRouteId", { length: 32 }), shiftEndMin: int("shiftEndMin").notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: varchar("id", { length: 32 }).primaryKey(), capacityKg: int("capacityKg").notNull(), available: boolean("available").default(true).notNull(),
  fuelL: decimal("fuelL", { precision: 8, scale: 2 }).notNull(), co2KgPerKm: decimal("co2KgPerKm", { precision: 6, scale: 3 }).notNull(), costPerKm: decimal("costPerKm", { precision: 7, scale: 3 }).notNull(), driverId: varchar("driverId", { length: 32 }).notNull(),
});

export const stops = mysqlTable("stops", {
  id: varchar("id", { length: 32 }).primaryKey(), name: varchar("name", { length: 160 }).notNull(), lat: decimal("lat", { precision: 9, scale: 6 }).notNull(), lon: decimal("lon", { precision: 9, scale: 6 }).notNull(),
  demandKg: int("demandKg").notNull(), priority: mysqlEnum("priority", ["Critical", "Urgent", "Normal"]).notNull(), deadlineMin: int("deadlineMin").notNull(), serviceMin: int("serviceMin").notNull(),
  routeId: varchar("routeId", { length: 32 }).notNull(), committed: boolean("committed").default(true).notNull(), completed: boolean("completed").default(false).notNull(), cancelled: boolean("cancelled").default(false).notNull(),
});

export const routes = mysqlTable("routes", {
  id: varchar("id", { length: 32 }).primaryKey(), vehicleId: varchar("vehicleId", { length: 32 }).notNull(), driverId: varchar("driverId", { length: 32 }).notNull(),
  currentStopIndex: int("currentStopIndex").notNull(), distanceCompletedKm: decimal("distanceCompletedKm", { precision: 8, scale: 2 }).notNull(), distanceRemainingKm: decimal("distanceRemainingKm", { precision: 8, scale: 2 }).notNull(), etaMin: int("etaMin").notNull(),
  status: mysqlEnum("status", ["On route", "At risk", "Recovering", "Complete"]).notNull(), stopIds: text("stopIds").notNull(),
});

export const disruptions = mysqlTable("disruptions", {
  id: varchar("id", { length: 48 }).primaryKey(), type: mysqlEnum("type", ["road", "vehicle_unavailable", "urgent_addition", "cancellation", "capacity_shortage"]).notNull(),
  targetId: varchar("targetId", { length: 32 }).notNull(), severity: mysqlEnum("severity", ["Critical", "Urgent", "Normal"]).notNull(), description: text("description").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const roads = mysqlTable("roads", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  lat: decimal("lat", { precision: 9, scale: 6 }).notNull(),
  lon: decimal("lon", { precision: 9, scale: 6 }).notNull(),
  radiusKm: decimal("radiusKm", { precision: 7, scale: 2 }).notNull(),
  detourMultiplier: decimal("detourMultiplier", { precision: 6, scale: 3 }).notNull(),
});

export const experimentRuns = mysqlTable("experimentRuns", {
  id: int("id").autoincrement().primaryKey(), scenarioName: varchar("scenarioName", { length: 180 }).notNull(), disruptionId: varchar("disruptionId", { length: 48 }).notNull(),
  planner: mysqlEnum("planner", ["baseline", "reliefroute"]).notNull(), elapsedMs: decimal("elapsedMs", { precision: 10, scale: 2 }).notNull(), serviceRate: decimal("serviceRate", { precision: 6, scale: 2 }).notNull(), protectedPct: decimal("protectedPct", { precision: 6, scale: 2 }).notNull(),
  distanceKm: decimal("distanceKm", { precision: 10, scale: 2 }).notNull(), cost: decimal("cost", { precision: 10, scale: 2 }).notNull(), emissionsKg: decimal("emissionsKg", { precision: 10, scale: 2 }).notNull(), score: decimal("score", { precision: 6, scale: 2 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
  lateStops: int("lateStops").notNull().default(0),
  unassignedStops: int("unassignedStops").notNull().default(0),
  reliability: decimal("reliability", { precision: 6, scale: 2 }).notNull().default("100"),
  stability: decimal("stability", { precision: 6, scale: 2 }).notNull().default("100"),
  routeChanges: int("routeChanges").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
