-- Migration: Add consultation_bookings table for in-store coffee consultation bookings
-- Sessions: Tue/Wed/Thu, 11:00/14:00/17:00 WIB, 2 hours, IDR 250,000 upfront via QRIS
-- NOTE: This is a DOCUMENTARY migration for this repo. The canonical migration lives in ../agr-ops/

CREATE TABLE IF NOT EXISTS consultation_bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  purpose       TEXT NOT NULL, -- 'custom_blending' | 'product_testing'
  booking_date  DATE NOT NULL,
  time_slot     TEXT NOT NULL, -- '11:00' | '14:00' | '17:00'
  status        TEXT NOT NULL DEFAULT 'pending_payment', -- 'pending_payment' | 'confirmed' | 'cancelled' | 'expired'
  amount        BIGINT NOT NULL DEFAULT 250000,
  pivot_payment_session_id TEXT,
  pivot_qr_string        TEXT,
  pivot_qr_url           TEXT,
  pivot_qr_expires_at    TIMESTAMPTZ,
  paid_at       TIMESTAMPTZ,
  manage_token  UUID NOT NULL DEFAULT gen_random_uuid(),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at  TIMESTAMPTZ
);

-- INTENTIONALLY NO RLS on consultation_bookings: all access goes through the
-- server-side admin client with trusted filters (manage_token, user_id from
-- session, pivot_payment_session_id from verified webhook). This matches the
-- existing products/variants no-RLS pattern in this project.

-- Enforce one active booking per slot (pending_payment holds slot during QR window)
CREATE UNIQUE INDEX IF NOT EXISTS consultation_bookings_unique_active_slot
  ON consultation_bookings (booking_date, time_slot)
  WHERE status IN ('pending_payment', 'confirmed');

-- Lookup indexes
CREATE INDEX IF NOT EXISTS consultation_bookings_manage_token_idx ON consultation_bookings (manage_token);
CREATE INDEX IF NOT EXISTS consultation_bookings_pivot_session_idx ON consultation_bookings (pivot_payment_session_id);
CREATE INDEX IF NOT EXISTS consultation_bookings_user_idx ON consultation_bookings (user_id) WHERE user_id IS NOT NULL;

-- Comments
COMMENT ON TABLE consultation_bookings IS 'In-store coffee consultation bookings (Tue/Wed/Thu, 3 slots/day, 2 hours each)';
COMMENT ON COLUMN consultation_bookings.status IS 'pending_payment = QR window open (5 min), confirmed = paid, cancelled = user cancelled, expired = QR timed out';
COMMENT ON COLUMN consultation_bookings.pivot_payment_session_id IS 'Pivot QRIS payment session ID for upfront payment';
COMMENT ON COLUMN consultation_bookings.manage_token IS 'Secret token for guest self-service manage page (cancel/reschedule)';
