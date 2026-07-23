# Consultation Booking Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a consultation booking feature where customers book 2-hour in-store coffee consultation slots (Tue/Wed/Thu, 11:00/14:00/17:00 WIB), pay IDR 250,000 upfront via Pivot QRIS, and self-manage (cancel/reschedule) via token links.

**Architecture:** New `consultation_bookings` table (migration lives in `../agr-ops/` — shared Supabase DB, ops panel reads it directly). Web app adds API routes under `app/api/consultations/`, pages under `app/(root)/konsultasi/`, extends the existing Pivot webhook to handle consultation payments, and sends Resend emails + Telegram alerts on payment confirmation. QR payment page mirrors the existing checkout `QrPaymentClient` pattern without modifying checkout code.

**Tech Stack:** Next.js 16 App Router (Node runtime), Supabase (`createSupabaseAdminClient` / `createSupabaseServerClient`), Pivot QRIS (`lib/pivot/client.ts`), Resend, Telegram, React Hook Form + Zod, Tailwind, Vitest + jsdom (`pnpm test`).

**Spec:** `docs/superpowers/specs/2026-07-23-consultation-booking-design.md`

**Key conventions (from AGENTS.md):**
- Money = BIGINT IDR. No `runtime = 'edge'`. Structured errors `{ error, code? }`.
- Tests run via `pnpm test` (NOT `vitest` directly — needs crypto polyfill runner).
- Import alias `@/`. Commit style: `feat(scope): message`.

---

## File Structure

**Create:**
- `lib/consultations/constants.ts` — slots, valid weekdays, fee, window
- `lib/consultations/availability.ts` — pure availability generator + tests
- `lib/consultations/schema.ts` — Zod schemas (create / reschedule) + tests
- `lib/consultations/notify.ts` — Telegram messages for team
- `lib/whatsapp.ts` — `buildWhatsAppLink` helper + tests
- `lib/resend/sendConsultationEmail.ts` + `lib/resend/templates/ConsultationBooking.tsx`
- `app/api/consultations/availability/route.ts`
- `app/api/consultations/route.ts` (create booking)
- `app/api/consultations/[id]/status/route.ts`
- `app/api/consultations/refresh-qr/route.ts`
- `app/api/consultations/manage/[token]/route.ts` (GET)
- `app/api/consultations/manage/[token]/cancel/route.ts`
- `app/api/consultations/manage/[token]/reschedule/route.ts`
- `app/api/dev/simulate-consultation-payment/route.ts`
- `app/(root)/konsultasi/page.tsx` + `booking-flow.tsx` (client)
- `app/(root)/konsultasi/bayar/[bookingId]/page.tsx` + `qr-consultation-client.tsx`
- `app/(root)/konsultasi/sukses/page.tsx`
- `app/(root)/konsultasi/manage/[token]/page.tsx` + `manage-booking-client.tsx`

**Modify:**
- `app/api/webhooks/pivot/route.ts` — fall through to `consultation_bookings` when no `ecom_orders` match
- `components/navigation/index.tsx` — add "Konsultasi" link
- `app/(root)/account/page.tsx` — upcoming consultations list
- `.env.example` — `NEXT_PUBLIC_WHATSAPP_NUMBER`

**External (NOT in this repo):** migration for `consultation_bookings` in `../agr-ops/`. The web app code assumes the table exists per the spec. Task 1 includes a Supabase MCP migration for the dev database so local/dev testing works.

---

### Task 1: Database migration (dev) + shared constants

**Files:**
- Create: `lib/consultations/constants.ts`
- Test: `lib/consultations/constants.test.ts`
- External: apply migration to dev DB via Supabase MCP `apply_migration`

- [ ] **Step 1: Apply the table migration to the dev database**

Use the Supabase MCP `apply_migration` tool with name `consultation_bookings`:

```sql
CREATE TABLE consultation_bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id),
  name          text NOT NULL,
  email         text NOT NULL,
  phone         text NOT NULL,
  purpose       text NOT NULL,
  booking_date  date NOT NULL,
  time_slot     text NOT NULL,
  status        text NOT NULL DEFAULT 'pending_payment',
  amount        bigint NOT NULL DEFAULT 250000,
  pivot_payment_session_id text,
  pivot_qr_string        text,
  pivot_qr_url           text,
  pivot_qr_expires_at    timestamptz,
  paid_at       timestamptz,
  manage_token  uuid NOT NULL DEFAULT gen_random_uuid(),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  cancelled_at  timestamptz
);

-- INTENTIONALLY NO RLS on consultation_bookings: all access goes through the
-- server-side admin client with trusted filters (manage_token, user_id from
-- session, pivot_payment_session_id from verified webhook). This matches the
-- existing products/variants no-RLS pattern in this project. Do NOT enable
-- RLS without adding policies for every server access path.

CREATE UNIQUE INDEX consultation_bookings_unique_active_slot
  ON consultation_bookings (booking_date, time_slot)
  WHERE status IN ('pending_payment', 'confirmed');

CREATE INDEX consultation_bookings_manage_token_idx ON consultation_bookings (manage_token);
CREATE INDEX consultation_bookings_pivot_session_idx ON consultation_bookings (pivot_payment_session_id);
CREATE INDEX consultation_bookings_user_idx ON consultation_bookings (user_id) WHERE user_id IS NOT NULL;
```

NOTE: the canonical migration must also be added to `../agr-ops/` (ask the user to do this or confirm it was done) — ops panel repo owns migrations.

- [ ] **Step 2: Write the failing constants test**

Create `lib/consultations/constants.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  CONSULTATION_TIME_SLOTS,
  CONSULTATION_WEEKDAYS,
  CONSULTATION_FEE_IDR,
  CONSULTATION_WINDOW_WEEKS,
  isConsultationSlot,
} from "./constants";

describe("consultation constants", () => {
  it("defines exactly three slots", () => {
    expect(CONSULTATION_TIME_SLOTS).toEqual(["11:00", "14:00", "17:00"]);
  });

  it("defines Tue/Wed/Thu as valid weekdays (JS getDay: 2,3,4)", () => {
    expect(CONSULTATION_WEEKDAYS).toEqual([2, 3, 4]);
  });

  it("fee is 250k IDR", () => {
    expect(CONSULTATION_FEE_IDR).toBe(250_000);
  });

  it("window is 4 weeks", () => {
    expect(CONSULTATION_WINDOW_WEEKS).toBe(4);
  });

  it("isConsultationSlot validates slot strings", () => {
    expect(isConsultationSlot("11:00")).toBe(true);
    expect(isConsultationSlot("17:00")).toBe(true);
    expect(isConsultationSlot("10:00")).toBe(false);
    expect(isConsultationSlot("")).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test lib/consultations/constants.test.ts`
Expected: FAIL — module `./constants` does not exist

- [ ] **Step 4: Implement constants**

Create `lib/consultations/constants.ts`:

```typescript
/** Consultation booking shared constants (WIB local time). */

/** Fixed 2-hour session start times, stored as "HH:MM" strings. */
export const CONSULTATION_TIME_SLOTS = ["11:00", "14:00", "17:00"] as const;

export type ConsultationTimeSlot = (typeof CONSULTATION_TIME_SLOTS)[number];

/** Valid consultation weekdays as JS Date.getDay() values: Tue=2, Wed=3, Thu=4. */
export const CONSULTATION_WEEKDAYS = [2, 3, 4] as const;

/** Session fee in IDR (bigint-safe integer). */
export const CONSULTATION_FEE_IDR = 250_000;

/** Rolling booking window in weeks. */
export const CONSULTATION_WINDOW_WEEKS = 4;

/** Human-readable purpose labels keyed by DB enum value. */
export const CONSULTATION_PURPOSES = {
  custom_blending: "Cari blend yang cocok untuk menu saya",
  product_testing: "Coba produk/biji kopi AGR",
} as const;

export type ConsultationPurpose = keyof typeof CONSULTATION_PURPOSES;

export function isConsultationSlot(value: string): value is ConsultationTimeSlot {
  return (CONSULTATION_TIME_SLOTS as readonly string[]).includes(value);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test lib/consultations/constants.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/consultations/constants.ts lib/consultations/constants.test.ts
git commit -m "feat(consultations): add shared booking constants"
```

---

### Task 2: Availability generator (pure function)

**Files:**
- Create: `lib/consultations/availability.ts`
- Test: `lib/consultations/availability.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/consultations/availability.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateConsultationAvailability } from "./availability";

// 2026-07-23 is a Thursday (WIB).
const THU = new Date("2026-07-23T09:00:00+07:00");

describe("generateConsultationAvailability", () => {
  it("only returns Tue/Wed/Thu dates", () => {
    const result = generateConsultationAvailability(THU, []);
    for (const d of result) {
      // TZ-independent assertion: parse string, use UTC getters
      const [y, m, dd] = d.date.split("-").map(Number);
      const day = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
      expect([2, 3, 4]).toContain(day);
    }
  });

  it("covers 4 weeks of valid days (12 dates) starting after today", () => {
    const result = generateConsultationAvailability(THU, []);
    expect(result).toHaveLength(12);
    // Today is Thursday — same-day slots may already be past, so the first
    // bookable date is next Tuesday 2026-07-28.
    expect(result[0].date).toBe("2026-07-28");
    expect(result[11].date).toBe("2026-08-20");
  });

  it("marks taken slots unavailable", () => {
    const result = generateConsultationAvailability(THU, [
      { booking_date: "2026-07-28", time_slot: "14:00" },
    ]);
    const tue = result.find((d) => d.date === "2026-07-28")!;
    expect(tue.slots).toEqual([
      { time: "11:00", available: true },
      { time: "14:00", available: false },
      { time: "17:00", available: true },
    ]);
  });

  it("ignores bookings outside the window", () => {
    const result = generateConsultationAvailability(THU, [
      { booking_date: "2027-01-05", time_slot: "11:00" },
    ]);
    expect(result.every((d) => d.slots.every((s) => s.available))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/consultations/availability.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement availability generator**

Create `lib/consultations/availability.ts`:

```typescript
import {
  CONSULTATION_TIME_SLOTS,
  CONSULTATION_WEEKDAYS,
  CONSULTATION_WINDOW_WEEKS,
} from "./constants";

export interface SlotAvailability {
  time: string;
  available: boolean;
}

export interface DateAvailability {
  date: string; // YYYY-MM-DD (WIB)
  slots: SlotAvailability[];
}

interface ActiveBooking {
  booking_date: string; // YYYY-MM-DD
  time_slot: string;
}

