-- Migration: Add is_global_discountable column to products
-- This separates B2B visibility (is_global) from discount eligibility (is_global_discountable)

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_global_discountable BOOLEAN DEFAULT true;

-- Backfill: Set is_global_discountable to true for all existing active products
-- Ops can later set to false for specific products that should not receive global discounts
UPDATE products 
SET is_global_discountable = true 
WHERE is_global_discountable IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_global_discountable 
ON products(is_global_discountable) 
WHERE is_global_discountable = true;

COMMENT ON COLUMN products.is_global_discountable IS 'Whether this product is eligible for global discounts (separate from is_global which controls B2B visibility)';
