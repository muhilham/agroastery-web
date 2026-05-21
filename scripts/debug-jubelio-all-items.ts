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

async function main() {
  const token = await getToken();

  console.log("Fetching ALL inventory items (paginated) to find bundles...\n");

  let page = 1;
  const pageSize = 100;
  let found = false;

  while (page <= 20 && !found) {
    const res = await fetch(
      `${JUBELIO_BASE}/inventory/items/?page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: token } }
    );

    if (!res.ok) {
      console.error(`Page ${page} failed: ${res.status}`);
      break;
    }

    const data = await res.json();
    const items = data.data ?? [];

    if (items.length === 0) break;

    for (const group of items) {
      // Check if this group is a bundle
      if (group.is_bundle === true) {
        console.log(`\n>>> BUNDLE FOUND: ${group.item_name} (id=${group.item_group_id})`);
        console.log(`    keys: ${Object.keys(group).join(", ")}`);
        if (group.variants) {
          for (const v of group.variants) {
            console.log(`    variant code="${v.item_code}", id=${v.item_id}`);
            if (v.item_code === SKU) {
              console.log(`    >>>>> MATCH FOUND!`);
              found = true;
            }
          }
        }
        if (group.compositions) {
          console.log(`    compositions: ${JSON.stringify(group.compositions).slice(0, 200)}`);
        }
      }

      // Also check variants of non-bundles
      if (group.variants) {
        for (const v of group.variants) {
          if (v.item_code === SKU) {
            console.log(`\n>>> MATCH in non-bundle: ${group.item_name} (id=${group.item_group_id})`);
            console.log(`    variant code="${v.item_code}", id=${v.item_id}`);
            found = true;
          }
        }
      }
    }

    console.log(`Page ${page}: ${items.length} items scanned`);
    page++;
  }

  if (!found) {
    console.log("\n❌ SKU not found in any page");
  }
}

main().catch(console.error);
