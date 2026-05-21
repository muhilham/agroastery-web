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

async function tryEndpoint(token: string, path: string) {
  const url = `${JUBELIO_BASE}${path}`;
  console.log(`\n>>> GET ${url}`);
  try {
    const res = await fetch(url, { headers: { Authorization: token } });
    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    if (res.ok) {
      try {
        const data = JSON.parse(text);
        const items = data.data ?? [];
        console.log(`   Results: ${items.length}`);
        if (items.length > 0) {
          console.log(`   First item keys: ${Object.keys(items[0]).join(", ")}`);
          // Check if any are bundles
          const bundles = items.filter((i: Record<string, unknown>) => i.is_bundle === true || i.item_group_id === 1480);
          console.log(`   Bundles found: ${bundles.length}`);
          bundles.forEach((b: Record<string, unknown>) => {
            console.log(`     - ${b.item_name} (id=${b.item_group_id})`);
          });
        }
        return data;
      } catch {
        console.log(`   Body (first 200 chars): ${text.slice(0, 200)}`);
      }
    } else {
      console.log(`   Body (first 200 chars): ${text.slice(0, 200)}`);
    }
    return null;
  } catch (err) {
    console.log(`   Error: ${err}`);
    return null;
  }
}

async function main() {
  const token = await getToken();
  console.log("Searching for any endpoint that lists bundles...\n");

  const endpoints = [
    // Inventory
    "/inventory/items/?page=1&pageSize=1000",
    "/inventory/items/?page=1&pageSize=50&includeBundle=true",
    "/inventory/items/?page=1&pageSize=50&type=bundle",
    "/inventory/items/?page=1&pageSize=50&category=bundle",
    "/inventory/bundles/?page=1&pageSize=50",
    "/inventory/composites/?page=1&pageSize=50",
    "/inventory/groups/?page=1&pageSize=50",
    // Catalog / Master
    "/catalog/items/?page=1&pageSize=50",
    "/catalog/bundles/?page=1&pageSize=50",
    "/catalog/composites/?page=1&pageSize=50",
    "/master/items/?page=1&pageSize=50",
    "/master/bundles/?page=1&pageSize=50",
    "/master/composites/?page=1&pageSize=50",
    // Products
    "/products/?page=1&pageSize=50",
    "/products/bundles/?page=1&pageSize=50",
    "/products/composites/?page=1&pageSize=50",
    // Sales
    "/sales/items/?page=1&pageSize=50",
    "/sales/bundles/?page=1&pageSize=50",
    // Items detail
    "/inventory/items/1480",
    "/inventory/items/group/1480",
    "/catalog/items/1480",
    "/master/items/1480",
    "/products/1480",
  ];

  for (const path of endpoints) {
    await tryEndpoint(token, path);
  }

  console.log("\n\n=== Done. No bundle list endpoint exists on api2.jubelio.com ===");
}

main().catch(console.error);