/** Format a Date as YYYY-MM-DD in WIB. */
function toWibDateString(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/**
 * Pure generator: valid consultation dates (Tue/Wed/Thu) for the rolling
 * window, starting the day after `now` (same-day slots may be in the past),
 * with taken slots marked unavailable.
 */
export function generateConsultationAvailability(
  now: Date,
  activeBookings: ActiveBooking[]
): DateAvailability[] {
  const taken = new Set(activeBookings.map((b) => `${b.booking_date}|${b.time_slot}`));
  const result: DateAvailability[] = [];

  // Iterate day-by-day starting tomorrow (WIB), collecting valid weekdays
  // until we have 4 weeks worth (12 days = 3 days/week * 4 weeks).
  const cursor = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  cursor.setDate(cursor.getDate() + 1);

  const maxDays = CONSULTATION_WINDOW_WEEKS * 7;
  for (let i = 0; i < maxDays; i++) {
    const day = cursor.getDay();
    if ((CONSULTATION_WEEKDAYS as readonly number[]).includes(day)) {
      const dateStr = toWibDateString(cursor);
      result.push({
        date: dateStr,
        slots: CONSULTATION_TIME_SLOTS.map((time) => ({
          time,
          available: !taken.has(`${dateStr}|${time}`),
        })),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/consultations/availability.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/consultations/availability.ts lib/consultations/availability.test.ts
git commit -m "feat(consultations): add availability generator"
```

---

### Task 3: Zod schemas for create/reschedule

**Files:**
- Create: `lib/consultations/schema.ts`
- Test: `lib/consultations/schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/consultations/schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { CreateBookingSchema, RescheduleSchema } from "./schema";

const valid = {
  name: "Budi",
  email: "budi@example.com",
  phone: "08123456789",
  purpose: "custom_blending",
  booking_date: "2026-07-28", // a Tuesday
  time_slot: "11:00",
  notes: "Bawa susu sendiri",
};

describe("CreateBookingSchema", () => {
  it("accepts a valid booking", () => {
    expect(CreateBookingSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts product_testing purpose and empty notes", () => {
    const r = CreateBookingSchema.safeParse({ ...valid, purpose: "product_testing", notes: undefined });
    expect(r.success).toBe(true);
  });

  it("rejects invalid purpose", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, purpose: "cupping" }).success).toBe(false);
  });

  it("rejects invalid slot", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, time_slot: "10:00" }).success).toBe(false);
  });

  it("rejects non-Tue/Wed/Thu date (2026-07-27 is Monday)", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, booking_date: "2026-07-27" }).success).toBe(false);
  });

  it("rejects malformed date", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, booking_date: "28/07/2026" }).success).toBe(false);
  });

  it("rejects bad email and short phone", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(CreateBookingSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });
});

describe("RescheduleSchema", () => {
  it("accepts valid date+slot", () => {
    expect(RescheduleSchema.safeParse({ booking_date: "2026-07-29", time_slot: "17:00" }).success).toBe(true);
  });

  it("rejects invalid weekday", () => {
    expect(RescheduleSchema.safeParse({ booking_date: "2026-07-26", time_slot: "11:00" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/consultations/schema.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement schemas**

Create `lib/consultations/schema.ts`:

```typescript
import { z } from "zod";
import {
  CONSULTATION_TIME_SLOTS,
  CONSULTATION_WEEKDAYS,
  CONSULTATION_WINDOW_WEEKS,
} from "./constants";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Day-of-week for a YYYY-MM-DD string, TZ-independent.
 * Parse the string directly and read via UTC getters — never
 * `new Date(str + "T00:00:00+07:00").getDay()`, which re-projects the
 * instant onto the process timezone (UTC on Railway → off-by-one weekday).
 */
function wibWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Today's date as YYYY-MM-DD in WIB. */
function wibToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** Date (WIB) exactly `weeks` from today, as YYYY-MM-DD. */
function wibMaxDate(weeks: number): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  d.setDate(d.getDate() + weeks * 7);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

const BookingDateSchema = z
  .string()
  .regex(DATE_RE, "Format tanggal harus YYYY-MM-DD")
  .refine((d) => {
    const [y, m, day] = d.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, day));
    // Reject impossible dates like 2026-02-30 (rolls over to March)
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === day;
  }, "Tanggal tidak valid")
  .refine((d) => (CONSULTATION_WEEKDAYS as readonly number[]).includes(wibWeekday(d)), {
    message: "Konsultasi hanya tersedia Selasa–Kamis",
  })
  .refine((d) => d > wibToday(), "Tanggal sudah lewat")
  .refine((d) => d <= wibMaxDate(CONSULTATION_WINDOW_WEEKS), "Maksimal 4 minggu ke depan");

const TimeSlotSchema = z.enum(CONSULTATION_TIME_SLOTS);

export const CreateBookingSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(20),
  purpose: z.enum(["custom_blending", "product_testing"]),
  booking_date: BookingDateSchema,
  time_slot: TimeSlotSchema,
  notes: z.string().trim().max(500).optional(),
});

export const RescheduleSchema = z.object({
  booking_date: BookingDateSchema,
  time_slot: TimeSlotSchema,
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type RescheduleInput = z.infer<typeof RescheduleSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/consultations/schema.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/consultations/schema.ts lib/consultations/schema.test.ts
git commit -m "feat(consultations): add booking zod schemas"
```

---

### Task 4: WhatsApp link helper

**Files:**
- Create: `lib/whatsapp.ts`
- Test: `lib/whatsapp.test.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write the failing test**

Create `lib/whatsapp.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildWhatsAppLink } from "./whatsapp";

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with encoded message", () => {
    const link = buildWhatsAppLink("Halo, saya mau tanya");
    expect(link).toBe(
      "https://wa.me/628979092726?text=" + encodeURIComponent("Halo, saya mau tanya")
    );
  });

  it("encodes newlines and braces from booking context", () => {
    const msg = "Booking tanggal 2026-07-28 jam 11:00.\nSaya mau koordinasi bahan.";
    const link = buildWhatsAppLink(msg);
    expect(link.startsWith("https://wa.me/628979092726?text=")).toBe(true);
    expect(link).toContain(encodeURIComponent("\n"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/whatsapp.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement helper**

Create `lib/whatsapp.ts`:

```typescript
/** Shop WhatsApp in wa.me format (country code, no +). */
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "628979092726";

/** Build a wa.me click-to-chat link with a pre-filled message. */
export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/whatsapp.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Add env var to `.env.example`**

Append to `.env.example`:

```
# Shop WhatsApp number in wa.me format (country code, no + or spaces)
NEXT_PUBLIC_WHATSAPP_NUMBER=628979092726
```

- [ ] **Step 6: Run test again (env-independent) and commit**

Run: `pnpm test lib/whatsapp.test.ts`
Expected: PASS

```bash
git add lib/whatsapp.ts lib/whatsapp.test.ts .env.example
git commit -m "feat(consultations): add whatsapp link helper"
```

---

### Task 5: Availability API route

**Files:**
- Create: `app/api/consultations/availability/route.ts`
- Test: `app/api/consultations/availability/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/api/consultations/availability/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockIn = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ select: mockSelect }),
  }),
}));

import { GET } from "./route";

describe("GET /api/consultations/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Chain: select -> in -> gte -> lte (resolves)
    mockSelect.mockReturnValue({ in: mockIn });
    mockIn.mockReturnValue({ gte: mockGte });
    mockGte.mockReturnValue({ lte: mockLte });
  });

  it("returns dates with slots, taken slots unavailable", async () => {
    mockLte.mockResolvedValue({
      data: [{ booking_date: "2026-07-28", time_slot: "11:00" }],
      error: null,
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json.dates)).toBe(true);
    expect(json.dates.length).toBeGreaterThan(0);
    for (const d of json.dates) {
      expect(d.slots).toHaveLength(3);
    }
    // The taken slot (if in window) must be unavailable; find any date and check shape
    const first = json.dates[0];
    expect(first).toHaveProperty("date");
    expect(first.slots[0]).toHaveProperty("time");
    expect(first.slots[0]).toHaveProperty("available");
  });

  it("returns 500 on db error", async () => {
    mockLte.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test app/api/consultations/availability/route.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement the route**

Create `app/api/consultations/availability/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateConsultationAvailability } from "@/lib/consultations/availability";
import { CONSULTATION_WINDOW_WEEKS } from "@/lib/consultations/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const now = new Date();
  const todayWib = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const max = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  max.setDate(max.getDate() + CONSULTATION_WINDOW_WEEKS * 7);
  const maxWib = max.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const { data, error } = await supabase
    .from("consultation_bookings")
    .select("booking_date, time_slot")
    .in("status", ["pending_payment", "confirmed"])
    .gte("booking_date", todayWib)
    .lte("booking_date", maxWib);

  if (error) {
    console.error("[consultations/availability] DB error:", error);
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 });
  }

  const dates = generateConsultationAvailability(
    now,
    (data ?? []).map((b) => ({
      booking_date: String(b.booking_date),
      time_slot: String(b.time_slot),
    }))
  );

  return NextResponse.json({ dates });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test app/api/consultations/availability/route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/consultations/availability/
git commit -m "feat(consultations): add availability api route"
```

---

### Task 6: Create booking API route (+ Pivot session)

**Files:**
- Create: `app/api/consultations/route.ts`
- Test: `app/api/consultations/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/api/consultations/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockDeleteEq = vi.fn();
const mockUpdateEq = vi.fn();
const mockGetUser = vi.fn();
const mockCreateQris = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      insert: mockInsert,
      delete: () => ({ eq: mockDeleteEq }),
      update: () => ({ eq: mockUpdateEq }),
    }),
  }),
  createSupabaseServerClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/pivot/client", () => ({
  createQrisPaymentSession: (...args: unknown[]) => mockCreateQris(...args),
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/consultations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Budi",
  email: "budi@example.com",
  phone: "08123456789",
  purpose: "custom_blending",
  booking_date: "2026-07-28",
  time_slot: "11:00",
};

describe("POST /api/consultations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockInsert.mockReturnValue({
      select: () => ({ single: mockSingle }),
    });
    mockCreateQris.mockResolvedValue({
      paymentSessionId: "ps_123",
      qrUrl: "https://qr",
      qrString: "EMVCO",
      qrExpiresAt: "2026-07-23T10:05:00.000Z",
    });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it("creates booking + pivot session and returns qr data", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b-1", manage_token: "t-1" },
      error: null,
    });

    const res = await POST(req(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.bookingId).toBe("b-1");
    expect(json.qrString).toBe("EMVCO");
    expect(mockCreateQris).toHaveBeenCalledOnce();
  });

  it("returns 400 on invalid body", async () => {
    const res = await POST(req({ ...validBody, time_slot: "10:00" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("maps unique violation to SLOT_TAKEN", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate" },
    });

    const res = await POST(req(validBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe("SLOT_TAKEN");
  });

  it("deletes booking and returns 500 when pivot session fails", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b-1", manage_token: "t-1" },
      error: null,
    });
    mockCreateQris.mockRejectedValue(new Error("pivot down"));
    mockDeleteEq.mockResolvedValue({ error: null });

    const res = await POST(req(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "b-1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test app/api/consultations/route.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement the route**

Create `app/api/consultations/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { CreateBookingSchema } from "@/lib/consultations/schema";
import { CONSULTATION_FEE_IDR } from "@/lib/consultations/constants";
import { createQrisPaymentSession } from "@/lib/pivot/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Attach user_id when logged in (guests: null)
  let userId: string | null = null;
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const supabase = createSupabaseAdminClient();

  const { data: booking, error: insertError } = await supabase
    .from("consultation_bookings")
    .insert({
      user_id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      purpose: input.purpose,
      booking_date: input.booking_date,
      time_slot: input.time_slot,
      notes: input.notes ?? null,
      amount: CONSULTATION_FEE_IDR,
      status: "pending_payment",
    })
    .select("id, manage_token")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Slot ini baru saja dipesan. Silakan pilih waktu lain.", code: "SLOT_TAKEN" },
        { status: 409 }
      );
    }
    console.error("[consultations] insert error:", insertError);
    return NextResponse.json({ error: "Gagal membuat booking" }, { status: 500 });
  }

  // Create Pivot QRIS session. On failure, delete the booking so the slot
  // isn't held without a way to pay.
  try {
    const session = await createQrisPaymentSession({
      orderId: booking.id as string,
      orderNumber: `KONSULTASI-${input.booking_date}-${input.time_slot}`,
      total: CONSULTATION_FEE_IDR,
      customerName: input.name,
      customerEmail: input.email,
      customerPhone: input.phone,
    });

    await supabase
      .from("consultation_bookings")
      .update({
        pivot_payment_session_id: session.paymentSessionId,
        pivot_qr_string: session.qrString,
        pivot_qr_url: session.qrUrl,
        pivot_qr_expires_at: session.qrExpiresAt,
      })
      .eq("id", booking.id as string);

    return NextResponse.json({
      bookingId: booking.id,
      qrString: session.qrString,
      qrUrl: session.qrUrl,
      qrExpiresAt: session.qrExpiresAt,
    });
  } catch (err) {
    console.error("[consultations] Pivot session failed:", err);
    await supabase
      .from("consultation_bookings")
      .delete()
      .eq("id", booking.id as string);
    return NextResponse.json(
      { error: "Gagal membuat sesi pembayaran. Coba lagi." },
      { status: 500 }
    );
  }
}
```

NOTE: Before implementing, confirm the Pivot client signature in `lib/pivot/client.ts` — at time of writing it is `createQrisPaymentSession(params: CreateQrisSessionParams, requestIdSuffix = "")` where params are `{ orderId, orderNumber, total, customerName, customerEmail?, customerPhone }`. Adapt the call below if it has changed.

NOTE: `createQrisPaymentSession`'s `redirectUrl` fields point at checkout URLs — acceptable for now since the consultation QR page is driven by polling, not redirects (mode "API", autoConfirm). If Pivot requires valid URLs, existing checkout URLs still resolve.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test app/api/consultations/route.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/consultations/route.ts app/api/consultations/route.test.ts
git commit -m "feat(consultations): add create booking api with pivot qris"
```

