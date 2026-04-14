-- Add pivot_qr_string column to store raw EMVCO QRIS string for client-side rendering.
-- The existing pivot_qr_url stores a Bank Neo CDN image URL that expires and gets deleted,
-- making it unreliable for display. The raw qrString is permanent for the session lifetime.
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS pivot_qr_string TEXT;
