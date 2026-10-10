-- VOC Survey: contacts, responses, and survey_status on orders

-- Table: survey_contacts
-- One row per recipient for a given VOC order
CREATE TABLE IF NOT EXISTS survey_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name         TEXT,
  email        TEXT NOT NULL,
  token        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  sent_at      TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS survey_contacts_order_id_idx ON survey_contacts(order_id);
CREATE INDEX IF NOT EXISTS survey_contacts_token_idx    ON survey_contacts(token);

-- Table: survey_responses
-- One row per question per respondent
CREATE TABLE IF NOT EXISTS survey_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  contact_id  UUID NOT NULL REFERENCES survey_contacts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  value       TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS survey_responses_order_id_idx   ON survey_responses(order_id);
CREATE INDEX IF NOT EXISTS survey_responses_contact_id_idx ON survey_responses(contact_id);

-- Column: orders.survey_status
-- Tracks lifecycle: draft → collecting → delivered
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS survey_status TEXT DEFAULT 'draft';