---

### Task 7: Payment status polling + refresh-QR routes

**Files:**
- Create: `app/api/consultations/[id]/status/route.ts`
- Create: `app/api/consultations/refresh-qr/route.ts`
- Test: `app/api/consultations/refresh-qr/route.test.ts`

- [ ] **Step 1: Write the status route**

Create `app/api/consultations/[id]/status/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("consultation_bookings")
    .select("status")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ status: data.status });
}
```

- [ ] **Step 2: Write the failing refresh-qr test**

Create `app/api/consultations/refresh-qr/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();
const mockCreateQris = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: () => ({ eq: mockUpdateEq }),
    }),
  }),
}));

vi.mock("@/lib/pivot/client", () => ({
  createQrisPaymentSession: (...args: unknown[]) => mockCreateQris(...args),
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/consultations/refresh-qr", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/consultations/refresh-qr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateQris.mockResolvedValue({
      paymentSessionId: "ps_new",
      qrUrl: "https://qr2",
      qrString: "EMVCO2",
      qrExpiresAt: "2026-07-23T10:10:00.000Z",
    });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it("rejects invalid input", async () => {
    const res = await POST(req({ bookingId: "nope" }));
    expect(res.status).toBe(400);
  });

  it("404s when booking missing", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(
      req({ bookingId: "11111111-1111-1111-1111-111111111111" })
    );
    expect(res.status).toBe(404);
  });

  it("400s when booking is not pending_payment", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed" },
      error: null,
    });
    const res = await POST(
      req({ bookingId: "11111111-1111-1111-1111-111111111111" })
    );
    expect(res.status).toBe(400);
  });

  it("creates a new session for pending booking", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        status: "pending_payment",
        booking_date: "2026-07-28",
        time_slot: "11:00",
        amount: 250000,
        name: "Budi",
        email: "b@e.com",
        phone: "08123456789",
      },
      error: null,
    });
    const res = await POST(
      req({ bookingId: "11111111-1111-1111-1111-111111111111" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.qrString).toBe("EMVCO2");
    expect(mockCreateQris).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test app/api/consultations/refresh-qr/route.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 4: Implement refresh-qr route**

Create `app/api/consultations/refresh-qr/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createQrisPaymentSession } from "@/lib/pivot/client";

const RefreshSchema = z.object({ bookingId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RefreshSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { bookingId } = parsed.data;
    const supabase = createSupabaseAdminClient();

    const { data: booking, error } = await supabase
      .from("consultation_bookings")
      .select("id, status, booking_date, time_slot, amount, name, email, phone")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Booking tidak menunggu pembayaran" },
        { status: 400 }
      );
    }

    const suffix = Date.now().toString(36);
    const session = await createQrisPaymentSession(
      {
        orderId: booking.id as string,
        orderNumber: `KONSULTASI-${booking.booking_date}-${booking.time_slot}`,
        total: booking.amount as number,
        customerName: booking.name as string,
        customerEmail: booking.email as string,
        customerPhone: booking.phone as string,
      },
      suffix
    );

    await supabase
      .from("consultation_bookings")
      .update({
        pivot_payment_session_id: session.paymentSessionId,
        pivot_qr_string: session.qrString,
        pivot_qr_url: session.qrUrl,
        pivot_qr_expires_at: session.qrExpiresAt,
      })
      .eq("id", bookingId);

    return NextResponse.json({
      qrUrl: session.qrUrl,
      qrString: session.qrString,
      qrExpiresAt: session.qrExpiresAt,
    });
  } catch (error) {
    console.error("[consultations/refresh-qr] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test app/api/consultations/refresh-qr/route.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add "app/api/consultations/[id]/status/" app/api/consultations/refresh-qr/
git commit -m "feat(consultations): add payment status + refresh-qr routes"
```

---

### Task 8: Manage endpoints (GET / cancel / reschedule)

**Files:**
- Create: `app/api/consultations/manage/[token]/route.ts`
- Create: `app/api/consultations/manage/[token]/cancel/route.ts`
- Create: `app/api/consultations/manage/[token]/reschedule/route.ts`
- Test: `app/api/consultations/manage/[token]/cancel/route.test.ts`
- Test: `app/api/consultations/manage/[token]/reschedule/route.test.ts`

- [ ] **Step 1: Implement GET manage route**

Create `app/api/consultations/manage/[token]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("consultation_bookings")
    .select("id, name, email, phone, purpose, booking_date, time_slot, status, amount, notes, created_at")
    .eq("manage_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ booking: data });
}
```

- [ ] **Step 2: Write failing cancel test**

Create `app/api/consultations/manage/[token]/cancel/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockUpdateResult = vi.fn();
const mockNotify = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: () => ({ eq: () => ({ eq: mockUpdateResult }) }),
    }),
  }),
}));

vi.mock("@/lib/consultations/notify", () => ({
  sendConsultationCancelAlert: (...args: unknown[]) => mockNotify(...args),
}));

vi.mock("@/lib/resend/sendConsultationEmail", () => ({
  sendConsultationCancelledEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";

function ctx(token: string) {
  return { params: Promise.resolve({ token }) };
}

const req = () =>
  new NextRequest("http://localhost/api/consultations/manage/t/cancel", {
    method: "POST",
  });

const futureDate = "2099-01-06"; // a Tuesday

describe("POST cancel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("404s for unknown token", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(req(), ctx("bad"));
    expect(res.status).toBe(404);
  });

  it("400s when booking is not confirmed", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "expired", booking_date: futureDate },
      error: null,
    });
    const res = await POST(req(), ctx("t"));
    expect(res.status).toBe(400);
  });

  it("400s when booking is in the past", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed", booking_date: "2020-01-07" },
      error: null,
    });
    const res = await POST(req(), ctx("t"));
    expect(res.status).toBe(400);
  });

  it("cancels a confirmed future booking and alerts team", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "b",
        status: "confirmed",
        booking_date: futureDate,
        time_slot: "11:00",
        name: "Budi",
        phone: "0812",
        amount: 250000,
        email: "b@e.com",
      },
      error: null,
    });
    mockUpdateResult.mockResolvedValue({ error: null });

    const res = await POST(req(), ctx("t"));
    expect(res.status).toBe(200);
    expect(mockNotify).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 3: Write failing reschedule test**

Create `app/api/consultations/manage/[token]/reschedule/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: () => ({ eq: mockUpdateEq }),
    }),
  }),
}));

vi.mock("@/lib/resend/sendConsultationEmail", () => ({
  sendConsultationRescheduledEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";

function ctx(token: string) {
  return { params: Promise.resolve({ token }) };
}

function req(body: unknown) {
  return new NextRequest("http://localhost/api/consultations/manage/t/reschedule", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST reschedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("404s for unknown token", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(req({ booking_date: "2099-01-06", time_slot: "11:00" }), ctx("bad"));
    expect(res.status).toBe(404);
  });

  it("400s when booking not confirmed", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "cancelled", booking_date: "2099-01-06" },
      error: null,
    });
    const res = await POST(req({ booking_date: "2099-01-06", time_slot: "11:00" }), ctx("t"));
    expect(res.status).toBe(400);
  });

  it("409s with SLOT_TAKEN on unique violation", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed", booking_date: "2099-01-06", email: "b@e.com", name: "B", time_slot: "11:00" },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: { code: "23505", message: "dup" } });
    const res = await POST(req({ booking_date: "2099-01-07", time_slot: "14:00" }), ctx("t"));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe("SLOT_TAKEN");
  });

  it("reschedules a confirmed booking", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed", booking_date: "2099-01-06", email: "b@e.com", name: "B", time_slot: "11:00", manage_token: "t" },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: null });
    const res = await POST(req({ booking_date: "2099-01-07", time_slot: "14:00" }), ctx("t"));
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm test app/api/consultations/manage`
Expected: FAIL — modules do not exist (also `lib/consultations/notify` + `lib/resend/sendConsultationEmail` missing — implemented in Tasks 9–10; the mocks above use `vi.mock` so tests will fail on missing route modules first)

