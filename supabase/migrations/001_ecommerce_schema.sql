-- ============================================================
-- Agroastery E-Commerce Schema Migration
-- ============================================================
-- IMPORTANT: This migration is designed to be run on the shared
-- Supabase database. It does NOT drop or modify existing ops columns.
-- ============================================================

-- ============================================================
-- 1. Extend existing `products` table (DO NOT CREATE TABLE products)
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_ids TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 2. Product Variant Tables (NEW)
-- ============================================================

-- Product option axes (e.g., "Size", "Grind Type")
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Option values (e.g., "150g", "1kg", "Fine", "Medium")
CREATE TABLE IF NOT EXISTS product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES product_options(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Concrete variants (each unique combination of option values)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  price BIGINT NOT NULL,
  compare_at_price BIGINT,
  stock_quantity INT DEFAULT 0,
  ship_weight_grams INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction: variant <-> option values
CREATE TABLE IF NOT EXISTS product_variant_option_values (
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id UUID REFERENCES product_option_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, option_value_id)
);

-- ============================================================
-- 3. User Profile Tables (NEW)
-- ============================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  default_address_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saved addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK for default_address_id after addresses table is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_default_address_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_default_address_id_fkey
      FOREIGN KEY (default_address_id) REFERENCES addresses(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Shopping cart (for logged-in users)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, variant_id)
);

-- ============================================================
-- 4. E-Commerce Order Tables (NEW — NOT the B2B `orders` table)
-- ============================================================

-- Consumer orders (SEPARATE from B2B `orders` which has client_id NOT NULL)
CREATE TABLE IF NOT EXISTS ecom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',

  -- Customer info (denormalized for guest + historical record)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,

  -- Shipping info
  shipping_address JSONB NOT NULL,
  shipping_courier TEXT,
  shipping_service TEXT,
  shipping_cost BIGINT NOT NULL DEFAULT 0,
  shipping_etd TEXT,
  tracking_number TEXT,
  biteship_order_id TEXT,

  -- Payment info
  xendit_invoice_id TEXT,
  xendit_payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ,

  -- Totals
  subtotal BIGINT NOT NULL,
  total BIGINT NOT NULL,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consumer order line items (SEPARATE from B2B `order_items`)
CREATE TABLE IF NOT EXISTS ecom_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES ecom_orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,

  -- Denormalized snapshot (so order history survives product changes)
  product_name TEXT NOT NULL,
  variant_description TEXT NOT NULL,
  unit_price BIGINT NOT NULL,
  quantity INT NOT NULL,
  subtotal BIGINT NOT NULL,
  ship_weight_grams INT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. Row Level Security (RLS)
-- NOTE: NO RLS on products, product_options, product_option_values,
-- product_variants, product_variant_option_values — these are read
-- server-side via service role key. Enabling RLS could break ops dashboard.
-- ============================================================

-- Profiles: users can read/update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Cart: users can CRUD their own cart
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- E-commerce orders: users can view their own orders
ALTER TABLE ecom_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON ecom_orders;
CREATE POLICY "Users can view own orders" ON ecom_orders FOR SELECT USING (auth.uid() = user_id);

-- E-commerce order items: users can view items of their own orders
ALTER TABLE ecom_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own order items" ON ecom_order_items;
CREATE POLICY "Users can view own order items" ON ecom_order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM ecom_orders WHERE user_id = auth.uid())
  );

-- Addresses: users can CRUD their own addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ecom_orders_user ON ecom_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ecom_orders_number ON ecom_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_ecom_orders_xendit ON ecom_orders(xendit_invoice_id);
CREATE INDEX IF NOT EXISTS idx_ecom_order_items_order ON ecom_order_items(order_id);

-- ============================================================
-- 7. Triggers
-- ============================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_product_variants_updated_at ON product_variants;
CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_cart_items_updated_at ON cart_items;
CREATE TRIGGER set_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_ecom_orders_updated_at ON ecom_orders;
CREATE TRIGGER set_ecom_orders_updated_at
  BEFORE UPDATE ON ecom_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 8. Backfill: Generate slugs for existing products
-- ============================================================
UPDATE products
SET slug = lower(regexp_replace(
  regexp_replace(name, '[^a-zA-Z0-9\s]+', '', 'g'),
  '\s+', '-', 'g'
))
WHERE slug IS NULL AND name IS NOT NULL;
