-- Single unlimited monthly plan only
UPDATE plans SET is_active = FALSE;

INSERT INTO plans (name, description, price, plan_type, duration_days, trial_days, max_devices, sort_order, is_popular, is_active, features)
VALUES (
  'Unlimited Monthly',
  'Unlimited devices, full WiFi extender features, renewed every 30 days.',
  9.99,
  'MONTHLY',
  30,
  0,
  -1,
  1,
  TRUE,
  TRUE,
  'Unlimited devices|30-day license|Full device monitoring|Device blocking|Bandwidth tracking|Hotspot management|Priority support'
)
ON CONFLICT (name) DO UPDATE SET
  description   = EXCLUDED.description,
  price         = EXCLUDED.price,
  plan_type     = EXCLUDED.plan_type,
  duration_days = EXCLUDED.duration_days,
  trial_days    = EXCLUDED.trial_days,
  max_devices   = EXCLUDED.max_devices,
  sort_order    = EXCLUDED.sort_order,
  is_popular    = EXCLUDED.is_popular,
  is_active     = TRUE,
  features      = EXCLUDED.features;
