-- =============================================================================
-- V5: Connected device monitoring upgrade
-- =============================================================================

ALTER TABLE connected_devices
    ADD COLUMN IF NOT EXISTS vendor          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS signal_strength INTEGER CHECK (signal_strength BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS is_online       BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_connected_devices_online
    ON connected_devices (user_id, is_online);

COMMENT ON COLUMN connected_devices.vendor          IS 'Hardware vendor from MAC OUI lookup';
COMMENT ON COLUMN connected_devices.signal_strength IS 'WiFi signal strength 0-100';
COMMENT ON COLUMN connected_devices.is_online       IS 'True if heartbeat received within last 2 minutes';
