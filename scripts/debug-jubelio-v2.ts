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

const SKU = "PJ-BK-SM-CDSSTDGAY";
const DASHBOARD_ID = 1480;

async function getToken(base: string): Promise<string> {
  const res = await fetch(`${base}/login`, {
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

async function tryEndpoint(token: string, base: string, path: string) {
  const url = `${base}${path}`;
  console.log(`\n>>> GET ${url}`);
  try {
    const res = await fetch(url, { headers: { Authorization: token } });
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
  const v2Token = await getToken("https://v2.jubelio.com");
  const api2Token = await getToken("https://api2.jubelio.com");

  console.log("=== Probing v2.jubelio.com ===\n");
  await tryEndpoint(v2Token, "https://v2.jubelio.com", `/api/inventory/items/?q=${encodeURIComponent(SKU)}&pageSize=50`);
  await tryEndpoint(v2Token, "https://v2.jubelio.com", `/api/inventory/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`);
  await tryEndpoint(v2Token, "https://v2.jubelio.com", `/api/catalog/items/?q=${encodeURIComponent(SKU)}&pageSize=50`);
  await tryEndpoint(v2Token, "https://v2.jubelio.com", `/api/catalog/bundles/?q=${encodeURIComponent(SKU)}&pageSize=50`);
  await tryEndpoint(v2Token, "https://v2.jubelio.com", `/api/inventory/items/${DASHBOARD_ID}`);
  await tryEndpoint(v2Token, "https://v2.jubelio.com", `/api/inventory/bundles/${DASHBOARD_ID}`);

  console.log("\n\n=== Probing api2.jubelio.com with different paths ===\n");
  await tryEndpoint(api2Token, "https://api2.jubelio.com", `/inventory/items/${DASHBOARD_ID}`);
  await tryEndpoint(api2Token, "https://api2.jubelio.com", `/inventory/items/group/${DASHBOARD_ID}`);
  await tryEndpoint(api2Token, "https://api2.jubelio.com", `/inventory/items/master/${DASHBOARD_ID}`);
  await tryEndpoint(api2Token, "https://api2.jubelio.com", `/inventory/items/bundle/${DASHBOARD_ID}`);

  console.log("\n\n=== Done ===");
}

main().catch(console.error);
