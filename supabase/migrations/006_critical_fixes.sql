-- supabase/migrations/006_critical_fixes.sql
-- Critical transaction fixes for pre-release

-- Fix 2: Checkout idempotency — prevents double order on client retry
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Fix 4: Email deduplication — prevents duplicate confirmation email on webhook retry
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Fix 1: Atomic multi-item stock decrement
-- All items decremented in one transaction. If any item has insufficient stock,
-- the entire function raises an exception (triggering a full rollback).
-- Returns TRUE on full success.
CREATE OR REPLACE FUNCTION ecom_decrement_stock_multi(p_items jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  rows_affected int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE product_variants
    SET stock_quantity = stock_quantity - (item->>'quantity')::int
    WHERE id = (item->>'variant_id')::uuid
      AND stock_quantity >= (item->>'quantity')::int;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    IF rows_affected = 0 THEN
      RAISE EXCEPTION 'insufficient_stock:%', item->>'variant_id';
    END IF;
  END LOOP;
  RETURN true;
END;
$$;
