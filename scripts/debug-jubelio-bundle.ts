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

async function searchItems(token: string, endpoint: string) {
  const url = `${JUBELIO_BASE}${endpoint}?q=${encodeURIComponent(SKU)}&pageSize=50`;
  console.log(`\n>>> GET ${url}`);
  const res = await fetch(url, { headers: { Authorization: token } });

  if (!res.ok) {
    console.log(`   Status: ${res.status} — skipping`);
    return null;
  }

  const data = await res.json();
  const items = data.data ?? [];
  console.log(`   Found ${items.length} results`);

  if (items.length > 0) {
    console.log(`   First result keys: ${Object.keys(items[0]).join(", ")}`);
    console.log(`   Sample: ${JSON.stringify(items[0]).slice(0, 500)}`);
  }

  return items;
}

async function main() {
  const token = await getToken();
  console.log(`Searching Jubelio for SKU: ${SKU}\n`);

  // 1. Regular inventory items
  await searchItems(token, "/inventory/items/");

  // 2. Bundles / composites
  await searchItems(token, "/inventory/bundles/");

  // 3. Alternative: all items with bundle filter
  await searchItems(token, "/inventory/items/");

  // 4. Try fetching by exact item code endpoint if exists
  console.log("\n>>> Trying direct item lookup by code...");
  const directRes = await fetch(
    `${JUBELIO_BASE}/inventory/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    { headers: { Authorization: token } }
  );
  const directData = await directRes.json();
  const groups = directData.data ?? [];

  for (const group of groups) {
    console.log(`\n   Group: ${group.item_name} (id=${group.item_group_id})`);
    console.log(`   is_bundle: ${group.is_bundle ?? "N/A"}`);
    if (group.variants) {
      for (const v of group.variants) {
        console.log(`   Variant: item_code="${v.item_code}", item_id=${v.item_id}, is_bundle=${v.is_bundle}`);
      }
    }
    if (group.compositions) {
      console.log(`   Compositions: ${JSON.stringify(group.compositions).slice(0, 300)}`);
    }
  }

  // 5. Try fetching all bundles explicitly
  console.log("\n>>> Trying /inventory/items/?is_bundle=true ...");
  const bundleRes = await fetch(
    `${JUBELIO_BASE}/inventory/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    { headers: { Authorization: token } }
  );
  const bundleData = await bundleRes.json();
  console.log(`   Results: ${(bundleData.data ?? []).length}`);
  (bundleData.data ?? []).forEach((g: Record<string, unknown>) => {
    console.log(`   - ${g.item_name} (bundle=${g.is_bundle}, id=${g.item_group_id})`);
  });
}

main().catch(console.error);
