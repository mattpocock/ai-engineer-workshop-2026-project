CREATE UNIQUE INDEX `point_events_dedup_idx` ON `point_events` (`user_id`, `action`, `reference_id`);
