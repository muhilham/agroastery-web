-- ============================================================
-- E-Commerce Schema Fixes
-- ============================================================

-- 1. Namespace the updated_at trigger function to avoid overwriting ops functions
CREATE OR REPLACE FUNCTION ecom_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers to use the namespaced function
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION ecom_update_updated_at_column();

DROP TRIGGER IF EXISTS set_product_variants_updated_at ON product_variants;
CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION ecom_update_updated_at_column();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION ecom_update_updated_at_column();

DROP TRIGGER IF EXISTS set_cart_items_updated_at ON cart_items;
CREATE TRIGGER set_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION ecom_update_updated_at_column();

DROP TRIGGER IF EXISTS set_ecom_orders_updated_at ON ecom_orders;
CREATE TRIGGER set_ecom_orders_updated_at
  BEFORE UPDATE ON ecom_orders
  FOR EACH ROW EXECUTE FUNCTION ecom_update_updated_at_column();

-- 2. Add WITH CHECK to FOR ALL RLS policies
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Add CHECK constraints on order status enums
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'ecom_orders_status_check'
  ) THEN
    ALTER TABLE ecom_orders ADD CONSTRAINT ecom_orders_status_check
      CHECK (status IN ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'ecom_orders_payment_status_check'
  ) THEN
    ALTER TABLE ecom_orders ADD CONSTRAINT ecom_orders_payment_status_check
      CHECK (payment_status IN ('unpaid', 'paid', 'expired', 'refunded'));
  END IF;
END
$$;

-- 4. Atomic stock decrement function for checkout
CREATE OR REPLACE FUNCTION ecom_decrement_stock(p_variant_id UUID, p_quantity INT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INT;
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id AND stock_quantity >= p_quantity;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. Fix slug backfill: handle consecutive hyphens and trailing hyphens
UPDATE products
SET slug = trim(both '-' from regexp_replace(
  lower(regexp_replace(
    regexp_replace(name, '[^a-zA-Z0-9\s]+', '', 'g'),
    '\s+', '-', 'g'
  )),
  '-{2,}', '-', 'g'
))
WHERE slug IS NULL AND name IS NOT NULL;
