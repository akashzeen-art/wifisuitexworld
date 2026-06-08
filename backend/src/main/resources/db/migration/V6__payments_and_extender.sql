-- =============================================================================
-- V6: Production SaaS — payments gateway columns + hotspot extender mode
-- =============================================================================

-- ── payments: add gateway-specific columns ────────────────────────────────────
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS gateway_order_id  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS gateway_signature VARCHAR(512),
    ADD COLUMN IF NOT EXISTS currency          VARCHAR(3)  NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS description       TEXT,
    ADD COLUMN IF NOT EXISTS refund_id         VARCHAR(255),
    ADD COLUMN IF NOT EXISTS refunded_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS metadata          JSONB;

-- Expand gateway check
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_gateway_check;
ALTER TABLE payments ADD CONSTRAINT payments_gateway_check
    CHECK (gateway IN ('STRIPE','RAZORPAY','PAYPAL','MANUAL') OR gateway IS NULL);

-- ── hotspots: extender mode columns ──────────────────────────────────────────
ALTER TABLE hotspots
    ADD COLUMN IF NOT EXISTS mode               VARCHAR(20) NOT NULL DEFAULT 'SHARING'
                                                CHECK (mode IN ('SHARING','REPEATER','BRIDGE')),
    ADD COLUMN IF NOT EXISTS upstream_ssid      VARCHAR(100),
    ADD COLUMN IF NOT EXISTS upstream_signal    INTEGER     CHECK (upstream_signal BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS upstream_adapter   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS downstream_adapter VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ics_enabled        BOOLEAN     NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_hotspots_mode ON hotspots (mode);

-- ── plans: add currency column ────────────────────────────────────────────────
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD';
