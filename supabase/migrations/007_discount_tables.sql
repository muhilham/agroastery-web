-- Migration: Add discount tables for global and product-specific discounts
-- Created: 2026-04-21

-- NOTE: These tables have no RLS policies. All access is via service role (createSupabaseAdminClient).
-- This is intentional - discounts are managed by ops and read by server-side code only.
-- Never expose these tables directly to client-side code.

-- Global discounts: apply per-item to products with is_global_discountable = true
CREATE TABLE IF NOT EXISTS global_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'nominal')),
  value BIGINT NOT NULL CHECK (value >= 0),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product-specific discounts: apply to one specific product's variants
CREATE TABLE IF NOT EXISTS product_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'nominal')),
  value BIGINT NOT NULL CHECK (value >= 0),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_discounts_active ON global_discounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_discounts_product ON product_discounts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_discounts_active ON product_discounts(is_active) WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE global_discounts IS 'Global discounts applied per-item to products with is_global_discountable = true. No RLS - use service role only.';
COMMENT ON TABLE product_discounts IS 'Product-specific discounts applied to variants of a specific product. No RLS - use service role only.';
COMMENT ON COLUMN global_discounts.type IS 'Discount type: percentage (%) or nominal (fixed IDR amount)';
COMMENT ON COLUMN product_discounts.type IS 'Discount type: percentage (%) or nominal (fixed IDR amount)';
COMMENT ON COLUMN global_discounts.value IS 'Discount value: percentage (0-100) or nominal amount in IDR (no decimals)';
COMMENT ON COLUMN product_discounts.value IS 'Discount value: percentage (0-100) or nominal amount in IDR (no decimals)';
