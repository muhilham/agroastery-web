# Debug Scripts

One-off utilities for debugging staging/production issues without touching the UI.

## Prerequisites

All scripts read credentials from `.env.local` in the project root. Make sure you have:

- `JUBELIO_EMAIL` / `JUBELIO_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` (for `run-side-effects.ts`)
- `BITESHIP_API_KEY` (for `run-side-effects.ts`)
- `RESEND_API_KEY` (for `run-side-effects.ts`)

## Running

All scripts use `tsx` (already in project dev dependencies):

```bash
npx tsx scripts/<script-name>.ts
```

---

### 1. `run-side-effects.ts`

Manually re-run the full post-payment side-effect chain for an order.

**Use when:**
- The Pivot webhook could not reach your staging server (e.g., ngrok offline).
- You fixed a bug in Telegram / Biteship / Email / Jubelio code and need to retry for an existing paid order.
- You want to verify the side-effect chain works end-to-end on a real order.

**Before running:**
Edit the top of the file and set the order ID:

```ts
const ORDER_ID = "6dd306ee-90bb-4d55-a8c6-68a7707cbeef";
```

**What it does:**
1. Fetches the order from `ecom_orders`.
2. Runs `sendPaymentNotification` (Telegram).
3. Runs `createBiteshipDraft` (Biteship).
4. Runs `sendOrderEmail` (Resend).
5. Runs `createJubelioOrderFromEcom` (Jubelio SO + invoice).

Each step is wrapped in its own try/catch so one failure does not block the others.

**Output example:**
```
🚀 Running side effects for order AGR-20260521-KN1KTI (6dd306ee-90bb-4d55-a8c6-68a7707cbeef)

✅ Telegram notification sent
✅ Biteship draft created
✅ Order email sent
✅ Jubelio sync completed

🏁 Done
```

**Caveats:**
- If Biteship already has a draft for this `reference_id` (order UUID), it will fail with "Reference ID already taken." This is expected — the draft was already created.
- Jubelio is idempotent: if `jubelio_salesorder_id` is already set, it skips creating a duplicate SO and resumes from invoice conversion.
- The script does **not** change `payment_status` or `status` in the database. It only runs side effects.

---

### 2. `debug-jubelio-sku.ts`

Directly call Jubelio's item search API and print the raw response.

**Use when:**
- A checkout order fails with "SKU not found in Jubelio: XXX".
- You want to confirm a SKU actually exists in Jubelio before running `run-side-effects.ts`.
- You suspect the API response shape has changed (e.g., `item_code` moved from top-level to `variants[]`).

**Before running:**
Set the SKU at the top of the file:

```ts
const SKU = "PJ-BK-KSS-2080-KG10-V_BEA";
```

**Output example:**
```
Searching Jubelio for SKU: PJ-BK-KSS-2080-KG10-V_BEA

API Response structure keys: [ 'data', 'totalCount' ]
Full response (first 2000 chars):
{ ... }

Found 1 items
First item keys: [ 'item_group_id', 'item_name', ... 'variants' ]
All item_code values:
  [0] item_code="undefined", item_name="..."

Exact match for SKU: NOT FOUND
```

> **Note:** The debug script uses its own raw fetch, not `fetchJubelioItemBySku`, so you see the true API response even if the library code has a bug.

---

### 3. `debug-jubelio-contacts.ts`

List Jubelio contacts and print the ID of the generic customer ("Pelanggan Umum").

**Use when:**
- Jubelio SO creation fails with a foreign-key error on `contacts_soheader`.
- You need to know the correct `contact_id` to use for walk-in / webstore orders.
- You suspect the generic customer ID has changed.

**No configuration needed** — just run it.

**Output example:**
```
Fetching Jubelio contacts...

Found 100 contacts

>>> Generic customer found:
{
  "contact_id": -1,
  "contact_name": "Pelanggan Umum",
  ...
}
```

---

### 4. `debug-jubelio-so.ts`

Search Jubelio sales orders by our `order_number` (`ref_no` in Jubelio).

**Use when:**
- You want to verify whether a Jubelio SO was already created for an order.
- `run-side-effects.ts` fails with "Pesanan sudah dipakai di transaksi lain" — this script tells you the existing SO ID.
- You need to manually sync `jubelio_salesorder_id` back to `ecom_orders`.

**Before running:**
Set the order number:

```ts
const REF_NO = "AGR-20260521-KN1KTI";
```

**Output example:**
```
Searching Jubelio sales orders for ref_no: AGR-20260521-KN1KTI

Response: {
  "data": [
    {
      "salesorder_id": 14906,
      "salesorder_no": "SO-000014906",
      "ref_no": "AGR-20260521-KN1KTI",
      ...
    }
  ],
  "totalCount": 1
}
```

---

## Quick Reference

| Script | When to use |
|---|---|
| `run-side-effects.ts` | Retry full post-payment chain |
| `debug-jubelio-sku.ts` | Verify SKU exists in Jubelio |
| `debug-jubelio-contacts.ts` | Find generic customer `contact_id` |
| `debug-jubelio-so.ts` | Find existing SO by order number |
