-- =============================================================================
-- V3: Subscription system upgrade
-- =============================================================================

-- ── plans: add new columns ────────────────────────────────────────────────────
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS plan_type    VARCHAR(20)  NOT NULL DEFAULT 'MONTHLY'
                                          CHECK (plan_type IN ('MONTHLY','LIFETIME','FREE_TRIAL')),
    ADD COLUMN IF NOT EXISTS trial_days   INTEGER      NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
    ADD COLUMN IF NOT EXISTS sort_order   INTEGER      NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_popular   BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS features     TEXT;

-- Allow NULL duration_days (lifetime plans have no expiry)
ALTER TABLE plans ALTER COLUMN duration_days DROP NOT NULL;

-- Allow max_devices = -1 (unlimited)
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_max_devices_check;
ALTER TABLE plans ADD CONSTRAINT plans_max_devices_check CHECK (max_devices >= -1);

-- ── subscriptions: add new columns ───────────────────────────────────────────
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS trial_ends_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS activated_by   BIGINT,
    ADD COLUMN IF NOT EXISTS activated_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admin_notes    TEXT;

-- Allow NULL expires_at (lifetime subscriptions)
ALTER TABLE subscriptions ALTER COLUMN expires_at DROP NOT NULL;

-- Expand status check to include PENDING and DISABLED
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('PENDING','ACTIVE','EXPIRED','CANCELLED','DISABLED'));

-- FK for activated_by
ALTER TABLE subscriptions
    ADD CONSTRAINT fk_subscriptions_activated_by
    FOREIGN KEY (activated_by) REFERENCES users (id) ON DELETE SET NULL;

-- New indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_activated_by ON subscriptions (activated_by);
CREATE INDEX IF NOT EXISTS idx_plans_plan_type            ON plans (plan_type);
CREATE INDEX IF NOT EXISTS idx_plans_sort_order           ON plans (sort_order);

-- ── Seed the 4 canonical plans ────────────────────────────────────────────────
INSERT INTO plans (name, description, price, plan_type, duration_days, trial_days, max_devices, sort_order, is_popular, is_active, features)
VALUES
  ('Free Trial', 'Try WiFiExtender free for 7 days.',
   0.00, 'FREE_TRIAL', 7, 7, 3, 0, FALSE, TRUE,
   'Up to 3 devices|7-day free trial|Basic monitoring|Email support'),

  ('Starter', 'Perfect for personal use at home or on the go.',
   4.99, 'MONTHLY', 30, 0, 3, 1, FALSE, TRUE,
   'Up to 3 devices|30-day license|Basic monitoring|Bandwidth tracking|Email support'),

  ('Basic', 'For users who need more devices and advanced controls.',
   9.99, 'MONTHLY', 30, 0, 10, 2, TRUE, TRUE,
   'Up to 10 devices|30-day license|Advanced monitoring|Device blocking|Bandwidth per device|Priority support'),

  ('Premium', 'Unlimited devices for power users and teams.',
   19.99, 'MONTHLY', 30, 0, -1, 3, FALSE, TRUE,
   'Unlimited devices|30-day license|Full analytics|Device blocking|Admin panel|API access|24/7 support'),

  ('Lifetime', 'One-time payment. Never expires.',
   99.99, 'LIFETIME', NULL, 0, -1, 4, FALSE, TRUE,
   'Unlimited devices|Lifetime license|Full analytics|Device blocking|Admin panel|API access|24/7 support|Priority queue')

ON CONFLICT (name) DO UPDATE SET
  plan_type    = EXCLUDED.plan_type,
  duration_days = EXCLUDED.duration_days,
  trial_days   = EXCLUDED.trial_days,
  max_devices  = EXCLUDED.max_devices,
  sort_order   = EXCLUDED.sort_order,
  is_popular   = EXCLUDED.is_popular,
  features     = EXCLUDED.features,
  price        = EXCLUDED.price;
