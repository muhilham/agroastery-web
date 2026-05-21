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
const SKU = "PJ-BK-SM-CDSSTDGAY";

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

async function tryEndpoint(token: string, method: string, path: string, body?: unknown) {
  const url = `${JUBELIO_BASE}${path}`;
  const opts: RequestInit = {
    method,
    headers: { Authorization: token, "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  console.log(`\n>>> ${method} ${url}`);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    console.log(`   Body (first 1200 chars): ${text.slice(0, 1200)}`);
    return { status: res.status, text };
  } catch (err) {
    console.log(`   Error: ${err}`);
    return null;
  }
}

async function main() {
  const token = await getToken();
  console.log(`Probing bundle endpoints for SKU: ${SKU}\n`);

  const endpoints = [
    // Inventory bundle/composite variants
    { method: "GET", path: `/inventory/items/?q=${encodeURIComponent(SKU)}&pageSize=50&includeBundle=true` },
    { method: "GET", path: `/inventory/items/master/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/inventory/items/master/single/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/inventory/items/master/bundle/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/inventory/items/master/composite/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    // Catalog endpoints
    { method: "GET", path: `/catalog/items/master/single/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/catalog/items/master/bundle/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/catalog/items/master/composite/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    // Direct master ID lookup (1480 is dashboard ID)
    { method: "GET", path: `/inventory/items/master/1480` },
    { method: "GET", path: `/inventory/items/master/bundle/1480` },
    { method: "GET", path: `/inventory/items/master/composite/1480` },
    { method: "GET", path: `/inventory/items/master/single/1480` },
    // Alternative paths
    { method: "GET", path: `/inventory/master/items/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/inventory/master/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/inventory/master/composites/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    // Product catalog
    { method: "GET", path: `/products/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/products/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    // Items detail
    { method: "GET", path: `/inventory/items/detail/1480` },
    { method: "GET", path: `/inventory/items/detail/?item_group_id=1480` },
  ];

  for (const ep of endpoints) {
    await tryEndpoint(token, ep.method, ep.path, ep.body);
  }

  console.log("\n\n--- Done probing ---");
}

main().catch(console.error);
