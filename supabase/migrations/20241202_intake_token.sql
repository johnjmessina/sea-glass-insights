-- Add intake token and completion timestamp to orders
-- intake_token: UUID used to identify the intake form link (permanent, no expiry)
-- intake_completed_at: set when the customer submits their intake form

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS intake_token UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS orders_intake_token_idx ON orders(intake_token);
