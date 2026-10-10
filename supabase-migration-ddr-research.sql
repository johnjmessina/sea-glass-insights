-- DDR Research Brief — adds research_brief column to orders
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS research_brief JSONB;
