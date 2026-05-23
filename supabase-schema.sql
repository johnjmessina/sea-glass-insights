-- Sea Glass Insights — orders table
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run

CREATE TABLE IF NOT EXISTS orders (
  id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  customer_name           TEXT        NOT NULL,
  business_name           TEXT        NOT NULL,
  email                   TEXT        NOT NULL,
  status                  TEXT        NOT NULL DEFAULT 'pending_payment',
                          -- values: pending_payment | new | in_progress | delivered
  stripe_session_id       TEXT,
  stripe_payment_intent_id TEXT,
  paid_at                 TIMESTAMPTZ,
  q1                      TEXT,
  q2                      TEXT,
  q3                      TEXT,
  q4                      TEXT,
  q5                      TEXT,
  q6                      TEXT,
  q7                      TEXT,
  q8                      TEXT,
  q9                      TEXT,
  q10                     TEXT,
  ai_draft                JSONB,
  analyst_commentary      JSONB
);

-- Disable RLS for this private internal tool
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
