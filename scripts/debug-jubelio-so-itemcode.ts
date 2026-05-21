import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

const JUBELIO_BASE = "https://api2.jubelio.com";

async function getToken(): Promise<string> {
  const res = await fetch(`${JUBELIO_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.JUBELIO_EMAIL,
      password: process.env.JUBELIO_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error(`Jubelio login failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function main() {
  const token = await getToken();

  // Try creating a minimal SO with item_code instead of item_id
  const testPayload = {
    salesorder_id: 0,
    salesorder_no: "[auto]",
    contact_id: -1,
    customer_name: "Test Bundle Lookup",
    transaction_date: new Date().toISOString(),
    sub_total: 100000,
    total_disc: 0,
    total_tax: 0,
    grand_total: 100000,
    location_id: -1,
    source: 524289,
    add_fee: 0,
    add_disc: 0,
    service_fee: 0,
    items: [
      {
        salesorder_detail_id: 0,
        item_code: "PJ-BK-SM-CDSSTDGAY",  // Try using item_code instead of item_id
        description: "Test bundle",
        tax_id: 1,
        price: 100000,
        unit: "Pcs",
        qty_in_base: 1,
        disc: 0,
        disc_amount: 0,
        tax_amount: 0,
        amount: 100000,
        location_id: -1,
      }
    ],
    ref_no: "TEST-BUNDLE-001",
    is_paid: true,
    payment_method: "QRIS",
    store_id: "127657",
  };

  console.log("Trying to create SO with item_code instead of item_id...\n");
  const res = await fetch(`${JUBELIO_BASE}/sales/orders/`, {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify(testPayload),
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text.slice(0, 1000)}`);
}

main().catch(console.error);