NOTE: Tasks 9–10 create the notify/email modules these tests mock. The routes below import them, so **Tasks 9 and 10 MUST be completed before running this task's tests or committing**. Order: implement routes (steps 5–6) → implement Task 9 (notify) → implement Task 10 (email) → then run this task's tests (deferred to Task 10 step 4) → commit. The commit for this task's files is folded into Task 10 step 5.

- [ ] **Step 5: Implement cancel route**

Create `app/api/consultations/manage/[token]/cancel/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendConsultationCancelAlert } from "@/lib/consultations/notify";
import { sendConsultationCancelledEmail } from "@/lib/resend/sendConsultationEmail";

export const dynamic = "force-dynamic";

function todayWib(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: booking, error } = await supabase
    .from("consultation_bookings")
    .select("id, status, booking_date, time_slot, name, phone, email, amount")
    .eq("manage_token", token)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ ok: true }); // idempotent
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Booking tidak dapat dibatalkan" },
      { status: 400 }
    );
  }

  if ((booking.booking_date as string) <= todayWib()) {
    return NextResponse.json(
      { error: "Booking sudah lewat dan tidak dapat dibatalkan" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("consultation_bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id as string)
    .eq("status", "confirmed"); // guard against concurrent state change

  if (updateError) {
    console.error("[consultations/cancel] update error:", updateError);
    return NextResponse.json({ error: "Gagal membatalkan booking" }, { status: 500 });
  }

  // Fire-and-forget: refund alert to team + email to customer
  sendConsultationCancelAlert({
    name: booking.name as string,
    phone: booking.phone as string,
    bookingDate: booking.booking_date as string,
    timeSlot: booking.time_slot as string,
    amount: booking.amount as number,
  }).catch((err) => console.error("[consultations/cancel] telegram failed:", err));

  sendConsultationCancelledEmail(booking.id as string).catch((err) =>
    console.error("[consultations/cancel] email failed:", err)
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Implement reschedule route**

Create `app/api/consultations/manage/[token]/reschedule/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { RescheduleSchema } from "@/lib/consultations/schema";
import { sendConsultationRescheduledEmail } from "@/lib/resend/sendConsultationEmail";

export const dynamic = "force-dynamic";

function todayWib(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RescheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: booking, error } = await supabase
    .from("consultation_bookings")
    .select("id, status, booking_date")
    .eq("manage_token", token)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Hanya booking terkonfirmasi yang bisa diubah jadwalnya" },
      { status: 400 }
    );
  }

  if ((booking.booking_date as string) <= todayWib()) {
    return NextResponse.json(
      { error: "Booking sudah lewat dan tidak dapat diubah" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("consultation_bookings")
    .update({
      booking_date: parsed.data.booking_date,
      time_slot: parsed.data.time_slot,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id as string);

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "Slot ini baru saja dipesan. Pilih waktu lain.", code: "SLOT_TAKEN" },
        { status: 409 }
      );
    }
    console.error("[consultations/reschedule] update error:", updateError);
    return NextResponse.json({ error: "Gagal mengubah jadwal" }, { status: 500 });
  }

  sendConsultationRescheduledEmail(booking.id as string).catch((err) =>
    console.error("[consultations/reschedule] email failed:", err)
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 7: Proceed to Tasks 9–10, then run manage tests**

(Tests for this task are verified after notify/email modules exist — see Task 10 Step 4.)

---

### Task 9: Telegram notifications for consultations

**Files:**
- Create: `lib/consultations/notify.ts`
- Test: `lib/consultations/notify.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/consultations/notify.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  sendConsultationBookingAlert,
  sendConsultationCancelAlert,
  sendConsultationConflictAlert,
} from "./notify";

describe("consultation telegram notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = "tok";
    process.env.TELEGRAM_CHAT_ID = "chat";
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("sends booking alert with date/slot/customer", async () => {
    await sendConsultationBookingAlert({
      name: "Budi",
      phone: "0812",
      bookingDate: "2026-07-28",
      timeSlot: "11:00",
      purpose: "custom_blending",
      notes: "Bawa susu",
      amount: 250000,
    });
    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe("chat");
    expect(body.text).toContain("Budi");
    expect(body.text).toContain("2026-07-28");
    expect(body.text).toContain("11:00");
  });

  it("sends cancel alert with refund amount", async () => {
    await sendConsultationCancelAlert({
      name: "Budi",
      phone: "0812",
      bookingDate: "2026-07-28",
      timeSlot: "11:00",
      amount: 250000,
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toMatch(/REFUND/i);
    expect(body.text).toContain("250.000");
  });

  it("sends conflict alert", async () => {
    await sendConsultationConflictAlert({
      bookingId: "b-1",
      name: "Budi",
      phone: "0812",
      bookingDate: "2026-07-28",
      timeSlot: "11:00",
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toMatch(/KONFLIK/i);
  });

  it("skips silently when env vars missing", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    await sendConsultationBookingAlert({
      name: "Budi",
      phone: "0812",
      bookingDate: "2026-07-28",
      timeSlot: "11:00",
      purpose: "custom_blending",
      notes: null,
      amount: 250000,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/consultations/notify.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement notify module**

First check `lib/telegram/notify.ts` for the exact Telegram send URL/env names used in this codebase and mirror them. Create `lib/consultations/notify.ts`:

```typescript
/** Telegram notifications for consultation bookings (fire-and-forget). */

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = () => process.env.TELEGRAM_CHAT_ID ?? "";

function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

async function sendTelegram(text: string): Promise<void> {
  if (!BOT_TOKEN() || !CHAT_ID()) return;
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN()}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID(), text }),
    }
  );
  if (!res.ok) {
    console.error("[consultations/notify] telegram send failed:", res.status);
  }
}

export interface BookingAlertParams {
  name: string;
  phone: string;
  bookingDate: string;
  timeSlot: string;
  purpose: string;
  notes: string | null;
  amount: number;
}

export async function sendConsultationBookingAlert(p: BookingAlertParams): Promise<void> {
  const purposeLabel =
    p.purpose === "custom_blending" ? "Cari blend untuk menu" : "Coba produk AGR";
  await sendTelegram(
    [
      "🗓 KONSULTASI BARU (LUNAS)",
      `${p.name} — ${p.phone}`,
      `Tanggal: ${p.bookingDate} jam ${p.timeSlot} WIB`,
      `Tujuan: ${purposeLabel}`,
      p.notes ? `Catatan: ${p.notes}` : null,
      `Fee: ${formatIdr(p.amount)}`,
      "👉 Follow-up bahan via WhatsApp",
    ]
      .filter(Boolean)
      .join("\n")
  );
}

export interface CancelAlertParams {
  name: string;
  phone: string;
  bookingDate: string;
  timeSlot: string;
  amount: number;
}

export async function sendConsultationCancelAlert(p: CancelAlertParams): Promise<void> {
  await sendTelegram(
    [
      "⚠️ KONSULTASI DIBATALKAN — PERLU REFUND MANUAL",
      `${p.name} — ${p.phone}`,
      `Tanggal: ${p.bookingDate} jam ${p.timeSlot} WIB`,
      `Refund: ${formatIdr(p.amount)}`,
    ].join("\n")
  );
}

export interface ConflictAlertParams {
  bookingId: string;
  name: string;
  phone: string;
  bookingDate: string;
  timeSlot: string;
}

export async function sendConsultationConflictAlert(p: ConflictAlertParams): Promise<void> {
  await sendTelegram(
    [
      "🚨 KONFLIK SLOT KONSULTASI",
      `Booking ${p.bookingId} (${p.name} — ${p.phone}) dibayar SETELAH expired,`,
      `tapi slot ${p.bookingDate} jam ${p.timeSlot} WIB sudah terisi.`,
      "👉 Hubungi customer untuk reschedule/refund manual.",
    ].join("\n")
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/consultations/notify.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/consultations/notify.ts lib/consultations/notify.test.ts
git commit -m "feat(consultations): add telegram notifications"
```

---

### Task 10: Consultation emails (Resend)

**Files:**
- Create: `lib/consultations/format.ts`
- Create: `lib/resend/templates/ConsultationBooking.tsx`
- Create: `lib/resend/sendConsultationEmail.ts`
- Test: `lib/resend/sendConsultationEmail.test.ts`

- [ ] **Step 0: Create the shared date formatter (pure, client-safe)**

`formatBookingDateId` is used by the email sender (server) AND the success/manage pages (client components) — it must live in a pure module with no server-only imports.

Create `lib/consultations/format.ts`:

```typescript
const DAY_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * "2026-07-28" → "Selasa, 28 Juli 2026".
 * TZ-independent: parse the string and use UTC getters — local getters
 * (.getDay()/.getDate()) re-project onto the process timezone.
 */
export function formatBookingDateId(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_ID[weekday]}, ${d} ${MONTH_ID[m - 1]} ${y}`;
}
```

- [ ] **Step 1: Write the failing test**

Create `lib/resend/sendConsultationEmail.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
const mockSingle = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: mockSingle }) }) }),
  }),
}));

import { sendConsultationConfirmationEmail } from "./sendConsultationEmail";

const booking = {
  id: "b-1",
  name: "Budi",
  email: "budi@example.com",
  booking_date: "2026-07-28",
  time_slot: "11:00",
  purpose: "custom_blending",
  manage_token: "tok-1",
  amount: 250000,
};

describe("sendConsultationConfirmationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "key";
    process.env.NEXT_PUBLIC_APP_URL = "https://agroastery.com";
    mockSingle.mockResolvedValue({ data: booking, error: null });
    mockSend.mockResolvedValue({ error: null });
  });

  it("sends confirmation with manage link", async () => {
    await sendConsultationConfirmationEmail("b-1");
    expect(mockSend).toHaveBeenCalledOnce();
    const arg = mockSend.mock.calls[0][0];
    expect(arg.to).toBe("budi@example.com");
    expect(arg.subject).toContain("Konsultasi");
  });

  it("skips when booking not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    await sendConsultationConfirmationEmail("nope");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("skips when RESEND_API_KEY missing", async () => {
    delete process.env.RESEND_API_KEY;
    await sendConsultationConfirmationEmail("b-1");
    expect(mockSend).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/resend/sendConsultationEmail.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement email template + sender**

Create `lib/resend/templates/ConsultationBooking.tsx`:

```tsx
import * as React from "react";

export interface ConsultationBookingEmailProps {
  customerName: string;
  bookingDate: string; // e.g. "Selasa, 28 Juli 2026"
  timeSlot: string;    // e.g. "11:00"
  manageUrl: string;
  whatsappUrl: string;
  variant: "confirmed" | "rescheduled" | "cancelled";
}

export function ConsultationBookingEmail({
  customerName,
  bookingDate,
  timeSlot,
  manageUrl,
  whatsappUrl,
  variant,
}: ConsultationBookingEmailProps) {
  const heading =
    variant === "confirmed"
      ? "Konsultasi kamu terkonfirmasi"
      : variant === "rescheduled"
        ? "Jadwal konsultasi diperbarui"
        : "Konsultasi dibatalkan";

  return (
    <div style={{ fontFamily: "sans-serif", color: "#1a1a1a", maxWidth: 480 }}>
      <h2>{heading}</h2>
      <p>Halo {customerName},</p>
      {variant !== "cancelled" ? (
        <>
          <p>
            Jadwal konsultasi kopi kamu: <strong>{bookingDate}</strong> jam{" "}
            <strong>{timeSlot} WIB</strong> (2 jam).
          </p>
          <p>
            Bawa bahan sendiri (susu, gula, dll) — kecuali biji kopi. Tim kami
            juga bisa belanjakan; biaya ditambahkan ke invoice akhir.
          </p>
          <p>
            <a
              href={whatsappUrl}
              style={{
                display: "inline-block",
                background: "#25D366",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                textDecoration: "none",
                marginRight: 8,
              }}
            >
              Koordinasi bahan via WhatsApp
            </a>
            <a href={manageUrl} style={{ color: "#1a1a1a" }}>
              Kelola booking
            </a>
          </p>
        </>
      ) : (
        <p>
          Booking konsultasi kamu untuk <strong>{bookingDate}</strong> jam{" "}
          <strong>{timeSlot} WIB</strong> telah dibatalkan. Refund akan
          diproses manual oleh tim kami melalui WhatsApp.
        </p>
      )}
      <p style={{ color: "#666", fontSize: 12 }}>Agroastery</p>
    </div>
  );
}
```

Create `lib/resend/sendConsultationEmail.ts`:

```typescript
import { Resend } from "resend";
import * as React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ConsultationBookingEmail } from "./templates/ConsultationBooking";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBookingDateId } from "@/lib/consultations/format";

