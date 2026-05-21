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
const ITEM_GROUP_ID = 1480;
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

async function main() {
  const token = await getToken();

  console.log(`Fetching product group detail for id=${ITEM_GROUP_ID}\n`);

  const res = await fetch(
    `${JUBELIO_BASE}/inventory/items/group/${ITEM_GROUP_ID}`,
    { headers: { Authorization: token } }
  );

  if (!res.ok) {
    console.error(`Failed: ${res.status}`);
    const text = await res.text();
    console.error(text);
    return;
  }

  const data = await res.json();
  console.log("Response keys:", Object.keys(data));
  console.log("\nFull response (first 3000 chars):");
  console.log(JSON.stringify(data, null, 2).slice(0, 3000));

  // Also try fetching all items (not search) to see if bundles are included
  console.log("\n\n--- Fetching all items page 1 (no search) ---");
  const allRes = await fetch(
    `${JUBELIO_BASE}/inventory/items/?page=1&pageSize=100`,
    { headers: { Authorization: token } }
  );
  const allData = await allRes.json();
  const items = allData.data ?? [];
  console.log(`Total items: ${items.length}`);

  const bundles = items.filter((g: Record<string, unknown>) => g.is_bundle === true || g.item_group_id === ITEM_GROUP_ID);
  console.log(`Bundles / matching group found: ${bundles.length}`);
  bundles.forEach((g: Record<string, unknown>) => {
    console.log(`  - ${g.item_name} (id=${g.item_group_id}, is_bundle=${g.is_bundle})`);
    if (g.variants) {
      (g.variants as Array<Record<string, unknown>>).forEach((v) => {
        console.log(`    variant: code=${v.item_code}, id=${v.item_id}`);
      });
    }
  });
}

main().catch(console.error);
