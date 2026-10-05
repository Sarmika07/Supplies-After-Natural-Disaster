CREATE TABLE IF NOT EXISTS `roads` (`id` varchar(32) NOT NULL PRIMARY KEY, `name` varchar(160) NOT NULL, `lat` decimal(9,6) NOT NULL, `lon` decimal(9,6) NOT NULL, `radiusKm` decimal(7,2) NOT NULL, `detourMultiplier` decimal(6,3) NOT NULL);
ALTER TABLE `experimentRuns` ADD COLUMN `lateStops` int NOT NULL DEFAULT 0;
ALTER TABLE `experimentRuns` ADD COLUMN `unassignedStops` int NOT NULL DEFAULT 0;
ALTER TABLE `experimentRuns` ADD COLUMN `reliability` decimal(6,2) NOT NULL DEFAULT 100;
ALTER TABLE `experimentRuns` ADD COLUMN `stability` decimal(6,2) NOT NULL DEFAULT 100;
ALTER TABLE `experimentRuns` ADD COLUMN `routeChanges` int NOT NULL DEFAULT 0;