type Variant = "confirmed" | "rescheduled" | "cancelled";

async function send(bookingId: string, variant: Variant): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[sendConsultationEmail] RESEND_API_KEY not set — skipping");
      return;
    }

    const admin = createSupabaseAdminClient();
    const { data: booking, error } = await admin
      .from("consultation_bookings")
      .select("id, name, email, booking_date, time_slot, manage_token")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      console.error(`[sendConsultationEmail] booking not found: ${bookingId}`, error);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";
    const dateLabel = formatBookingDateId(String(booking.booking_date));
    const timeSlot = String(booking.time_slot);
    const manageUrl = `${appUrl}/konsultasi/manage/${booking.manage_token}`;
    const whatsappUrl = buildWhatsAppLink(
      `Halo, saya sudah booking konsultasi tanggal ${dateLabel} jam ${timeSlot}. Saya mau koordinasi bahan.`
    );

    const subject =
      variant === "confirmed"
        ? "Konsultasi kamu terkonfirmasi — Agroastery"
        : variant === "rescheduled"
          ? "Jadwal konsultasi diperbarui — Agroastery"
          : "Konsultasi dibatalkan — Agroastery";

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: "Agroastery <order@agroastery.com>",
      to: booking.email as string,
      subject,
      react: React.createElement(ConsultationBookingEmail, {
        customerName: booking.name as string,
        bookingDate: dateLabel,
        timeSlot,
        manageUrl,
        whatsappUrl,
        variant,
      }),
    });

    if (sendError) {
      console.error("[sendConsultationEmail] resend error:", sendError);
    }
  } catch (err) {
    console.error("[sendConsultationEmail] unexpected error:", err);
  }
}

export function sendConsultationConfirmationEmail(bookingId: string): Promise<void> {
  return send(bookingId, "confirmed");
}

export function sendConsultationRescheduledEmail(bookingId: string): Promise<void> {
  return send(bookingId, "rescheduled");
}

export function sendConsultationCancelledEmail(bookingId: string): Promise<void> {
  return send(bookingId, "cancelled");
}
```

- [ ] **Step 4: Run email tests + deferred manage tests**

Run: `pnpm test lib/resend/sendConsultationEmail.test.ts app/api/consultations/manage`
Expected: PASS (3 email tests + 8 manage tests)

- [ ] **Step 5: Commit**

```bash
git add lib/resend/sendConsultationEmail.ts lib/resend/sendConsultationEmail.test.ts lib/resend/templates/ConsultationBooking.tsx "app/api/consultations/manage/"
git commit -m "feat(consultations): add manage endpoints, telegram + email notifications"
```

---

### Task 11: Extend Pivot webhook for consultations

**Files:**
- Modify: `app/api/webhooks/pivot/route.ts`
- Test: `app/api/webhooks/pivot/consultation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/api/webhooks/pivot/consultation.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockOrderSingle = vi.fn();
const mockBookingSingle = vi.fn();
const mockBookingUpdate = vi.fn();
const mockEmail = vi.fn();
const mockTelegram = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) =>
      table === "ecom_orders"
        ? { select: () => ({ eq: () => ({ single: mockOrderSingle }) }) }
        : {
            select: () => ({ eq: () => ({ single: mockBookingSingle }) }),
            update: () => ({ eq: mockBookingUpdate }),
          },
  }),
}));

vi.mock("@/lib/resend/sendConsultationEmail", () => ({
  sendConsultationConfirmationEmail: (...a: unknown[]) => mockEmail(...a),
}));

vi.mock("@/lib/consultations/notify", () => ({
  sendConsultationBookingAlert: (...a: unknown[]) => mockTelegram(...a),
  sendConsultationConflictAlert: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";

function webhookReq(event: string, sessionId: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/pivot", {
    method: "POST",
    headers: { "x-api-key": process.env.PIVOT_CALLBACK_API_KEY ?? "" },
    body: JSON.stringify({
      event,
      data: { id: sessionId, chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] },
    }),
  });
}

