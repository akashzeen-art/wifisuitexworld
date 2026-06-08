-- =============================================================================
-- V2: Add indexes for performance + check constraints
-- =============================================================================

-- Partial index: only active licenses (most common lookup)
CREATE INDEX IF NOT EXISTS idx_licenses_active_user
    ON licenses (user_id)
    WHERE status = 'ACTIVE';

-- Partial index: only active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_user
    ON subscriptions (user_id)
    WHERE status = 'ACTIVE';

-- Partial index: non-blocked devices (most common query)
CREATE INDEX IF NOT EXISTS idx_devices_active_user
    ON connected_devices (user_id)
    WHERE is_blocked = FALSE;

-- Composite index for bandwidth time-series queries
CREATE INDEX IF NOT EXISTS idx_bandwidth_user_hotspot_time
    ON bandwidth_usage (user_id, hotspot_id, recorded_at DESC);
