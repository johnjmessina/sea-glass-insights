-- Migration: Add is_archived column to orders table
-- Run this in the Supabase SQL editor.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill existing rows
UPDATE orders SET is_archived = FALSE WHERE is_archived IS NULL;