describe("pivot webhook — consultation branch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PIVOT_CALLBACK_API_KEY = "test-key";
    // No ecom_order matches the session
    mockOrderSingle.mockResolvedValue({ data: null, error: null });
  });

  it("confirms a consultation booking on PAYMENT.PAID", async () => {
    mockBookingSingle.mockResolvedValue({
      data: {
        id: "b-1",
        status: "pending_payment",
        name: "Budi",
        phone: "0812",
        booking_date: "2026-07-28",
        time_slot: "11:00",
        purpose: "custom_blending",
        notes: null,
        amount: 250000,
      },
      error: null,
    });
    mockBookingUpdate.mockResolvedValue({ error: null });

    const res = await POST(webhookReq("PAYMENT.PAID", "ps_1"));
    expect(res.status).toBe(200);
    expect(mockEmail).toHaveBeenCalledWith("b-1");
    expect(mockTelegram).toHaveBeenCalledOnce();
  });

  it("is idempotent when booking already confirmed", async () => {
    mockBookingSingle.mockResolvedValue({
      data: { id: "b-1", status: "confirmed" },
      error: null,
    });
    const res = await POST(webhookReq("PAYMENT.PAID", "ps_1"));
    expect(res.status).toBe(200);
    expect(mockBookingUpdate).not.toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("marks booking expired on PAYMENT.EXPIRED (slot releases)", async () => {
    mockBookingSingle.mockResolvedValue({
      data: { id: "b-1", status: "pending_payment" },
      error: null,
    });
    mockBookingUpdate.mockResolvedValue({ error: null });

    const res = await POST(webhookReq("PAYMENT.EXPIRED", "ps_1"));
    expect(res.status).toBe(200);
    expect(mockBookingUpdate).toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("ignores unknown session (neither order nor booking)", async () => {
    mockBookingSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(webhookReq("PAYMENT.PAID", "ps_unknown"));
    expect(res.status).toBe(200);
    expect(mockBookingUpdate).not.toHaveBeenCalled();
  });
});
```

NOTE: the existing webhook route imports `createBiteshipDraft`, `createJubelioOrderFromEcom`, `sendOrderEmail`, `sendPaymentNotification` — the test file must also mock those modules (or the module under test fails to import). Add `vi.mock` for `@/lib/biteship/createDraft`, `@/lib/jubelio/orders`, `@/lib/resend/sendOrderEmail`, `@/lib/telegram/notify` at the top of the test.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test app/api/webhooks/pivot/consultation.test.ts`
Expected: FAIL — consultation branch not implemented (booking lookup never happens)

- [ ] **Step 3: Modify the webhook**

In `app/api/webhooks/pivot/route.ts`, add imports:

```typescript
import { sendConsultationConfirmationEmail } from "@/lib/resend/sendConsultationEmail";
import {
  sendConsultationBookingAlert,
  sendConsultationConflictAlert,
} from "@/lib/consultations/notify";
```

Then, in the `PAYMENT.PAID` branch, replace the `if (!existing)` early-return block:

```typescript
    if (!existing) {
      console.warn(`Pivot webhook: no order found for session ${paymentSessionId}`);
      return NextResponse.json({ received: true });
    }
```

with a fall-through to consultations:

```typescript
    if (!existing) {
      await handleConsultationPaid(supabase, paymentSessionId, paidAt);
      return NextResponse.json({ received: true });
    }
```

And in the `PAYMENT.EXPIRED || PAYMENT.CANCELLED` branch, wrap the existing order-cancellation logic so it only runs when an order exists; otherwise fall through to consultations. The existing code uses `.single()` which errors (PGRST116) when no row — currently treated as "already terminal". Change to `.maybeSingle()` for the order lookup and add the consultation fallback:

```typescript
  } else if (event === "PAYMENT.EXPIRED" || event === "PAYMENT.CANCELLED") {
    // Idempotently cancel the order (use neq to act as a lock)
    const { data: cancelledOrder, error: cancelError } = await supabase
      .from("ecom_orders")
      .update({ payment_status: "expired", status: "cancelled" })
      .eq("pivot_payment_session_id", paymentSessionId)
      .not("payment_status", "in", '("expired","paid")')
      .select("id")
      .maybeSingle();

    if (cancelError) {
      console.error("Pivot webhook: DB error on EXPIRED/CANCELLED:", cancelError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!cancelledOrder) {
      await handleConsultationExpired(supabase, paymentSessionId);
      return NextResponse.json({ received: true });
    }
    // ... existing stock-restore block unchanged, using cancelledOrder ...
```

Add the two helper functions at the bottom of the file:

```typescript
type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

async function handleConsultationPaid(
  supabase: SupabaseAdmin,
  paymentSessionId: string,
  paidAt: string
): Promise<void> {
  const { data: booking } = await supabase
    .from("consultation_bookings")
    .select("id, status, name, phone, booking_date, time_slot, purpose, notes, amount")
    .eq("pivot_payment_session_id", paymentSessionId)
    .maybeSingle();

  if (!booking) {
    console.warn(`Pivot webhook: no consultation booking for session ${paymentSessionId}`);
    return;
  }
  if (booking.status === "confirmed") return; // idempotent

  // Only confirm from pending_payment. If already expired, the slot may have
  // been retaken — the partial unique index will reject the update (23505).
  const fromStatus = booking.status as string;
  const { error } = await supabase
    .from("consultation_bookings")
    .update({ status: "confirmed", paid_at: paidAt, updated_at: new Date().toISOString() })
    .eq("id", booking.id as string)
    .eq("status", fromStatus);

  if (error) {
    if (error.code === "23505" || fromStatus === "expired") {
      // Money received but slot conflict — record payment, alert ops.
      await supabase
        .from("consultation_bookings")
        .update({ paid_at: paidAt, updated_at: new Date().toISOString() })
        .eq("id", booking.id as string);
      sendConsultationConflictAlert({
        bookingId: booking.id as string,
        name: booking.name as string,
        phone: booking.phone as string,
        bookingDate: String(booking.booking_date),
        timeSlot: String(booking.time_slot),
      }).catch(() => {});
      return;
    }
    console.error("Pivot webhook: consultation confirm error:", error);
    return;
  }

  sendConsultationConfirmationEmail(booking.id as string).catch((err: unknown) =>
    console.error(`[pivot-webhook] consultation email failed for ${booking.id}:`, err)
  );
  sendConsultationBookingAlert({
    name: booking.name as string,
    phone: booking.phone as string,
    bookingDate: String(booking.booking_date),
    timeSlot: String(booking.time_slot),
    purpose: String(booking.purpose),
    notes: (booking.notes as string | null) ?? null,
    amount: booking.amount as number,
  }).catch((err: unknown) =>
    console.error(`[pivot-webhook] consultation telegram failed for ${booking.id}:`, err)
  );
}

async function handleConsultationExpired(
  supabase: SupabaseAdmin,
  paymentSessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("consultation_bookings")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("pivot_payment_session_id", paymentSessionId)
    .eq("status", "pending_payment"); // idempotent guard

  if (error && error.code !== "PGRST116") {
    console.error("Pivot webhook: consultation expire error:", error);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test app/api/webhooks/pivot/consultation.test.ts`
Expected: PASS (4 tests). Also run existing webhook tests if any exist: `pnpm test app/api/webhooks`

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/pivot/
git commit -m "feat(consultations): handle consultation payments in pivot webhook"
```

---

### Task 12: Dev simulate-consultation-payment route

**Files:**
- Create: `app/api/dev/simulate-consultation-payment/route.ts`

- [ ] **Step 1: Implement route** (dev-only utility, mirrors `app/api/dev/simulate-payment/route.ts` — no test needed beyond typecheck since it's excluded from production)

Create `app/api/dev/simulate-consultation-payment/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { simulatePayment } from "@/lib/pivot/client";

const SimulateSchema = z.object({ bookingId: z.string().uuid() });

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = SimulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { bookingId } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data: booking, error } = await supabase
    .from("consultation_bookings")
    .select("pivot_payment_session_id, status")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "confirmed") {
    return NextResponse.json({ error: "Booking already paid" }, { status: 409 });
  }

  if (!booking.pivot_payment_session_id) {
    return NextResponse.json(
      { error: "No Pivot payment session on this booking" },
      { status: 422 }
    );
  }

  try {
    await simulatePayment(booking.pivot_payment_session_id as string);
  } catch (err) {
    console.error("[dev/simulate-consultation-payment] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  return NextResponse.json({ simulated: true });
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/dev/simulate-consultation-payment/
git commit -m "feat(consultations): add dev simulate payment route"
```

---

### Task 13: Booking page UI (`/konsultasi`)

**Files:**
- Create: `app/(root)/konsultasi/page.tsx`
- Create: `app/(root)/konsultasi/booking-flow.tsx`
- Test: `app/(root)/konsultasi/booking-flow.test.tsx`

- [ ] **Step 1: Write the failing component test**

Create `app/(root)/konsultasi/booking-flow.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookingFlow from "./booking-flow";

const availability = {
  dates: [
    {
      date: "2026-07-28",
      slots: [
        { time: "11:00", available: true },
        { time: "14:00", available: false },
        { time: "17:00", available: true },
      ],
    },
    {
      date: "2026-07-29",
      slots: [
        { time: "11:00", available: true },
        { time: "14:00", available: true },
        { time: "17:00", available: true },
      ],
    },
  ],
};

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("BookingFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/consultations/availability")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(availability),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("progressive disclosure: slots hidden until date picked, form hidden until slot picked", async () => {
    render(<BookingFlow />);

    // Initially no slot picker or form
    await waitFor(() => screen.getByText("Sel"));
    expect(screen.queryByText("11:00")).toBeNull();
    expect(screen.queryByLabelText(/nama/i)).toBeNull();

    // Pick a date → slots appear, taken slot disabled
    fireEvent.click(screen.getByText("Sel"));
    await waitFor(() => screen.getByText("11:00"));
    expect(screen.getByText("14:00").closest("button")).toBeDisabled();
    expect(screen.queryByLabelText(/nama/i)).toBeNull();

    // Pick a slot → form appears
    fireEvent.click(screen.getByText("11:00"));
    await waitFor(() => screen.getByLabelText(/nama/i));
  });

  it("submits booking and redirects to payment page", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/consultations/availability")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(availability) });
      }
      if (url.endsWith("/api/consultations")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              bookingId: "b-1",
              qrString: "EMVCO",
              qrExpiresAt: "2026-07-23T10:05:00Z",
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<BookingFlow />);
    await waitFor(() => screen.getByText("Sel"));
    fireEvent.click(screen.getByText("Sel"));
    await waitFor(() => screen.getByText("11:00"));
    fireEvent.click(screen.getByText("11:00"));

    fireEvent.change(await screen.findByLabelText(/nama/i), { target: { value: "Budi" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "budi@example.com" } });
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: "08123456789" } });
    fireEvent.click(screen.getByLabelText(/cari blend/i));
    fireEvent.click(screen.getByRole("button", { name: /bayar/i }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/konsultasi/bayar/b-1")
    );
  });

  it("shows SLOT_TAKEN error and refreshes availability", async () => {
    let availabilityCalls = 0;
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/consultations/availability")) {
        availabilityCalls++;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(availability) });
      }
      return Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "Slot ini baru saja dipesan.", code: "SLOT_TAKEN" }),
      });
    });

    render(<BookingFlow />);
    await waitFor(() => screen.getByText("Sel"));
    fireEvent.click(screen.getByText("Sel"));
    await waitFor(() => screen.getByText("11:00"));
    fireEvent.click(screen.getByText("11:00"));

    fireEvent.change(await screen.findByLabelText(/nama/i), { target: { value: "Budi" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "budi@example.com" } });
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: "08123456789" } });
    fireEvent.click(screen.getByLabelText(/cari blend/i));
    fireEvent.click(screen.getByRole("button", { name: /bayar/i }));

    await waitFor(() => screen.getByText(/baru saja dipesan/i));
    expect(availabilityCalls).toBeGreaterThan(1); // availability refetched
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test "app/(root)/konsultasi/booking-flow.test.tsx"`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement booking page + client**

Create `app/(root)/konsultasi/page.tsx`:

```tsx
import Navigation from "@/components/navigation";
import BookingFlow from "./booking-flow";

export const metadata = {
  title: "Konsultasi Kopi — Agroastery",
  description:
    "Konsultasi 2 jam dengan peralatan profesional kami: espresso machine, EK43, Mazzer Super Jolly.",
};

export default function KonsultasiPage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 px-4 py-10">
        <BookingFlow />
      </main>
    </div>
  );
}
```

Create `app/(root)/konsultasi/booking-flow.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { numberToIdr } from "@/lib/numberToIdr";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  CONSULTATION_FEE_IDR,
  CONSULTATION_PURPOSES,
  type ConsultationPurpose,
} from "@/lib/consultations/constants";

