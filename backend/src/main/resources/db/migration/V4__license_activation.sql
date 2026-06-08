-- =============================================================================
-- V4: License activation system upgrade
-- =============================================================================

-- ── licenses: add machine binding + revocation columns ───────────────────────
ALTER TABLE licenses
    ADD COLUMN IF NOT EXISTS machine_id      VARCHAR(64),
    ADD COLUMN IF NOT EXISTS machine_label   VARCHAR(200),
    ADD COLUMN IF NOT EXISTS max_activations INTEGER     NOT NULL DEFAULT 1 CHECK (max_activations >= 1),
    ADD COLUMN IF NOT EXISTS activation_count INTEGER    NOT NULL DEFAULT 0 CHECK (activation_count >= 0),
    ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_reason  VARCHAR(500),
    ADD COLUMN IF NOT EXISTS revoked_by      BIGINT,
    ADD COLUMN IF NOT EXISTS revoked_at      TIMESTAMPTZ;

-- Allow NULL expires_at (lifetime licenses)
ALTER TABLE licenses ALTER COLUMN expires_at DROP NOT NULL;

-- FK for revoked_by
ALTER TABLE licenses
    ADD CONSTRAINT fk_licenses_revoked_by
    FOREIGN KEY (revoked_by) REFERENCES users (id) ON DELETE SET NULL;

-- Index on machine_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON licenses (machine_id)
    WHERE machine_id IS NOT NULL;

-- ── license_activations: audit log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS license_activations (
    id             BIGSERIAL    PRIMARY KEY,
    license_id     BIGINT       NOT NULL,
    machine_id     VARCHAR(64)  NOT NULL,
    machine_label  VARCHAR(200),
    ip_address     VARCHAR(45),
    result         VARCHAR(20)  NOT NULL DEFAULT 'SUCCESS'
                                CHECK (result IN ('SUCCESS','FAILED','REACTIVATED')),
    failure_reason VARCHAR(300),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lic_act_license
        FOREIGN KEY (license_id) REFERENCES licenses (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lic_act_license_id  ON license_activations (license_id);
CREATE INDEX IF NOT EXISTS idx_lic_act_machine_id  ON license_activations (machine_id);
CREATE INDEX IF NOT EXISTS idx_lic_act_created_at  ON license_activations (created_at DESC);

COMMENT ON TABLE  license_activations IS 'Audit log of every license activation attempt';
COMMENT ON COLUMN license_activations.result IS 'SUCCESS=first activation, REACTIVATED=same machine, FAILED=rejected';
