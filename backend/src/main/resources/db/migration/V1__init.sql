-- =============================================================================
-- WiFi Extender SaaS Platform — Full Schema
-- Migration: V1__init.sql
-- =============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE: users
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id               BIGSERIAL       PRIMARY KEY,
    email            VARCHAR(255)    NOT NULL,
    password         VARCHAR(255)    NOT NULL,
    name             VARCHAR(100)    NOT NULL,
    role             VARCHAR(20)     NOT NULL DEFAULT 'USER'
                                     CHECK (role IN ('USER', 'ADMIN')),
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
    failed_attempts  SMALLINT        NOT NULL DEFAULT 0
                                     CHECK (failed_attempts >= 0),
    locked_until     TIMESTAMPTZ,
    last_login       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email      ON users (email);
CREATE INDEX idx_users_role       ON users (role);
CREATE INDEX idx_users_is_active  ON users (is_active);

COMMENT ON TABLE  users                IS 'Platform user accounts';
COMMENT ON COLUMN users.role           IS 'USER or ADMIN';
COMMENT ON COLUMN users.failed_attempts IS 'Consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until   IS 'Account locked until this timestamp';

-- =============================================================================
-- TABLE: refresh_tokens
-- =============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL,
    token_hash   VARCHAR(64)  NOT NULL,
    expires_at   TIMESTAMPTZ  NOT NULL,
    revoked      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash       ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at)
    WHERE revoked = FALSE;

COMMENT ON TABLE refresh_tokens IS 'Hashed JWT refresh tokens — rotated on each use';

-- =============================================================================
-- TABLE: plans
-- =============================================================================
CREATE TABLE IF NOT EXISTS plans (
    id            BIGSERIAL       PRIMARY KEY,
    name          VARCHAR(100)    NOT NULL,
    description   TEXT,
    price         NUMERIC(10, 2)  NOT NULL CHECK (price >= 0),
    duration_days INTEGER         NOT NULL CHECK (duration_days > 0),
    max_devices   INTEGER         NOT NULL DEFAULT 5 CHECK (max_devices > 0),
    is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_plans_name UNIQUE (name)
);

CREATE INDEX idx_plans_is_active ON plans (is_active);

COMMENT ON TABLE  plans             IS 'Subscription plans offered on the platform';
COMMENT ON COLUMN plans.max_devices IS 'Maximum simultaneous connected devices allowed';

-- =============================================================================
-- TABLE: subscriptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    plan_id     BIGINT       NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                              CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    starts_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ  NOT NULL,
    cancelled_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_subscriptions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_plan
        FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE RESTRICT
);

