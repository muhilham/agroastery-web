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

  // Fetch the SO we created earlier (14906) to see the item_id used
  console.log("Fetching SO 14906 details...\n");
  const soRes = await fetch(
    `${JUBELIO_BASE}/sales/orders/14906`,
    { headers: { Authorization: token } }
  );

  if (!soRes.ok) {
    console.error(`Failed: ${soRes.status}`);
    const text = await soRes.text();
    console.error(text.slice(0, 500));
    return;
  }

  const soData = await soRes.json();
  console.log("SO Response keys:", Object.keys(soData));
  console.log("\nItems in SO:");
  if (soData.items) {
    soData.items.forEach((item: Record<string, unknown>, i: number) => {
      console.log(`  [${i}] item_id=${item.item_id}, item_code="${item.item_code}", description="${item.description}"`);
    });
  }

  // Also try fetching by ref_no to see if there are other SOs with bundles
  console.log("\n\nSearching SOs by ref_no 'AGR-20260521-KN1KTI'...");
  const searchRes = await fetch(
    `${JUBELIO_BASE}/sales/orders/?q=AGR-20260521-KN1KTI&pageSize=50`,
    { headers: { Authorization: token } }
  );
  const searchData = await searchRes.json();
  console.log(`Found ${(searchData.data ?? []).length} SOs`);

  // Now let's search for SOs that might contain bundle items
  console.log("\n\nSearching all recent SOs for bundle item_ids...");
  const allRes = await fetch(
    `${JUBELIO_BASE}/sales/orders/?page=1&pageSize=100`,
    { headers: { Authorization: token } }
  );
  const allData = await allRes.json();
  const orders = allData.data ?? [];
  console.log(`Found ${orders.length} recent SOs`);

  for (const order of orders.slice(0, 10)) {
    const detailRes = await fetch(
      `${JUBELIO_BASE}/sales/orders/${order.salesorder_id}`,
      { headers: { Authorization: token } }
    );
    if (detailRes.ok) {
      const detail = await detailRes.json();
      if (detail.items) {
        for (const item of detail.items) {
          if (item.item_code && String(item.item_code).includes("PJ-BK-SM-CDSSTDGAY")) {
            console.log(`\n>>> FOUND bundle in SO ${order.salesorder_id}:`);
            console.log(`    item_id=${item.item_id}, item_code="${item.item_code}"`);
          }
        }
      }
    }
  }

  console.log("\n\nDone.");
}

main().catch(console.error);
