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

  // Fetch the SO that was created (SO-000014912)
  console.log("Fetching SO SO-000014912...\n");
  const soRes = await fetch(
    `${JUBELIO_BASE}/sales/orders/?q=TEST-BUNDLE-1480&pageSize=50`,
    { headers: { Authorization: token } }
  );
  
  const data = await soRes.json();
  const orders = data.data ?? [];
  console.log(`Found ${orders.length} matching SOs`);
  
  for (const order of orders) {
    console.log(`\nSO: ${order.salesorder_no} (id=${order.salesorder_id})`);
    console.log(`ref_no: ${order.ref_no}`);
    
    const detailRes = await fetch(
      `${JUBELIO_BASE}/sales/orders/${order.salesorder_id}`,
      { headers: { Authorization: token } }
    );
    const detail = await detailRes.json();
    console.log("Items:");
    detail.items.forEach((item: Record<string, unknown>) => {
      console.log(`  item_id=${item.item_id}, item_code="${item.item_code}", description="${item.description}"`);
    });
  }
}

main().catch(console.error);
