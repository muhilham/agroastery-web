const JUBELIO_BASE = "https://api2.jubelio.com";
const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${JUBELIO_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.JUBELIO_EMAIL,
      password: process.env.JUBELIO_PASSWORD,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Jubelio login failed: ${res.status}`);

  const data = await res.json();
  if (!data.token) throw new Error(`Jubelio login: no token in response`);

  cachedToken = data.token;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min (token expires in 1h)
  return cachedToken!;
}

export type JubelioVariant = {
  item_id: number;
  item_code: string;
  item_name: string;
  variation_values: string | null;
  sell_price: number | string | null;
  available_qty: number | null;
};

export type JubelioProductGroup = {
  item_group_id: number;
  item_name: string;
  variations: string | null;
  item_category_id: number;
  thumbnail: string | null;
  variants: JubelioVariant[];
};

export type JubelioProductDetail = {
  item_group_id: number;
  item_group_name: string;
  description: string | null;
  package_weight: string | null; // grams, e.g. "150.0000"
  variations: string | null;     // e.g. "Grind" or null
};

export async function fetchAllJubelioProducts(): Promise<JubelioProductGroup[]> {
  const token = await getToken();
  const all: JubelioProductGroup[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const res = await fetch(
      `${JUBELIO_BASE}/inventory/items/?page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: token }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    if (!res.ok) throw new Error(`Jubelio items fetch failed: ${res.status}`);

    const data = await res.json();
    const items: JubelioProductGroup[] = data.data ?? [];
    all.push(...items);

    if (items.length < pageSize) break;
    page++;
  }

  return all;
}

export async function fetchJubelioProductDetail(
  itemGroupId: number
): Promise<JubelioProductDetail> {
  const token = await getToken();
  const res = await fetch(`${JUBELIO_BASE}/inventory/items/group/${itemGroupId}`, {
    headers: { Authorization: token },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Jubelio item detail failed for ${itemGroupId}: ${res.status}`);
  return res.json();
}

// ─── Order / Invoice Functions ──────────────────────────────────────────────

const MOCK = process.env.JUBELIO_MOCK === "true";

export type JubelioItemSearchResult = {
  item_id: number;
  item_code: string;
  item_name: string;
};

// SKUs that should never sync to Jubelio (test products, etc.)
const UNSYNCABLE_SKUS = new Set(['test']);

/**
 * Search Jubelio inventory by SKU and return the exact match.
 * Tries regular items first, then falls back to bundle endpoint.
 * Returns null if not found or on API error (caller decides what to do).
 */
export async function fetchJubelioItemBySku(
  sku: string
): Promise<JubelioItemSearchResult | null> {
  if (MOCK) {
    return { item_id: 999999, item_code: sku, item_name: `Mock ${sku}` };
  }

  // 1. Skip known unsyncable SKUs (test products, etc.)
  if (UNSYNCABLE_SKUS.has(sku)) {
    console.warn(`[Jubelio] SKU "${sku}" is in unsyncable list; skipping sync.`);
    return null;
  }

  const token = await getToken();

  // 2. Search regular inventory items
  const res = await fetch(
    `${JUBELIO_BASE}/inventory/items/?q=${encodeURIComponent(sku)}&pageSize=50`,
    { headers: { Authorization: token }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  );

  if (!res.ok) {
    console.error(`[Jubelio] SKU lookup failed for ${sku}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  const groups: JubelioProductGroup[] = data.data ?? [];

  // Search inside each product group's variants array
  for (const group of groups) {
    for (const variant of group.variants) {
      if (variant.item_code === sku) {
        return {
          item_id: variant.item_id,
          item_code: variant.item_code,
          item_name: variant.item_name,
        };
      }
    }
  }

  // 3. Fallback: search bundle endpoint (api.jubelio.com accepts the same api2 token)
  console.log(`[Jubelio] SKU "${sku}" not found in regular items, trying bundle endpoint...`);
  const bundleRes = await fetch(
    `https://api.jubelio.com/inventory/item-bundles/?q=${encodeURIComponent(sku)}&pageSize=50`,
    { headers: { Authorization: token }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  );

  if (!bundleRes.ok) {
    console.warn(`[Jubelio] Bundle lookup failed for ${sku}: ${bundleRes.status}`);
    return null;
  }

  const bundleData = await bundleRes.json();
  const bundleGroups: JubelioProductGroup[] = bundleData.data ?? [];

  for (const group of bundleGroups) {
    for (const variant of group.variants) {
      if (variant.item_code === sku) {
        console.log(`[Jubelio] SKU "${sku}" found in bundles (item_id=${variant.item_id}).`);
        return {
          item_id: variant.item_id,
          item_code: variant.item_code,
          item_name: variant.item_name,
        };
      }
    }
  }

  console.warn(`[Jubelio] SKU not found: ${sku}`);
  return null;
}

export type JubelioSalesOrderItem = {
  salesorder_detail_id?: number;
  item_id: number;
  description: string;
  tax_id: number;
  price: number;
  unit: string;
  qty_in_base: number;
  disc?: number;
  disc_amount?: number;
  tax_amount?: number;
  amount: number;
  location_id: number;
};

export type JubelioSalesOrderPayload = {
  salesorder_id: number;
  salesorder_no: string;
  contact_id: number | null;
  customer_name: string;
  transaction_date: string;
  sub_total: number;
  total_disc: number;
  total_tax: number;
  grand_total: number;
  location_id: number;
  source: number;
  add_fee: number;
  add_disc: number;
  service_fee: number;
  items: JubelioSalesOrderItem[];
  ref_no?: string;
  note?: string;
  shipping_cost?: number;
  shipping_full_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_area?: string;
  shipping_city?: string;
  shipping_subdistrict?: string;
  shipping_province?: string;
  shipping_post_code?: string;
  shipping_country?: string;
  is_paid?: boolean;
  payment_method?: string;
  store_id?: string;
};

/**
 * Create a Sales Order in Jubelio.
 * Returns the created salesorder_id.
 */
export async function createJubelioSalesOrder(
  payload: JubelioSalesOrderPayload
): Promise<number> {
  if (MOCK) {
    console.log("[Jubelio MOCK] createSalesOrder:", payload.ref_no);
    return 999999;
  }

  const token = await getToken();
  const res = await fetch(`${JUBELIO_BASE}/sales/orders/`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new Error(
      `Jubelio createSalesOrder failed: ${res.status} ${JSON.stringify(body)}`
    );
  }

  const data = await res.json();
  if (!data.id) {
    throw new Error(`Jubelio createSalesOrder: no id in response`);
  }
  return data.id as number;
}

/**
 * Convert a Sales Order to Invoice with Payment in one step.
 * Returns the invoice number.
 */
export async function convertJubelioToInvoicePayment(
  salesorderId: number
): Promise<string> {
  if (MOCK) {
    console.log("[Jubelio MOCK] convertToInvoicePayment:", salesorderId);
    return "INV-TEST-001";
  }

  const token = await getToken();
  const res = await fetch(`${JUBELIO_BASE}/sales/packlists/create-invoice-payment`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ salesorder_id: salesorderId }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new Error(
      `Jubelio convertToInvoicePayment failed: ${res.status} ${JSON.stringify(body)}`
    );
  }

  const data = await res.json();
  const invoiceNo = data.invoice_no ?? data.id;
  if (!invoiceNo) {
    throw new Error(`Jubelio convertToInvoicePayment: no invoice_no or id in response: ${JSON.stringify(data)}`);
  }
  return String(invoiceNo);
}
