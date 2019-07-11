"""
TRUNCATE TABLE monitoring_events;
TRUNCATE TABLE monitoring_event_alerts;
TRUNCATE TABLE monitoring_releases;
TRUNCATE TABLE monitoring_triggers;
TRUNCATE TABLE monitoring_release_publishers;
TRUNCATE TABLE monitoring_triggers_misc;
TRUNCATE TABLE monitoring_on_demand;
TRUNCATE TABLE monitoring_earthquake;
TRUNCATE TABLE monitoring_moms;
TRUNCATE TABLE moms_instances;
TRUNCATE TABLE monitoring_moms_releases;

ALTER TABLE monitoring_event_alerts AUTO_INCREMENT = 1;
ALTER TABLE monitoring_triggers_misc AUTO_INCREMENT = 1;
ALTER TABLE monitoring_moms_releases AUTO_INCREMENT = 1;
"""