CREATE INDEX idx_subscriptions_user_id   ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_plan_id   ON subscriptions (plan_id);
CREATE INDEX idx_subscriptions_status    ON subscriptions (status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions (expires_at)
    WHERE status = 'ACTIVE';

COMMENT ON TABLE subscriptions IS 'User plan subscriptions';

-- =============================================================================
-- TABLE: licenses
-- =============================================================================
CREATE TABLE IF NOT EXISTS licenses (
    id               BIGSERIAL    PRIMARY KEY,
    subscription_id  BIGINT       NOT NULL,
    user_id          BIGINT       NOT NULL,
    license_key      VARCHAR(64)  NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                                   CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    activated_at     TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ  NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_licenses_key UNIQUE (license_key),
    CONSTRAINT fk_licenses_subscription
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_licenses_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_licenses_user_id         ON licenses (user_id);
CREATE INDEX idx_licenses_subscription_id ON licenses (subscription_id);
CREATE INDEX idx_licenses_key             ON licenses (license_key);
CREATE INDEX idx_licenses_status          ON licenses (status);

COMMENT ON TABLE  licenses             IS 'License keys generated per subscription';
COMMENT ON COLUMN licenses.license_key IS 'Unique uppercase hex key sent to desktop app';

-- =============================================================================
-- TABLE: hotspots
-- =============================================================================
CREATE TABLE IF NOT EXISTS hotspots (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         BIGINT       NOT NULL,
    license_id      BIGINT,
    ssid            VARCHAR(32)  NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'STOPPED'
                                  CHECK (status IN ('ACTIVE', 'STOPPED', 'ERROR')),
    max_clients     INTEGER      NOT NULL DEFAULT 10 CHECK (max_clients > 0),
    started_at      TIMESTAMPTZ,
    stopped_at      TIMESTAMPTZ,
    total_bytes_up   BIGINT      NOT NULL DEFAULT 0 CHECK (total_bytes_up >= 0),
    total_bytes_down BIGINT      NOT NULL DEFAULT 0 CHECK (total_bytes_down >= 0),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hotspots_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_hotspots_license
        FOREIGN KEY (license_id) REFERENCES licenses (id) ON DELETE SET NULL
);

CREATE INDEX idx_hotspots_user_id   ON hotspots (user_id);
CREATE INDEX idx_hotspots_status    ON hotspots (status);
CREATE INDEX idx_hotspots_license_id ON hotspots (license_id);

COMMENT ON TABLE  hotspots              IS 'Hotspot sessions created by users via the desktop app';
COMMENT ON COLUMN hotspots.ssid         IS 'WiFi network name broadcast by the hotspot';
COMMENT ON COLUMN hotspots.password_hash IS 'BCrypt hash of the hotspot WiFi password';

-- =============================================================================
-- TABLE: connected_devices
-- =============================================================================
CREATE TABLE IF NOT EXISTS connected_devices (
    id             BIGSERIAL    PRIMARY KEY,
    user_id        BIGINT       NOT NULL,
    hotspot_id     BIGINT,
    mac_address    VARCHAR(17)  NOT NULL,
    device_name    VARCHAR(100),
    device_type    VARCHAR(30)  DEFAULT 'UNKNOWN'
                                CHECK (device_type IN ('PHONE','LAPTOP','TABLET','TV','DESKTOP','UNKNOWN')),
    ip_address     VARCHAR(45),
    is_blocked     BOOLEAN      NOT NULL DEFAULT FALSE,
    bytes_sent     BIGINT       NOT NULL DEFAULT 0 CHECK (bytes_sent >= 0),
    bytes_received BIGINT       NOT NULL DEFAULT 0 CHECK (bytes_received >= 0),
    connected_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    last_seen      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_connected_devices_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_connected_devices_hotspot
        FOREIGN KEY (hotspot_id) REFERENCES hotspots (id) ON DELETE SET NULL
);

CREATE INDEX idx_connected_devices_user_id    ON connected_devices (user_id);
CREATE INDEX idx_connected_devices_hotspot_id ON connected_devices (hotspot_id);
CREATE INDEX idx_connected_devices_mac        ON connected_devices (mac_address);
CREATE INDEX idx_connected_devices_is_blocked ON connected_devices (is_blocked);

COMMENT ON TABLE  connected_devices              IS 'Devices connected to user hotspots';
COMMENT ON COLUMN connected_devices.mac_address  IS 'Physical MAC address of the device';
COMMENT ON COLUMN connected_devices.is_blocked   IS 'Whether this device is blocked from connecting';

-- =============================================================================
-- TABLE: bandwidth_usage
-- =============================================================================
CREATE TABLE IF NOT EXISTS bandwidth_usage (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    hotspot_id  BIGINT,
    device_id   BIGINT,
    bytes_up    BIGINT       NOT NULL DEFAULT 0 CHECK (bytes_up >= 0),
    bytes_down  BIGINT       NOT NULL DEFAULT 0 CHECK (bytes_down >= 0),
    recorded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bandwidth_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_bandwidth_hotspot
        FOREIGN KEY (hotspot_id) REFERENCES hotspots (id) ON DELETE SET NULL,
    CONSTRAINT fk_bandwidth_device
        FOREIGN KEY (device_id) REFERENCES connected_devices (id) ON DELETE SET NULL
);

CREATE INDEX idx_bandwidth_user_id     ON bandwidth_usage (user_id);
CREATE INDEX idx_bandwidth_hotspot_id  ON bandwidth_usage (hotspot_id);
CREATE INDEX idx_bandwidth_device_id   ON bandwidth_usage (device_id);
CREATE INDEX idx_bandwidth_recorded_at ON bandwidth_usage (recorded_at DESC);
CREATE INDEX idx_bandwidth_user_time   ON bandwidth_usage (user_id, recorded_at DESC);

COMMENT ON TABLE bandwidth_usage IS 'Time-series bandwidth snapshots per device/hotspot';

-- =============================================================================
-- TABLE: payments
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    subscription_id BIGINT,
    amount          NUMERIC(10, 2)  NOT NULL CHECK (amount >= 0),
    currency        VARCHAR(3)      NOT NULL DEFAULT 'USD',
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                                     CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    gateway         VARCHAR(50),
    gateway_txn_id  VARCHAR(255),
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payments_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_subscription
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE SET NULL
);

CREATE INDEX idx_payments_user_id         ON payments (user_id);
CREATE INDEX idx_payments_subscription_id ON payments (subscription_id);
CREATE INDEX idx_payments_status          ON payments (status);
CREATE INDEX idx_payments_gateway_txn_id  ON payments (gateway_txn_id);

COMMENT ON TABLE  payments                IS 'Payment transactions for plan purchases';
COMMENT ON COLUMN payments.gateway        IS 'Payment gateway used e.g. Stripe, PayPal';
COMMENT ON COLUMN payments.gateway_txn_id IS 'Transaction ID returned by the payment gateway';

-- =============================================================================
-- TABLE: audit_logs
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT,
    action      VARCHAR(100) NOT NULL,
    entity      VARCHAR(50),
    entity_id   BIGINT,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    details     JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_id    ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action     ON audit_logs (action);
CREATE INDEX idx_audit_logs_entity     ON audit_logs (entity, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_details    ON audit_logs USING GIN (details);

COMMENT ON TABLE  audit_logs            IS 'Immutable log of user and admin actions';
COMMENT ON COLUMN audit_logs.action     IS 'e.g. LOGIN, PURCHASE_PLAN, BLOCK_DEVICE';
COMMENT ON COLUMN audit_logs.entity     IS 'Table name the action was performed on';
COMMENT ON COLUMN audit_logs.details    IS 'JSON payload with before/after or extra context';

-- =============================================================================
-- TRIGGER FUNCTION: set_updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_licenses_updated_at
    BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_hotspots_updated_at
    BEFORE UPDATE ON hotspots
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_connected_devices_updated_at
    BEFORE UPDATE ON connected_devices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Default admin user (password: admin123 — BCrypt hashed)
INSERT INTO users (email, password, name, role, is_active)
VALUES (
    'admin@wifiextender.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'Platform Admin',
    'ADMIN',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Sample plans
INSERT INTO plans (name, description, price, duration_days, max_devices, is_active)
VALUES
    ('Basic',    '1 device, 30 days',          4.99,  30,  1,  TRUE),
    ('Standard', 'Up to 5 devices, 30 days',   9.99,  30,  5,  TRUE),
    ('Pro',      'Up to 15 devices, 30 days',  19.99, 30,  15, TRUE),
    ('Annual',   'Up to 10 devices, 365 days', 79.99, 365, 10, TRUE)
ON CONFLICT (name) DO NOTHING;
