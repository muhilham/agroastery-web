# Consultation Booking Feature — Design

**Date:** 2026-07-23
**Status:** Approved
**Approach:** Dedicated booking system (custom table + API + UI, reusing existing Pivot/Resend/Telegram infrastructure)

## Overview

Customers book a 2-hour in-store coffee consultation. Sessions use the shop's professional equipment (espresso machine, EK43 grinder, Mazzer Super Jolly) for hands-on work: finding the right blend for a cafe's menu (e.g., dialing in espresso for their es kopi susu) or testing AGR products with their own ingredients.

- **Schedule:** Tuesday, Wednesday, Thursday
- **Duration:** 2 hours per session
- **Time slots:** 11:00, 14:00, 17:00 WIB
- **Fee:** IDR 250,000 per session, **paid upfront via QRIS (Pivot)**
- **Capacity:** one booking per slot (exclusive)
- **Materials:** customers bring their own (except coffee beans), or the team purchases them (cost added to final invoice) — coordinated via WhatsApp **after** booking confirmation
- **Booking window:** rolling 4 weeks
- **Management:** ops team uses the existing ops admin panel (shared Supabase DB). **The migration lives in `../agr-ops/`**, not this repo.

## User Flows

### Booking (guest or logged-in)

1. Customer opens `/konsultasi`, reads intro (equipment, use cases, materials guidelines)
2. Picks a date (only Tue/Wed/Thu within next 4 weeks shown)
3. Picks a time slot (taken slots disabled)
4. Fills contact form: name, email, WhatsApp number, purpose, optional notes
5. Submits → booking created (`pending_payment`) + Pivot QRIS session created
6. Redirected to `/konsultasi/bayar/[bookingId]` — scans QR (5-min expiry, countdown, refresh button)
7. Payment confirmed via webhook → `confirmed` → confirmation email (with manage link) + Telegram to team
8. Success page: booking details + manage link + **primary WhatsApp CTA** to coordinate materials

### Manage booking (self-service)

- Customer opens `/konsultasi/manage/[token]` (link from confirmation email)
- **Reschedule:** picks new date/slot — payment carries over, no re-payment
- **Cancel:** booking cancelled, slot releases; if paid, team gets Telegram refund alert (manual refund)

## Data Model

New table (migration in `../agr-ops/`):

```sql
CREATE TABLE consultation_bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id),      -- null for guests
  name          text NOT NULL,
  email         text NOT NULL,
  phone         text NOT NULL,                       -- WhatsApp for materials follow-up
  purpose       text NOT NULL,                       -- 'custom_blending' | 'product_testing'
  booking_date  date NOT NULL,                       -- local WIB date
  time_slot     text NOT NULL,                       -- '11:00' | '14:00' | '17:00'
  status        text NOT NULL DEFAULT 'pending_payment',
                -- 'pending_payment' | 'confirmed' | 'cancelled' | 'expired'
  amount        bigint NOT NULL DEFAULT 250000,      -- IDR, stored per-booking in case pricing changes
  pivot_payment_session_id text,
  pivot_qr_string        text,                       -- same column pattern as ecom_orders
  pivot_qr_url           text,
  pivot_qr_expires_at    timestamptz,
  paid_at       timestamptz,
  manage_token  uuid NOT NULL DEFAULT gen_random_uuid(),  -- guest self-service link
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  cancelled_at  timestamptz
);

-- Pending payment HOLDS the slot; expired/cancelled releases it
CREATE UNIQUE INDEX consultation_bookings_unique_active_slot
  ON consultation_bookings (booking_date, time_slot)
  WHERE status IN ('pending_payment', 'confirmed');
```

**Key decisions:**

- **Date + slot string** (not timestamps) — slots are fixed local WIB times; keeps availability logic simple, no timezone math
- **Partial unique index** — enforces one active booking per slot at DB level, handles race conditions; cancelled/expired bookings release the slot automatically
- **`pending_payment` holds the slot** for the 5-minute QR window, then releases on expiry
- **`manage_token`** — random UUID in the manage link, same pattern as guest order tracking
- **`amount` stored per booking** — pricing may change; history stays accurate
- No `completed` status for now — ops can extend in their panel later (YAGNI)

## API Routes