interface DateAvailability {
  date: string;
  slots: { time: string; available: boolean }[];
}

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const FormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(8, "Nomor WhatsApp tidak valid"),
  purpose: z.enum(["custom_blending", "product_testing"]),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export default function BookingFlow() {
  const router = useRouter();
  const [dates, setDates] = useState<DateAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  async function loadAvailability() {
    const res = await fetch("/api/consultations/availability");
    if (res.ok) {
      const json = await res.json();
      setDates(json.dates ?? []);
    }
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  const selected = dates.find((d) => d.date === selectedDate);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          booking_date: selectedDate,
          time_slot: selectedSlot,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Terjadi kesalahan. Coba lagi.");
        if (json.code === "SLOT_TAKEN") {
          setSelectedSlot(null);
          loadAvailability();
        }
        return;
      }
      router.push(`/konsultasi/bayar/${json.bookingId}`);
    } catch {
      setSubmitError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Intro */}
      <h1 className="text-2xl font-semibold text-primary mb-2">Konsultasi Kopi</h1>
      <p className="text-secondary text-sm mb-1">
        2 jam &middot; {numberToIdr({ nominal: CONSULTATION_FEE_IDR })}
      </p>
      <p className="text-sm text-foreground/80 mb-2">
        Gunakan peralatan kami: espresso machine, EK43, Mazzer Super Jolly.
        Cocok untuk mengembangkan blend untuk menu kafe Anda, atau mencoba
        produk kami dengan bahan Anda sendiri.
      </p>
      <p className="text-xs text-secondary mb-4">
        Bawa bahan sendiri (susu, gula, dll) — kecuali biji kopi. Atau tim kami
        bisa belanjakan (biaya ditambah ke invoice akhir).
      </p>
      <a
        href={buildWhatsAppLink("Halo, saya mau tanya tentang konsultasi kopi")}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary underline underline-offset-4"
      >
        Ada pertanyaan? Chat kami
      </a>

      {/* 1. Date picker */}
      <h2 className="text-base font-medium text-foreground mt-8 mb-3">1. Pilih Tanggal</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((d) => {
          // TZ-independent: parse string, read via UTC getters (never local getters)
          const [y, m, dd] = d.date.split("-").map(Number);
          const weekday = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
          const allTaken = d.slots.every((s) => !s.available);
          const active = selectedDate === d.date;
          return (
            <button
              key={d.date}
              type="button"
              disabled={allTaken}
              onClick={() => {
                setSelectedDate(d.date);
                setSelectedSlot(null);
              }}
              className={`flex flex-col items-center min-w-14 rounded-lg border px-3 py-2 text-sm transition-colors
                ${active ? "border-primary bg-primary/10 text-primary" : "border-white/15 text-foreground/80"}
                ${allTaken ? "opacity-30" : "hover:border-primary/60"}`}
            >
              <span className="text-xs">{DAY_SHORT[weekday]}</span>
              <span className="font-semibold">{dd}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Slot picker */}
      {selectedDate && selected && (
        <>
          <h2 className="text-base font-medium text-foreground mt-6 mb-3">2. Pilih Waktu</h2>
          <div className="flex gap-2">
            {selected.slots.map((s) => {
              const active = selectedSlot === s.time;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setSelectedSlot(s.time)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors
                    ${active ? "border-primary bg-primary/10 text-primary" : "border-white/15 text-foreground/80"}
                    ${!s.available ? "opacity-30 line-through" : "hover:border-primary/60"}`}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 3. Contact form */}
      {selectedSlot && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <h2 className="text-base font-medium text-foreground mb-3">3. Data Diri</h2>

          <label className="block text-sm mb-1" htmlFor="name">Nama</label>
          <input id="name" {...register("name")} className="w-full mb-1 rounded border border-white/15 bg-transparent px-3 py-2 text-sm" />
          {errors.name && <p className="text-destructive text-xs mb-2">{errors.name.message}</p>}

          <label className="block text-sm mb-1 mt-3" htmlFor="email">Email</label>
          <input id="email" type="email" {...register("email")} className="w-full mb-1 rounded border border-white/15 bg-transparent px-3 py-2 text-sm" />
          {errors.email && <p className="text-destructive text-xs mb-2">{errors.email.message}</p>}

          <label className="block text-sm mb-1 mt-3" htmlFor="phone">No. WhatsApp</label>
          <input id="phone" {...register("phone")} className="w-full mb-1 rounded border border-white/15 bg-transparent px-3 py-2 text-sm" />
          {errors.phone && <p className="text-destructive text-xs mb-2">{errors.phone.message}</p>}

          <fieldset className="mt-4">
            <legend className="text-sm mb-2">Tujuan</legend>
            {(Object.keys(CONSULTATION_PURPOSES) as ConsultationPurpose[]).map((key) => (
              <label key={key} className="flex items-start gap-2 text-sm mb-2">
                <input type="radio" value={key} {...register("purpose")} />
                <span>{CONSULTATION_PURPOSES[key]}</span>
              </label>
            ))}
            {errors.purpose && <p className="text-destructive text-xs">Pilih salah satu</p>}
          </fieldset>

          <label className="block text-sm mb-1 mt-4" htmlFor="notes">Catatan (opsional)</label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Ceritakan menu andalan Anda atau bahan yang ingin dibawa (opsional)"
            {...register("notes")}
            className="w-full rounded border border-white/15 bg-transparent px-3 py-2 text-sm"
          />

          {submitError && <p className="text-destructive text-sm mt-3">{submitError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full mt-5">
            {isSubmitting ? "Memproses..." : `Bayar ${numberToIdr({ nominal: CONSULTATION_FEE_IDR })} & Konfirmasi`}
          </Button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test "app/(root)/konsultasi/booking-flow.test.tsx"`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add "app/(root)/konsultasi/"
git commit -m "feat(consultations): add booking page with date/slot picker and form"
```

---

### Task 14: QR payment page (`/konsultasi/bayar/[bookingId]`)

**Files:**
- Create: `app/(root)/konsultasi/bayar/[bookingId]/page.tsx`
- Create: `app/(root)/konsultasi/bayar/[bookingId]/qr-consultation-client.tsx`
- Test: `app/(root)/konsultasi/bayar/[bookingId]/qr-consultation-client.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/(root)/konsultasi/bayar/[bookingId]/qr-consultation-client.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import QrConsultationClient from "./qr-consultation-client";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ bookingId: "b-1" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("QrConsultationClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redirects to success when polling detects confirmed", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "confirmed" }),
    });

    render(
      <QrConsultationClient
        bookingId="b-1"
        qrString="EMVCO"
        qrExpiresAt={new Date(Date.now() + 5 * 60_000).toISOString()}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/konsultasi/sukses?booking=b-1")
    );
  });

  it("stops polling when booking expired", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "expired" }),
    });

    render(
      <QrConsultationClient
        bookingId="b-1"
        qrString="EMVCO"
        qrExpiresAt={new Date(Date.now() + 5 * 60_000).toISOString()}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    const calls = mockFetch.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(mockFetch.mock.calls.length).toBe(calls); // no more polling
    expect(mockPush).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test "app/(root)/konsultasi/bayar/[bookingId]/qr-consultation-client.test.tsx"`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement page + client**

Create `app/(root)/konsultasi/bayar/[bookingId]/page.tsx`:

```tsx
import { notFound, redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import QrConsultationClient from "./qr-consultation-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ bookingId: string }> };

export default async function ConsultationPaymentPage({ params }: Props) {
  const { bookingId } = await params;
  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from("consultation_bookings")
    .select("id, status, amount, pivot_qr_string, pivot_qr_expires_at")
    .eq("id", bookingId)
    .single();

  if (!booking) notFound();

  if (booking.status === "confirmed") {
    redirect(`/konsultasi/sukses?booking=${bookingId}`);
  }

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <QrConsultationClient
          bookingId={booking.id as string}
          amount={booking.amount as number}
          qrString={(booking.pivot_qr_string as string) ?? ""}
          qrExpiresAt={(booking.pivot_qr_expires_at as string) ?? new Date().toISOString()}
        />
      </main>
    </div>
  );
}
```

Create `app/(root)/konsultasi/bayar/[bookingId]/qr-consultation-client.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { numberToIdr } from "@/lib/numberToIdr";

interface Props {
  bookingId: string;
  amount: number;
  qrString: string;
  qrExpiresAt: string;
}

function useCountdown(expiresAtIso: string) {
  const getSecondsLeft = () =>
    Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);
  useEffect(() => {
    const id = setInterval(() => {
      const s = getSecondsLeft();
      setSecondsLeft(s);
      if (s === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAtIso]);
  return secondsLeft;
}

export default function QrConsultationClient({
  bookingId,
  amount,
  qrString: initialQrString,
  qrExpiresAt: initialQrExpiresAt,
}: Props) {
  const router = useRouter();
  const [qrString, setQrString] = useState(initialQrString);
  const [qrExpiresAt, setQrExpiresAt] = useState(initialQrExpiresAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const secondsLeft = useCountdown(qrExpiresAt);
  const isExpired = secondsLeft === 0;

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/consultations/${bookingId}/status`);
        if (!res.ok) return;
        const { status } = await res.json();
        if (status === "confirmed") {
          clearInterval(pollingRef.current!);
          router.push(`/konsultasi/sukses?booking=${bookingId}`);
        } else if (status === "expired" || status === "cancelled") {
          clearInterval(pollingRef.current!);
        }
      } catch {
        // network error — keep polling
      }
    }, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [bookingId, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/consultations/refresh-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefreshError(data.error ?? "Gagal memperbarui QR");
        return;
      }
      setQrString(data.qrString ?? "");
      setQrExpiresAt(data.qrExpiresAt);
    } catch {
      setRefreshError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsRefreshing(false);
    }
  }, [bookingId]);

  const handleSimulate = useCallback(async () => {
    setIsSimulating(true);
    try {
      await fetch("/api/dev/simulate-consultation-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      // polling loop detects confirmation and redirects
    } finally {
      setIsSimulating(false);
    }
  }, [bookingId]);

  return (
    <div className="max-w-sm w-full">
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-primary mb-1">Scan QR untuk Membayar</h1>
        <p className="text-secondary text-sm">
          Konsultasi Kopi &middot; {numberToIdr({ nominal: amount })}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
        {qrString ? (
          <div className={`relative transition-opacity duration-300 ${isExpired ? "opacity-30" : "opacity-100"}`}>
            <QRCode value={qrString} size={224} />
            {isExpired && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <span className="text-sm font-medium text-gray-600">QR Kedaluwarsa</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
            <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
          </div>
        )}

        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || secondsLeft >= 30}
          variant="outline"
          className={`w-full transition-opacity duration-300 ${secondsLeft >= 30 ? "opacity-30" : "opacity-100"}`}
        >
          {isRefreshing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {isRefreshing ? "Memperbarui..." : "Perbarui QR"}
        </Button>

        {refreshError && <p className="text-destructive text-sm text-center">{refreshError}</p>}

        <p className="text-xs text-secondary text-center">
          Mendukung QRIS — GoPay, OVO, Dana, dan semua bank
        </p>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="text-xs px-3 py-1.5 rounded border border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 font-mono transition-colors"
          >
            {isSimulating ? "Simulating..." : "[DEV] Simulate Payment"}
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-secondary">Menunggu konfirmasi pembayaran...</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test "app/(root)/konsultasi/bayar/[bookingId]/qr-consultation-client.test.tsx"`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add "app/(root)/konsultasi/bayar/"
git commit -m "feat(consultations): add qris payment page"
```

---

### Task 15: Success page (`/konsultasi/sukses`)

**Files:**
- Create: `app/(root)/konsultasi/sukses/page.tsx`

- [ ] **Step 1: Implement page**

Create `app/(root)/konsultasi/sukses/page.tsx`:

```tsx
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBookingDateId } from "@/lib/consultations/format";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ booking?: string }> };

export default async function KonsultasiSuccessPage({ searchParams }: Props) {
  const { booking: bookingId } = await searchParams;

  let booking: {
    booking_date: string;
    time_slot: string;
    manage_token: string;
    status: string;
  } | null = null;

  if (bookingId) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("consultation_bookings")
      .select("booking_date, time_slot, manage_token, status")
      .eq("id", bookingId)
      .single();
    booking = data;
  }

  const dateLabel = booking ? formatBookingDateId(booking.booking_date) : "";
  const waUrl = booking
    ? buildWhatsAppLink(
        `Halo, saya sudah booking konsultasi tanggal ${dateLabel} jam ${booking.time_slot}. Saya mau koordinasi bahan.`
      )
    : "#";

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-primary mb-2">
            Pembayaran berhasil
          </h1>
          <p className="text-secondary text-sm mb-6">
            Slot konsultasi kamu sudah terkonfirmasi. Detail booking dan link
            untuk mengelola jadwal telah dikirim ke email kamu.
          </p>

          {booking && (
            <div className="rounded-xl border border-white/15 p-4 mb-6 text-left">
              <p className="text-sm text-foreground">
                <span className="text-secondary">Tanggal:</span> {dateLabel}
              </p>
              <p className="text-sm text-foreground mt-1">
                <span className="text-secondary">Waktu:</span> {booking.time_slot} WIB (2 jam)
              </p>
            </div>
          )}

          {booking && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block mb-3">
              <Button className="w-full">Koordinasi bahan via WhatsApp</Button>
            </a>
          )}

          {booking && (
            <Link
              href={`/konsultasi/manage/${booking.manage_token}`}
              className="text-sm text-secondary underline-offset-4 hover:underline"
            >
              Kelola booking (ubah jadwal / batalkan)
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(root)/konsultasi/sukses/"
git commit -m "feat(consultations): add booking success page with whatsapp cta"
```

---

### Task 16: Manage page (`/konsultasi/manage/[token]`)

**Files:**
- Create: `app/(root)/konsultasi/manage/[token]/page.tsx`
- Create: `app/(root)/konsultasi/manage/[token]/manage-booking-client.tsx`

- [ ] **Step 1: Implement server page**

Create `app/(root)/konsultasi/manage/[token]/page.tsx`:

```tsx
import Navigation from "@/components/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import ManageBookingClient from "./manage-booking-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function ManageBookingPage({ params }: Props) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from("consultation_bookings")
    .select("id, name, purpose, booking_date, time_slot, status, notes")
    .eq("manage_token", token)
    .single();

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 px-4 py-12">
        <ManageBookingClient
          token={token}
          initialBooking={
            booking
              ? {
                  id: booking.id as string,
                  name: booking.name as string,
                  purpose: booking.purpose as string,
                  bookingDate: String(booking.booking_date),
                  timeSlot: String(booking.time_slot),
                  status: booking.status as string,
                  notes: (booking.notes as string | null) ?? null,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
```

Create `app/(root)/konsultasi/manage/[token]/manage-booking-client.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBookingDateId } from "@/lib/consultations/format";

interface Booking {
  id: string;
  name: string;
  purpose: string;
  bookingDate: string;
  timeSlot: string;
  status: string;
  notes: string | null;
}

interface SlotAvailability {
  time: string;
  available: boolean;
}

interface DateAvailability {
  date: string;
  slots: SlotAvailability[];
}

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function ManageBookingClient({
  token,
  initialBooking,
}: {
  token: string;
  initialBooking: Booking | null;
}) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [dates, setDates] = useState<DateAvailability[]>([]);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!showReschedule) return;
    fetch("/api/consultations/availability")
      .then((r) => r.json())
      .then((j) => setDates(j.dates ?? []))
      .catch(() => {});
  }, [showReschedule]);

  const handleReschedule = useCallback(async () => {
    if (!newDate || !newSlot) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/manage/${token}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_date: newDate, time_slot: newSlot }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengubah jadwal");
        return;
      }
      setBooking((b) => b && { ...b, bookingDate: newDate, timeSlot: newSlot });
      setShowReschedule(false);
      setNewDate(null);
      setNewSlot(null);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsBusy(false);
    }
  }, [token, newDate, newSlot]);

  const handleCancel = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/manage/${token}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal membatalkan booking");
        return;
      }
      setBooking((b) => b && { ...b, status: "cancelled" });
      setShowCancelConfirm(false);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsBusy(false);
    }
  }, [token]);

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-xl font-semibold text-primary mb-2">Booking tidak ditemukan</h1>
        <p className="text-secondary text-sm mb-6">Link mungkin sudah tidak valid.</p>
        <Link href="/konsultasi" className="text-primary underline underline-offset-4 text-sm">
          Buat booking baru
        </Link>
      </div>
    );
  }

  const dateLabel = formatBookingDateId(booking.bookingDate);
  const isUpcoming = booking.status === "confirmed" && booking.bookingDate > new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const waUrl = buildWhatsAppLink(
    `Halo, saya mau tanya soal booking konsultasi saya (tanggal ${dateLabel} jam ${booking.timeSlot})`
  );

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-primary mb-4">Kelola Booking</h1>

      <div className="rounded-xl border border-white/15 p-4 mb-4">
        <p className="text-sm"><span className="text-secondary">Nama:</span> {booking.name}</p>
        <p className="text-sm mt-1"><span className="text-secondary">Tanggal:</span> {dateLabel}</p>
        <p className="text-sm mt-1"><span className="text-secondary">Waktu:</span> {booking.timeSlot} WIB</p>
        <p className="text-sm mt-1">
          <span className="text-secondary">Status:</span>{" "}
          {booking.status === "confirmed" ? "Terkonfirmasi" : booking.status === "cancelled" ? "Dibatalkan" : booking.status}
        </p>
      </div>

      {booking.status === "cancelled" && (
        <div className="text-center py-4">
          <p className="text-secondary text-sm mb-4">Booking ini telah dibatalkan. Refund diproses manual oleh tim kami.</p>
          <Link href="/konsultasi" className="text-primary underline underline-offset-4 text-sm">
            Booking lagi
          </Link>
        </div>
      )}

      {isUpcoming && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" className="flex-1" onClick={() => setShowReschedule((v) => !v)}>
            Ubah Jadwal
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(true)}>
            Batalkan
          </Button>
        </div>
      )}

      {showReschedule && (
        <div className="rounded-xl border border-white/15 p-4 mb-4">
          <h2 className="text-sm font-medium mb-3">Pilih jadwal baru</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
             {dates.map((d) => {
               // TZ-independent: parse string, read via UTC getters (never local getters)
               const [y, m, dd] = d.date.split("-").map(Number);
               const weekday = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
               const allTaken = d.slots.every((s) => !s.available);
               return (
                 <button
                   key={d.date}
                   type="button"
                   disabled={allTaken}
                   onClick={() => { setNewDate(d.date); setNewSlot(null); }}
                   className={`flex flex-col items-center min-w-14 rounded-lg border px-3 py-2 text-sm
                     ${newDate === d.date ? "border-primary bg-primary/10 text-primary" : "border-white/15"}
                     ${allTaken ? "opacity-30" : ""}`}
                 >
                   <span className="text-xs">{DAY_SHORT[weekday]}</span>
                   <span className="font-semibold">{dd}</span>
                 </button>
               );
             })}
          </div>
          {newDate && (
            <div className="flex gap-2 mb-3">
              {dates.find((d) => d.date === newDate)?.slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setNewSlot(s.time)}
                  className={`rounded-lg border px-4 py-2 text-sm
                    ${newSlot === s.time ? "border-primary bg-primary/10 text-primary" : "border-white/15"}
                    ${!s.available ? "opacity-30 line-through" : ""}`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          <Button onClick={handleReschedule} disabled={!newDate || !newSlot || isBusy} className="w-full">
            {isBusy ? "Menyimpan..." : "Simpan Jadwal Baru"}
          </Button>
        </div>
      )}

      {showCancelConfirm && (
        <div className="rounded-xl border border-destructive/40 p-4 mb-4">
          <p className="text-sm mb-3">
            Yakin mau membatalkan booking ini? Refund akan diproses manual oleh tim kami via WhatsApp.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)} disabled={isBusy}>
              Kembali
            </Button>
            <Button className="flex-1" onClick={handleCancel} disabled={isBusy}>
              {isBusy ? "Membatalkan..." : "Ya, Batalkan"}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline underline-offset-4">
        Butuh bantuan? Chat kami
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(root)/konsultasi/manage/"
git commit -m "feat(consultations): add self-service manage booking page"
```

---

### Task 17: Navigation link + account page list

**Files:**
- Modify: `components/navigation/index.tsx`
- Modify: `app/(root)/account/page.tsx`

- [ ] **Step 1: Add "Konsultasi" to navigation**

In `components/navigation/index.tsx`, near the existing `<a href="/katalog">` link (line ~181), add:

```tsx
            <a href="/konsultasi" className="hover:underline">
              Konsultasi
            </a>
```

Match the existing markup/classes of the Katalog link exactly. If the mobile menu uses a link array (`item.link` around line 313), add `{ label: "Konsultasi", link: "/konsultasi" }` to that array instead/as well — follow the existing structure.

- [ ] **Step 2: Add upcoming consultations to account page**

In `app/(root)/account/page.tsx`, after the existing profile/orders sections, add a server-side fetch (the page is already a server component using `createSupabaseServerClient` — follow its existing auth pattern):

```tsx
  const admin = createSupabaseAdminClient();
  const todayWib = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data: consultations } = await admin
    .from("consultation_bookings")
    .select("id, booking_date, time_slot, status, manage_token")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .gte("booking_date", todayWib)
    .order("booking_date", { ascending: true });
```

Render (styled like the page's existing sections):

```tsx
      {consultations && consultations.length > 0 && (
        <section>
          <h2>Konsultasi Mendatang</h2>
          <ul>
            {consultations.map((c) => (
              <li key={c.id}>
                <span>{c.booking_date} — {c.time_slot} WIB</span>
                <Link href={`/konsultasi/manage/${c.manage_token}`}>Kelola</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
```

Adapt `user.id` variable name and markup to the page's existing structure.

- [ ] **Step 3: Verify lint + full test suite**

Run: `pnpm lint && pnpm test`
Expected: lint clean, all tests pass

- [ ] **Step 4: Commit**

```bash
git add components/navigation/index.tsx "app/(root)/account/page.tsx"
git commit -m "feat(consultations): add nav link and account page booking list"
```

---

### Task 18: Final verification + AGENTS.md update

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all tests pass

- [ ] **Step 2: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: clean build

- [ ] **Step 3: Update AGENTS.md**

Add to the "File Locations" section:

```
lib/
  consultations/   # Consultation booking: constants, availability, schemas, telegram notify
  whatsapp.ts      # wa.me link helper (NEXT_PUBLIC_WHATSAPP_NUMBER)
app/(root)/konsultasi/  # Consultation booking pages
app/api/consultations/  # Consultation booking API
```

Add to "Environment Variables":

```
- NEXT_PUBLIC_WHATSAPP_NUMBER (wa.me format, e.g. 628979092726)
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): document consultation booking feature"
```

- [ ] **Step 5: Remind user about the agr-ops migration**

The canonical `consultation_bookings` migration must exist in `../agr-ops/` for the ops panel. Confirm with the user that this is done before production deploy.

---

## Notes for the Executor

- **Never** modify the existing checkout QR component or `app/api/dev/simulate-payment/route.ts` — consultation features are parallel, not refactors.
- All API routes: Node runtime (default), `export const dynamic = "force-dynamic"` where responses depend on DB state.
- The partial unique index is the source of truth for slot conflicts — always map PG error `23505` to `SLOT_TAKEN`.
- Notification calls (email/Telegram) are ALWAYS fire-and-forget with `.catch()` — never await them in request/webhook paths.
