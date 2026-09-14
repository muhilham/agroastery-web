-- Rename: add total_sold_count to products table
-- Purpose: denormalized aggregate sold units per product (all channels).
-- Updated by periodic sync job, not computed per-request.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS total_sold_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sold_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Populate from web sales (ecom_order_items via ecom_orders, excluding cancelled).
-- Join path: ecom_order_items → ecom_orders (id → order_id) → variant_id → product_variants (id → product_id) → products.

UPDATE public.products p
SET total_sold_count = sub.cnt
FROM (
  SELECT pv.product_id, SUM(eoi.quantity) AS cnt
  FROM public.ecom_order_items eoi
  JOIN public.ecom_orders eo ON eo.id = eoi.order_id
  JOIN public.product_variants pv ON pv.id = eoi.variant_id
  WHERE LOWER(eo.payment_status) = 'paid'  -- exclude unpaid/cancelled/expired
  GROUP BY pv.product_id
) sub
WHERE p.id = sub.product_id;

-- Default is already 0 (from ADD COLUMN), so untouched products stay at 0.