All under `app/api/consultations/` unless noted. Node runtime, Zod validation, `{ error, code? }` responses.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/consultations/availability` | GET | Available slots for rolling 4-week window |
| `/api/consultations` | POST | Create booking + Pivot QRIS session |
| `/api/consultations/[id]/status` | GET | Payment status for polling (mirrors `/api/orders/[orderId]/status`) |
| `/api/consultations/refresh-qr` | POST | New QR session for expired pending booking (mirrors checkout refresh-qr) |
| `/api/consultations/manage/[token]` | GET | Booking details for manage page |
| `/api/consultations/manage/[token]/cancel` | POST | Cancel booking |
| `/api/consultations/manage/[token]/reschedule` | POST | Change date/slot |
| `/api/webhooks/pivot` (extend existing) | POST | Handle consultation payment events |

### Availability

Uses admin client. Generates Tue/Wed/Thu dates for the next 4 weeks, excludes past dates, joins active bookings (`pending_payment` + `confirmed`) to mark taken slots:

```typescript
{ dates: [{ date: "2026-07-28", slots: [
  { time: "11:00", available: true },
  { time: "14:00", available: false },
  { time: "17:00", available: true }
]}, ...] }
```

### Create booking

- Zod validates: date is Tue/Wed/Thu, valid slot, within 4-week window, not in past, phone format
- If user session exists, attach `user_id`
- Insert with `status='pending_payment'`; unique index race → `23505` → `{ error: "Slot baru saja dipesan", code: "SLOT_TAKEN" }`
- On Pivot session failure: delete the booking row (don't hold the slot), return 500
- On success: store `pivot_payment_session_id`, `pivot_qr_string`, `pivot_qr_url`, `pivot_qr_expires_at`; return `bookingId` + QR data
- **No notifications at this stage** — they fire on payment confirmation

### Webhook extension (`/api/webhooks/pivot`)

Existing handler looks up `ecom_orders` by `pivot_payment_session_id`; if not found, falls through to `consultation_bookings`:

- `PAYMENT.PAID` → `status='confirmed'`, `paid_at` set → fire-and-forget: confirmation email (with manage link) + Telegram to team. Idempotent (skip if already `confirmed`).
- `PAYMENT.EXPIRED` / `PAYMENT.CANCELLED` → `status='expired'` → slot releases. Idempotent via status guard (same `.not(...)` pattern as existing code).
- Same `verifyPivotCallback` auth, fast-200 + fire-and-forget pattern.

### Cancel

Validates: booking exists, is `confirmed`, not in the past. Sets `status='cancelled'`, `cancelled_at=now()`. Slot auto-releases (partial index). Sends cancellation email + Telegram **refund alert** to team (refunds are manual). Double-cancel → idempotent 200.

### Reschedule

Same Zod validation as create. Updates `booking_date`/`time_slot` on the existing record — unique index protects against double-booking (`SLOT_TAKEN`). `manage_token` unchanged — link never breaks. Payment carries over; no re-payment. Sends updated confirmation email.

### Manage endpoints

Look up by `manage_token` only, no auth required (token is the secret). Logged-in users additionally see their bookings listed on the account page via `user_id` query (read-only list + link to manage page).

## UI / Pages

### `/konsultasi` — booking page (Bahasa Indonesia)

Single-page progressive disclosure (mobile-friendly, no wizard overhead):

```
┌─────────────────────────────────┐
│  Konsultasi Kopi                │
│  2 jam • Rp 250.000             │
│                                 │
│  Gunakan peralatan kami:        │
│  espresso machine, EK43,        │
│  Mazzer Super Jolly             │
│                                 │
│  Cocok untuk: kembangkan blend  │
│  untuk menu kafe Anda, atau     │
│  coba produk kami dengan bahan  │
│  Anda sendiri.                  │
│                                 │
│  Bawa bahan sendiri (susu,      │
│  gula, dll) — kecuali biji      │
│  kopi. Atau tim kami bisa       │
│  belanjakan (biaya ditambah ke  │
│  invoice akhir).                │
│                                 │
│  [WhatsApp: Ada pertanyaan?     │
│   Chat kami]                    │
├─────────────────────────────────┤
│  1. Pilih Tanggal               │
│  [Sel 28] [Rab 29] [Kam 30] ... │  ← 4-week horizontal scroll, Tue/Wed/Thu only
├─────────────────────────────────┤
│  2. Pilih Waktu (revealed)      │
│  [11:00] [14:00 ✕] [17:00]      │  ← taken slots disabled
├─────────────────────────────────┤
│  3. Data Diri (revealed)        │
│  Nama, Email, No. WhatsApp      │
│  Tujuan:                        │
│   ( ) Cari blend yang cocok     │
│       untuk menu saya           │
│   ( ) Coba produk/biji kopi AGR │
│  Catatan: "Ceritakan menu       │
│  andalan Anda atau bahan yang   │
│  ingin dibawa (opsional)"       │
│  [ Bayar & Konfirmasi ]         │
└─────────────────────────────────┘
```

- Custom-built date picker — simple horizontal scroll of date cards (~12 valid dates in 4 weeks), no calendar library
- React Hook Form + Zod (existing pattern); logged-in users get name/email/phone pre-filled from profile
- Local component state only — no Nanostore needed

### `/konsultasi/bayar/[bookingId]` — QR payment page

Consultation-specific page following the `QrPaymentClient` pattern (checkout component left untouched — minimal intrusion):

- QRIS rendered client-side from `qrString` (`react-qr-code`), download QR button
- 5-minute countdown ring; "Perbarui QR" button (enabled near expiry) → `/api/consultations/refresh-qr`
- Polls `/api/consultations/[id]/status` every 3s → on `confirmed` redirect to success; on `expired` stop polling
- `[DEV] Simulate Payment` button in development → new `/api/dev/simulate-consultation-payment` route (takes `bookingId`, looks up `pivot_payment_session_id`, calls existing `simulatePayment()`; existing order route untouched)

### `/konsultasi/sukses` — success page

- "Pembayaran berhasil — slot kamu terkonfirmasi" + booking details + manage link
- **Primary CTA: "Koordinasi bahan via WhatsApp"** — pre-filled message with booking date/time
- Note that the team will also reach out via WhatsApp about materials

### `/konsultasi/manage/[token]` — manage page

- Booking card: date, time, purpose, status, contact info
- `confirmed` + upcoming → inline reschedule picker (same availability API) + "Batalkan Booking" (confirmation dialog, notes refund is processed manually)
- `cancelled` → cancelled state + link to book again
- Past booking → read-only
- Invalid token → generic "booking tidak ditemukan" (no info leakage)
- "Butuh bantuan? Chat kami" WhatsApp link with booking context pre-filled

### Account page integration (minimal)

Logged-in users see upcoming consultations on their existing account page — read-only list + manage links.

### Entry points

- "Konsultasi" link in main navigation
- Optional homepage CTA section linking to `/konsultasi`

## Notifications

### Email (Resend) — new templates under `lib/resend/templates/`

| Email | Trigger | Contents |
|---|---|---|
| Booking confirmation | Webhook `PAID` | Booking details, manage link, materials guidelines, WhatsApp CTA |
| Booking updated | Reschedule | New date/time, manage link |
| Booking cancelled | Cancel | Cancellation confirmation, refund note (processed manually) |

Fire-and-forget, logged, never block responses (existing pattern).

### Telegram (team) — consultation-specific messages (new `lib/consultations/notify.ts`)

| Message | Trigger |
|---|---|
| New booking confirmed | Webhook `PAID` — customer name/phone, date, slot, purpose, notes |
| Booking cancelled + refund alert | Paid cancellation — includes customer contact + amount |
| Slot conflict alert | `PAID` after `EXPIRED` when slot was retaken — ops resolves manually |

### WhatsApp touchpoints

Shop number from footer (`+62 897-9092-726` → `wa.me/628979092726`).

- New env var `NEXT_PUBLIC_WHATSAPP_NUMBER` (default `628979092726`), added to `.env.example`
- Helper `lib/whatsapp.ts`: `buildWhatsAppLink(message)` → `https://wa.me/{number}?text={encoded}`
- Pre-filled messages per touchpoint:

