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
    console.log(`   Body (first 800 chars): ${text.slice(0, 800)}`);
    return { status: res.status, text };
  } catch (err) {
    console.log(`   Error: ${err}`);
    return null;
  }
}

async function main() {
  const token = await getToken();
  console.log(`Probing endpoints for SKU: ${SKU}\n`);

  const endpoints = [
    { method: "GET", path: `/inventory/items/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/inventory/items/?q=${encodeURIComponent(SKU)}&pageSize=50&is_bundle=true` },
    { method: "GET", path: `/inventory/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/inventory/composites/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/catalog/items/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/catalog/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/master/items/?q=${encodeURIComponent(SKU)}&pageSize=50` },
    { method: "GET", path: `/inventory/items/group/1480` },
    { method: "GET", path: `/inventory/bundles/group/1480` },
    { method: "GET", path: `/inventory/items/1480` },
    { method: "POST", path: "/inventory/items/search/", body: { q: SKU, pageSize: 50 } },
  ];

  for (const ep of endpoints) {
    await tryEndpoint(token, ep.method, ep.path, ep.body);
  }

  console.log("\n\n--- Done probing ---");
}

main().catch(console.error);
