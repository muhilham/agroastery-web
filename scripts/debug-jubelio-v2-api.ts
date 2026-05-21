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

const API2_BASE = "https://api2.jubelio.com";
const V2_BASE = "https://v2.jubelio.com";
const SKU = "PJ-BK-SM-CDSSTDGAY";

async function getToken(base: string): Promise<string> {
  const res = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.JUBELIO_EMAIL,
      password: process.env.JUBELIO_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error(`Jubelio login failed at ${base}: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function tryEndpoint(token: string, base: string, path: string) {
  const url = `${base}${path}`;
  console.log(`\n>>> GET ${url}`);
  try {
    const res = await fetch(url, { headers: { Authorization: token } });
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
  console.log("Logging in to both API endpoints...\n");
  const api2Token = await getToken(API2_BASE);
  let v2Token: string;
  try {
    v2Token = await getToken(V2_BASE);
  } catch {
    console.log("v2.jubelio.com login failed (expected), using api2 token for v2 requests\n");
    v2Token = api2Token;
  }

  console.log("=== Probing v2.jubelio.com /api/ paths ===\n");
  const v2Paths = [
    `/api/inventory/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/api/inventory/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/api/catalog/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/api/catalog/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/api/inventory/items/1480`,
    `/api/inventory/bundles/1480`,
    `/api/inventory/items/group/1480`,
    `/api/inventory/bundles/group/1480`,
    `/api/catalog/items/master/bundle/1480`,
    `/api/catalog/items/master/bundle/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/api/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/api/items/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/api/master/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/api/master/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`,
  ];

  for (const path of v2Paths) {
    await tryEndpoint(v2Token, V2_BASE, path);
  }

  console.log("\n\n=== Probing api2.jubelio.com alternative paths ===\n");
  const api2Paths = [
    `/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/items/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/master/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/master/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/inventory/bundles/1480`,
    `/inventory/composites/1480`,
    `/sales/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    `/sales/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
  ];

  for (const path of api2Paths) {
    await tryEndpoint(api2Token, API2_BASE, path);
  }

  console.log("\n\n=== Done ===");
}

main().catch(console.error);
