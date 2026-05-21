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
const SKU = "SET_SKU_HERE";

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

  console.log(`Searching Jubelio for SKU: ${SKU}\n`);

  const res = await fetch(
    `${JUBELIO_BASE}/inventory/items/?q=${encodeURIComponent(SKU)}&pageSize=50`,
    { headers: { Authorization: token } }
  );

  if (!res.ok) {
    console.error(`Search failed: ${res.status}`);
    const text = await res.text();
    console.error(text);
    return;
  }

  const data = await res.json();
  console.log("API Response structure keys:", Object.keys(data));
  console.log("\nFull response (first 2000 chars):");
  console.log(JSON.stringify(data, null, 2).slice(0, 2000));

  const items = data.data ?? [];
  console.log(`\nFound ${items.length} items`);

  if (items.length > 0) {
    console.log("\nFirst item keys:", Object.keys(items[0]));
    console.log("\nAll item_code values:");
    items.forEach((item: Record<string, unknown>, i: number) => {
      console.log(`  [${i}] item_code="${item.item_code}", item_name="${item.item_name}"`);
    });

    const match = items.find((i: Record<string, unknown>) => i.item_code === SKU);
    console.log("\nExact match for SKU:", match ? "FOUND" : "NOT FOUND");
    if (match) {
      console.log(match);
    }
  }
}

main().catch(console.error);
