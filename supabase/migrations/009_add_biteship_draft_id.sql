-- Migration: Add biteship_draft_id column to ecom_orders
-- For Biteship draft order flow (staff confirms in dashboard before live order)

ALTER TABLE ecom_orders 
ADD COLUMN IF NOT EXISTS biteship_draft_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ecom_orders.biteship_draft_id IS 'Biteship draft order ID, created after payment. Staff confirms draft in Biteship dashboard to create live order.';
