-- ============================================================
-- Audit Fixes (2026-03-26)
-- ============================================================

-- 1. Atomic stock restore function (for expired orders and checkout rollback)
CREATE OR REPLACE FUNCTION ecom_restore_stock(p_variant_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Deactivate test/junk products with 0 variants
UPDATE products SET is_active = false
WHERE name IN ('global product', 'Tes kopi', 'test 3', 'test 4', 'test beans ilham')
   OR sku LIKE 'TEST%';

-- NOTE: Stock anomalies flagged for manual review:
--   - 3 active variants with stock=0: Ethiopia Adola, Merapi Babadan, MISHA
--   - 1 variant with stock=2,427,000: Arabica Papua Nugini PNG (likely sync error)
