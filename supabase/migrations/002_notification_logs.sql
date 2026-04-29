-- ============================================================
-- Ecom Telegram Notification Logs
-- Stores every outbound Telegram notification attempt.
-- NOTE: The existing ops `notification_logs` table is NOT touched.
-- ============================================================

CREATE TABLE IF NOT EXISTS ecom_notification_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL,          -- 'order_created' | 'payment_confirmed'
  channel       TEXT NOT NULL DEFAULT 'telegram',
  order_id      UUID REFERENCES ecom_orders(id) ON DELETE SET NULL,
  order_number  TEXT,                   -- denormalised for quick lookup
  message       TEXT NOT NULL,          -- exact text sent to Telegram
  status        TEXT NOT NULL,          -- 'sent' | 'failed' | 'skipped'
  error         TEXT,                   -- error detail when status = 'failed'
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ecom_notification_logs_order   ON ecom_notification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_ecom_notification_logs_type    ON ecom_notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_ecom_notification_logs_status  ON ecom_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_ecom_notification_logs_created ON ecom_notification_logs(created_at DESC);

-- No RLS — read/written server-side via service role key only
