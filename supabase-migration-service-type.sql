-- Migration: Add service_type and service_data columns to orders table
-- Run this in the Supabase SQL editor.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'market_intelligence_report',
  ADD COLUMN IF NOT EXISTS service_data JSONB;

-- Backfill: existing orders without a service_type get MIR
UPDATE orders
SET service_type = 'market_intelligence_report'
WHERE service_type IS NULL;