| Location | CTA style | Pre-filled message |
|---|---|---|
| Booking page intro | Secondary/outline | `Halo, saya mau tanya tentang konsultasi kopi` |
| Success page | **Primary CTA** | `Halo, saya sudah booking konsultasi tanggal {date} jam {time}. Saya mau koordinasi bahan.` |
| Manage page | Secondary/outline | `Halo, saya mau tanya soal booking konsultasi saya (tanggal {date} jam {time})` |
| Confirmation email | Button/link | Same as success page |

## Error Handling

| Scenario | Behavior |
|---|---|
| Race: two users book same slot | Unique index → `23505` → `code: "SLOT_TAKEN"`; UI shows message + refreshes availability |
| Pivot session creation fails after insert | Delete booking row (don't hold slot), return 500 |
| Refresh-QR on non-pending booking | `400` "booking tidak menunggu pembayaran" → UI prompts rebook |
| `PAID` after `EXPIRED` + slot retaken | Unique violation caught → `paid_at` recorded, Telegram conflict alert, ops resolves manually |
| Cancel/reschedule past booking | `400` "booking sudah lewat" |
| Manage token not found | `404` generic message |
| Double-cancel | Idempotent 200 |
| Email/Telegram failure | Fire-and-forget, logged |
| Zod validation | `400` with field errors; invalid day/slot/window rejected server-side |

## Testing

Vitest + jsdom via `pnpm test`, following existing patterns:

- **Unit:** booking Zod schema (valid Tue/Wed/Thu, slot, 4-week window, phone); availability generator (day filtering, past exclusion, taken-slot merging); `buildWhatsAppLink`
- **API routes:** create booking (validation, `SLOT_TAKEN` mapping, Pivot failure cleanup); webhook consultation branch (`PAID` idempotency, `EXPIRED` releases slot, conflict alert); cancel/reschedule rules (past booking, token 404, idempotent cancel); refresh-qr status guard
- **Component:** booking flow progressive disclosure; QR page polling/refresh (mirroring `qr-payment-client.test.tsx`)

## Out of Scope

- Automated refunds (manual via ops)
- Automated session reminders (team WhatsApps manually)
- `completed` status / post-session follow-up
- Materials pre-selection during booking (coordinated post-booking via WhatsApp)
- Ops admin UI in this repo (uses existing ops panel)
